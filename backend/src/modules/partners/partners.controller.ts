import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly svc: PartnersService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('payouts') getPayouts() { return this.svc.getPayouts(); }
  @Post('payouts') createPayout(@Body() body: any) { return this.svc.createPayout(body); }
  @Patch('payouts/:id/approve') approvePayout(@Param('id') id: string) { return this.svc.approvePayout(id); }
  @Get() getPartners() { return this.svc.getPartners(); }
  @Post() createPartner(@Body() body: any) { return this.svc.createPartner(body); }
  @Patch(':id') updatePartner(@Param('id') id: string, @Body() body: any) { return this.svc.updatePartner(id, body); }
  @Delete(':id') deletePartner(@Param('id') id: string) { return this.svc.deletePartner(id); }
}
