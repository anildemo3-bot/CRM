import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // ─── PROJECTS ─────────────────────────────────────────────────

  @Get()
  getProjects(@Request() req: any) {
    return this.projectsService.getProjects(req.user.orgId);
  }

  @Post()
  createProject(@Request() req: any, @Body() data: any) {
    return this.projectsService.createProject(req.user.orgId, data);
  }

  @Patch(':projectId')
  updateProject(@Param('projectId') projectId: string, @Body() data: any) {
    return this.projectsService.updateProject(projectId, data);
  }

  @Delete(':projectId')
  deleteProject(@Param('projectId') projectId: string) {
    return this.projectsService.deleteProject(projectId);
  }

  // ─── TASKS ────────────────────────────────────────────────────

  @Get('tasks')
  getTasks(@Request() req: any, @Query('projectId') projectId?: string) {
    return this.projectsService.getTasks(req.user.orgId, projectId);
  }

  @Post('tasks')
  createTask(@Request() req: any, @Body() data: any) {
    return this.projectsService.createTask(req.user.orgId, req.user.userId, data);
  }

  @Patch('tasks/:id')
  updateTask(@Param('id') id: string, @Body() data: any) {
    return this.projectsService.updateTask(id, data);
  }

  @Delete('tasks/:id')
  deleteTask(@Param('id') id: string) {
    return this.projectsService.deleteTask(id);
  }

  // ─── TASK NOTES / CHECKLIST ───────────────────────────────────

  @Get('tasks/:id/notes')
  getTaskNotes(@Param('id') id: string) {
    return this.projectsService.getTaskNotes(id);
  }

  @Post('tasks/:id/notes')
  addTaskNote(@Param('id') id: string, @Request() req: any, @Body('content') content: string) {
    return this.projectsService.addTaskNote(id, req.user.userId, content);
  }

  @Delete('tasks/notes/:noteId')
  deleteTaskNote(@Param('noteId') noteId: string) {
    return this.projectsService.deleteTaskNote(noteId);
  }

  // ─── TIME TRACKING ────────────────────────────────────────────

  @Get('time')
  getTimeEntries(@Request() req: any, @Query('taskId') taskId?: string) {
    return this.projectsService.getTimeEntries(req.user.orgId, taskId);
  }

  @Post('time')
  logTime(@Request() req: any, @Body() data: any) {
    return this.projectsService.logTime(req.user.userId, data);
  }

  @Delete('time/:id')
  deleteTimeEntry(@Param('id') id: string) {
    return this.projectsService.deleteTimeEntry(id);
  }

  // ─── WORKLOAD ─────────────────────────────────────────────────

  @Get('workload')
  getWorkload(@Request() req: any) {
    return this.projectsService.getWorkload(req.user.orgId);
  }

  // ─── DASHBOARD ────────────────────────────────────────────────

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.projectsService.getDashboard(req.user.orgId);
  }

  // ─── MEMBERS ──────────────────────────────────────────────────

  @Get('members')
  getMembers(@Request() req: any) {
    return this.projectsService.getMembers(req.user.orgId);
  }
}
