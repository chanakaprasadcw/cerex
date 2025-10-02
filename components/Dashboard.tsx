import React, { useEffect } from 'react';
// FIX: Add side-effect import to load global JSX type definitions.
import {} from '../types';
import type { Project, User, PurchaseRecord } from '../types';
import { Page, ProjectStatus, UserRole, InvoiceStatus } from '../types';
import { ProjectList } from './ProjectList';
import { Card } from './common/Card';
import { Button } from './common/Button';

interface DashboardProps {
  projects: Project[];
  purchaseRecords: PurchaseRecord[];
  onNavigate: (page: Page) => void;
  onViewProject: (projectId: string) => void;
  onEditProject: (projectId: string) => void;
  onCloneProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  currentUser: User;
  successMessage: string | null;
  onDismissSuccessMessage: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, purchaseRecords, onNavigate, onViewProject, onEditProject, onCloneProject, onDeleteProject, currentUser, successMessage, onDismissSuccessMessage }) => {
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        onDismissSuccessMessage();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage, onDismissSuccessMessage]);

  const pendingReviewProjects = projects.filter(p => p.status === ProjectStatus.PENDING_REVIEW).length;
  const pendingApprovalProjects = projects.filter(p => p.status === ProjectStatus.PENDING_APPROVAL).length;
  const activeProjects = projects.filter(p => p.status === ProjectStatus.APPROVED || p.status === ProjectStatus.IN_PROGRESS).length;

  const projectsAwaitingReview = projects.filter(p => p.status === ProjectStatus.PENDING_REVIEW);
  const projectsAwaitingApproval = projects.filter(p => p.status === ProjectStatus.PENDING_APPROVAL);

  const pendingReviewInvoices = new Set(purchaseRecords.filter(p => p.status === InvoiceStatus.PENDING_REVIEW).map(p => p.invoiceId)).size;
  const pendingApprovalInvoices = new Set(purchaseRecords.filter(p => p.status === InvoiceStatus.PENDING_APPROVAL).map(p => p.invoiceId)).size;
  
  // FIX: Explicitly typed the initial value in the reduce function to prevent properties from being read on 'unknown' type.
  const invoicesAwaitingReview = Object.values(
    purchaseRecords
      .filter(p => p.status === InvoiceStatus.PENDING_REVIEW)
      .reduce<Record<string, { invoiceId: string; supplier: string; purchaseDate: string; totalCost: number }>>((acc, record) => {
        if (!acc[record.invoiceId]) {
          acc[record.invoiceId] = { 
              invoiceId: record.invoiceId,
              supplier: record.supplier,
              purchaseDate: record.purchaseDate,
              totalCost: 0,
          };
        }
        acc[record.invoiceId].totalCost += record.totalCost;
        return acc;
      }, {})
  );

  // FIX: Explicitly typed the initial value in the reduce function to prevent properties from being read on 'unknown' type.
  const invoicesAwaitingApproval = Object.values(
    purchaseRecords
      .filter(p => p.status === InvoiceStatus.PENDING_APPROVAL)
      .reduce<Record<string, { invoiceId: string; supplier: string; purchaseDate: string; checkedBy?: string, totalCost: number }>>((acc, record) => {
        if (!acc[record.invoiceId]) {
          acc[record.invoiceId] = { 
              invoiceId: record.invoiceId,
              supplier: record.supplier,
              purchaseDate: record.purchaseDate,
              checkedBy: record.checkedBy,
              totalCost: 0,
          };
        }
        acc[record.invoiceId].totalCost += record.totalCost;
        return acc;
      }, {})
  );


  return (
    <div className="space-y-8">
      {successMessage && (
        <div className="bg-green-500/10 border border-green-400/30 text-green-300 px-4 py-3 rounded-lg relative flex justify-between items-center" role="alert">
          <div className="flex items-center">
            <ion-icon name="checkmark-circle-outline" className="text-xl mr-3"></ion-icon>
            <span className="block sm:inline">{successMessage}</span>
          </div>
          <button onClick={onDismissSuccessMessage} className="p-1 rounded-full hover:bg-green-500/20">
             <ion-icon name="close-outline" className="text-xl"></ion-icon>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-800 rounded-md p-3">
               <ion-icon name="file-tray-stacked-outline" className="text-2xl text-blue-300"></ion-icon>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Projects</p>
              <p className="text-2xl font-bold text-white">{projects.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-cyan-800 rounded-md p-3">
               <ion-icon name="eye-outline" className="text-2xl text-cyan-300"></ion-icon>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Projects Pending Review</p>
              <p className="text-2xl font-bold text-white">{pendingReviewProjects}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-800 rounded-md p-3">
               <ion-icon name="time-outline" className="text-2xl text-yellow-300"></ion-icon>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Invoices Pending Review</p>
              <p className="text-2xl font-bold text-white">{pendingReviewInvoices}</p>
            </div>
          </div>
        </Card>
         <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-800 rounded-md p-3">
              <ion-icon name="alert-circle-outline" className="text-2xl text-orange-300"></ion-icon>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Invoices Pending Approval</p>
              <p className="text-2xl font-bold text-white">{pendingApprovalInvoices}</p>
            </div>
          </div>
        </Card>
      </div>

      {currentUser.role === UserRole.CHECKER && projectsAwaitingReview.length > 0 && (
          <Card>
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <ion-icon name="document-text-outline" className="mr-3 text-cyan-400 text-2xl"></ion-icon>
                  Projects Awaiting Your Review
              </h2>
              <div className="space-y-4">
                {projectsAwaitingReview.map(project => {
                    const totalCost = project.bom.reduce((acc, item) => acc + item.price * item.quantityNeeded, 0);
                    return (
                        <div key={project.id} className="bg-gray-800/50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-700 hover:border-cyan-500/50 transition-colors">
                            <div className="flex-grow">
                                <p className="font-bold text-white text-lg">{project.name}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                                    <span className="flex items-center">
                                        <ion-icon name="person-circle-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                        {project.submittedBy}
                                    </span>
                                    <span className="flex items-center">
                                        <ion-icon name="calendar-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                        {new Date(project.submissionDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 flex-shrink-0">
                                <p className="font-mono text-lg text-cyan-400">${totalCost.toFixed(2)}</p>
                                <Button onClick={() => onViewProject(project.id)} variant="secondary" size="sm" iconName="arrow-forward-outline">
                                    Review Project
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
          </Card>
      )}
      
      {currentUser.role === UserRole.CHECKER && invoicesAwaitingReview.length > 0 && (
          <Card>
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <ion-icon name="receipt-outline" className="mr-3 text-yellow-400 text-2xl"></ion-icon>
                  Invoices Awaiting Your Review
              </h2>
              <div className="space-y-4">
                {invoicesAwaitingReview.map(invoice => (
                    <div key={invoice.invoiceId} className="bg-gray-800/50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-700 hover:border-yellow-500/50 transition-colors">
                        <div className="flex-grow">
                            <p className="font-bold text-white text-lg">{invoice.supplier}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                                <span className="flex items-center">
                                    <ion-icon name="calendar-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                    {new Date(invoice.purchaseDate + 'T00:00:00').toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 flex-shrink-0">
                            <p className="font-mono text-lg text-yellow-400">${invoice.totalCost.toFixed(2)}</p>
                            <Button onClick={() => onNavigate(Page.INVOICES)} variant="secondary" size="sm" iconName="arrow-forward-outline">
                                Review Invoice
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
          </Card>
      )}

      {currentUser.role === UserRole.AUTHORIZER && projectsAwaitingApproval.length > 0 && (
          <Card>
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <ion-icon name="document-text-outline" className="mr-3 text-orange-400 text-2xl"></ion-icon>
                  Projects Awaiting Your Approval
              </h2>
              <div className="space-y-4">
                {projectsAwaitingApproval.map(project => {
                    const totalCost = project.bom.reduce((acc, item) => acc + item.price * item.quantityNeeded, 0);
                    return (
                        <div key={project.id} className="bg-gray-800/50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-700 hover:border-orange-500/50 transition-colors">
                            <div className="flex-grow">
                                <p className="font-bold text-white text-lg">{project.name}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                                    <span className="flex items-center">
                                        <ion-icon name="person-circle-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                        {project.submittedBy}
                                    </span>
                                    {project.checkedBy && (
                                       <span className="flex items-center">
                                            <ion-icon name="checkmark-done-circle-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                            Checked by {project.checkedBy}
                                        </span> 
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 flex-shrink-0">
                                <p className="font-mono text-lg text-orange-400">${totalCost.toFixed(2)}</p>
                                <Button onClick={() => onViewProject(project.id)} variant="secondary" size="sm" iconName="arrow-forward-outline">
                                    Review Project
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
          </Card>
      )}
      
      {currentUser.role === UserRole.AUTHORIZER && invoicesAwaitingApproval.length > 0 && (
          <Card>
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <ion-icon name="receipt-outline" className="mr-3 text-orange-400 text-2xl"></ion-icon>
                  Invoices Awaiting Your Approval
              </h2>
              <div className="space-y-4">
                {invoicesAwaitingApproval.map(invoice => (
                    <div key={invoice.invoiceId} className="bg-gray-800/50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-700 hover:border-orange-500/50 transition-colors">
                        <div className="flex-grow">
                            <p className="font-bold text-white text-lg">{invoice.supplier}</p>
                             <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                                <span className="flex items-center">
                                    <ion-icon name="calendar-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                    {new Date(invoice.purchaseDate + 'T00:00:00').toLocaleDateString()}
                                </span>
                                {invoice.checkedBy && (
                                   <span className="flex items-center">
                                        <ion-icon name="checkmark-done-circle-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                        Checked by {invoice.checkedBy}
                                    </span> 
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 flex-shrink-0">
                            <p className="font-mono text-lg text-orange-400">${invoice.totalCost.toFixed(2)}</p>
                            <Button onClick={() => onNavigate(Page.INVOICES)} variant="secondary" size="sm" iconName="arrow-forward-outline">
                                Review Invoice
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
          </Card>
      )}

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">All Projects</h2>
          {(currentUser.role === UserRole.LOGGER || currentUser.role === UserRole.CHECKER) && (
            <Button onClick={() => onNavigate(Page.NEW_PROJECT)} variant="primary" size="sm" iconName="add-outline">
                Create Project
            </Button>
          )}
        </div>
        <ProjectList 
            projects={projects} 
            onViewProject={onViewProject} 
            onEditProject={onEditProject} 
            onCloneProject={onCloneProject}
            onDeleteProject={onDeleteProject}
            currentUser={currentUser} 
        />
      </Card>
    </div>
  );
};
