import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  CompanySize,
  ContractType,
  OffreType,
} from '../../generated/prisma/client';

export class OffreDto {
  @IsString()
  @IsNotEmpty({ message: "Le titre de l'offre est requis." })
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(OffreType, { message: "Type d'offre inconnu." })
  type?: OffreType;

  @IsOptional()
  @IsString()
  metier?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsEnum(ContractType, { message: 'Type de contrat inconnu.' })
  contract?: ContractType;

  // id зі словника data/skills.json; невідомі бекенд відкине.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

export class OrgNodeDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis.' })
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telephone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email du contact invalide.' })
  email?: string;

  // Рекурсія: вузол містить такі самі вузли.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrgNodeDto)
  children?: OrgNodeDto[];
}

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty({ message: "Le nom de l'entreprise est requis." })
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsEnum(CompanySize, { message: 'Catégorie inconnue.' })
  size?: CompanySize;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date de création invalide.' })
  foundedOn?: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrgNodeDto)
  nodes?: OrgNodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OffreDto)
  offres?: OffreDto[];
}
