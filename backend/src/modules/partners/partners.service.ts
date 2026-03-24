import { Injectable } from '@nestjs/common';

let PARTNERS: any[] = [
  { id: 'p1', name: 'Growth Lab', type: 'Influencer', contactEmail: 'hello@growthlab.io', revenue: 42000, referrals: 15, commissionRate: 20, commission: 8400, status: 'Active', joinedAt: '2024-01-10' },
  { id: 'p2', name: 'SaaS Rocket', type: 'Agency', contactEmail: 'team@saasrocket.co', revenue: 125000, referrals: 32, commissionRate: 20, commission: 25000, status: 'Active', joinedAt: '2023-11-05' },
  { id: 'p3', name: 'Legal Flow', type: 'Affiliate', contactEmail: 'info@legalflow.com', revenue: 12000, referrals: 4, commissionRate: 10, commission: 1200, status: 'Pending', joinedAt: '2024-02-20' },
  { id: 'p4', name: 'Acme Partnerships', type: 'Strategic', contactEmail: 'partners@acme.com', revenue: 0, referrals: 0, commissionRate: 15, commission: 0, status: 'Draft', joinedAt: '2024-03-01' },
];

let PAYOUTS: any[] = [
  { id: 'pay1', partner: 'SaaS Rocket', amount: 12500, period: 'Feb 2024', status: 'Paid', paidAt: '2024-03-05' },
  { id: 'pay2', partner: 'Growth Lab', amount: 4200, period: 'Feb 2024', status: 'Paid', paidAt: '2024-03-05' },
  { id: 'pay3', partner: 'SaaS Rocket', amount: 12500, period: 'Mar 2024', status: 'Pending', paidAt: null },
  { id: 'pay4', partner: 'Growth Lab', amount: 4200, period: 'Mar 2024', status: 'Pending', paidAt: null },
];

let counter = 100;

@Injectable()
export class PartnersService {
  getPartners() { return PARTNERS; }
  createPartner(data: any) {
    const item = { id: `p${++counter}`, ...data, revenue: 0, referrals: 0, commission: 0, joinedAt: new Date().toISOString() };
    PARTNERS.push(item);
    return item;
  }
  updatePartner(id: string, data: any) {
    PARTNERS = PARTNERS.map(p => p.id === id ? { ...p, ...data } : p);
    return PARTNERS.find(p => p.id === id);
  }
  deletePartner(id: string) {
    PARTNERS = PARTNERS.filter(p => p.id !== id);
    return { success: true };
  }

  getPayouts() { return PAYOUTS; }
  createPayout(data: any) {
    const item = { id: `pay${++counter}`, ...data, paidAt: null };
    PAYOUTS.push(item);
    return item;
  }
  approvePayout(id: string) {
    PAYOUTS = PAYOUTS.map(p => p.id === id ? { ...p, status: 'Paid', paidAt: new Date().toISOString() } : p);
    return PAYOUTS.find(p => p.id === id);
  }

  getStats() {
    const totalRevenue = PARTNERS.reduce((s, p) => s + p.revenue, 0);
    const activePartners = PARTNERS.filter(p => p.status === 'Active').length;
    const totalCommission = PARTNERS.reduce((s, p) => s + p.commission, 0);
    const pendingPayout = PAYOUTS.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
    return { totalRevenue, activePartners, totalCommission, pendingPayout };
  }
}
