import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { CRMModule } from './modules/crm/crm.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { FinanceModule } from './modules/finance/finance.module';
import { OperationsModule } from './modules/operations/operations.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { PartnersModule } from './modules/partners/partners.module';
import { OutreachModule } from './modules/outreach/outreach.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    AuthModule,
    CRMModule,
    ProjectsModule,
    FinanceModule,
    OperationsModule,
    MarketingModule,
    ClientsModule,
    AnalyticsModule,
    KnowledgeModule,
    PartnersModule,
    OutreachModule,
  ],
})
export class AppModule {}
