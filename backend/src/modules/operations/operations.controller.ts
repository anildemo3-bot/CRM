import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(private ops: OperationsService) {}

  @Get('employees')
  getEmployees(@Request() req: any) {
    return this.ops.getEmployees(req.user.orgId);
  }

  @Post('employees')
  createEmployee(@Request() req: any, @Body() data: any) {
    return this.ops.createEmployee(req.user.orgId, data);
  }

  @Patch('employees/:id')
  updateEmployee(@Param('id') id: string, @Body() data: any) {
    return this.ops.updateEmployee(id, data);
  }

  @Get('attendance')
  getAttendance(@Request() req: any) {
    return this.ops.getAttendance(req.user.orgId);
  }

  @Post('attendance')
  markAttendance(@Body() data: any) {
    return this.ops.markAttendance(data);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.ops.getStats(req.user.orgId);
  }
}
