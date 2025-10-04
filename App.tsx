// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import './types';
// FIX: Corrected the import syntax for React hooks.
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProjectDashboard } from './components/ProjectDashboard';
import { InvoiceDashboard } from './components/InvoiceDashboard';
import { TimeTrackingDashboard } from './components/TimeTrackingDashboard';
import { InventoryView } from './components/InventoryView';
import { InvoicesView } from './components/InvoicesView';
import { NewProjectView } from './components/NewProjectView';
import { ProjectDetailsView } from './components/ProjectDetailsView';
import { LoginView } from './components/LoginView';
import { UserControlView } from './components/UserControlView';
import { ActivityLogView } from './components/ActivityLogView';
import { Chatbot } from './components/Chatbot';
import { EmailNotificationModal } from './components/common/EmailNotificationModal';
import { Spinner } from './components/common/Spinner';
import { FlowSelectionView } from './components/FlowSelectionView';
import { RecordInvoiceView } from './components/RecordInvoiceView';
import { ProjectCostView } from './components/ProjectCostView';
import { TimeLogView } from './components/TimeLogView';
import { ProjectTimeReportView } from './components/ProjectTimeReportView';
import { useProjectData } from './hooks/useProjectData';
import { useAuth } from './hooks/useAuth';
import { useToast, ToastProvider } from './hooks/useToast';
import type { Project, User, Notification } from './types';
// FIX: Combined multiple imports into one to ensure types and value enums are loaded, which resolves JSX augmentation for custom elements like 'ion-icon'.
import { Page, UserRole, ProjectStatus, Flow } from './types';

