import { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Removed InvoiceItem import
import type { Project, InventoryItem, TeamMember, BomItem, User, ActivityLogEntry, Notification, StoredFile, CostCenterType, PurchaseRecord, TimeLogEntry } from '../types';
import { ProjectStatus, UserRole, ActivityAction, InventoryItemStatus, InvoiceStatus, COST_CENTERS } from '../types';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, orderBy, addDoc, doc, updateDoc, runTransaction, where, getDocs, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { logActivity } from '../services/activityLogger';

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { id: 'team-1', name: 'Asela Madushan', email: 'asela@example.com', role: 'Electronics Engineer' },
  { id: 'team-2', name: 'Lahiru Madhushanka', email: 'lahiru@example.com', role: 'Firmware Engineer' },
  { id: 'team-3', name: 'Ashmika Sadharuwan', email: 'ashmika@example.com', role: 'Manufacturing Engineer' },
  { id: 'team-4', name: 'Chanaka Prasad', email: 'chanaka@example.com', role: 'Electronic Engineer' },
];

// FIX: Added missing type export for InvoiceSubmissionData to resolve import error in InvoicesView.
export type InvoiceSubmissionData = {
    vendorName: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    costCenterType: CostCenterType;
    projectId: string;
    invoiceFile: File;
};

export type TimeLogData = {
    projectId: string;
    date: string;
    hours: number;
    note: string;
};


