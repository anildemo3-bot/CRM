import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('overview')
  getOverview(@Request() req: any) {
    return this.analytics.getOverview(req.user.orgId);
  }

  @Get('revenue-by-month')
  getRevenueByMonth(@Request() req: any) {
    return this.analytics.getRevenueByMonth(req.user.orgId);
  }
}
