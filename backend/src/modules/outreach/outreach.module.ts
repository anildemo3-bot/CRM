import { Module } from '@nestjs/common';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [OutreachController],
  providers: [OutreachService, PrismaService],
})
export class OutreachModule {}
