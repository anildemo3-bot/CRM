import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Request() req: any) {
    return this.notificationsService.getForUser(req.user.orgId, req.user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    return { count: this.notificationsService.unreadCount(req.user.orgId, req.user.userId) };
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    this.notificationsService.markRead(id);
    return { success: true };
  }

  @Patch('read-all')
  markAllRead(@Request() req: any) {
    this.notificationsService.markAllRead(req.user.orgId, req.user.userId);
    return { success: true };
  }
}
