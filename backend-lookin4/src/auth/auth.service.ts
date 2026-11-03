import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/** Вартість bcrypt. Вище = повільніше підбирати, але й повільніше логінитись. */
const SALT_ROUNDS = 12;

/**
 * Хеш неіснуючого пароля. Потрібен, щоб вхід із невідомим email
 * займав стільки ж часу, скільки з відомим, — інакше за часом відповіді
 * можна перебрати, які адреси зареєстровані.
 */
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      // Покладаємось на unique-індекс, а не на попередній findUnique:
      // між перевіркою і вставкою міг би вклинитись інший запит.
      return await this.prisma.user.create({
        data: { email, passwordHash },
        // Явний select — щоб хеш ніколи не поїхав у відповідь.
        select: { id: true, email: true, createdAt: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Cet email est déjà utilisé.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Порівнюємо завжди — навіть коли користувача нема.
    const matches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    // Одне повідомлення на обидва випадки: не кажемо, чи email існує.
    if (!user || !matches) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }
}
