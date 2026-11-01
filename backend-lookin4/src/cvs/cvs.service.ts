import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { readFile, unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { SkillsService } from '../skills/skills.service';
import { UPLOAD_DIR } from '../uploads/uploads.constants';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';

/** Те, що зберігаємо в Cv.content. */
type CvContent = {
  /** Знайдені парсером у PDF */
  skills: string[];
  /** Додані вручну — новий PDF їх не стирає */
  manual: string[];
  textLength: number;
  parsedAt: string | null;
};

const EMPTY_CONTENT: CvContent = {
  skills: [],
  manual: [],
  textLength: 0,
  parsedAt: null,
};

/** Cv.content — це Json, тож з бази він приходить як unknown. */
function toContent(value: unknown): CvContent {
  const raw = (value ?? {}) as Partial<CvContent>;

  return {
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    manual: Array.isArray(raw.manual) ? raw.manual : [],
    textLength: typeof raw.textLength === 'number' ? raw.textLength : 0,
    parsedAt: typeof raw.parsedAt === 'string' ? raw.parsedAt : null,
  };
}

const CV_FIELDS = {
  id: true,
  title: true,
  content: true,
  fileUrl: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true } },
} as const;

@Injectable()
export class CvsService {
  private readonly logger = new Logger(CvsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
  ) {}

  async create(dto: CreateCvDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) throw new BadRequestException('Utilisateur inconnu.');

    // Один CV на людину — це вже гарантує unique в базі, але зрозуміла
    // помилка краща за 500 від порушення обмеження.
    const existing = await this.prisma.cv.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (existing) throw new BadRequestException('Vous avez déjà un CV.');

    return this.prisma.cv.create({
      data: { title: dto.title, userId: user.id },
      select: CV_FIELDS,
    });
  }

  /** CV цієї людини або null, якщо вона його ще не створила. */
  findByUser(userId: string) {
    return this.prisma.cv.findUnique({
      where: { userId },
      select: CV_FIELDS,
    });
  }

  async findOne(id: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id },
      select: CV_FIELDS,
    });

    if (!cv) throw new NotFoundException('CV introuvable.');

    return cv;
  }

  async update(id: string, dto: UpdateCvDto) {
    const current = await this.prisma.cv.findUnique({
      where: { id },
      select: { fileUrl: true, content: true },
    });
    if (!current) throw new NotFoundException('CV introuvable.');

    const content = toContent(current.content);

    // Новий PDF — одразу дістаємо з нього навички. Додані вручну лишаються.
    if (dto.fileUrl && dto.fileUrl !== current.fileUrl) {
      const parsed = await this.parse(dto.fileUrl);
      content.skills = parsed.skills;
      content.textLength = parsed.textLength;
      content.parsedAt = parsed.parsedAt;
    }

    if (dto.manualSkills) {
      // Вигадані id відкидаємо, як і в пропозиціях.
      content.manual = this.skills.keepKnown(dto.manualSkills);
    }

    const touchesContent = Boolean(dto.fileUrl || dto.manualSkills);

    const updated = await this.prisma.cv.update({
      where: { id },
      data: {
        title: dto.title,
        fileUrl: dto.fileUrl,
        ...(touchesContent ? { content } : {}),
      },
      select: CV_FIELDS,
    });

    // Замінили PDF — старий на диску вже нікому не потрібен.
    if (current.fileUrl && current.fileUrl !== updated.fileUrl) {
      await this.removeFile(current.fileUrl);
    }

    return updated;
  }

  async remove(id: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id },
      select: { id: true, title: true, fileUrl: true },
    });
    if (!cv) throw new NotFoundException('CV introuvable.');

    await this.prisma.cv.delete({ where: { id } });
    await this.removeFile(cv.fileUrl);

    return { id: cv.id, title: cv.title };
  }

  /**
   * Розбір не має валити завантаження: якщо PDF побитий або це скан
   * без текстового шару, CV лишається, просто без навичок.
   */
  private async parse(fileUrl: string): Promise<CvContent> {
    const parsedAt = new Date().toISOString();

    try {
      const data = await readFile(join(UPLOAD_DIR, basename(fileUrl)));
      const { skills, textLength } = await this.skills.parseCv(data);

      return { ...EMPTY_CONTENT, skills, textLength, parsedAt };
    } catch (error) {
      this.logger.warn(
        `Не вдалося розібрати ${fileUrl}: ${(error as Error).message}`,
      );

      return { ...EMPTY_CONTENT, parsedAt };
    }
  }

  /**
   * basename тут обовʼязковий: він відрізає будь-який шлях і лишає саме імʼя,
   * тож стерти можна лише всередині user_files.
   */
  private async removeFile(fileUrl: string | null) {
    if (!fileUrl) return;

    try {
      await unlink(join(UPLOAD_DIR, basename(fileUrl)));
    } catch {
      // Файлу вже нема — для видалення це успіх, а не помилка.
    }
  }
}