export const useProjectData = (currentUser: User | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [teamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLogEntry[]>([]);
  const cleanupPerformed = useRef(false);

  useEffect(() => {
    if (!currentUser) {
        setProjects([]);
        setInventory([]);
        setUsers([]);
        setActivityLog([]);
        setNotifications([]);
        setPurchaseRecords([]);
        setTimeLogs([]);
        cleanupPerformed.current = false;
        return;
    }
      
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

    const qNotifications = query(
        collection(db, "notifications"),
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
    );
    const unsubscribeNotifications = onSnapshot(qNotifications, (querySnapshot) => {
        const notificationsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp, // Assuming timestamp is stored as ISO string
            } as Notification;
        });
        setNotifications(notificationsData);
    }, (error) => {
        console.error("Error fetching notifications:", error);
    });
    
    const qInvoices = query(collection(db, "purchaseRecords"), orderBy("submissionDate", "desc"));
    const unsubscribeInvoices = onSnapshot(qInvoices, (querySnapshot) => {
        const invoicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseRecord));
        setPurchaseRecords(invoicesData);
    }, (error) => {
        console.error("Error fetching invoices:", error);
    });

    const qTimeLogs = query(collection(db, "timeLogs"), orderBy("timestamp", "desc"));
    const unsubscribeTimeLogs = onSnapshot(qTimeLogs, (querySnapshot) => {
        const timeLogsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeLogEntry));
        setTimeLogs(timeLogsData);
    }, (error) => {
        console.error("Error fetching time logs:", error);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeInventory();
      unsubscribeUsers();
      unsubscribeActivityLog();
      unsubscribeNotifications();
      unsubscribeInvoices();
      unsubscribeTimeLogs();
    };
  }, [currentUser]);

  useEffect(() => {
    const cleanupOldLogs = async () => {
        if (currentUser && currentUser.role === UserRole.SUPER_ADMIN && !cleanupPerformed.current) {
            cleanupPerformed.current = true; // Mark as performed for this session

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const oldLogsQuery = query(
                collection(db, 'activityLog'),
                where('timestamp', '<', oneWeekAgo)
            );

            try {
                const querySnapshot = await getDocs(oldLogsQuery);
                if (!querySnapshot.empty) {
                    const batch = writeBatch(db);
                    querySnapshot.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    await batch.commit();
                    console.log(`Successfully deleted ${querySnapshot.size} old activity log entries.`);
                }
            } catch (error) {
                console.error("Error cleaning up old activity logs:", error);
            }
        }
    };

    cleanupOldLogs();
  }, [currentUser]);


  const createNotification = async (recipientId: string, message: string, projectId: string) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId: recipientId,
            message,
            projectId,
            read: false,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
  };
  
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
    try {
        const projectData = {
          name: project.name,
          costCenter: project.costCenter,
          details: project.details,
          projectDocument: project.projectDocument ? {
              name: project.projectDocument.name,
              type: project.projectDocument.type,
              data: project.projectDocument.data,
          } : null,
          bomDocument: project.bomDocument ? {
              name: project.bomDocument.name,
              type: project.bomDocument.type,
              data: project.bomDocument.data,
          } : null,
          bom: project.bom.map(item => ({
              inventoryItemId: item.inventoryItemId,
              name: item.name,
              quantityNeeded: item.quantityNeeded,
              price: item.price,
              source: item.source,
          })),
          timeline: project.timeline.map(item => ({
              id: item.id,
              name: item.name,
              startDate: item.startDate,
              endDate: item.endDate,
              completed: item.completed,
          })),
          team: project.team.map(item => ({
              id: item.id,
              name: item.name,
              email: item.email,
              role: item.role,
          })),
          approvers: project.approvers.map(item => ({
              id: item.id,
              name: item.name,
              email: item.email,
              role: item.role,
          })),
          status: project.status,
          submittedBy: project.submittedBy,
          submissionDate: project.submissionDate,
        };

        const docRef = await addDoc(collection(db, 'projects'), projectData);
        if (currentUser) {
            await logActivity(currentUser, ActivityAction.PROJECT_CREATED, { projectId: docRef.id, projectName: project.name });
            // Notify checkers
            const checkers = users.filter(u => u.role === UserRole.CHECKER);
            for (const checker of checkers) {
                await createNotification(checker.uid, `New project "${project.name}" submitted for your review.`, docRef.id);
            }
        }
    } catch (error) {
        console.error("Error adding project to Firestore:", error);
        throw new Error("Failed to save project to the database. Please check your connection and try again.");
    }
  }, [currentUser, users]);

  const updateProject = useCallback(async (updatedProject: Project, user: User) => {
    const { id } = updatedProject;
    if (id) {
        const originalProject = projects.find(p => p.id === id);
        if (!originalProject) {
            console.error("Original project not found for update");
            return;
        }

        const isReviewer = user.role === UserRole.CHECKER || user.role === UserRole.AUTHORIZER;
        const isEditingSomeoneElsesProject = user.username !== originalProject.submittedBy;

        let newStatus = updatedProject.status;
        let lastEditor: string | null = null;
        let lastEditDate: string | null = null;

        if (isReviewer && isEditingSomeoneElsesProject && updatedProject.status !== ProjectStatus.REJECTED) {
            newStatus = ProjectStatus.AWAITING_ACKNOWLEDGMENT;
            lastEditor = user.username;
            lastEditDate = new Date().toISOString();

            const submitter = users.find(u => u.username === originalProject.submittedBy);
            if (submitter) {
                await createNotification(submitter.uid, `Project "${updatedProject.name}" was edited by ${user.username} and requires your acknowledgment.`, id);
            }
        }

        const projectData = {
            name: updatedProject.name,
            costCenter: updatedProject.costCenter,
            details: updatedProject.details,
            projectDocument: updatedProject.projectDocument || null,
            bomDocument: updatedProject.bomDocument || null,
            bom: updatedProject.bom.map(item => ({...item})),
            timeline: updatedProject.timeline.map(item => ({...item})),
            team: updatedProject.team.map(item => ({...item})),
            approvers: updatedProject.approvers.map(item => ({...item})),
            status: newStatus,
            checkedBy: updatedProject.checkedBy,
            approvedBy: updatedProject.approvedBy,
            lastEditor,
            lastEditDate,
        };
        
        const cleanProjectData = Object.fromEntries(Object.entries(projectData).filter(([_, v]) => v !== undefined));
        
        const projectRef = doc(db, 'projects', id);
        await updateDoc(projectRef, cleanProjectData);
        if (currentUser) {
            await logActivity(currentUser, ActivityAction.PROJECT_UPDATED, { projectId: id, projectName: updatedProject.name });
        }
    }
  }, [currentUser, projects, users]);
  
  const acknowledgeProjectChanges = useCallback(async (projectId: string, user: User) => {
    const projectRef = doc(db, 'projects', projectId);
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        console.error("Project not found for acknowledgment");
        return;
    }

    const lastEditorUser = users.find(u => u.username === project.lastEditor);
    let newStatus = ProjectStatus.PENDING_REVIEW;
    if (lastEditorUser?.role === UserRole.CHECKER) {
        newStatus = ProjectStatus.PENDING_REVIEW;
    } else if (lastEditorUser?.role === UserRole.AUTHORIZER) {
        newStatus = ProjectStatus.PENDING_APPROVAL;
    }

    const updateData = { 
        status: newStatus,
        lastEditor: null,
        lastEditDate: null,
    };
    
    await updateDoc(projectRef, updateData as any);
    await logActivity(user, ActivityAction.PROJECT_CHANGES_ACKNOWLEDGED, {
        projectId,
        projectName: project.name,
        acknowledgedEditor: project.lastEditor
    });
  }, [projects, users]);

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

        // Create notifications for status changes
        if (status === ProjectStatus.PENDING_APPROVAL) {
            const authorizers = users.filter(u => u.role === UserRole.AUTHORIZER);
            for (const authorizer of authorizers) {
                await createNotification(authorizer.uid, `Project "${project.name}" is ready for final approval.`, projectId);
            }
        } else if (status === ProjectStatus.APPROVED || status === ProjectStatus.REJECTED) {
            const submitter = users.find(u => u.username === project.submittedBy);
            if (submitter) {
                await createNotification(submitter.uid, `Your project "${project.name}" has been ${status.toLowerCase()}.`, projectId);
            }
        }
    }
  }, [projects, users]);

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

  const addInventoryItem = useCallback(async (itemData: { name: string; quantity: number; price: number; category: string; }, user: User) => {
    try {
        // Always create a new item for review.
        // The merging logic is handled in `updateInventoryItemStatus` upon final approval.
        const newItem: Omit<InventoryItem, 'id'> = {
            name: itemData.name,
            quantity: itemData.quantity,
            price: itemData.price,
            category: itemData.category,
            status: InventoryItemStatus.PENDING_REVIEW, // Set initial status to Pending Review
            submittedBy: user.username,
            submissionDate: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, 'inventory'), newItem);
        
        await logActivity(user, ActivityAction.INVENTORY_ITEM_CREATED, { 
            itemId: docRef.id,
            itemName: itemData.name, 
            quantity: itemData.quantity,
            category: itemData.category,
            details: 'Item submitted for review.',
        });
    } catch (e) {
        console.error("Failed to add inventory item for review:", e);
        throw e;
    }
  }, []);

  const updateInventoryItemStatus = useCallback(async (itemId: string, newStatus: InventoryItemStatus, user: User) => {
    const itemRef = doc(db, 'inventory', itemId);
    
    const itemToUpdateSnapshot = await getDoc(itemRef);
    if (!itemToUpdateSnapshot.exists()) throw new Error("Item not found.");
    const itemToUpdateData = itemToUpdateSnapshot.data() as InventoryItem;
    
    let existingItemRef: any = null;
    let existingItemData: InventoryItem | null = null;
    if (newStatus === InventoryItemStatus.APPROVED && user.role === UserRole.AUTHORIZER) {
        const inventoryQuery = query(
            collection(db, 'inventory'),
            where('name', '==', itemToUpdateData.name),
            where('category', '==', itemToUpdateData.category),
            where('status', '==', InventoryItemStatus.APPROVED)
        );
        const existingItemsSnapshot = await getDocs(inventoryQuery);
        if (!existingItemsSnapshot.empty) {
            const doc = existingItemsSnapshot.docs[0];
            existingItemRef = doc.ref;
            existingItemData = doc.data() as InventoryItem;
        }
    }

    try {
        await runTransaction(db, async (transaction) => {
            if (newStatus === InventoryItemStatus.APPROVED && user.role === UserRole.AUTHORIZER) {
                if (existingItemRef && existingItemData) {
                    transaction.update(existingItemRef, {
                        quantity: existingItemData.quantity + itemToUpdateData.quantity,
                        price: itemToUpdateData.price
                    });
                    transaction.delete(itemRef);
                } else {
                    transaction.update(itemRef, { status: newStatus, approvedBy: user.username });
                }
            } else {
                const updateData: Partial<InventoryItem> = { status: newStatus };
                if (user.role === UserRole.CHECKER) updateData.checkedBy = user.username;
                if (user.role === UserRole.AUTHORIZER) updateData.approvedBy = user.username;
                transaction.update(itemRef, updateData);
            }
        });
        
        await logActivity(user, ActivityAction.INVENTORY_ITEM_STATUS_CHANGED, {
            itemId: itemId,
            itemName: itemToUpdateData.name,
            from: itemToUpdateData.status,
            to: newStatus,
            details: existingItemRef ? 'Merged into existing stock.' : ''
        });

    } catch (e) {
        console.error("Inventory item status update transaction failed: ", e);
        throw e;
    }
  }, []);

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
    
    const markNotificationAsRead = useCallback(async (notificationId: string) => {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
    }, []);

    const markAllNotificationsAsRead = useCallback(async () => {
        if (!currentUser) return;
        const unreadNotifs = notifications.filter(n => !n.read);
        for (const notif of unreadNotifs) {
            const notificationRef = doc(db, 'notifications', notif.id);
            await updateDoc(notificationRef, { read: true });
        }
    }, [currentUser, notifications]);

  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = error => reject(error);
      });
  };

  const submitInvoice = useCallback(async (payload: InvoiceSubmissionData, user: User) => {
      const { vendorName, invoiceNumber, invoiceDate, totalAmount, costCenterType, projectId, invoiceFile } = payload;
      
      const fileData = await fileToBase64(invoiceFile);
      const storedFile: StoredFile = {
          name: invoiceFile.name,
          type: invoiceFile.type,
          data: fileData,
      };

      const newRecord: Omit<PurchaseRecord, 'id'> = {
          vendorName,
          invoiceNumber,
          invoiceDate,
          totalAmount,
          costCenter: COST_CENTERS[costCenterType],
          status: InvoiceStatus.PENDING_REVIEW,
          submittedBy: user.username,
          submissionDate: new Date().toISOString(),
          invoiceFile: storedFile,
      };

      if (costCenterType === 'Customer Project Costing' && projectId) {
          const project = projects.find(p => p.id === projectId);
          if (project) {
              newRecord.projectName = project.name;
          }
      }

      const docRef = await addDoc(collection(db, 'purchaseRecords'), newRecord);
      await logActivity(user, ActivityAction.INVOICE_SUBMITTED, {
          invoiceId: docRef.id,
          invoiceNumber,
          vendor: vendorName,
          amount: totalAmount,
      });

  }, [projects]);
  
  const updateInvoiceStatus = useCallback(async (invoiceId: string, status: InvoiceStatus, user: User) => {
      const invoiceRef = doc(db, 'purchaseRecords', invoiceId);
      const invoice = purchaseRecords.find(pr => pr.id === invoiceId);
      if (!invoice) return;

      const updateData: Partial<PurchaseRecord> = { status };

      if (status === InvoiceStatus.PENDING_APPROVAL) {
          updateData.checkedBy = user.username;
      } else if (status === InvoiceStatus.APPROVED) {
          updateData.approvedBy = user.username;
      }
      
      await updateDoc(invoiceRef, updateData);
      await logActivity(user, ActivityAction.INVOICE_STATUS_CHANGED, {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          from: invoice.status,
          to: status
      });
  }, [purchaseRecords]);

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    if (!currentUser) return;
    const invoiceToDelete = purchaseRecords.find(pr => pr.id === invoiceId);
    if (!invoiceToDelete) return;
    
    const invoiceRef = doc(db, 'purchaseRecords', invoiceId);
    await deleteDoc(invoiceRef);
    await logActivity(currentUser, ActivityAction.INVOICE_DELETED, {
        invoiceId,
        invoiceNumber: invoiceToDelete.invoiceNumber,
        vendor: invoiceToDelete.vendorName,
    });
  }, [purchaseRecords, currentUser]);

  const addTimeLog = useCallback(async (logData: TimeLogData, user: User) => {
      const project = projects.find(p => p.id === logData.projectId);
      if (!project) {
          throw new Error("Project not found.");
      }

      const newLog: Omit<TimeLogEntry, 'id'> = {
          userId: user.uid,
          username: user.username,
          projectId: logData.projectId,
          projectName: project.name,
          date: logData.date,
          hours: logData.hours,
          note: logData.note,
          timestamp: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'timeLogs'), newLog);
      await logActivity(user, ActivityAction.TIME_LOG_CREATED, {
          timeLogId: docRef.id,
          projectName: project.name,
          hours: logData.hours,
      });
  }, [projects]);

  return {
    projects,
    inventory,
    teamMembers,
    users,
    activityLog,
    notifications,
    purchaseRecords,
    timeLogs,
    addProject,
    updateProject,
    acknowledgeProjectChanges,
    updateProjectStatus,
    deductInventory,
    deleteProject,
    updateUserRole,
    addInventoryItem,
    updateInventoryItemStatus,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    submitInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    addTimeLog,
  };
};