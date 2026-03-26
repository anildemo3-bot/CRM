import { Injectable } from '@nestjs/common';

export type NotifType =
  | 'TASK_STATUS_CHANGED'
  | 'TASK_OVERDUE'
  | 'TASK_REASSIGNED'
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED';

export interface Notification {
  id: string;
  orgId: string;
  recipientId: string | null; // null = broadcast to whole org
  type: NotifType;
  title: string;
  description: string;
  isRead: boolean;
  meta?: Record<string, any>;
  createdAt: Date;
}

let store: Notification[] = [];
let counter = 1;

@Injectable()
export class NotificationsService {
  push(
    orgId: string,
    recipientId: string | null,
    type: NotifType,
    title: string,
    description: string,
    meta?: Record<string, any>,
  ): Notification {
    const notif: Notification = {
      id: `notif_${counter++}_${Date.now()}`,
      orgId,
      recipientId,
      type,
      title,
      description,
      isRead: false,
      meta,
      createdAt: new Date(),
    };
    store.push(notif);
    // keep max 500 per org
    const orgNotifs = store.filter(n => n.orgId === orgId);
    if (orgNotifs.length > 500) {
      const oldest = orgNotifs.slice(0, orgNotifs.length - 500).map(n => n.id);
      store = store.filter(n => !oldest.includes(n.id));
    }
    return notif;
  }

  getForUser(orgId: string, userId: string): Notification[] {
    return store
      .filter(n => n.orgId === orgId && (n.recipientId === null || n.recipientId === userId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);
  }

  markRead(id: string): void {
    const n = store.find(n => n.id === id);
    if (n) n.isRead = true;
  }

  markAllRead(orgId: string, userId: string): void {
    store
      .filter(n => n.orgId === orgId && (n.recipientId === null || n.recipientId === userId))
      .forEach(n => { n.isRead = true; });
  }

  unreadCount(orgId: string, userId: string): number {
    return store.filter(
      n => n.orgId === orgId &&
        (n.recipientId === null || n.recipientId === userId) &&
        !n.isRead,
    ).length;
  }
}
