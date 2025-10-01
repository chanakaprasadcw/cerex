

import React, { useState, useMemo } from 'react';
import type { InventoryItem } from '../types';
import { InventoryCategory } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';

interface InventoryViewProps {
  inventory: InventoryItem[];
}

type SortableKeys = keyof Omit<InventoryItem, 'pendingQuantity'> | 'totalValue';

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  const sortedAndGroupedInventory = useMemo(() => {
    const filtered = inventory.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
      
    const grouped = filtered.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {} as Record<InventoryCategory, InventoryItem[]>);

    if (sortConfig.key) {
      for (const category in grouped) {
        (grouped[category as InventoryCategory] as InventoryItem[]).sort((a, b) => {
          let aValue: string | number;
          let bValue: string | number;

          if (sortConfig.key === 'totalValue') {
            aValue = a.quantity * a.price;
            bValue = b.quantity * b.price;
          } else {
            aValue = a[sortConfig.key as keyof Omit<InventoryItem, 'id' | 'category' | 'pendingQuantity'>];
            bValue = b[sortConfig.key as keyof Omit<InventoryItem, 'id' | 'category'| 'pendingQuantity'>];
          }

          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }
    }

    return grouped;
  }, [inventory, sortConfig, searchQuery]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const SortableHeader: React.FC<{ sortKey: SortableKeys; children: React.ReactNode; }> = ({ sortKey, children }) => (
    <th scope="col" className="px-6 py-3">
      <button onClick={() => requestSort(sortKey)} className="flex items-center uppercase text-xs text-gray-400 font-medium group focus:outline-none">
        <span className="group-hover:text-white transition-colors">{children}</span>
        {sortConfig.key === sortKey ? (
          <ion-icon name={sortConfig.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} className="ml-1.5"></ion-icon>
        ) : (
          <ion-icon name="remove-outline" className="ml-1.5 text-transparent group-hover:text-gray-500"></ion-icon>
        )}
      </button>
    </th>
  );
  
  const categoryOrder = Object.values(InventoryCategory);
  const totalFilteredItems = Object.values(sortedAndGroupedInventory).flat().length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-white">Inventory Management</h1>
      
      <div className="space-y-6">
        <div className="relative max-w-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pt-8">
                <ion-icon name="search-outline" className="h-5 w-5 text-gray-400"></ion-icon>
            </div>
            <Input
                label="Search Inventory"
                name="search"
                placeholder="Search by item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="!pl-10"
            />
        </div>
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-white">Current Stock</h2>
          <div className="space-y-6">
            {totalFilteredItems > 0 ? categoryOrder.map(category => {
              const itemsInCategory = sortedAndGroupedInventory[category];
              if (!itemsInCategory || itemsInCategory.length === 0) {
                return null;
              }
              return (
                <div key={category}>
                  <h3 className="text-lg font-medium text-blue-400 mb-2">{category}</h3>
                  <div className="overflow-x-auto border border-gray-700 rounded-lg">
                    <table className="w-full text-sm text-left text-gray-300">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <SortableHeader sortKey="name">Item Name</SortableHeader>
                          <SortableHeader sortKey="quantity">Quantity (Available + Pending)</SortableHeader>
                          <SortableHeader sortKey="price">Price per unit</SortableHeader>
                          <SortableHeader sortKey="totalValue">Total Value</SortableHeader>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsInCategory.map(item => (
                          <tr key={item.id} className="bg-gray-800 border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                            <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{item.name}</th>
                            <td className="px-6 py-4">
                                {item.quantity}
                                {item.pendingQuantity > 0 && (
                                    <span className="text-yellow-400 ml-2">(+{item.pendingQuantity})</span>
                                )}
                            </td>
                            <td className="px-6 py-4">${item.price.toFixed(2)}</td>
                            <td className="px-6 py-4">${(item.quantity * item.price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }) : (
              <p className="text-center py-10 text-gray-500">
                  {inventory.length > 0 ? `No items match your search for "${searchQuery}".` : 'Your inventory is empty.'}
              </p>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
};
