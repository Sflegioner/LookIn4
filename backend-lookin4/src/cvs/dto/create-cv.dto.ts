import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCvDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre du CV est requis.' })
  @MaxLength(160)
  title: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