const AppContent: React.FC = () => {
  const [currentFlow, setCurrentFlow] = useState<Flow | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectForEmail, setProjectForEmail] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [cloningProject, setCloningProject] = useState<Project | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { addToast } = useToast();
  const { currentUser, loading, logOut, signIn, signUp, resetPassword } = useAuth();

  const {
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
  } = useProjectData(currentUser);

  const navigate = (page: Page) => {
    if (editingProject) setEditingProject(null);
    if (cloningProject) setCloningProject(null);
    if (submissionError) setSubmissionError(null);
    setCurrentPage(page);
  };

  const handleSelectFlow = (flow: Flow) => {
    setCurrentFlow(flow);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleSwitchFlow = () => {
    setCurrentFlow(null);
  }

  const handleLogout = async () => {
    await logOut();
    setCurrentFlow(null);
    navigate(Page.DASHBOARD);
  };

  const handleViewProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    navigate(Page.PROJECT_DETAILS);
  }, []);

  const handleEditProject = useCallback((projectId: string) => {
    const projectToEdit = projects.find(p => p.id === projectId);
    if (projectToEdit) {
      setEditingProject(projectToEdit);
      setCurrentPage(Page.NEW_PROJECT);
    }
  }, [projects]);

  const handleCloneProject = useCallback((projectId: string) => {
    const projectToClone = projects.find(p => p.id === projectId);
    if (projectToClone) {
      setCloningProject(projectToClone);
      setCurrentPage(Page.NEW_PROJECT);
    }
  }, [projects]);
  
  const handleCreateNewProject = async (newProject: Project) => {
    try {
      setSubmissionError(null);
      await addProject(newProject);
      addToast(`Project "${newProject.name}" submitted for review.`, 'success');
      navigate(Page.DASHBOARD);
    } catch (error: any) {
      console.error("Project submission failed:", error);
      setSubmissionError(error.message || "An unknown error occurred during submission.");
      addToast('Project submission failed.', 'error');
    }
  };

  // FIX: Converted to an async function to align with the expected Promise return type for the onSubmit prop.
  const handleUpdateProject = async (updatedProject: Project) => {
    if (!currentUser) return;
    await updateProject(updatedProject, currentUser);
    addToast(`Project "${updatedProject.name}" updated successfully.`, 'success');
    setEditingProject(null);
    navigate(Page.DASHBOARD);
  };

  const handleAcknowledgeChanges = useCallback(async (projectId: string) => {
    if (!currentUser) return;
    await acknowledgeProjectChanges(projectId, currentUser);
    addToast('Project changes acknowledged.', 'success');
    navigate(Page.DASHBOARD);
  }, [currentUser, acknowledgeProjectChanges, addToast]);

  const handleApprove = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && currentUser) {
      await updateProjectStatus(projectId, ProjectStatus.APPROVED, currentUser);
      await deductInventory(project.bom);
      addToast(`Project "${project.name}" approved.`, 'success');
    }
  };

  const handleReject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && currentUser) {
      await updateProjectStatus(projectId, ProjectStatus.REJECTED, currentUser);
      addToast(`Project "${project.name}" rejected.`, 'error');
    }
  };

  const handleSubmitForApproval = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && currentUser) {
      await updateProjectStatus(projectId, ProjectStatus.PENDING_APPROVAL, currentUser);
      addToast(`Project "${project.name}" submitted for final approval.`, 'info');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if(project) {
        await deleteProject(projectId);
        addToast(`Project "${project.name}" has been deleted.`, 'success');
        if (currentPage === Page.PROJECT_DETAILS) {
            navigate(Page.DASHBOARD);
        }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    setCurrentFlow(Flow.PROJECT);
    handleViewProject(notification.projectId);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <Spinner />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onSignIn={signIn} onSignUp={signUp} onResetPassword={resetPassword} />;
  }

  if (!currentFlow) {
    return <FlowSelectionView onSelectFlow={handleSelectFlow} username={currentUser.username} onLogout={handleLogout} />;
  }

  const renderProjectFlow = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <ProjectDashboard projects={projects} onNavigate={navigate} onViewProject={handleViewProject} onEditProject={handleEditProject} onCloneProject={handleCloneProject} onDeleteProject={handleDeleteProject} currentUser={currentUser} />;
      case Page.INVENTORY:
        return <InventoryView inventory={inventory} projects={projects} addInventoryItem={addInventoryItem} updateInventoryItemStatus={updateInventoryItemStatus} currentUser={currentUser} />;
      case Page.NEW_PROJECT:
        // FIX: Corrected variable name from 'isEditingProject' to 'editingProject' to correctly check if in edit mode.
        return <NewProjectView inventory={inventory.filter(i => i.status === 'Approved')} teamMembers={teamMembers} onSubmit={editingProject ? handleUpdateProject : handleCreateNewProject} onCancel={() => navigate(Page.DASHBOARD)} currentUser={currentUser} projectToEdit={editingProject} projectToClone={cloningProject} submissionError={submissionError}/>;
      case Page.PROJECT_DETAILS:
        if (selectedProject) {
          // FIX: Renamed 'onDelete' prop to 'onDeleteProject' to match the component's prop interface.
          return <ProjectDetailsView project={selectedProject} onApprove={handleApprove} onReject={handleReject} onSubmitForApproval={handleSubmitForApproval} onDeleteProject={handleDeleteProject} onBack={() => navigate(Page.DASHBOARD)} onEdit={handleEditProject} onClone={handleCloneProject} onAcknowledgeChanges={handleAcknowledgeChanges} currentUser={currentUser} />;
        }
        // FIX: Added 'return null' after navigation to satisfy the ReactNode return type for the component.
        navigate(Page.DASHBOARD);
        return null;
      case Page.USER_CONTROL:
        return <UserControlView users={users} currentUser={currentUser} updateUserRole={updateUserRole} activityLog={activityLog} />;
      case Page.ACTIVITY_LOG:
        return <ActivityLogView activityLog={activityLog} />;
      default:
        return <ProjectDashboard projects={projects} onNavigate={navigate} onViewProject={handleViewProject} onEditProject={handleEditProject} onCloneProject={handleCloneProject} onDeleteProject={handleDeleteProject} currentUser={currentUser} />;
    }
  };

  const renderInvoiceFlow = () => {
    switch (currentPage) {
        case Page.DASHBOARD:
            return <InvoiceDashboard purchaseRecords={purchaseRecords} onNavigate={navigate} />;
        case Page.INVOICES:
            return <InvoicesView purchaseRecords={purchaseRecords} currentUser={currentUser} updateInvoiceStatus={updateInvoiceStatus} deleteInvoice={deleteInvoice} />;
        case Page.RECORD_INVOICE:
            return <RecordInvoiceView submitInvoice={submitInvoice} projects={projects} currentUser={currentUser} onCancel={() => navigate(Page.DASHBOARD)} />;
        case Page.PROJECT_COST:
            return <ProjectCostView purchaseRecords={purchaseRecords} projects={projects} />;
        default:
             return <InvoiceDashboard purchaseRecords={purchaseRecords} onNavigate={navigate} />;
    }
  };

  const renderPeopleFlow = () => {
    switch (currentPage) {
        case Page.DASHBOARD:
            return <TimeTrackingDashboard timeLogs={timeLogs} currentUser={currentUser} projects={projects} onNavigate={navigate} />;
        case Page.TIME_LOGGING:
            return <TimeLogView projects={projects.filter(p => p.status !== ProjectStatus.REJECTED && p.status !== ProjectStatus.COMPLETED)} currentUser={currentUser} addTimeLog={addTimeLog} onCancel={() => navigate(Page.DASHBOARD)} />;
        case Page.TIME_REPORTS:
             return <ProjectTimeReportView timeLogs={timeLogs} projects={projects} users={users} currentUser={currentUser} />;
        case Page.USER_CONTROL:
            return <UserControlView users={users} currentUser={currentUser} updateUserRole={updateUserRole} activityLog={activityLog} />;
        case Page.ACTIVITY_LOG:
            return <ActivityLogView activityLog={activityLog} />;
        default:
            return <TimeTrackingDashboard timeLogs={timeLogs} currentUser={currentUser} projects={projects} onNavigate={navigate} />;
    }
  }

  const renderContent = () => {
    switch(currentFlow) {
        case Flow.PROJECT:
            return renderProjectFlow();
        case Flow.INVOICE:
            return renderInvoiceFlow();
        case Flow.PEOPLE:
            return renderPeopleFlow();
        default:
            return <div>Invalid Flow</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentFlow={currentFlow}
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchFlow={handleSwitchFlow}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={markAllNotificationsAsRead}
      />
      <main 
        className="flex-1 transition-all duration-300 ease-in-out" 
        style={{ paddingLeft: isSidebarCollapsed ? '80px' : '288px' }}
      >
        <div className="w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {renderContent()}
        </div>
      </main>
      
      <button
        onClick={() => setIsChatbotOpen(prev => !prev)}
        className="fixed bottom-4 right-4 sm:right-6 lg:right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 z-30 transform hover:-translate-y-1 transition-all"
        aria-label="Toggle AI Assistant"
      >
        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
        {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
        <ion-icon name={isChatbotOpen ? "close-outline" : "sparkles-outline"} className="text-2xl"></ion-icon>
      </button>
      {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} isSidebarCollapsed={isSidebarCollapsed} />}
      
      {projectForEmail && <EmailNotificationModal project={projectForEmail} onSend={() => {}} onClose={() => setProjectForEmail(null)} />}
    </div>
  );
}

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;