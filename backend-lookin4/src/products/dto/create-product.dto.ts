import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCategory } from '../../generated/prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du produit est requis.' })
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // Ціна в центах: дробові євро в базі дали б помилки округлення.
  @IsInt({ message: 'Prix invalide.' })
  @Min(1, { message: 'Prix invalide.' })
  @Max(1_000_000_000, { message: 'Prix trop élevé.' })
  priceCents: number;

  @IsOptional()
  @IsEnum(ProductCategory, { message: 'Catégorie inconnue.' })
  category?: ProductCategory;

  // Лише шлях, який віддав POST /uploads, а не довільна адреса.
  @Matches(/^\/files\/[\w-]+\.\w+$/, { message: 'La photo est requise.' })
  imageUrl: string;

  // Лише http(s): значення потрапляє в href, тож javascript: сюди не пускаємо.
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: "Adresse du lien d'achat invalide." },
  )
  @MaxLength(2048)
  url?: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
