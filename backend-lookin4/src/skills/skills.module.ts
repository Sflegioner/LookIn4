import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({
  controllers: [SkillsController],
  providers: [SkillsService],
  // CvsModule парсить резюме тим самим словником.
  exports: [SkillsService],
})
export class SkillsModule {}
