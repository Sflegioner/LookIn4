import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalide.' })
  email: string;

  // Без обмежень довжини: правила пароля стосуються реєстрації,
  // а тут вони б лише підказували атакуючому формат.
  @IsString()
  @IsNotEmpty({ message: 'Mot de passe requis.' })
  password: string;
}
