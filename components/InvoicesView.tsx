// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../types';
import React, { useState, useMemo } from 'react';
import type { PurchaseRecord, User } from '../types';
import { InvoiceStatus, UserRole } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Modal } from './common/Modal';
import { DatePicker } from './common/DatePicker';
import { useToast } from '../hooks/useToast';

interface InvoicesViewProps {
  purchaseRecords: PurchaseRecord[];
  currentUser: User;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus, user: User) => void;
  deleteInvoice: (invoiceId: string) => Promise<void>;
}

const getStatusChipClass = (status: InvoiceStatus) => {
  switch (status) {
    case InvoiceStatus.PENDING_REVIEW:
      return 'bg-cyan-500/20 text-cyan-400';
    case InvoiceStatus.PENDING_APPROVAL:
      return 'bg-yellow-500/20 text-yellow-400';
    case InvoiceStatus.APPROVED:
      return 'bg-green-500/20 text-green-400';
    case InvoiceStatus.REJECTED:
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

const canDeleteInvoice = (invoice: PurchaseRecord, user: User): boolean => {
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }
  if (user.role === UserRole.CHECKER && invoice.status === InvoiceStatus.PENDING_REVIEW) {
    return true;
  }
  if (user.role === UserRole.AUTHORIZER && (
    invoice.status === InvoiceStatus.PENDING_REVIEW ||
    invoice.status === InvoiceStatus.PENDING_APPROVAL ||
    invoice.status === InvoiceStatus.REJECTED
  )) {
    return true;
  }
  return false;
};


const InvoiceDetailsModal: React.FC<{
    invoice: PurchaseRecord, 
    onClose: () => void,
    currentUser: User,
    updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus, user: User) => void
    deleteInvoice: (invoiceId: string) => Promise<void>;
}> = ({ invoice, onClose, currentUser, updateInvoiceStatus, deleteInvoice }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const handleApprove = () => {
        if(currentUser.role === UserRole.CHECKER) {
            updateInvoiceStatus(invoice.id, InvoiceStatus.PENDING_APPROVAL, currentUser);
        } else if (currentUser.role === UserRole.AUTHORIZER || currentUser.role === UserRole.SUPER_ADMIN) {
            updateInvoiceStatus(invoice.id, InvoiceStatus.APPROVED, currentUser);
        }
        onClose();
    }
    
    const handleReject = () => {
        updateInvoiceStatus(invoice.id, InvoiceStatus.REJECTED, currentUser);
        onClose();
    }

    const confirmDelete = async () => {
        await deleteInvoice(invoice.id);
        setShowDeleteModal(false);
        onClose();
    }

    const canApprove = (currentUser.role === UserRole.CHECKER && invoice.status === InvoiceStatus.PENDING_REVIEW) ||
                       ((currentUser.role === UserRole.AUTHORIZER || currentUser.role === UserRole.SUPER_ADMIN) && invoice.status === InvoiceStatus.PENDING_APPROVAL);

    const approveText = currentUser.role === UserRole.CHECKER ? "Submit for Approval" : "Approve Invoice";
    const canDelete = canDeleteInvoice(invoice, currentUser);

    const handleViewDocument = (file: any) => {
        const dataUrl = `data:${file.type};base64,${file.data}`;
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
            newWindow.document.title = file.name;
        }
    };

    return (
        <>
            {showDeleteModal && (
                <Modal
                    title="Confirm Deletion"
                    message={`Are you sure you want to permanently delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    confirmText="Delete Invoice"
                    variant="danger"
                />
            )}
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Invoice Details</h2>
                        <Button onClick={onClose} variant="secondary" size="sm" iconName="close-outline" />
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><span className="text-gray-400">Vendor Name:</span><p className="font-semibold text-white">{invoice.vendorName}</p></div>
                            <div><span className="text-gray-400">Invoice Number:</span><p className="font-semibold text-white">{invoice.invoiceNumber}</p></div>
                            <div><span className="text-gray-400">Invoice Date:</span><p className="font-semibold text-white">{new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString()}</p></div>
                            <div><span className="text-gray-400">Cost Center:</span><p className="font-semibold text-white">{invoice.costCenter}</p></div>
                             {invoice.projectName && <div><span className="text-gray-400">Project:</span><p className="font-semibold text-white">{invoice.projectName}</p></div>}
                             <div>
                                <span className="text-gray-400">Status:</span>
                                <p><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(invoice.status)}`}>{invoice.status}</span></p>
                            </div>
                            {invoice.checkedBy && (
                                <div><span className="text-gray-400">Checked By:</span><p className="font-semibold text-white">{invoice.checkedBy}</p></div>
                            )}
                            {invoice.approvedBy && (
                                <div><span className="text-gray-400">Approved By:</span><p className="font-semibold text-white">{invoice.approvedBy}</p></div>
                            )}
                             <div className="sm:col-span-2"><span className="text-gray-400">Total Amount:</span><p className="text-2xl font-bold text-blue-400">${invoice.totalAmount.toFixed(2)}</p></div>
                        </div>
                        
                        <div className="mt-6 flex justify-between items-center border-t border-gray-700 pt-4">
                            <div>
                                <Button onClick={() => handleViewDocument(invoice.invoiceFile)} variant="secondary" iconName="document-text-outline">View Invoice</Button>
                                {canDelete && (
                                    <Button onClick={() => setShowDeleteModal(true)} variant="danger-outline" iconName="trash-outline" className="ml-2">Delete</Button>
                                )}
                            </div>
                            <div className="flex space-x-4">
                                {canApprove && (
                                    <>
                                        <Button onClick={handleReject} variant="danger" iconName="close-circle-outline">Reject</Button>
                                        <Button onClick={handleApprove} variant="primary" iconName="checkmark-circle-outline">{approveText}</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
};

export const InvoicesView: React.FC<InvoicesViewProps> = ({ purchaseRecords, currentUser, updateInvoiceStatus, deleteInvoice }) => {
  const [filter, setFilter] = useState({ startDate: '', endDate: '' });
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseRecord | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<PurchaseRecord | null>(null);
  const { addToast } = useToast();
  
  const handleDateChange = (name: 'startDate' | 'endDate', date: string) => {
    setFilter(prev => ({...prev, [name]: date}));
  };

  const handleRequestDelete = (invoice: PurchaseRecord) => {
    setInvoiceToDelete(invoice);
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      await deleteInvoice(invoiceToDelete.id);
      addToast(`Invoice ${invoiceToDelete.invoiceNumber} has been deleted.`, 'success');
      setInvoiceToDelete(null);
    }
  };

  const filteredInvoices = useMemo(() => {
     return purchaseRecords.filter(invoice => {
        if (!filter.startDate && !filter.endDate) return true;
        const recordDate = new Date(invoice.invoiceDate + 'T00:00:00'); 
        const startDate = filter.startDate ? new Date(filter.startDate + 'T00:00:00') : null;
        let endDate = filter.endDate ? new Date(filter.endDate + 'T00:00:00') : null;
        if (startDate && recordDate < startDate) return false;
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
            if (recordDate > endDate) return false;
        }
        return true;
    }).sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  }, [purchaseRecords, filter]);

  return (
    <div className="space-y-8">
      {viewingInvoice && <InvoiceDetailsModal invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} currentUser={currentUser} updateInvoiceStatus={updateInvoiceStatus} deleteInvoice={deleteInvoice} />}
      {invoiceToDelete && (
        <Modal
            title="Confirm Deletion"
            message={`Are you sure you want to permanently delete invoice ${invoiceToDelete.invoiceNumber} from ${invoiceToDelete.vendorName}? This action cannot be undone.`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setInvoiceToDelete(null)}
            confirmText="Delete Invoice"
            variant="danger"
        />
      )}

      <h1 className="text-3xl font-bold tracking-tight text-white">All Invoices</h1>
      
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b border-gray-700">
            <DatePicker label="Start Date" value={filter.startDate} onChange={(date) => handleDateChange('startDate', date)} />
            <DatePicker label="End Date" value={filter.endDate} onChange={(date) => handleDateChange('endDate', date)} min={filter.startDate} />
        </div>

        <h2 className="text-xl font-semibold text-white mb-4">Purchase History ({filteredInvoices.length})</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Date</th>
                        <th scope="col" className="px-6 py-3">Invoice #</th>
                        <th scope="col" className="px-6 py-3">Cost Center</th>
                        <th scope="col" className="px-6 py-3">Project</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Total Cost</th>
                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => (
                        <tr key={invoice.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="px-6 py-4">{new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString()}</td>
                            <td scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{invoice.invoiceNumber}</td>
                            <td className="px-6 py-4">{invoice.costCenter}</td>
                            <td className="px-6 py-4">{invoice.projectName || 'N/A'}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(invoice.status)}`}>{invoice.status}</span></td>
                            <td className="px-6 py-4 font-mono">${invoice.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                                <Button onClick={() => setViewingInvoice(invoice)} variant="secondary" size="sm">View</Button>
                                {canDeleteInvoice(invoice, currentUser) && (
                                    <Button onClick={() => handleRequestDelete(invoice)} variant="danger-outline" size="sm">
                                        Delete
                                    </Button>
                                )}
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-500">No purchase records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};