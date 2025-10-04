import '../types';
import React, { useMemo } from 'react';
import type { PurchaseRecord } from '../types';
import { InvoiceStatus, Page } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';

interface InvoiceDashboardProps {
  purchaseRecords: PurchaseRecord[];
  onNavigate: (page: Page) => void;
}

export const InvoiceDashboard: React.FC<InvoiceDashboardProps> = ({ purchaseRecords, onNavigate }) => {
    
    const stats = useMemo(() => {
        const nonRejectedInvoices = purchaseRecords.filter(r => r.status !== InvoiceStatus.REJECTED);
        const totalValue = nonRejectedInvoices.reduce((acc, record) => acc + record.totalAmount, 0);
        const pendingReview = purchaseRecords.filter(r => r.status === InvoiceStatus.PENDING_REVIEW).length;
        const pendingApproval = purchaseRecords.filter(r => r.status === InvoiceStatus.PENDING_APPROVAL).length;
        return { totalValue, pendingReview, pendingApproval };
    }, [purchaseRecords]);

    const recentInvoices = useMemo(() => {
        return [...purchaseRecords]
            .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
            .slice(0, 5);
    }, [purchaseRecords]);

    const getStatusChipClass = (status: InvoiceStatus) => {
        switch (status) {
            case InvoiceStatus.PENDING_REVIEW: return 'bg-cyan-500/20 text-cyan-400';
            case InvoiceStatus.PENDING_APPROVAL: return 'bg-yellow-500/20 text-yellow-400';
            case InvoiceStatus.APPROVED: return 'bg-green-500/20 text-green-400';
            case InvoiceStatus.REJECTED: return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-white">Invoice Dashboard</h1>
                <Button onClick={() => onNavigate(Page.RECORD_INVOICE)} variant="primary" iconName="add-outline">
                    Add New Invoice
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-brand-primary rounded-md p-3">
                           {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                           <ion-icon name="cash-outline" className="text-2xl text-blue-200"></ion-icon>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-400">Total Invoice Value</p>
                            <p className="text-2xl font-bold text-white">${stats.totalValue.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-800 rounded-md p-3">
                           {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                           <ion-icon name="eye-outline" className="text-2xl text-cyan-300"></ion-icon>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-400">Invoices Pending Review</p>
                            <p className="text-2xl font-bold text-white">{stats.pendingReview}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-800 rounded-md p-3">
                           {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                           <ion-icon name="time-outline" className="text-2xl text-yellow-300"></ion-icon>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-400">Invoices Pending Approval</p>
                            <p className="text-2xl font-bold text-white">{stats.pendingApproval}</p>
                        </div>
                    </div>
                </Card>
            </div>
            
             <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Recent Invoices</h2>
                    <Button onClick={() => onNavigate(Page.INVOICES)} variant="secondary" size="sm" iconName="grid-outline">
                        View All
                    </Button>
                </div>
                 <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                          <tr>
                            <th scope="col" className="px-6 py-3">Vendor</th>
                            <th scope="col" className="px-6 py-3">Invoice #</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Submitted</th>
                            <th scope="col" className="px-6 py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentInvoices.map(invoice => (
                            <tr key={invoice.id} className="bg-gray-800 border-b border-gray-700 last:border-0 hover:bg-gray-750">
                              <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{invoice.vendorName}</th>
                              <td className="px-6 py-4">{invoice.invoiceNumber}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(invoice.status)}`}>
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">{new Date(invoice.submissionDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-mono text-right">${invoice.totalAmount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                       {recentInvoices.length === 0 && <p className="text-center py-10 text-gray-500">No recent invoices.</p>}
                    </div>
            </Card>
        </div>
    );
};