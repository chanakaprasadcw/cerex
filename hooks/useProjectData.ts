import { useState, useCallback, useEffect } from 'react';
import type { Project, InventoryItem, TeamMember, BomItem, PurchaseRecord, User, ActivityLogEntry } from '../types';
import { ProjectStatus, InventoryCategory, UserRole, InvoiceStatus, ActivityAction } from '../types';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, orderBy, addDoc, doc, updateDoc, runTransaction, where, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { logActivity } from '../services/activityLogger';

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { id: 'team-1', name: 'Asela Madushan', email: 'asela@example.com', role: 'Electronics Engineer' },
  { id: 'team-2', name: 'Lahiru Madhushanka', email: 'lahiru@example.com', role: 'Firmware Engineer' },
  { id: 'team-3', name: 'Ashmika Sadharuwan', email: 'ashmika@example.com', role: 'Manufacturing Engineer' },
  { id: 'team-4', name: 'Chanaka Prasad', email: 'chanaka@example.com', role: 'Electronic Engineer' },
];

// Define types for the new invoice submission payload for clarity and type safety.
type InvoiceItemPayload = {
  name: string;
  quantity: number;
  pricePerUnit: number;
  category: InventoryCategory;
  purchaseFor: 'General Inventory' | 'Project' | 'Expense';
  costCenter: string;
};

type InvoiceSubmissionPayload = {
  invoiceId: string;
  supplier: string;
  purchaseDate: string;
  invoiceFile: File | null;
  items: InvoiceItemPayload[];
};


