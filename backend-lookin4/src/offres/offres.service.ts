import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  ContractType,
  OffreType,
} from '../generated/prisma/client';

export type OffreFilters = {
  search?: string;
  type?: string;
  metier?: string;
  region?: string;
  contract?: string;
};

@Injectable()
export class OffresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters: OffreFilters) {
    const where: Prisma.OffreWhereInput = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Невідомі значення просто ігноруємо, а не падаємо з 500.
    if (isEnum(OffreType, filters.type)) where.type = filters.type;
    if (isEnum(ContractType, filters.contract)) {
      where.contract = filters.contract;
    }
    if (filters.metier) where.metier = filters.metier;
    if (filters.region) where.region = filters.region;

    return this.prisma.offre.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        metier: true,
        region: true,
        contract: true,
        skills: true,
        createdAt: true,
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });
  }

  /** Картка однієї пропозиції: та сама компанія, але докладніше, ніж у списку. */
  async findOne(id: string) {
    const offre = await this.prisma.offre.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        metier: true,
        region: true,
        contract: true,
        skills: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            description: true,
            sector: true,
            region: true,
            size: true,
            logoUrl: true,
            owner: { select: { email: true } },
          },
        },
      },
    });

    if (!offre) throw new NotFoundException('Offre introuvable.');

    return offre;
  }

  /** Значення для випадаючих списків — беремо з того, що реально є в базі. */
  async facets() {
    const [metiers, regions] = await Promise.all([
      this.prisma.offre.findMany({
        where: { metier: { not: null } },
        distinct: ['metier'],
        select: { metier: true },
        orderBy: { metier: 'asc' },
      }),
      this.prisma.offre.findMany({
        where: { region: { not: null } },
        distinct: ['region'],
        select: { region: true },
        orderBy: { region: 'asc' },
      }),
    ]);

    return {
      metiers: metiers.map((m) => m.metier!).filter(Boolean),
      regions: regions.map((r) => r.region!).filter(Boolean),
    };
  }
}

function isEnum<T extends Record<string, string>>(
  values: T,
  value: string | undefined,
): value is T[keyof T] {
  return !!value && Object.values(values).includes(value);
}
