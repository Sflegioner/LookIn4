import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  UPLOAD_DIR,
  UPLOAD_PREFIX,
} from './uploads.constants';

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          // Ім'я генеруємо самі. Оригінальне не використовуємо взагалі,
          // інакше `../../` у ньому вивів би запис за межі теки.
          const ext = ALLOWED_TYPES[file.mimetype] ?? '';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_TYPES[file.mimetype]) {
          cb(new BadRequestException('Format non supporté.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');

    return {
      filename: file.filename,
      url: `${UPLOAD_PREFIX}/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
