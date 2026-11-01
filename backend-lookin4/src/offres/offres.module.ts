import { Module } from '@nestjs/common';
import { OffresController } from './offres.controller';
import { OffresService } from './offres.service';

@Module({
  controllers: [OffresController],
  providers: [OffresService],
})
export class OffresModule {}
