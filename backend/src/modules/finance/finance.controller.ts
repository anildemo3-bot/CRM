import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('invoices')
  getInvoices(@Request() req: any) {
    return this.financeService.getInvoices(req.user.orgId);
  }

  @Post('invoices')
  createInvoice(@Request() req: any, @Body() data: any) {
    return this.financeService.createInvoice(req.user.orgId, data);
  }

  @Patch('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body() data: any) {
    return this.financeService.updateInvoice(id, data);
  }
}
