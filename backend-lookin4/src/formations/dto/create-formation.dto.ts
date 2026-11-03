import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateFormationDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre de la formation est requis.' })
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // Лише шлях, який віддав POST /uploads, а не довільна адреса.
  @Matches(/^\/files\/[\w-]+\.\w+$/, { message: 'La photo est requise.' })
  imageUrl: string;

  // Лише http(s): значення потрапляє в href, тож javascript: сюди не пускаємо.
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Adresse du site invalide.' },
  )
  @MaxLength(2048)
  url?: string;

  // id зі словника data/skills.json; невідомі бекенд відкине.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
