import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private clients: ClientsService) {}

  @Get('tickets')
  getTickets(@Request() req: any) {
    return this.clients.getTickets(req.user.orgId);
  }

  @Post('tickets')
  createTicket(@Request() req: any, @Body() data: any) {
    return this.clients.createTicket(req.user.orgId, data);
  }

  @Patch('tickets/:id')
  updateTicket(@Param('id') id: string, @Body() data: any) {
    return this.clients.updateTicket(id, data);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.clients.getStats(req.user.orgId);
  }
}
