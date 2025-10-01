

// FIX: Add a side-effect import to ensure global types are loaded.
import {} from './types';
// FIX: Corrected the React import statement.
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { InventoryView } from './components/InventoryView';
import { NewProjectView } from './components/NewProjectView';
import { ProjectDetailsView } from './components/ProjectDetailsView';
import { LoginView } from './components/LoginView';
import { InvoicesView } from './components/InvoicesView';
import { EmailNotificationModal } from './components/common/EmailNotificationModal';
import { useProjectData } from './hooks/useProjectData';
import type { Project, User } from './types';
import { Page, UserRole, ProjectStatus } from './types';

const LOGGER_USER: User = { username: 'Logger User', role: UserRole.LOGGER };
const CHECKER_USER: User = { username: 'Checker User', role: UserRole.CHECKER };
const AUTHORIZER_USER: User = { username: 'Authorizer User', role: UserRole.AUTHORIZER };

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [projectForEmail, setProjectForEmail] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [cloningProject, setCloningProject] = useState<Project | null>(null);

  const {
    projects,
    inventory,
    teamMembers,
    purchaseRecords,
    addProject,
    updateProject,
    updateProjectStatus,
    addPurchaseRecord,
    updateInvoiceStatus,
    deductInventory,
  } = useProjectData();

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

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

  const handleLogout = () => {
    setCurrentUser(null);
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
    if (projectForEmail) {
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
    if (project && currentUser?.role === UserRole.CHECKER) {
      updateProjectStatus(projectId, ProjectStatus.PENDING_APPROVAL, currentUser);
      setProjectForEmail(project);
    }
  }, [projects, updateProjectStatus, currentUser]);
  
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

  const renderContent = () => {
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
              currentUser={currentUser!}
              successMessage={successMessage}
              onDismissSuccessMessage={() => setSuccessMessage(null)}
            />
        );
      case Page.INVENTORY:
        return <InventoryView inventory={inventory} />;
      case Page.INVOICES:
        return <InvoicesView purchaseRecords={purchaseRecords} addPurchaseRecord={addPurchaseRecord} projects={projects} currentUser={currentUser!} updateInvoiceStatus={updateInvoiceStatus} />;
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
            currentUser={currentUser!}
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
              onBack={() => navigate(Page.DASHBOARD)}
              onEdit={handleEditProject}
              onClone={handleCloneProject}
              currentUser={currentUser!}
            />
          );
        }
        return <Dashboard projects={projects} purchaseRecords={purchaseRecords} onNavigate={navigate} onViewProject={handleViewProject} onEditProject={handleEditProject} onCloneProject={handleCloneProject} currentUser={currentUser!} successMessage={null} onDismissSuccessMessage={() => {}} />; // Fallback
      default:
        return <Dashboard projects={projects} purchaseRecords={purchaseRecords} onNavigate={navigate} onViewProject={handleViewProject} onEditProject={handleEditProject} onCloneProject={handleCloneProject} currentUser={currentUser!} successMessage={null} onDismissSuccessMessage={() => {}} />;
    }
  };
  
  if (!currentUser) {
    return (
        <LoginView 
            onLogin={handleLogin}
            loggerUser={LOGGER_USER}
            checkerUser={CHECKER_USER}
            authorizerUser={AUTHORIZER_USER}
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