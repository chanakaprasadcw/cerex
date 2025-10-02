// FIX: Import React before any local type augmentations to ensure global JSX types are loaded correctly.
import React, { useState, useCallback } from 'react';
// FIX: Add a side-effect import to ensure global types are loaded.
import {} from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { InventoryView } from './components/InventoryView';
import { NewProjectView } from './components/NewProjectView';
import { ProjectDetailsView } from './components/ProjectDetailsView';
import { LoginView } from './components/LoginView';
import { InvoicesView } from './components/InvoicesView';
import { UserControlView } from './components/UserControlView';
import { ActivityLogView } from './components/ActivityLogView';
import { Chatbot } from './components/Chatbot';
import { EmailNotificationModal } from './components/common/EmailNotificationModal';
import { Spinner } from './components/common/Spinner';
import { useProjectData } from './hooks/useProjectData';
import { useAuth } from './hooks/useAuth';
import type { Project, User } from './types';
import { Page, UserRole, ProjectStatus } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [projectForEmail, setProjectForEmail] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [cloningProject, setCloningProject] = useState<Project | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const { currentUser, loading, logOut, signIn, signUp, resetPassword } = useAuth();

  const {
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
  } = useProjectData(currentUser);

  const navigate = (page: Page) => {
    if (successMessage) {
        setSuccessMessage(null);
    }
    if (editingProject) {
        setEditingProject(null);
    }
    if (cloningProject) {
        setCloningProject(null);
    }
    setCurrentPage(page);
  };

  const handleLogout = async () => {
    await logOut();
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
  
  const handleCreateNewProject = (newProject: Project) => {
    addProject(newProject);
    setSuccessMessage(`Project "${newProject.name}" has been successfully submitted for review.`);
    navigate(Page.DASHBOARD);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    updateProject(updatedProject);
    setSuccessMessage(`Project "${updatedProject.name}" has been successfully updated.`);
    setEditingProject(null);
    navigate(Page.DASHBOARD);
  };

  const handleSendEmailNotification = () => {
    if (projectForEmail && currentUser) {
      // FIX: The status update is now correctly tied to the final confirmation action.
      updateProjectStatus(projectForEmail.id, ProjectStatus.PENDING_APPROVAL, currentUser);
      setSuccessMessage(`Project "${projectForEmail.name}" has been sent for final approval.`);
      setProjectForEmail(null);
      navigate(Page.DASHBOARD);
    }
  };

  const handleCloseEmailModal = () => {
    setProjectForEmail(null);
  };

  const handleSubmitForApproval = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    // FIX: Only set the project to open the modal. The status update will happen upon confirmation.
    if (project && currentUser?.role === UserRole.CHECKER) {
      setProjectForEmail(project);
    }
  }, [projects, currentUser]);
  
  const handleApproveProject = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && currentUser?.role === UserRole.AUTHORIZER) {
      deductInventory(project.bom);
      updateProjectStatus(projectId, ProjectStatus.APPROVED, currentUser);
      navigate(Page.DASHBOARD);
      setSelectedProjectId(null);
    }
  }, [projects, deductInventory, updateProjectStatus, currentUser]);

  const handleRejectProject = useCallback((projectId: string) => {
    if (currentUser?.role === UserRole.AUTHORIZER || currentUser?.role === UserRole.CHECKER) {
      updateProjectStatus(projectId, ProjectStatus.REJECTED, currentUser);
      navigate(Page.DASHBOARD);
      setSelectedProjectId(null);
    }
  }, [updateProjectStatus, currentUser]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (projectToDelete) {
        await deleteProject(projectId);
        setSuccessMessage(`Project "${projectToDelete.name}" has been deleted.`);
        if (currentPage === Page.PROJECT_DETAILS) {
            navigate(Page.DASHBOARD);
        }
    }
  }, [projects, deleteProject, currentPage]);

  const renderContent = () => {
    if (!currentUser) return null; // Should be handled by the main return, but good for type safety

    switch (currentPage) {
      case Page.DASHBOARD:
        return (
            <Dashboard
              projects={projects}
              purchaseRecords={purchaseRecords}
              onNavigate={navigate}
              onViewProject={handleViewProject}
              onEditProject={handleEditProject}
              onCloneProject={handleCloneProject}
              onDeleteProject={handleDeleteProject}
              currentUser={currentUser}
              successMessage={successMessage}
              onDismissSuccessMessage={() => setSuccessMessage(null)}
            />
        );
      case Page.INVENTORY:
        return <InventoryView inventory={inventory} />;
      case Page.INVOICES:
        return <InvoicesView purchaseRecords={purchaseRecords} submitInvoice={submitInvoice} projects={projects} currentUser={currentUser} updateInvoiceStatus={updateInvoiceStatus} deleteInvoice={deleteInvoice} />;
      case Page.NEW_PROJECT:
        return (
          <NewProjectView
            projectToEdit={editingProject}
            projectToClone={cloningProject}
            inventory={inventory}
            teamMembers={teamMembers}
            onSubmit={editingProject ? handleUpdateProject : handleCreateNewProject}
            onCancel={() => {
                setEditingProject(null);
                setCloningProject(null);
                navigate(Page.DASHBOARD);
            }}
            currentUser={currentUser}
          />
        );
      case Page.PROJECT_DETAILS:
        const project = projects.find(p => p.id === selectedProjectId);
        if (project) {
          return (
            <ProjectDetailsView
              project={project}
              onApprove={handleApproveProject}
              onReject={handleRejectProject}
              onSubmitForApproval={handleSubmitForApproval}
              onDeleteProject={handleDeleteProject}
              onBack={() => navigate(Page.DASHBOARD)}
              onEdit={handleEditProject}
              onClone={handleCloneProject}
              currentUser={currentUser}
            />
          );
        }
        return <Dashboard projects={projects} purchaseRecords={purchaseRecords} onNavigate={navigate} onViewProject={handleViewProject} onEditProject={handleEditProject} onCloneProject={handleCloneProject} onDeleteProject={handleDeleteProject} currentUser={currentUser} successMessage={null} onDismissSuccessMessage={() => {}} />; // Fallback
      case Page.USER_CONTROL:
        return <UserControlView users={users} currentUser={currentUser} updateUserRole={updateUserRole} activityLog={activityLog} />;
      case Page.ACTIVITY_LOG:
        return <ActivityLogView activityLog={activityLog} />;
      default:
        return <Dashboard projects={projects} purchaseRecords={purchaseRecords} onNavigate={navigate} onViewProject={handleViewProject} onEditProject={handleEditProject} onCloneProject={handleCloneProject} onDeleteProject={handleDeleteProject} currentUser={currentUser} successMessage={null} onDismissSuccessMessage={() => {}} />;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  
  if (!currentUser) {
    return (
        <LoginView 
            onSignIn={signIn}
            onSignUp={signUp}
            onResetPassword={resetPassword}
        />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div 
        className="absolute inset-0 z-0 bg-repeat"
        style={{
          backgroundImage: 'url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIxIi8+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+\')',
          opacity: 0.5,
        }}>
      </div>
      <div className="relative z-10">
        <Header onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} />
        <main className="p-4 sm:p-6 lg:p-8">
            {renderContent()}
        </main>
      </div>
       {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} />}
      
      <button
        onClick={() => setIsChatbotOpen(prev => !prev)}
        title={isChatbotOpen ? "Close Chat" : "Open AI Assistant"}
        className="fixed bottom-4 right-4 sm:right-6 lg:right-8 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
        aria-label="Toggle AI Assistant"
      >
        {/* FIX: Changed 'class' to 'className' for consistency with React. */}
        <ion-icon name={isChatbotOpen ? "close-outline" : "sparkles-outline"} className="text-3xl"></ion-icon>
      </button>

      {projectForEmail && (
        <EmailNotificationModal 
          project={projectForEmail}
          onSend={handleSendEmailNotification}
          onClose={handleCloseEmailModal}
        />
      )}
    </div>
  );
};

export default App;