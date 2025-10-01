import { useState, useCallback } from 'react';
import type { Project, InventoryItem, TeamMember, BomItem, PurchaseRecord, User } from '../types';
import { ProjectStatus, InventoryCategory, UserRole, InvoiceStatus } from '../types';

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Microcontroller Unit', quantity: 150, pendingQuantity: 0, price: 12.50, category: InventoryCategory.DEVELOPMENT_BOARDS },
  { id: 'inv-2', name: 'Resistor Pack (100pcs)', quantity: 300, pendingQuantity: 0, price: 5.00, category: InventoryCategory.PASSIVE_COMPONENTS },
  { id: 'inv-3', name: 'LED Pack (50pcs, assorted)', quantity: 200, pendingQuantity: 0, price: 7.25, category: InventoryCategory.PASSIVE_COMPONENTS },
  { id: 'inv-4', name: 'Power Supply Unit 5V', quantity: 80, pendingQuantity: 0, price: 25.00, category: InventoryCategory.POWER_SUPPLIES },
  { id: 'inv-5', name: 'Breadboard Large', quantity: 120, pendingQuantity: 0, price: 8.00, category: InventoryCategory.MISCELLANEOUS },
];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { id: 'team-1', name: 'Asela Madushan', email: 'asela@example.com', role: 'Electronics Engineer' },
  { id: 'team-2', name: 'Lahiru Madhushanka', email: 'lahiru@example.com', role: 'Firmware Engineer' },
  { id: 'team-3', name: 'Ashmika Sadharuwan', email: 'ashmika@example.com', role: 'Manufacturing Engineer' },
  { id: 'team-4', name: 'Chanaka Prasad', email: 'chanaka@example.com', role: 'Electronic Engineer' },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'IoT Weather Station',
    costCenter: 'R&D-001',
    details: 'Develop a proof-of-concept IoT device to monitor local weather conditions and report data to a central server.',
    bom: [
      { inventoryItemId: 'inv-1', name: 'Microcontroller Unit', quantityNeeded: 10, price: 12.50, source: 'Inventory' },
      { inventoryItemId: 'inv-4', name: 'Power Supply Unit 5V', quantityNeeded: 10, price: 25.00, source: 'Inventory' },
      { inventoryItemId: 'new-1', name: 'Humidity Sensor', quantityNeeded: 10, price: 15, source: 'Purchase' },
    ],
    timeline: [
        { id: 't-1-1', name: 'Prototype design', startDate: '2024-08-01', endDate: '2024-08-15', completed: true },
        { id: 't-1-2', name: 'Firmware development', startDate: '2024-08-16', endDate: '2024-09-05', completed: false },
    ],
    team: [INITIAL_TEAM_MEMBERS[0], INITIAL_TEAM_MEMBERS[1]],
    approvers: [INITIAL_TEAM_MEMBERS[3]],
    status: ProjectStatus.PENDING_REVIEW,
    submittedBy: 'Logger User',
    submissionDate: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Automated Warehouse Robot',
    costCenter: 'OPS-003',
    details: 'Build a small autonomous robot for moving packages within the warehouse.',
    bom: [
       { inventoryItemId: 'inv-1', name: 'Microcontroller Unit', quantityNeeded: 5, price: 12.50, source: 'Inventory' },
       { inventoryItemId: 'new-2', name: 'Motor Driver', quantityNeeded: 10, price: 20, source: 'Purchase' },
    ],
    timeline: [
        { id: 't-2-1', name: 'Chassis construction', startDate: '2024-07-10', endDate: '2024-07-25', completed: true },
        { id: 't-2-2', name: 'Navigation system integration', startDate: '2024-07-26', endDate: '2024-08-15', completed: true },
    ],
    team: [INITIAL_TEAM_MEMBERS[1], INITIAL_TEAM_MEMBERS[2], INITIAL_TEAM_MEMBERS[0]],
    approvers: [INITIAL_TEAM_MEMBERS[3]],
    status: ProjectStatus.APPROVED,
    submittedBy: 'Admin',
    submissionDate: new Date().toISOString(),
  }
];

