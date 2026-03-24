import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly svc: KnowledgeService) {}

  @Get('scripts') getScripts() { return this.svc.getScripts(); }
  @Post('scripts') createScript(@Body() body: any) { return this.svc.createScript(body); }
  @Patch('scripts/:id') updateScript(@Param('id') id: string, @Body() body: any) { return this.svc.updateScript(id, body); }
  @Delete('scripts/:id') deleteScript(@Param('id') id: string) { return this.svc.deleteScript(id); }

  @Get('playbooks') getPlaybooks() { return this.svc.getPlaybooks(); }
  @Post('playbooks') createPlaybook(@Body() body: any) { return this.svc.createPlaybook(body); }
  @Patch('playbooks/:id') updatePlaybook(@Param('id') id: string, @Body() body: any) { return this.svc.updatePlaybook(id, body); }
  @Delete('playbooks/:id') deletePlaybook(@Param('id') id: string) { return this.svc.deletePlaybook(id); }

  @Get('templates') getTemplates() { return this.svc.getTemplates(); }
  @Post('templates') createTemplate(@Body() body: any) { return this.svc.createTemplate(body); }
  @Delete('templates/:id') deleteTemplate(@Param('id') id: string) { return this.svc.deleteTemplate(id); }
}