export const useProjectData = (currentUser: User | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [teamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    const qProjects = query(collection(db, "projects"), orderBy("submissionDate", "desc"));
    const unsubscribeProjects = onSnapshot(qProjects, (querySnapshot) => {
      const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
    }, (error) => {
        console.error("Error fetching projects:", error);
    });

    const unsubscribeInventory = onSnapshot(collection(db, "inventory"), (querySnapshot) => {
      const inventoryData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventory(inventoryData);
    }, (error) => {
        console.error("Error fetching inventory:", error);
    });

    const qPurchases = query(collection(db, "purchaseRecords"), orderBy("purchaseDate", "desc"));
    const unsubscribePurchases = onSnapshot(qPurchases, (querySnapshot) => {
      const recordsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as PurchaseRecord;
      });
      setPurchaseRecords(recordsData);
    }, (error) => {
        console.error("Error fetching purchase records:", error);
    });
      
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (querySnapshot) => {
        const usersData = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        setUsers(usersData);
    }, (error) => {
        console.error("Error fetching users:", error);
    });

    const qActivityLog = query(collection(db, "activityLog"), orderBy("timestamp", "desc"));
    const unsubscribeActivityLog = onSnapshot(qActivityLog, (querySnapshot) => {
        const logData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate().toISOString() ?? new Date().toISOString(),
            } as ActivityLogEntry
        });
        setActivityLog(logData);
    }, (error) => {
        console.error("Error fetching activity log:", error);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeInventory();
      unsubscribePurchases();
      unsubscribeUsers();
      unsubscribeActivityLog();
    };
  }, []);
  
  const updateUserRole = useCallback(async (userId: string, newRole: UserRole, actor: User) => {
    const userRef = doc(db, 'users', userId);
    try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const oldRole = userData.role;
            if (oldRole !== newRole) {
                await updateDoc(userRef, { role: newRole });
                await logActivity(actor, ActivityAction.USER_ROLE_CHANGED, {
                    targetUser: userData.username,
                    from: oldRole,
                    to: newRole
                });
            }
        } else {
            throw new Error("User not found.");
        }
    } catch (e) {
        console.error("Error updating user role:", e);
    }
  }, []);

  const addProject = useCallback(async (project: Project) => {
    // FIX: Explicitly create plain objects for all nested array items to prevent circular reference errors when writing to Firestore.
    const projectData = {
      name: project.name,
      costCenter: project.costCenter,
      details: project.details,
      bom: project.bom.map(item => ({...item})),
      timeline: project.timeline.map(item => ({...item})),
      team: project.team.map(item => ({...item})),
      approvers: project.approvers.map(item => ({...item})),
      status: project.status,
      submittedBy: project.submittedBy,
      submissionDate: project.submissionDate,
      checkedBy: project.checkedBy || null,
      approvedBy: project.approvedBy || null,
    };
    const docRef = await addDoc(collection(db, 'projects'), projectData);
    if (currentUser) {
        await logActivity(currentUser, ActivityAction.PROJECT_CREATED, { projectId: docRef.id, projectName: project.name });
    }
  }, [currentUser]);

  const updateProject = useCallback(async (updatedProject: Project) => {
    const { id } = updatedProject;
    if (id) {
        // FIX: Explicitly create plain objects for all nested array items to prevent circular reference errors when writing to Firestore, especially during edits.
        const projectData = {
            name: updatedProject.name,
            costCenter: updatedProject.costCenter,
            details: updatedProject.details,
            bom: updatedProject.bom.map(item => ({...item})),
            timeline: updatedProject.timeline.map(item => ({...item})),
            team: updatedProject.team.map(item => ({...item})),
            approvers: updatedProject.approvers.map(item => ({...item})),
            status: updatedProject.status,
            checkedBy: updatedProject.checkedBy,
            approvedBy: updatedProject.approvedBy,
        };
        // Filter out undefined values to avoid errors with Firestore
        const cleanProjectData = Object.fromEntries(Object.entries(projectData).filter(([_, v]) => v !== undefined));
        
        const projectRef = doc(db, 'projects', id);
        await updateDoc(projectRef, cleanProjectData);
        if (currentUser) {
            await logActivity(currentUser, ActivityAction.PROJECT_UPDATED, { projectId: id, projectName: updatedProject.name });
        }
    }
  }, [currentUser]);

  const updateProjectStatus = useCallback(async (projectId: string, status: ProjectStatus, user?: User) => {
    const projectRef = doc(db, 'projects', projectId);
    const project = projects.find(p => p.id === projectId);
    const updateData: { status: ProjectStatus; checkedBy?: string; approvedBy?: string } = { status };
    if (status === ProjectStatus.PENDING_APPROVAL && user?.role === UserRole.CHECKER) {
      updateData.checkedBy = user.username;
    }
    if (status === ProjectStatus.APPROVED && user?.role === UserRole.AUTHORIZER) {
      updateData.approvedBy = user.username;
    }
    await updateDoc(projectRef, updateData as { [x: string]: any });
    if (user && project) {
        await logActivity(user, ActivityAction.PROJECT_STATUS_CHANGED, {
            projectId,
            projectName: project.name,
            from: project.status,
            to: status
        });
    }
  }, [projects]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
        const projectToDelete = projects.find(p => p.id === projectId);
        if (projectToDelete && currentUser) {
            const projectRef = doc(db, 'projects', projectId);
            await deleteDoc(projectRef);
            await logActivity(currentUser, ActivityAction.PROJECT_DELETED, { projectId, projectName: projectToDelete.name });
        }
    } catch (e) {
        console.error("Error deleting project: ", e);
    }
  }, [projects, currentUser]);

  const submitInvoice = useCallback(async (payload: InvoiceSubmissionPayload, user: User) => {
    const { invoiceId, supplier, items } = payload;
    if (!items || items.length === 0) {
      console.error("Cannot submit an empty invoice.");
      return;
    }

    const isAuthorizer = user.role === UserRole.AUTHORIZER;
    const initialStatus = isAuthorizer ? InvoiceStatus.APPROVED : InvoiceStatus.PENDING_REVIEW;

    try {
      // Pre-fetch all necessary inventory documents before starting the transaction,
      // as queries are not allowed inside Firestore transactions.
      const itemProcessingData = [];
      for (const item of items) {
        let inventoryItemRef = null;
        if (item.purchaseFor !== 'Expense') {
          const inventoryQuery = query(
            collection(db, 'inventory'),
            where('name', '==', item.name),
            where('category', '==', item.category)
          );
          const snapshot = await getDocs(inventoryQuery);
          if (!snapshot.empty) {
            inventoryItemRef = snapshot.docs[0].ref;
          }
        }
        itemProcessingData.push({ item, inventoryItemRef });
      }
      
      await runTransaction(db, async (transaction) => {
        for (const { item, inventoryItemRef } of itemProcessingData) {
          let finalInventoryItemId = null;

          // Handle inventory updates
          if (item.purchaseFor !== 'Expense') {
            if (inventoryItemRef) { // Item exists, update it
              finalInventoryItemId = inventoryItemRef.id;
              const invDoc = await transaction.get(inventoryItemRef);
              if (!invDoc.exists()) throw new Error(`Inventory item ${item.name} not found in transaction.`);
              
              if (isAuthorizer) {
                const newQuantity = invDoc.data().quantity + item.quantity;
                transaction.update(inventoryItemRef, { quantity: newQuantity, price: item.pricePerUnit });
              } else {
                const newPendingQuantity = invDoc.data().pendingQuantity + item.quantity;
                transaction.update(inventoryItemRef, { pendingQuantity: newPendingQuantity });
              }
            } else { // Item is new, create it
              const newInvRef = doc(collection(db, 'inventory'));
              finalInventoryItemId = newInvRef.id;
              const newInventoryItem: Omit<InventoryItem, 'id'> = {
                name: item.name,
                quantity: isAuthorizer ? item.quantity : 0,
                pendingQuantity: isAuthorizer ? 0 : item.quantity,
                price: item.pricePerUnit,
                category: item.category,
              };
              transaction.set(newInvRef, newInventoryItem);
            }
          }

          // Create the purchase record for the item
          const newRecordRef = doc(collection(db, 'purchaseRecords'));
          const newRecordData: Partial<PurchaseRecord> = {
            invoiceId: payload.invoiceId,
            purchaseDate: payload.purchaseDate,
            supplier: payload.supplier,
            itemName: item.name,
            inventoryItemId: finalInventoryItemId ?? '',
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalCost: item.quantity * item.pricePerUnit,
            purchaseFor: item.purchaseFor,
            costCenter: item.costCenter,
            status: initialStatus,
          };

          if (isAuthorizer) {
            newRecordData.checkedBy = user.username;
            newRecordData.approvedBy = user.username;
          }
          transaction.set(newRecordRef, newRecordData);
        }
      });

      await logActivity(user, ActivityAction.INVOICE_CREATED, { invoiceId, supplier });
    } catch (e) {
      console.error("Failed to submit invoice:", e);
      throw e; // Re-throw to be caught by the UI
    }
  }, []);
  
  const updateInvoiceStatus = useCallback(async (invoiceId: string, status: InvoiceStatus, user: User) => {
    const recordsQuery = query(collection(db, 'purchaseRecords'), where('invoiceId', '==', invoiceId));
    const recordsSnapshot = await getDocs(recordsQuery);
    const recordsToUpdate = recordsSnapshot.docs;
    const firstRecord = recordsToUpdate.length > 0 ? recordsToUpdate[0].data() as PurchaseRecord : null;

    if (!firstRecord) return;

    try {
        await runTransaction(db, async (transaction) => {
            for (const recordDoc of recordsToUpdate) {
                const updateData: { status: InvoiceStatus, checkedBy?: string, approvedBy?: string } = { status };
                
                if (status === InvoiceStatus.PENDING_APPROVAL && user.role === UserRole.CHECKER) {
                    updateData.checkedBy = user.username;
                }
                
                if (status === InvoiceStatus.APPROVED && user.role === UserRole.AUTHORIZER) {
                    // FIX: Ensure the approver's name is recorded.
                    updateData.approvedBy = user.username;
                    const rec = recordDoc.data() as PurchaseRecord;

                    // FIX: Correctly move items from pending to available inventory.
                    if (rec.purchaseFor !== 'Expense' && rec.inventoryItemId) {
                        const itemRef = doc(db, 'inventory', rec.inventoryItemId);
                        const itemDoc = await transaction.get(itemRef);
                        if (itemDoc.exists()) {
                            const itemData = itemDoc.data() as InventoryItem;
                            const newPendingQuantity = itemData.pendingQuantity - rec.quantity;
                            transaction.update(itemRef, {
                                quantity: itemData.quantity + rec.quantity,
                                // FIX: Add a safeguard against negative pending quantities.
                                pendingQuantity: newPendingQuantity < 0 ? 0 : newPendingQuantity,
                                price: rec.pricePerUnit,
                            });
                        }
                    }
                }
                transaction.update(recordDoc.ref, updateData);
            }
        });
        await logActivity(user, ActivityAction.INVOICE_STATUS_CHANGED, {
            invoiceId,
            supplier: firstRecord.supplier,
            from: firstRecord.status,
            to: status
        });
    } catch (e) {
        console.error("Invoice status update transaction failed: ", e);
    }
  }, []);

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    const recordsQuery = query(collection(db, 'purchaseRecords'), where('invoiceId', '==', invoiceId));
    const recordsSnapshot = await getDocs(recordsQuery);
    
    if (recordsSnapshot.empty || !currentUser) {
        console.error("No invoice records found to delete or user not logged in.");
        return;
    }
    
    const firstRecord = recordsSnapshot.docs[0].data() as PurchaseRecord;
    
    try {
        await runTransaction(db, async (transaction) => {
            // Use the snapshot fetched outside the transaction
            for (const recordDoc of recordsSnapshot.docs) {
                const record = recordDoc.data() as PurchaseRecord;
                if (record.purchaseFor !== 'Expense' && record.inventoryItemId) {
                    const itemRef = doc(db, 'inventory', record.inventoryItemId);
                    const itemDoc = await transaction.get(itemRef);
                    if (itemDoc.exists()) {
                        const itemData = itemDoc.data() as InventoryItem;
                        if (record.status === InvoiceStatus.APPROVED) {
                            const newQuantity = itemData.quantity - record.quantity;
                            transaction.update(itemRef, { quantity: newQuantity < 0 ? 0 : newQuantity });
                        } else {
                            const newPendingQuantity = itemData.pendingQuantity - record.quantity;
                            transaction.update(itemRef, { pendingQuantity: newPendingQuantity < 0 ? 0 : newPendingQuantity });
                        }
                    }
                }
                // Delete the purchase record itself
                transaction.delete(recordDoc.ref);
            }
        });
        await logActivity(currentUser, ActivityAction.INVOICE_DELETED, { invoiceId, supplier: firstRecord.supplier });
    } catch (e) {
        console.error("Invoice deletion transaction failed: ", e);
    }
  }, [currentUser]);


  const deductInventory = useCallback(async (bom: BomItem[]) => {
    try {
      await runTransaction(db, async (transaction) => {
        for (const bomItem of bom) {
          if (bomItem.source === 'Inventory') {
            const invItemRef = doc(db, 'inventory', bomItem.inventoryItemId);
            const invItemDoc = await transaction.get(invItemRef);
            if (!invItemDoc.exists()) {
              throw `Inventory item with ID ${bomItem.inventoryItemId} does not exist!`;
            }
            const newQuantity = invItemDoc.data().quantity - bomItem.quantityNeeded;
            if (newQuantity < 0) {
              throw `Not enough stock for ${invItemDoc.data().name}.`;
            }
            transaction.update(invItemRef, { quantity: newQuantity });
          }
        }
      });
    } catch (e) {
      console.error("Inventory deduction transaction failed: ", e);
    }
  }, []);

  return {
    projects,
    inventory,
    teamMembers,
    purchaseRecords,
    users,
    activityLog,
    addProject,
    updateProject,
    updateProjectStatus,
    submitInvoice,
    updateInvoiceStatus,
    deductInventory,
    deleteProject,
    deleteInvoice,
    updateUserRole,
  };
};