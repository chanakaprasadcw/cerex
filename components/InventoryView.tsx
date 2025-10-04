// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../types';
import React, { useState, useMemo } from 'react';
import type { InventoryItem, User, Project, BomItem, MainInventoryCategory } from '../types';
import { INVENTORY_CATEGORIES, UserRole, InventoryItemStatus } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Button } from './common/Button';
import { Modal } from './common/Modal';
import { useToast } from '../hooks/useToast';

interface AddInventoryItemModalProps {
  onClose: () => void;
  onAddItem: (itemData: { name: string; quantity: number; price: number; category: string }) => Promise<void>;
}

const AddInventoryItemModal: React.FC<AddInventoryItemModalProps> = ({ onClose, onAddItem }) => {
  const defaultMainCategory = Object.keys(INVENTORY_CATEGORIES)[0] as MainInventoryCategory;
  
  const [itemDetails, setItemDetails] = useState({ name: '', quantity: 1, price: 0 });
  const [mainCategory, setMainCategory] = useState<MainInventoryCategory>(defaultMainCategory);
  const [subCategory, setSubCategory] = useState<string>(INVENTORY_CATEGORIES[defaultMainCategory][0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItemDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMainCategory = e.target.value as MainInventoryCategory;
    setMainCategory(newMainCategory);
    setSubCategory(INVENTORY_CATEGORIES[newMainCategory][0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const quantity = Number(itemDetails.quantity);
    const price = Number(itemDetails.price);

    if (!itemDetails.name.trim()) {
      setErrorMessage("Item name is required.");
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage("Quantity must be a number greater than 0.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setErrorMessage("Price must be a number greater than 0.");
      return;
    }
    
    setIsLoading(true);
    try {
        await onAddItem({
          ...itemDetails,
          quantity: Number(itemDetails.quantity),
          price: Number(itemDetails.price),
          category: `${mainCategory} > ${subCategory}`,
        });
    } catch (error: any) {
        setErrorMessage(error.message || "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Modal title="Add New Item to Inventory" onCancel={onClose} confirmText="" onConfirm={() => {}}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-400/30 text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">
                {errorMessage}
            </div>
          )}
          <Input label="Item Name" name="name" value={itemDetails.name} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Main Category</label>
              <select value={mainCategory} onChange={handleMainCategoryChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                {Object.keys(INVENTORY_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sub-Category</label>
              <select value={subCategory} onChange={e => setSubCategory(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                {INVENTORY_CATEGORIES[mainCategory].map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity" name="quantity" type="number" min="1" value={itemDetails.quantity} onChange={handleChange} required />
            <Input label="Price per unit" name="price" type="number" step="0.01" min="0.01" value={itemDetails.price} onChange={handleChange} required />
          </div>
          <div className="mt-6 flex justify-end space-x-4 border-t border-gray-700 pt-4">
            <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary" disabled={isLoading} iconName="add-circle-outline">
              {isLoading ? 'Adding...' : 'Add to Inventory'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};

interface InventoryViewProps {
  inventory: InventoryItem[];
  projects: Project[];
  addInventoryItem?: (itemData: { name: string; quantity: number; price: number; category: string; }, user: User) => Promise<void>;
  updateInventoryItemStatus?: (itemId: string, newStatus: InventoryItemStatus, user: User) => Promise<void>;
  currentUser?: User | null;
}

type SortableKeys = keyof Omit<InventoryItem, 'id'> | 'totalValue';
type TotalInventorySortKeys = 'name' | 'general' | 'pending' | 'allocated' | 'total';

const getStatusChipClass = (status: InventoryItemStatus) => {
    switch (status) {
        case InventoryItemStatus.PENDING_REVIEW: return 'bg-cyan-500/20 text-cyan-400';
        case InventoryItemStatus.PENDING_APPROVAL: return 'bg-yellow-500/20 text-yellow-400';
        case InventoryItemStatus.APPROVED: return 'bg-green-500/20 text-green-400';
        case InventoryItemStatus.REJECTED: return 'bg-red-500/20 text-red-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

type ActiveTab = 'general' | 'pending' | 'project' | 'total';

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory, projects, addInventoryItem, updateInventoryItemStatus, currentUser }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [totalSortConfig, setTotalSortConfig] = useState<{ key: TotalInventorySortKeys; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [confirmingAction, setConfirmingAction] = useState<{ item: InventoryItem; action: 'approve' | 'reject' } | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [confirmingBulkAction, setConfirmingBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { addToast } = useToast();

  const approvedInventory = useMemo(() => inventory.filter(i => i.status === InventoryItemStatus.APPROVED), [inventory]);
  const pendingInventory = useMemo(() => inventory.filter(i => i.status !== InventoryItemStatus.APPROVED && i.status !== InventoryItemStatus.REJECTED).sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()), [inventory]);

  const visiblePendingInventory = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.LOGGER) {
      return pendingInventory.filter(item => item.submittedBy === currentUser.username);
    }
    return pendingInventory;
  }, [pendingInventory, currentUser]);

  const actionablePendingInventory = useMemo(() => {
    if (!currentUser) return [];
    return pendingInventory.filter(item =>
      (currentUser.role === UserRole.CHECKER && item.status === InventoryItemStatus.PENDING_REVIEW) ||
      ((currentUser.role === UserRole.AUTHORIZER || currentUser.role === UserRole.SUPER_ADMIN) && item.status === InventoryItemStatus.PENDING_APPROVAL)
    );
  }, [pendingInventory, currentUser]);

  const sortedAndGroupedGeneralInventory = useMemo(() => {
    const filtered = approvedInventory.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const grouped = filtered.reduce((acc, item) => {
      const mainCategory = item.category.split(' > ')[0] || 'Miscellaneous';
      (acc[mainCategory] = acc[mainCategory] || []).push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);

    for (const category in grouped) {
      (grouped[category] as InventoryItem[]).sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        if (sortConfig.key === 'totalValue') {
          aValue = a.quantity * a.price;
          bValue = b.quantity * b.price;
        } else {
          aValue = a[sortConfig.key as keyof Omit<InventoryItem, 'id' | 'category'>];
          bValue = b[sortConfig.key as keyof Omit<InventoryItem, 'id' | 'category'>];
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return grouped;
  }, [approvedInventory, sortConfig, searchQuery]);

  const projectInventory = useMemo(() => {
    if (!selectedProjectId) return [];
    const project = projects.find(p => p.id === selectedProjectId);
    return project ? project.bom : [];
  }, [selectedProjectId, projects]);

  const totalCompanyInventory = useMemo(() => {
    const combined = new Map<string, { name: string; general: number; pending: number; allocated: number; price: number, category: string | null }>();
    
    approvedInventory.forEach(item => {
        combined.set(item.name, { name: item.name, general: item.quantity, pending: 0, allocated: 0, price: item.price, category: item.category });
    });

    pendingInventory.forEach(item => {
        const existing = combined.get(item.name) || { name: item.name, general: 0, pending: 0, allocated: 0, price: item.price, category: item.category };
        existing.pending += item.quantity;
        combined.set(item.name, existing);
    });

    projects.forEach(project => {
        project.bom.forEach(bomItem => {
            const existing = combined.get(bomItem.name) || { name: bomItem.name, general: 0, pending: 0, allocated: 0, price: bomItem.price, category: null };
            existing.allocated += bomItem.quantityNeeded;
            combined.set(bomItem.name, existing);
        });
    });
    
    const sorted = Array.from(combined.values());
    sorted.sort((a, b) => {
        const key = totalSortConfig.key;
        let aValue: string | number;
        let bValue: string | number;

        if (key === 'total') {
            aValue = a.general + a.pending + a.allocated;
            bValue = b.general + b.pending + b.allocated;
        } else {
            aValue = a[key] ?? 0;
            bValue = b[key] ?? 0;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
             return totalSortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) return totalSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return totalSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return sorted;

  }, [approvedInventory, pendingInventory, projects, totalSortConfig]);

  const requestSort = (key: SortableKeys) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const requestTotalSort = (key: TotalInventorySortKeys) => {
    setTotalSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };
  
  const handleAddItem = async (itemData: { name: string; quantity: number; price: number; category: string }) => {
    if (addInventoryItem && currentUser) {
      await addInventoryItem(itemData, currentUser);
      addToast(`Item "${itemData.name}" was submitted for review.`, 'success');
      setIsAddModalOpen(false);
    }
  };
  
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const handleSelectAll = () => {
    setSelectedItems(selectedItems.length === actionablePendingInventory.length ? [] : actionablePendingInventory.map(item => item.id));
  };
    
  const handleConfirmAction = async () => {
    if (!confirmingAction || !updateInventoryItemStatus || !currentUser) return;
    const { item, action } = confirmingAction;
    let newStatus = action === 'reject' ? InventoryItemStatus.REJECTED : item.status === InventoryItemStatus.PENDING_REVIEW ? InventoryItemStatus.PENDING_APPROVAL : InventoryItemStatus.APPROVED;
    await updateInventoryItemStatus(item.id, newStatus, currentUser);
    addToast(`Item "${item.name}" has been ${action}ed.`, 'success');
    setConfirmingAction(null);
  };

  const handleConfirmBulkAction = async () => {
    if (!confirmingBulkAction || !updateInventoryItemStatus || !currentUser || selectedItems.length === 0) return;
    const action = confirmingBulkAction;
    const itemsToProcess = [...selectedItems];
    setConfirmingBulkAction(null);
    setSelectedItems([]);
    for (const itemId of itemsToProcess) {
      const item = inventory.find(i => i.id === itemId);
      if (!item) continue;
      let newStatus = action === 'reject' ? InventoryItemStatus.REJECTED : item.status === InventoryItemStatus.PENDING_REVIEW ? InventoryItemStatus.PENDING_APPROVAL : InventoryItemStatus.APPROVED;
      await updateInventoryItemStatus(item.id, newStatus, currentUser);
    }
    addToast(`${itemsToProcess.length} items have been ${action}ed.`, 'success');
  };

  const SortableHeader: React.FC<{ sortKey: SortableKeys; children: React.ReactNode; }> = ({ sortKey, children }) => (
    <th scope="col" className="px-6 py-3">
      <button onClick={() => requestSort(sortKey)} className="flex items-center uppercase text-xs text-gray-400 font-medium group focus:outline-none">
        <span className="group-hover:text-white transition-colors">{children}</span>
        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
        {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
        {sortConfig.key === sortKey ? <ion-icon name={sortConfig.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} className="ml-1.5"></ion-icon> : <ion-icon name="remove-outline" className="ml-1.5 text-transparent group-hover:text-gray-500"></ion-icon>}
      </button>
    </th>
  );
  
  const TotalSortableHeader: React.FC<{ sortKey: TotalInventorySortKeys; children: React.ReactNode; }> = ({ sortKey, children }) => (
    <th scope="col" className="px-6 py-3">
      <button onClick={() => requestTotalSort(sortKey)} className="flex items-center uppercase text-xs text-gray-400 font-medium group focus:outline-none">
        <span className="group-hover:text-white transition-colors">{children}</span>
        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
        {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
        {totalSortConfig.key === sortKey ? <ion-icon name={totalSortConfig.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} className="ml-1.5"></ion-icon> : <ion-icon name="remove-outline" className="ml-1.5 text-transparent group-hover:text-gray-500"></ion-icon>}
      </button>
    </th>
  );
  
  const TABS: { id: ActiveTab; name: string }[] = [
    { id: 'general', name: 'General Inventory' },
    { id: 'pending', name: 'Pending Inventory' },
    { id: 'project', name: 'Project Inventory' },
    { id: 'total', name: 'Total Company Inventory' },
  ];

  return (
    <div className="space-y-8">
      {isAddModalOpen && <AddInventoryItemModal onClose={() => setIsAddModalOpen(false)} onAddItem={handleAddItem} />}
      {confirmingAction && <Modal title={`Confirm ${confirmingAction.action}`} message={`Are you sure you want to ${confirmingAction.action} "${confirmingAction.item.name}"?`} onConfirm={handleConfirmAction} onCancel={() => setConfirmingAction(null)} confirmText={confirmingAction.action} variant={confirmingAction.action === 'reject' ? 'danger' : 'primary'} />}
      {confirmingBulkAction && <Modal title={`Confirm Bulk ${confirmingBulkAction}`} message={`Are you sure you want to ${confirmingBulkAction} ${selectedItems.length} selected item(s)?`} onConfirm={handleConfirmBulkAction} onCancel={() => setConfirmingBulkAction(null)} confirmText={`Yes, ${confirmingBulkAction} ${selectedItems.length}`} variant={confirmingBulkAction === 'reject' ? 'danger' : 'primary'} />}

      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold tracking-tight text-white">Inventory Management</h1>
        <Button onClick={() => setIsAddModalOpen(true)} iconName="add-outline">Add New Item</Button>
      </div>
      
        <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-brand-primary text-brand-secondary' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                        {tab.name}
                        {tab.id === 'pending' && visiblePendingInventory.length > 0 && <span className="ml-2 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-full px-2.5 py-0.5">{visiblePendingInventory.length}</span>}
                    </button>
                ))}
            </nav>
        </div>

      {activeTab === 'general' && (
        <Card>
            <div className="flex justify-between items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-white">General Inventory (Approved Stock)</h2>
              <div className="relative w-full sm:max-w-xs">
                  {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                  {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><ion-icon name="search-outline" className="h-5 w-5 text-gray-400"></ion-icon></div>
                  <Input label="" name="search" placeholder="Search stock..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="!pl-10 !py-2" />
              </div>
            </div>
            {Object.values(sortedAndGroupedGeneralInventory).flat().length > 0 ? Object.keys(INVENTORY_CATEGORIES).map(category => {
                const itemsInCategory = sortedAndGroupedGeneralInventory[category];
                if (!itemsInCategory || itemsInCategory.length === 0) return null;
                return (
                    <div key={category} className="space-y-6">
                        <h3 className="text-lg font-medium text-brand-secondary mb-2 mt-4">{category}</h3>
                        <div className="overflow-x-auto border border-gray-700 rounded-lg">
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="bg-gray-700/50"><tr><SortableHeader sortKey="name">Item Name</SortableHeader><th scope="col" className="px-6 py-3 uppercase text-xs text-gray-400 font-medium">Sub-Category</th><SortableHeader sortKey="quantity">Available Quantity</SortableHeader><SortableHeader sortKey="price">Price per unit</SortableHeader><SortableHeader sortKey="totalValue">Total Value</SortableHeader></tr></thead>
                                <tbody>{itemsInCategory.map(item => (<tr key={item.id} className="bg-gray-800 border-b border-gray-700 last:border-b-0 hover:bg-gray-750"><th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{item.name}</th><td className="px-6 py-4 text-gray-400">{item.category.split(' > ')[1] || 'N/A'}</td><td className="px-6 py-4">{item.quantity}</td><td className="px-6 py-4">${item.price.toFixed(2)}</td><td className="px-6 py-4">${(item.quantity * item.price).toFixed(2)}</td></tr>))}</tbody>
                            </table>
                        </div>
                    </div>
                );
            }) : <p className="text-center py-10 text-gray-500">No approved stock items found.</p>}
        </Card>
      )}

      {activeTab === 'pending' && (
        <Card>
            {selectedItems.length > 0 && (
                <div className="bg-gray-700/50 p-3 rounded-lg mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{selectedItems.length} item(s) selected</p>
                    <div className="space-x-2">
                        <Button onClick={() => setConfirmingBulkAction('reject')} variant="danger-outline" size="sm" iconName="close-circle-outline">Reject Selected</Button>
                        <Button onClick={() => setConfirmingBulkAction('approve')} variant="secondary" size="sm" iconName="checkmark-circle-outline">Approve Selected</Button>
                    </div>
                </div>
            )}
            <h2 className="text-xl font-semibold mb-4 text-white">Pending Inventory Items</h2>
            <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left text-gray-300">
                <thead className="bg-gray-700/50"><tr><th scope="col" className="p-4"><input type="checkbox" className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-blue-600 focus:ring-blue-500" onChange={handleSelectAll} checked={actionablePendingInventory.length > 0 && selectedItems.length === actionablePendingInventory.length} disabled={actionablePendingInventory.length === 0} aria-label="Select all" /></th><th scope="col" className="px-6 py-3">Item Name</th><th scope="col" className="px-6 py-3">Submitted By</th><th scope="col" className="px-6 py-3">Date</th><th scope="col" className="px-6 py-3">Qty</th><th scope="col" className="px-6 py-3">Status</th><th scope="col" className="px-6 py-3 text-right">Actions</th></tr></thead>
                <tbody>
                    {visiblePendingInventory.map(item => {
                        const canAct = (currentUser?.role === UserRole.CHECKER && item.status === InventoryItemStatus.PENDING_REVIEW) || 
                                     ((currentUser?.role === UserRole.AUTHORIZER || currentUser?.role === UserRole.SUPER_ADMIN) && item.status === InventoryItemStatus.PENDING_APPROVAL);
                        return (<tr key={item.id} className={`bg-gray-800 border-b border-gray-700 last:border-b-0 hover:bg-gray-750 ${selectedItems.includes(item.id) ? 'bg-blue-600/10' : ''}`}><td className="p-4">{canAct && <input type="checkbox" className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-blue-600 focus:ring-blue-500" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} />}</td><th scope="row" className="px-6 py-4 font-medium text-white">{item.name}</th><td className="px-6 py-4">{item.submittedBy}</td><td className="px-6 py-4">{new Date(item.submissionDate).toLocaleDateString()}</td><td className="px-6 py-4">{item.quantity}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(item.status)}`}>{item.status}</span></td><td className="px-6 py-4 text-right">{canAct ? (<div className="space-x-2"><Button onClick={() => setConfirmingAction({item, action: 'reject'})} variant="danger-outline" size="sm">Reject</Button><Button onClick={() => setConfirmingAction({item, action: 'approve'})} variant="secondary" size="sm">{currentUser?.role === UserRole.CHECKER ? 'Approve' : 'Final Approve'}</Button></div>) : (<span className="text-xs text-gray-500">{currentUser?.role === UserRole.LOGGER ? 'In Review' : `Awaiting ${item.status === InventoryItemStatus.PENDING_REVIEW ? 'Checker' : 'Authorizer'}`}</span>)}</td></tr>);
                    })}
                </tbody>
                </table>
                {visiblePendingInventory.length === 0 && <p className="text-center py-10 text-gray-500">{currentUser?.role === UserRole.LOGGER ? 'You have no items pending.' : 'No items pending.'}</p>}
            </div>
        </Card>
      )}

      {activeTab === 'project' && (
        <Card>
            <h2 className="text-xl font-semibold text-white mb-4">Project-Allocated Inventory</h2>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Select a Project</label>
                <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                    <option value="">-- Choose a Project --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            {selectedProjectId ? (
                projectInventory.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-700 rounded-lg">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="bg-gray-700/50"><tr><th className="px-6 py-3">Item Name</th><th className="px-6 py-3">Allocated Qty</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Total Value</th></tr></thead>
                            <tbody>{projectInventory.map((item, index) => (<tr key={index} className="bg-gray-800 border-b border-gray-700 last:border-b-0 hover:bg-gray-750"><th className="px-6 py-4 font-medium text-white">{item.name}</th><td className="px-6 py-4">{item.quantityNeeded}</td><td className="px-6 py-4">${item.price.toFixed(2)}</td><td className="px-6 py-4">${(item.quantityNeeded * item.price).toFixed(2)}</td></tr>))}</tbody>
                        </table>
                    </div>
                ) : <p className="text-center py-10 text-gray-500">This project has no inventory items allocated.</p>
            ) : <p className="text-center py-10 text-gray-500">Please select a project to view its inventory.</p>}
        </Card>
      )}

      {activeTab === 'total' && (
        <Card>
            <h2 className="text-xl font-semibold text-white mb-4">Total Company Inventory</h2>
            <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="bg-gray-700/50"><tr><TotalSortableHeader sortKey="name">Item Name</TotalSortableHeader><TotalSortableHeader sortKey="general">Available</TotalSortableHeader><TotalSortableHeader sortKey="pending">Pending</TotalSortableHeader><TotalSortableHeader sortKey="allocated">Allocated</TotalSortableHeader><TotalSortableHeader sortKey="total">Total Qty</TotalSortableHeader></tr></thead>
                    <tbody>
                        {totalCompanyInventory.map((item, index) => (
                            <tr key={index} className="bg-gray-800 border-b border-gray-700 last:border-b-0 hover:bg-gray-750">
                                <th className="px-6 py-4 font-medium text-white">{item.name}</th>
                                <td className="px-6 py-4 text-green-400">{item.general}</td>
                                <td className="px-6 py-4 text-yellow-400">{item.pending}</td>
                                <td className="px-6 py-4 text-cyan-400">{item.allocated}</td>
                                <td className="px-6 py-4 font-bold text-white">{item.general + item.pending + item.allocated}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {totalCompanyInventory.length === 0 && <p className="text-center py-10 text-gray-500">No inventory data available across the company.</p>}
            </div>
        </Card>
      )}
    </div>
  );
};