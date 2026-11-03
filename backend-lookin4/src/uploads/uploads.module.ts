import { Module } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { UploadsController } from './uploads.controller';
import { UPLOAD_DIR } from './uploads.constants';

// multer не створює теку сам — якщо її нема, запис падає.
mkdirSync(UPLOAD_DIR, { recursive: true });

@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
