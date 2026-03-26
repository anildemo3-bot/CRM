import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { OutreachService } from './outreach.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('outreach')
@UseGuards(JwtAuthGuard)
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  // ─── PROSPECTS ───────────────────────────────────────────────

  @Get('prospects')
  getProspects(@Request() req: any) {
    return this.outreachService.getProspects(req.user.orgId, req.user.sub, req.user.role);
  }

  @Post('prospects')
  createProspect(@Request() req: any, @Body() body: any) {
    return this.outreachService.createProspect(req.user.orgId, req.user.sub, body);
  }

  @Post('prospects/import')
  importProspects(@Request() req: any, @Body() body: { rows: any[] }) {
    return this.outreachService.importProspects(req.user.orgId, req.user.sub, body.rows);
  }

  @Patch('prospects/:id/assign')
  assignProspect(@Param('id') id: string, @Request() req: any, @Body('assigneeId') assigneeId: string) {
    return this.outreachService.assignProspect(id, assigneeId, req.user.orgId, req.user.sub);
  }

  @Patch('prospects/:id')
  updateProspect(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.outreachService.updateProspect(id, req.user.sub, req.user.orgId, body);
  }

  @Delete('prospects/:id')
  deleteProspect(@Param('id') id: string) {
    return this.outreachService.deleteProspect(id);
  }

  // ─── CALL LOGS ───────────────────────────────────────────────

  @Get('calls')
  getCallLogs(@Request() req: any) {
    return this.outreachService.getCallLogs(req.user.orgId, req.user.sub, req.user.role);
  }

  @Post('calls')
  createCallLog(@Request() req: any, @Body() body: any) {
    return this.outreachService.createCallLog(req.user.orgId, req.user.sub, body);
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
    return this.outreachService.createSequence(req.user.orgId, req.user.sub, body);
  }

  @Patch('sequences/:id')
  updateSequence(@Param('id') id: string, @Body() body: any) {
    return this.outreachService.updateSequence(id, body);
  }

  @Delete('sequences/:id')
  deleteSequence(@Param('id') id: string) {
    return this.outreachService.deleteSequence(id);
  }

  // ─── SEQUENCE ENROLLMENT ─────────────────────────────────────

  @Post('sequences/:id/enroll')
  enrollProspects(
    @Param('id') sequenceId: string,
    @Request() req: any,
    @Body('prospectIds') prospectIds: string[],
  ) {
    return this.outreachService.enrollProspects(req.user.orgId, req.user.sub, sequenceId, prospectIds);
  }

  @Get('enrollments')
  getEnrollments(
    @Request() req: any,
    @Query('prospectId') prospectId?: string,
    @Query('sequenceId') sequenceId?: string,
  ) {
    return this.outreachService.getEnrollments(req.user.orgId, prospectId, sequenceId);
  }

  // ─── EMAIL TEMPLATES ─────────────────────────────────────────

  @Get('templates')
  getTemplates(@Request() req: any) {
    return this.outreachService.getTemplates(req.user.orgId);
  }

  @Post('templates')
  createTemplate(@Request() req: any, @Body() body: any) {
    return this.outreachService.createTemplate(req.user.orgId, req.user.sub, body);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.outreachService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.outreachService.deleteTemplate(id);
  }

  // ─── INBOX ────────────────────────────────────────────────────

  @Get('inbox')
  getInbox(
    @Request() req: any,
    @Query('prospectId') prospectId?: string,
    @Query('channel') channel?: string,
  ) {
    return this.outreachService.getInbox(req.user.orgId, req.user.sub, req.user.role, prospectId, channel);
  }

  @Post('inbox')
  addInboxMessage(@Request() req: any, @Body() body: any) {
    return this.outreachService.addInboxMessage(req.user.orgId, req.user.sub, body);
  }

  @Patch('inbox/:id/read')
  markRead(@Param('id') id: string) {
    return this.outreachService.markRead(id);
  }

  // ─── ACTIVITY FEED ───────────────────────────────────────────

  @Get('activities')
  getActivities(
    @Request() req: any,
    @Query('prospectId') prospectId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.outreachService.getActivities(req.user.orgId, prospectId, userId);
  }

  // ─── SDR KPI DASHBOARD ───────────────────────────────────────

  @Get('sdr-stats')
  getSDRStats(@Request() req: any) {
    return this.outreachService.getSDRStats(req.user.orgId);
  }

  // ─── ANALYTICS ───────────────────────────────────────────────

  @Get('analytics')
  getAnalytics(@Request() req: any) {
    return this.outreachService.getAnalytics(req.user.orgId);
  }

  // ─── AI ───────────────────────────────────────────────────────

  @Post('ai/generate-message')
  generateMessage(@Body() body: any) {
    return this.outreachService.generateMessage(body);
  }

  @Get('ai/follow-ups/:prospectId')
  getSuggestedFollowUps(@Param('prospectId') prospectId: string) {
    return this.outreachService.getSuggestedFollowUps(prospectId);
  }
}
