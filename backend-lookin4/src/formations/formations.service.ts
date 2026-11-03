import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SkillsService } from '../skills/skills.service';
import { Prisma } from '../generated/prisma/client';
import { CreateFormationDto } from './dto/create-formation.dto';

export type FormationFilters = {
  search?: string;
  category?: string;
  skill?: string;
  ownerId?: string;
};

const PUBLIC_FIELDS = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  url: true,
  skills: true,
  createdAt: true,
} as const;

@Injectable()
export class FormationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
  ) {}

  async create(dto: CreateFormationDto) {
    const owner = await this.prisma.user.findUnique({
      where: { id: dto.ownerId },
      select: { id: true },
    });
    if (!owner) throw new BadRequestException('Utilisateur inconnu.');

    return this.prisma.formation.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        imageUrl: dto.imageUrl,
        url: dto.url || null,
        // Вигадані id відкидаємо тут, а не в базі.
        skills: this.skills.keepKnown(dto.skills ?? []),
        ownerId: owner.id,
      },
      select: PUBLIC_FIELDS,
    });
  }

  findAll(filters: FormationFilters) {
    const where: Prisma.FormationWhereInput = {};

    if (filters.ownerId) where.ownerId = filters.ownerId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Конкретна навичка вужча за категорію, тож має пріоритет.
    // Невідомі значення просто ігноруємо, а не падаємо.
    const all = this.skills.all();
    if (filters.skill && all.some((s) => s.id === filters.skill)) {
      where.skills = { has: filters.skill };
    } else if (filters.category) {
      const ids = all
        .filter((s) => s.category === filters.category)
        .map((s) => s.id);
      if (ids.length) where.skills = { hasSome: ids };
    }

    return this.prisma.formation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: PUBLIC_FIELDS,
    });
  }

  /** Міняти й видаляти формацію може лише її власник. */
  private async assertOwner(id: string, ownerId?: string) {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!formation) throw new NotFoundException('Formation introuvable.');
    if (formation.ownerId !== ownerId) {
      throw new ForbiddenException('Cette formation ne vous appartient pas.');
    }
  }

  async update(id: string, dto: CreateFormationDto) {
    await this.assertOwner(id, dto.ownerId);

    return this.prisma.formation.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description || null,
        imageUrl: dto.imageUrl,
        url: dto.url || null,
        skills: this.skills.keepKnown(dto.skills ?? []),
      },
      select: PUBLIC_FIELDS,
    });
  }

  async remove(id: string, ownerId?: string) {
    await this.assertOwner(id, ownerId);

    return this.prisma.formation.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }

  async findOne(id: string) {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
      select: { ...PUBLIC_FIELDS, owner: { select: { email: true } } },
    });

    if (!formation) throw new NotFoundException('Formation introuvable.');

    return formation;
  }
}
