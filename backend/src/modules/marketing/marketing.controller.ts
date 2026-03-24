import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
  constructor(private marketing: MarketingService) {}

  @Get('campaigns')
  getCampaigns(@Request() req: any) {
    return this.marketing.getCampaigns(req.user.orgId);
  }

  @Post('campaigns')
  createCampaign(@Request() req: any, @Body() data: any) {
    return this.marketing.createCampaign(req.user.orgId, data);
  }

  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() data: any) {
    return this.marketing.updateCampaign(id, data);
  }

  @Get('leads')
  getLeads(@Request() req: any) {
    return this.marketing.getLeads(req.user.orgId);
  }

  @Post('leads')
  createLead(@Body() data: any) {
    return this.marketing.createLead(data);
  }

  @Patch('leads/:id/score')
  updateLeadScore(@Param('id') id: string, @Body('score') score: number) {
    return this.marketing.updateLeadScore(id, score);
  }
}
