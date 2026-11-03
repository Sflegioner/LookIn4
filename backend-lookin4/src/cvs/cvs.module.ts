import { Module } from '@nestjs/common';
import { SkillsModule } from '../skills/skills.module';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';

@Module({
  imports: [SkillsModule],
  controllers: [CvsController],
  providers: [CvsService],
})
export class CvsModule {}
