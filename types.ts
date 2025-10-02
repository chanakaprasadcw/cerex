// FIX: Using a standard import for React to ensure its global JSX types are loaded correctly before augmentation. A type-only import can lead to incomplete JSX definitions.
// FIX: Changed React import to a namespace import to support different module interop settings which can affect JSX namespace augmentation.
import * as React from 'react';

export enum ProjectStatus {
  PENDING_REVIEW = 'Pending Review',
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
}

export enum InvoiceStatus {
  PENDING_REVIEW = 'Pending Review',
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum UserRole {
  LOGGER = 'Logger',
  CHECKER = 'Checker',
  AUTHORIZER = 'Authorizer',
}

export interface User {
  uid: string;
  email: string;
  username: string;
  role: UserRole;
}

export enum InventoryCategory {
  DEVELOPMENT_BOARDS = 'Development Boards',
  SENSORS = 'Sensors',
  ICS_SEMICONDUCTORS = 'ICs & Semiconductors',
  MODULES = 'Modules',
  PASSIVE_COMPONENTS = 'Passive Components',
  CONNECTORS = 'Connectors',
  WIRES = 'Wires',
  POWER_SUPPLIES = 'Power Supplies',
  MECHANICAL_COMPONENTS = 'Mechanical Components',
  MISCELLANEOUS = 'Miscellaneous',
}

export interface BomItem {
  inventoryItemId: string;
  name: string;
  quantityNeeded: number;
  price: number;
  source: 'Inventory' | 'Purchase';
}

export interface TimelineMilestone {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  completed: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  costCenter: string;
  details: string;
  detailsFile?: File | null;
  costingFile?: File | null;
  bom: BomItem[];
  timeline: TimelineMilestone[];
  team: TeamMember[];
  approvers: TeamMember[];
  status: ProjectStatus;
  submittedBy: string;
  submissionDate: string;
  checkedBy?: string;
  approvedBy?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  pendingQuantity: number;
  price: number;
  category: InventoryCategory;
}

export interface PurchaseRecord {
  id: string;
  invoiceId: string;
  purchaseDate: string;
  supplier: string;
  itemName: string;
  inventoryItemId: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  invoiceFile?: File;
  invoiceUrl?: string;
  purchaseFor: 'General Inventory' | 'Project' | 'Expense';
  costCenter: string;
  status: InvoiceStatus;
  checkedBy?: string;
  approvedBy?: string;
}

export enum Page {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  INVOICES = 'INVOICES',
  NEW_PROJECT = 'NEW_PROJECT',
  PROJECT_DETAILS = 'PROJECT_DETAILS',
  USER_CONTROL = 'USER_CONTROL',
  ACTIVITY_LOG = 'ACTIVITY_LOG',
}

export enum ActivityAction {
    USER_REGISTERED = 'User Registered',
    USER_LOGIN = 'User Logged In',
    USER_LOGOUT = 'User Logged Out',
    USER_ROLE_CHANGED = 'User Role Changed',
    PROJECT_CREATED = 'Project Created',
    PROJECT_UPDATED = 'Project Updated',
    PROJECT_STATUS_CHANGED = 'Project Status Changed',
    PROJECT_DELETED = 'Project Deleted',
    INVOICE_CREATED = 'Invoice Created',
    INVOICE_STATUS_CHANGED = 'Invoice Status Changed',
    INVOICE_DELETED = 'Invoice Deleted',
}

export interface ActivityLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    username: string;
    action: ActivityAction;
    details: { [key: string]: any };
}


// Add global type definition for ion-icon to be recognized by TypeScript/JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // FIX: Restored the more explicit 'React.DetailedHTMLProps' type for the custom 'ion-icon' element.
      // The simpler 'React.HTMLAttributes' was insufficient, causing TypeScript to not recognize the element.
      'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { name: string }, HTMLElement>;
    }
  }
}
