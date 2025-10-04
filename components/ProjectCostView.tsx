import '../types';
import React, { useState, useMemo } from 'react';
import type { PurchaseRecord, Project, BomItem } from '../types';
import { InvoiceStatus } from '../types';
import { Card } from './common/Card';

interface ProjectCostViewProps {
  purchaseRecords: PurchaseRecord[];
  projects: Project[];
}

export const ProjectCostView: React.FC<ProjectCostViewProps> = ({ purchaseRecords, projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [selectedProjectId, projects]);

  const { invoiceCost, inventoryCost, totalProjectCost, approvedInvoices, inventoryItems } = useMemo(() => {
    if (!selectedProject) {
        return { invoiceCost: 0, inventoryCost: 0, totalProjectCost: 0, approvedInvoices: [], inventoryItems: [] };
    }

    // 1. Approved Invoice Cost
    const associatedInvoices = purchaseRecords.filter(
        pr => pr.projectName === selectedProject.name && pr.status === InvoiceStatus.APPROVED
    );
    const calculatedInvoiceCost = associatedInvoices.reduce((acc, invoice) => acc + invoice.totalAmount, 0);

    // 2. Inventory Cost (from BOM items sourced from inventory)
    const projectInventoryItems = selectedProject.bom.filter(item => item.source === 'Inventory');
    const calculatedInventoryCost = projectInventoryItems.reduce((acc, item) => acc + (item.quantityNeeded * item.price), 0);

    const calculatedTotalProjectCost = calculatedInvoiceCost + calculatedInventoryCost;

    return {
        invoiceCost: calculatedInvoiceCost,
        inventoryCost: calculatedInventoryCost,
        totalProjectCost: calculatedTotalProjectCost,
        approvedInvoices: associatedInvoices,
        inventoryItems: projectInventoryItems,
    };
  }, [selectedProject, purchaseRecords]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-white">Project Cost Calculator</h1>
      <Card>
        <div className="mb-6">
          <label htmlFor="project-select" className="block text-sm font-medium text-gray-300 mb-2">
            Select a Project to Calculate Costs
          </label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-3"
          >
            <option value="">-- Choose a Project --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {selectedProject ? (
          <div className="space-y-6">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                Cost Summary for: <span className="text-blue-400">{selectedProject.name}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                      <p className="text-sm text-gray-400">From Approved Invoices</p>
                      <p className="text-2xl font-bold text-white">${invoiceCost.toFixed(2)}</p>
                  </div>
                   <div>
                      <p className="text-sm text-gray-400">From General Inventory</p>
                      <p className="text-2xl font-bold text-white">${inventoryCost.toFixed(2)}</p>
                  </div>
                   <div className="md:border-l border-gray-700">
                      <p className="text-sm text-gray-400">Total Project Cost</p>
                      <p className="text-3xl font-extrabold text-blue-400">${totalProjectCost.toFixed(2)}</p>
                  </div>
              </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Approved Invoices ({approvedInvoices.length})</h3>
                 <div className="overflow-x-auto border border-gray-700 rounded-lg">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Invoice Date</th>
                                <th scope="col" className="px-6 py-3">Vendor</th>
                                <th scope="col" className="px-6 py-3">Invoice #</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedInvoices.length > 0 ? approvedInvoices.map(invoice => (
                                <tr key={invoice.id} className="bg-gray-800 border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                    <td className="px-6 py-4">{new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-white">{invoice.vendorName}</td>
                                    <td className="px-6 py-4">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 font-mono text-right">${invoice.totalAmount.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-500">No approved invoices are associated with this project.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Items from General Inventory ({inventoryItems.length})</h3>
                 <div className="overflow-x-auto border border-gray-700 rounded-lg">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Item Name</th>
                                <th scope="col" className="px-6 py-3">Quantity Used</th>
                                <th scope="col" className="px-6 py-3">Unit Price</th>
                                <th scope="col" className="px-6 py-3 text-right">Total Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventoryItems.length > 0 ? inventoryItems.map((item, index) => (
                                <tr key={index} className="bg-gray-800 border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                                    <td className="px-6 py-4">{item.quantityNeeded}</td>
                                    <td className="px-6 py-4 font-mono">${item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 font-mono text-right">${(item.quantityNeeded * item.price).toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-500">No items from general inventory were used in this project.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            {/* FIX: Changed 'class' to 'className' for ion-icon component to align with React standards. */}
            <ion-icon name="analytics-outline" className="text-6xl mb-4"></ion-icon>
            <p>Please select a project to view its cost breakdown.</p>
          </div>
        )}
      </Card>
    </div>
  );
};