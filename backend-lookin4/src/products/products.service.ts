import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ProductCategory } from '../generated/prisma/client';
import { CreateProductDto } from './dto/create-product.dto';

export type ProductFilters = {
  search?: string;
  category?: string;
  sort?: string;
  ownerId?: string;
};

const PUBLIC_FIELDS = {
  id: true,
  title: true,
  description: true,
  priceCents: true,
  category: true,
  imageUrl: true,
  url: true,
  createdAt: true,
  // Без посилання кнопка «Acheter» пише продавцю.
  owner: { select: { email: true } },
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const owner = await this.prisma.user.findUnique({
      where: { id: dto.ownerId },
      select: { id: true },
    });
    if (!owner) throw new BadRequestException('Utilisateur inconnu.');

    return this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        priceCents: dto.priceCents,
        category: dto.category ?? null,
        imageUrl: dto.imageUrl,
        url: dto.url || null,
        ownerId: owner.id,
      },
      select: PUBLIC_FIELDS,
    });
  }

  findAll(filters: ProductFilters) {
    const where: Prisma.ProductWhereInput = {};

    if (filters.ownerId) where.ownerId = filters.ownerId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Невідомі значення просто ігноруємо, а не падаємо з 500.
    const categories: string[] = Object.values(ProductCategory);
    if (filters.category && categories.includes(filters.category)) {
      where.category = filters.category as ProductCategory;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      filters.sort === 'price_asc'
        ? { priceCents: 'asc' }
        : filters.sort === 'price_desc'
          ? { priceCents: 'desc' }
          : { createdAt: 'desc' };

    return this.prisma.product.findMany({
      where,
      orderBy,
      select: PUBLIC_FIELDS,
    });
  }

  /** Міняти й видаляти товар може лише його власник. */
  private async assertOwner(id: string, ownerId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!product) throw new NotFoundException('Produit introuvable.');
    if (product.ownerId !== ownerId) {
      throw new ForbiddenException('Ce produit ne vous appartient pas.');
    }
  }

  async update(id: string, dto: CreateProductDto) {
    await this.assertOwner(id, dto.ownerId);

    return this.prisma.product.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description || null,
        priceCents: dto.priceCents,
        category: dto.category ?? null,
        imageUrl: dto.imageUrl,
        url: dto.url || null,
      },
      select: PUBLIC_FIELDS,
    });
  }

  async remove(id: string, ownerId?: string) {
    await this.assertOwner(id, ownerId);

    return this.prisma.product.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: PUBLIC_FIELDS,
    });

    if (!product) throw new NotFoundException('Produit introuvable.');

    return product;
  }
}
