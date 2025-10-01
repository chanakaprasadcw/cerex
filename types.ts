// FIX: Changed to a namespace import to correctly augment the global JSX namespace.
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
  invoiceFile: File;
  invoiceUrl: string;
  purchaseFor: 'General Inventory' | 'Project' | 'Expense';
  costCenter: string;
  status: InvoiceStatus;
  checkedBy?: string;
}

export enum Page {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  INVOICES = 'INVOICES',
  NEW_PROJECT = 'NEW_PROJECT',
  PROJECT_DETAILS = 'PROJECT_DETAILS',
}

// Add global type definition for ion-icon to be recognized by TypeScript/JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // FIX: Used React.HTMLAttributes to be explicit after changing the import style.
      'ion-icon': React.HTMLAttributes<HTMLElement> & {
        name: string;
      };
    }
  }
}