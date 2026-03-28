import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  @Get('stats')
  getStats() {
    return this.superAdminService.getStats();
  }

  @Get('orgs')
  getOrgs() {
    return this.superAdminService.getOrgs();
  }

  @Get('orgs/:id')
  getOrgDetail(@Param('id') id: string) {
    return this.superAdminService.getOrgDetail(id);
  }
}
