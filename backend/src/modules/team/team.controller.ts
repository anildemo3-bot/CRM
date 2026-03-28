import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Get('members')
  getMembers(@Request() req: any) {
    return this.teamService.getMembers(req.user.orgId);
  }

  @Post('invite')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'SUPER_ADMIN')
  inviteMember(@Request() req: any, @Body() body: any) {
    return this.teamService.inviteMember(req.user.orgId, req.user.userId, body.email, body.role);
  }

  @Get('invites')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'SUPER_ADMIN')
  getInvites(@Request() req: any) {
    return this.teamService.getInvites(req.user.orgId);
  }

  @Delete('invites/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  revokeInvite(@Param('id') id: string, @Request() req: any) {
    return this.teamService.revokeInvite(id, req.user.orgId);
  }

  @Patch('members/:id/role')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  changeRole(@Param('id') id: string, @Body('role') role: string, @Request() req: any) {
    return this.teamService.changeRole(id, req.user.orgId, role);
  }

  @Delete('members/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  removeMember(@Param('id') id: string, @Request() req: any) {
    return this.teamService.removeMember(id, req.user.orgId, req.user.userId);
  }
}
