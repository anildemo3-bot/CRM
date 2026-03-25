import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OutreachService } from './outreach.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('outreach')
@UseGuards(JwtAuthGuard)
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  // ─── PROSPECTS ───────────────────────────────────────────────

  @Get('prospects')
  getProspects(@Request() req: any) {
    return this.outreachService.getProspects(req.user.orgId, req.user.userId, req.user.role);
  }

  @Post('prospects')
  createProspect(@Request() req: any, @Body() body: any) {
    return this.outreachService.createProspect(req.user.orgId, req.user.userId, body);
  }

  @Post('prospects/import')
  importProspects(@Request() req: any, @Body() body: { rows: any[] }) {
    return this.outreachService.importProspects(req.user.orgId, req.user.userId, body.rows);
  }

  @Patch('prospects/:id')
  updateProspect(@Param('id') id: string, @Body() body: any) {
    return this.outreachService.updateProspect(id, body);
  }

  @Delete('prospects/:id')
  deleteProspect(@Param('id') id: string) {
    return this.outreachService.deleteProspect(id);
  }

  // ─── CALL LOGS ───────────────────────────────────────────────

  @Get('calls')
  getCallLogs(@Request() req: any) {
    return this.outreachService.getCallLogs(req.user.orgId, req.user.userId, req.user.role);
  }

  @Post('calls')
  createCallLog(@Request() req: any, @Body() body: any) {
    return this.outreachService.createCallLog(req.user.orgId, req.user.userId, body);
  }

  @Delete('calls/:id')
  deleteCallLog(@Param('id') id: string) {
    return this.outreachService.deleteCallLog(id);
  }

  // ─── SEQUENCES ───────────────────────────────────────────────

  @Get('sequences')
  getSequences(@Request() req: any) {
    return this.outreachService.getSequences(req.user.orgId);
  }

  @Post('sequences')
  createSequence(@Request() req: any, @Body() body: any) {
    return this.outreachService.createSequence(req.user.orgId, req.user.userId, body);
  }

  @Patch('sequences/:id')
  updateSequence(@Param('id') id: string, @Body() body: any) {
    return this.outreachService.updateSequence(id, body);
  }

  @Delete('sequences/:id')
  deleteSequence(@Param('id') id: string) {
    return this.outreachService.deleteSequence(id);
  }

  // ─── EMAIL TEMPLATES ─────────────────────────────────────────

  @Get('templates')
  getTemplates(@Request() req: any) {
    return this.outreachService.getTemplates(req.user.orgId);
  }

  @Post('templates')
  createTemplate(@Request() req: any, @Body() body: any) {
    return this.outreachService.createTemplate(req.user.orgId, req.user.userId, body);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.outreachService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.outreachService.deleteTemplate(id);
  }

  // ─── ANALYTICS ───────────────────────────────────────────────

  @Get('analytics')
  getAnalytics(@Request() req: any) {
    return this.outreachService.getAnalytics(req.user.orgId);
  }
}
