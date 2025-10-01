

import React, { useState, useMemo } from 'react';
// FIX: Add a side-effect import to ensure global JSX types are loaded.
import {} from '../types';
import type { PurchaseRecord, Project, User } from '../types';
import { InventoryCategory, InvoiceStatus, UserRole } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Button } from './common/Button';
import { FileUpload } from './common/FileUpload';

interface InvoicesViewProps {
  purchaseRecords: PurchaseRecord[];
  // FIX: Added 'category' to the record type to match the expected data structure.
  addPurchaseRecord: (record: Omit<PurchaseRecord, 'id' | 'invoiceUrl' | 'inventoryItemId' | 'totalCost' | 'itemName' | 'status'> & { name: string; category: InventoryCategory; }) => void;
  projects: Project[];
  currentUser: User;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus, user: User) => void;
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


const InvoiceDetailsModal: React.FC<{
    invoice: { invoiceId: string; records: PurchaseRecord[] }, 
    onClose: () => void,
    currentUser: User,
    updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus, user: User) => void
}> = ({ invoice, onClose, currentUser, updateInvoiceStatus }) => {
    const { records } = invoice;
    const firstRecord = records[0];
    const totalCost = records.reduce((sum, item) => sum + item.totalCost, 0);

    const handleApprove = () => {
        if(currentUser.role === UserRole.CHECKER) {
            updateInvoiceStatus(invoice.invoiceId, InvoiceStatus.PENDING_APPROVAL, currentUser);
        } else if (currentUser.role === UserRole.AUTHORIZER) {
            updateInvoiceStatus(invoice.invoiceId, InvoiceStatus.APPROVED, currentUser);
        }
        onClose();
    }
    
    const handleReject = () => {
        updateInvoiceStatus(invoice.invoiceId, InvoiceStatus.REJECTED, currentUser);
        onClose();
    }

    const canApprove = (currentUser.role === UserRole.CHECKER && firstRecord.status === InvoiceStatus.PENDING_REVIEW) ||
                       (currentUser.role === UserRole.AUTHORIZER && firstRecord.status === InvoiceStatus.PENDING_APPROVAL);

    const approveText = currentUser.role === UserRole.CHECKER ? "Submit for Approval" : "Approve Invoice";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Invoice Details</h2>
                    <Button onClick={onClose} variant="secondary" size="sm" iconName="close-outline" />
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 grid grid-cols-2 gap-4">
                        <div><span className="text-gray-400">Supplier:</span><p className="font-semibold text-white">{firstRecord.supplier}</p></div>
                        <div><span className="text-gray-400">Date:</span><p className="font-semibold text-white">{new Date(firstRecord.purchaseDate + 'T00:00:00').toLocaleDateString()}</p></div>
                        <div><span className="text-gray-400">Cost Center:</span><p className="font-semibold text-white">{firstRecord.costCenter}</p></div>
                         <div><span className="text-gray-400">Status:</span> <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(firstRecord.status)}`}>{firstRecord.status}</span></div>
                    </div>
                    <div>
                        <h3 className="font-medium text-white mb-2">Items</h3>
                        <ul className="space-y-2">
                           {records.map(item => (
                               <li key={item.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-md">
                                   <div>
                                       <p className="font-semibold text-white">{item.itemName}</p>
                                       <p className="text-sm text-gray-400">{item.quantity} units @ ${item.pricePerUnit.toFixed(2)} each</p>
                                   </div>
                                   <span className="font-bold text-white">${item.totalCost.toFixed(2)}</span>
                               </li>
                           ))}
                        </ul>
                         <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                            <p className="text-lg font-bold text-white">Total Cost: <span className="text-blue-400">${totalCost.toFixed(2)}</span></p>
                        </div>
                    </div>
                     {canApprove && (
                        <div className="mt-6 flex justify-end space-x-4 border-t border-gray-700 pt-4">
                            <Button onClick={handleReject} variant="danger" iconName="close-circle-outline">Reject</Button>
                            <Button onClick={handleApprove} variant="primary" iconName="checkmark-circle-outline">{approveText}</Button>
                        </div>
                     )}
                </div>
            </Card>
        </div>
    );
};


export const InvoicesView: React.FC<InvoicesViewProps> = ({ purchaseRecords, addPurchaseRecord, projects, currentUser, updateInvoiceStatus }) => {
  const [filter, setFilter] = useState({ startDate: '', endDate: '' });
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

  const [invoiceDetails, setInvoiceDetails] = useState({
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceDetailsLocked, setInvoiceDetailsLocked] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const [itemDetails, setItemDetails] = useState({
    name: '',
    quantity: '',
    price: '',
    category: InventoryCategory.MISCELLANEOUS,
    purchaseFor: 'General Inventory' as 'General Inventory' | 'Project' | 'Expense',
    costCenter: '',
    projectSelection: '',
  });

  const [formKey, setFormKey] = useState(Date.now());

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInvoiceDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleItemDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'projectSelection') {
        const selectedProject = projects.find(p => p.id === value);
        setItemDetails(prev => ({ 
            ...prev, 
            projectSelection: value,
            costCenter: selectedProject ? selectedProject.costCenter : ''
        }));
    } else {
        setItemDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLockInvoice = () => {
    if (invoiceDetails.supplier && invoiceDetails.purchaseDate && invoiceFile) {
        setInvoiceId(`invc-${Date.now()}`);
        setInvoiceDetailsLocked(true);
    } else {
        alert('Please provide supplier, purchase date, and an invoice file.');
    }
  };

  const handleStartNewInvoice = () => {
    setInvoiceDetailsLocked(false);
    setInvoiceId(null);
    setInvoiceDetails({ supplier: '', purchaseDate: new Date().toISOString().split('T')[0] });
    setInvoiceFile(null);
    setItemDetails({ name: '', quantity: '', price: '', category: InventoryCategory.MISCELLANEOUS, purchaseFor: 'General Inventory', costCenter: '', projectSelection: '' });
    setFormKey(Date.now());
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(itemDetails.quantity, 10);
    const price = parseFloat(itemDetails.price);

    if (itemDetails.name && !isNaN(quantity) && quantity > 0 && !isNaN(price) && price >= 0 && invoiceFile && invoiceId && itemDetails.costCenter) {
      addPurchaseRecord({
        invoiceId,
        supplier: invoiceDetails.supplier,
        purchaseDate: invoiceDetails.purchaseDate,
        invoiceFile,
        name: itemDetails.name,
        quantity,
        pricePerUnit: price,
        category: itemDetails.category,
        purchaseFor: itemDetails.purchaseFor,
        costCenter: itemDetails.costCenter,
      });
      setItemDetails(prev => ({ ...prev, name: '', quantity: '', price: '' }));
    } else {
        alert("Please fill all item fields with valid data, including a cost center.");
    }
  };

  const groupedInvoices = useMemo(() => {
    const invoices = purchaseRecords.reduce((acc, record) => {
        if (!acc[record.invoiceId]) {
            acc[record.invoiceId] = [];
        }
        acc[record.invoiceId].push(record);
        return acc;
    }, {} as Record<string, PurchaseRecord[]>);

    let invoiceList = Object.values(invoices).map(records => {
        const firstRecord = records[0];
        const totalCost = records.reduce((sum, item) => sum + item.totalCost, 0);
        return {
            invoiceId: firstRecord.invoiceId,
            purchaseDate: firstRecord.purchaseDate,
            supplier: firstRecord.supplier,
            itemCount: records.length,
            totalCost,
            status: firstRecord.status,
            records,
        }
    });
    
    // Filtering logic
     return invoiceList.filter(invoice => {
        if (!filter.startDate && !filter.endDate) return true;
        const recordDate = new Date(invoice.purchaseDate + 'T00:00:00'); 
        const startDate = filter.startDate ? new Date(filter.startDate + 'T00:00:00') : null;
        let endDate = filter.endDate ? new Date(filter.endDate + 'T00:00:00') : null;
        if (startDate && recordDate < startDate) return false;
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
            if (recordDate > endDate) return false;
        }
        return true;
    }).sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  }, [purchaseRecords, filter]);

  const viewingInvoice = viewingInvoiceId ? groupedInvoices.find(inv => inv.invoiceId === viewingInvoiceId) : null;

  return (
    <div className="space-y-8">
      {viewingInvoice && <InvoiceDetailsModal invoice={viewingInvoice} onClose={() => setViewingInvoiceId(null)} currentUser={currentUser} updateInvoiceStatus={updateInvoiceStatus} />}

      <h1 className="text-3xl font-bold tracking-tight text-white">Invoices & Purchases</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b border-gray-700">
                <Input label="Start Date" name="startDate" type="date" value={filter.startDate} onChange={handleFilterChange} />
                <Input label="End Date" name="endDate" type="date" value={filter.endDate} onChange={handleFilterChange} />
            </div>

            <h2 className="text-xl font-semibold text-white mb-4">Purchase History</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Supplier</th>
                            <th scope="col" className="px-6 py-3">Items</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Total Cost</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedInvoices.length > 0 ? groupedInvoices.map(invoice => (
                            <tr key={invoice.invoiceId} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4">{new Date(invoice.purchaseDate + 'T00:00:00').toLocaleDateString()}</td>
                                <td scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{invoice.supplier}</td>
                                <td className="px-6 py-4">{invoice.itemCount}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(invoice.status)}`}>{invoice.status}</span></td>
                                <td className="px-6 py-4 font-mono">${invoice.totalCost.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">
                                    <Button onClick={() => setViewingInvoiceId(invoice.invoiceId)} variant="secondary" size="sm" iconName="search-outline">View</Button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} className="text-center py-10 text-gray-500">No purchase records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          </Card>
        </div>

        <div>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Record New Invoice</h2>
                    {invoiceDetailsLocked && <Button onClick={handleStartNewInvoice} variant="secondary" size="sm" iconName="add-outline">New Invoice</Button>}
                </div>
                
                <fieldset disabled={invoiceDetailsLocked} className="space-y-4">
                    <legend className="text-lg font-medium text-blue-400 mb-2">Invoice Information</legend>
                    <Input label="Supplier" name="supplier" value={invoiceDetails.supplier} onChange={handleInvoiceDetailsChange} required />
                    <Input label="Purchase Date" name="purchaseDate" type="date" value={invoiceDetails.purchaseDate} onChange={handleInvoiceDetailsChange} required />
                    <FileUpload key={formKey} label="Invoice (PDF/Image)" onFileSelect={file => setInvoiceFile(file)} />
                </fieldset>

                {!invoiceDetailsLocked && <Button onClick={handleLockInvoice} variant="primary" className="w-full !mt-6" iconName="lock-closed-outline" disabled={!invoiceDetails.supplier || !invoiceDetails.purchaseDate || !invoiceFile}>Lock Invoice & Add Items</Button>}

                {invoiceDetailsLocked && (
                    <form onSubmit={handleAddItem} className="space-y-4 mt-6 border-t border-gray-700 pt-6">
                        <h3 className="text-lg font-medium text-blue-400 mb-2">Add Item to Invoice</h3>
                        <Input label="Item Name" name="name" value={itemDetails.name} onChange={handleItemDetailsChange} required />
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Purchase For</label>
                            <select name="purchaseFor" value={itemDetails.purchaseFor} onChange={handleItemDetailsChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                                <option value="General Inventory">General Inventory</option>
                                <option value="Project">Project</option>
                                <option value="Expense">Expense (No Inventory)</option>
                            </select>
                        </div>
                        {itemDetails.purchaseFor === 'Project' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
                                <select name="projectSelection" value={itemDetails.projectSelection} onChange={handleItemDetailsChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3" required>
                                    <option value="">Select a Project</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.costCenter})</option>)}
                                </select>
                            </div>
                        ) : (
                            <Input label="Cost Center" name="costCenter" value={itemDetails.costCenter} onChange={handleItemDetailsChange} required />
                        )}
                        {itemDetails.purchaseFor !== 'Expense' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                    <select name="category" value={itemDetails.category} onChange={handleItemDetailsChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                                        {Object.values(InventoryCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Quantity" name="quantity" type="number" value={itemDetails.quantity} onChange={handleItemDetailsChange} required />
                                    <Input label="Price per unit" name="price" type="number" step="0.01" value={itemDetails.price} onChange={handleItemDetailsChange} required />
                                </div>
                            </>
                        )}
                        <Button type="submit" variant="secondary" className="w-full !mt-6" iconName="add-circle-outline">Add Item</Button>
                    </form>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
};