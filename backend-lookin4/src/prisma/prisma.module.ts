import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global — щоб не імпортувати цей модуль у кожен feature-модуль окремо.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
