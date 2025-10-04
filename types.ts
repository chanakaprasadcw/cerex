// FIX: Use React namespace import to ensure global JSX augmentation is correctly applied in this project's setup.
import * as React from 'react';

// Add global type definition for ion-icon to be recognized by TypeScript/JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // FIX: Use React.DetailedHTMLProps for better web component type support, resolving issues where 'ion-icon' was not recognized.
      // FIX: Changed 'class' to 'className' for React compatibility.
      // FIX: Removed redundant 'className' property. It's already included in React.HTMLAttributes, and re-declaring it can cause augmentation issues.
      'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        name: string;
      }, HTMLElement>;
    }
  }
}

export enum Flow {
  PROJECT = 'PROJECT',
  INVOICE = 'INVOICE',
  PEOPLE = 'PEOPLE',
}

export enum ProjectStatus {
  PENDING_REVIEW = 'Pending Review',
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
  AWAITING_ACKNOWLEDGMENT = 'Awaiting Acknowledgment',
}

export enum UserRole {
  LOGGER = 'Logger',
  CHECKER = 'Checker',
  AUTHORIZER = 'Authorizer',
  SUPER_ADMIN = 'Super Admin',
}

export interface User {
  uid: string;
  email: string;
  username: string;
  role: UserRole;
}

export const INVENTORY_CATEGORIES = {
  'Electronics & Components': [
    'Microcontrollers & SoCs',
    'Sensors',
    'Actuators',
    'Communication modules',
    'Power components',
    'Connectors, cables, wires, jumpers',
    'PCBs',
  ],
  'Mechanical & Structural': [
    'Fasteners',
    'Frames & enclosures',
    '3D printing materials',
    'CNC machining stock',
    'Bearings, gears, pulleys, belts',
    'Hinges, joints, couplings',
  ],
  'Prototyping & Fabrication Tools': [
    '3D printers & filaments',
    'Laser cutters & engraving stock',
    'CNC machines & raw materials',
    'Soldering stations & consumables',
    'Breadboards, protoboards, jump wires',
    'Heat guns, hot-air rework stations',
    'Adhesives, tapes, epoxy',
  ],
  'Testing & Measurement Equipment': [
    'Multimeters, oscilloscopes, logic analyzers',
    'Power supplies',
    'Function/signal generators',
    'Environmental testing kits',
    'Load cells, force gauges',
    'Spectrum/network analyzers',
  ],
  'Robotics & Motion': [
    'DC motors, BLDC motors, stepper motors',
    'ESCs & motor drivers',
    'Wheels, tracks, omni wheels',
    'Robotic arms & grippers',
    'Linear rails, lead screws',
  ],
  'Computer & Development Assets': [
    'Workstations',
    'Laptops & tablets',
    'Development software licenses',
    'Servers for simulation & data handling',
    'Peripherals',
  ],
  'Lab Safety & General Operations': [
    'ESD mats, wrist straps',
    'Safety glasses, gloves',
    'Fire extinguishers, first-aid kits',
    'Fume extractors & ventilation systems',
    'Storage racks, bins, labeling systems',
  ],
  'Consumables & Miscellaneous': [
    'Prototyping boards, headers, jumper pins',
    'Heat shrink tubing, insulation tape',
    'PCB etching & cleaning solutions',
    'Packaging materials',
    'Stationery & documentation supplies',
  ],
};

export type MainInventoryCategory = keyof typeof INVENTORY_CATEGORIES;


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
  id:string;
  name: string;
  email: string;
  role: string;
}

export interface StoredFile {
  name: string;
  type: string;
  data: string; // base64 encoded data
}

export interface Project {
  id: string;
  name: string;
  costCenter: string;
  details: string;
  projectDocument: StoredFile | null;
  bomDocument: StoredFile | null;
  bom: BomItem[];
  timeline: TimelineMilestone[];
  team: TeamMember[];
  approvers: TeamMember[];
  status: ProjectStatus;
  submittedBy: string;
  submissionDate: string;
  checkedBy?: string;
  approvedBy?: string;
  lastEditor?: string;
  lastEditDate?: string;
}

export enum InventoryItemStatus {
    PENDING_REVIEW = 'Pending Review',
    PENDING_APPROVAL = 'Pending Approval',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  status: InventoryItemStatus;
  submittedBy: string;
  submissionDate: string;
  checkedBy?: string;
  approvedBy?: string;
}

export enum Page {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  NEW_PROJECT = 'NEW_PROJECT',
  PROJECT_DETAILS = 'PROJECT_DETAILS',
  USER_CONTROL = 'USER_CONTROL',
  ACTIVITY_LOG = 'ACTIVITY_LOG',
  INVOICES = 'INVOICES',
  RECORD_INVOICE = 'RECORD_INVOICE',
  PROJECT_COST = 'PROJECT_COST',
  TIME_LOGGING = 'TIME_LOGGING',
  TIME_REPORTS = 'TIME_REPORTS',
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
    PROJECT_CHANGES_ACKNOWLEDGED = 'Project Changes Acknowledged',
    INVENTORY_ITEM_CREATED = 'Inventory Item Created',
    INVENTORY_ITEM_UPDATED = 'Inventory Item Updated',
    INVENTORY_ITEM_STATUS_CHANGED = 'Inventory Item Status Changed',
    INVOICE_SUBMITTED = 'Invoice Submitted',
    INVOICE_STATUS_CHANGED = 'Invoice Status Changed',
    INVOICE_DELETED = 'Invoice Deleted',
    TIME_LOG_CREATED = 'Time Log Created',
}

export interface ActivityLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    username: string;
    action: ActivityAction;
    details: { [key: string]: any };
}

export interface Notification {
  id: string;
  userId: string; // Recipient's UID
  message: string;
  projectId: string;
  read: boolean;
  timestamp: string;
}

// FIX: Added missing types for the InvoicesView component to resolve import errors.
export enum InvoiceStatus {
    PENDING_REVIEW = 'Pending Review',
    PENDING_APPROVAL = 'Pending Approval',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export const COST_CENTERS = {
    'Customer Project Costing': 'CPC',
    'Internal R&D': 'IRD',
    'Operational Expense': 'OPEX',
};

export type CostCenterType = keyof typeof COST_CENTERS;

export interface PurchaseRecord {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  costCenter: string;
  projectName?: string;
  status: InvoiceStatus;
  submittedBy: string;
  submissionDate: string;
  checkedBy?: string;
  approvedBy?: string;
  invoiceFile: StoredFile;
}

export interface TimeLogEntry {
    id: string;
    userId: string;
    username: string;
    projectId: string;
    projectName: string;
    date: string; // YYYY-MM-DD
    hours: number;
    note: string;
    timestamp: string; // ISO string for sorting
}


// FIX: Add empty export to ensure file is treated as a module, allowing global JSX augmentation.
export {};