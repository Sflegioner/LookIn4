import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalide.' })
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  // bcrypt мовчки відрізає все після 72 байтів — краще відмовити явно,
  // ніж прийняти довгий пароль і врахувати лише його початок.
  @MaxLength(72, {
    message: 'Le mot de passe ne peut pas dépasser 72 caractères.',
  })
  password: string;
}
