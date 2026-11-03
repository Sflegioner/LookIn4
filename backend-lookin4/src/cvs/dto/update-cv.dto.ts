import {
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateCvDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  /**
   * Приймаємо лише те, що сам бекенд і видав з /uploads.
   * Шлях приходить від клієнта, тож без цієї перевірки сюди можна було б
   * записати будь-що — від `../../.env` до чужого URL.
   */
  @IsOptional()
  @Matches(/^\/files\/[\w.-]+$/, { message: 'Fichier invalide.' })
  fileUrl?: string;

  /** Навички, додані вручну. Повний список, а не приріст. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  manualSkills?: string[];
}