export const useProjectData = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [teamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);

  const addProject = useCallback((project: Project) => {
    setProjects(prev => [project, ...prev]);
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => 
      prev.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  }, []);

  const updateProjectStatus = useCallback((projectId: string, status: ProjectStatus, user?: User) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const updatedProject: Project = { ...p, status };
          if (status === ProjectStatus.PENDING_APPROVAL && user?.role === UserRole.CHECKER) {
            updatedProject.checkedBy = user.username;
          }
           if (status === ProjectStatus.APPROVED && user?.role === UserRole.AUTHORIZER) {
            updatedProject.approvedBy = user.username;
          }
          return updatedProject;
        }
        return p;
      })
    );
  }, []);

  // FIX: Added 'category' to the record type to match the data passed from InvoicesView.
  const addPurchaseRecord = useCallback((record: Omit<PurchaseRecord, 'id' | 'invoiceUrl' | 'inventoryItemId' | 'totalCost' | 'itemName' | 'status'> & { name: string; category: InventoryCategory }) => {
    let inventoryItemId = `temp-${Date.now()}`;
    
    if (record.purchaseFor !== 'Expense') {
        let inventoryItem = inventory.find(i => i.name.toLowerCase() === record.name.toLowerCase() && i.category === record.category);
        let updatedInventory = [...inventory];
        
        if (inventoryItem) {
            inventoryItemId = inventoryItem.id;
            updatedInventory = updatedInventory.map(i => 
                i.id === inventoryItem.id 
                ? { ...i, pendingQuantity: i.pendingQuantity + record.quantity } 
                : i
            );
        } else {
            inventoryItemId = `inv-${Date.now()}`;
            const newInventoryItem: InventoryItem = {
                id: inventoryItemId,
                name: record.name,
                quantity: 0,
                pendingQuantity: record.quantity,
                price: record.pricePerUnit,
                category: record.category,
            };
            updatedInventory.push(newInventoryItem);
        }
        setInventory(updatedInventory);
    }
    
    const newRecord: PurchaseRecord = {
        ...record,
        id: `pr-${Date.now()}`,
        itemName: record.name,
        inventoryItemId,
        totalCost: record.quantity * record.pricePerUnit,
        invoiceUrl: URL.createObjectURL(record.invoiceFile),
        status: InvoiceStatus.PENDING_REVIEW,
    };

    setPurchaseRecords(prev => [newRecord, ...prev]);

  }, [inventory]);
  
  const updateInvoiceStatus = useCallback((invoiceId: string, status: InvoiceStatus, user: User) => {
    setPurchaseRecords(prevRecords => {
        const updatedRecords = prevRecords.map(r => {
            if (r.invoiceId === invoiceId) {
                const updatedRecord = { ...r, status };
                if (status === InvoiceStatus.PENDING_APPROVAL && user.role === UserRole.CHECKER) {
                    updatedRecord.checkedBy = user.username;
                }
                return updatedRecord;
            }
            return r;
        });

        if (status === InvoiceStatus.APPROVED && user.role === UserRole.AUTHORIZER) {
            const recordsToApprove = updatedRecords.filter(r => r.invoiceId === invoiceId);
            setInventory(prevInventory => {
                let newInventory = [...prevInventory];
                recordsToApprove.forEach(rec => {
                    if (rec.purchaseFor !== 'Expense') {
                        const itemIndex = newInventory.findIndex(i => i.id === rec.inventoryItemId);
                        if (itemIndex !== -1) {
                            const item = newInventory[itemIndex];
                            newInventory[itemIndex] = {
                                ...item,
                                quantity: item.quantity + rec.quantity,
                                pendingQuantity: item.pendingQuantity - rec.quantity,
                                price: rec.pricePerUnit, // Update price to latest purchase price
                            };
                        }
                    }
                });
                return newInventory;
            });
        }
        
        return updatedRecords.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    });
  }, []);


  const deductInventory = useCallback((bom: BomItem[]) => {
    setInventory(currentInventory => {
      const newInventory = [...currentInventory];
      bom.forEach(bomItem => {
        if (bomItem.source === 'Inventory') {
          const inventoryIndex = newInventory.findIndex(invItem => invItem.id === bomItem.inventoryItemId);
          if (inventoryIndex !== -1) {
            newInventory[inventoryIndex].quantity -= bomItem.quantityNeeded;
          }
        }
      });
      return newInventory;
    });
  }, []);

  return {
    projects,
    inventory,
    teamMembers,
    purchaseRecords,
    addProject,
    updateProject,
    updateProjectStatus,
    addPurchaseRecord,
    updateInvoiceStatus,
    deductInventory
  };
};