import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { CRMService } from './crm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CRMController {
  constructor(private crmService: CRMService) {}

  @Get('contacts')
  async getContacts(@Request() req: any) {
    return this.crmService.getContacts(req.user.orgId);
  }

  @Post('contacts')
  async createContact(@Request() req: any, @Body() data: any) {
    return this.crmService.createContact(req.user.orgId, data);
  }

  @Get('pipelines')
  async getPipelines(@Request() req: any) {
    return this.crmService.getPipelines(req.user.orgId);
  }

  @Post('deals')
  async createDeal(@Request() req: any, @Body() data: any) {
    return this.crmService.createDeal(req.user.orgId, data);
  }

  @Patch('deals/:id/stage')
  async updateDealStage(@Param('id') id: string, @Body('stageId') stageId: string) {
    return this.crmService.updateDealStage(id, stageId);
  }

  @Patch('deals/:id')
  async updateDeal(@Param('id') id: string, @Body() data: any) {
    return this.crmService.updateDeal(id, data);
  }

  @Get('companies')
  async getCompanies(@Request() req: any) {
    return this.crmService.getCompanies(req.user.orgId);
  }

  @Post('companies')
  async createCompany(@Request() req: any, @Body() data: any) {
    return this.crmService.createCompany(req.user.orgId, data);
  }

  @Patch('companies/:id')
  async updateCompany(@Param('id') id: string, @Body() data: any) {
    return this.crmService.updateCompany(id, data);
  }
}
