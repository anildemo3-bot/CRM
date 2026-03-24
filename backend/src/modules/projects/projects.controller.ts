import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async getProjects(@Request() req: any) {
    return this.projectsService.getProjects(req.user.orgId);
  }

  @Post()
  async createProject(@Request() req: any, @Body() data: any) {
    return this.projectsService.createProject(req.user.orgId, data);
  }

  @Get('tasks')
  async getTasks(@Request() req: any) {
    return this.projectsService.getTasks(req.user.orgId);
  }

  @Post('tasks')
  async createTask(@Body() data: any) {
    return this.projectsService.createTask(data);
  }

  @Patch('tasks/:id')
  async updateTask(@Param('id') id: string, @Body('status') status: any) {
    return this.projectsService.updateTaskStatus(id, status);
  }
}
