import { Module } from '@nestjs/common';
import { SkillsModule } from '../skills/skills.module';
import { FormationsController } from './formations.controller';
import { FormationsService } from './formations.service';

@Module({
  imports: [SkillsModule],
  controllers: [FormationsController],
  providers: [FormationsService],
})
export class FormationsModule {}
