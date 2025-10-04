// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../types';
import React, { useState } from 'react';
import type { Project, User } from '../types';
import { Page, ProjectStatus, UserRole } from '../types';
import { ProjectList } from './ProjectList';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Modal } from './common/Modal';

interface ProjectDashboardProps {
  projects: Project[];
  onNavigate: (page: Page) => void;
  onViewProject: (projectId: string) => void;
  onEditProject: (projectId: string) => void;
  onCloneProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  currentUser: User;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projects, onNavigate, onViewProject, onEditProject, onCloneProject, onDeleteProject, currentUser }) => {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleRequestDelete = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const nonRejectedProjects = projects.filter(p => p.status !== ProjectStatus.REJECTED);
  const rejectedProjects = projects.filter(p => p.status === ProjectStatus.REJECTED);

  const pendingReviewProjects = nonRejectedProjects.filter(p => p.status === ProjectStatus.PENDING_REVIEW).length;
  const pendingApprovalProjects = nonRejectedProjects.filter(p => p.status === ProjectStatus.PENDING_APPROVAL).length;

  const projectsAwaitingReview = nonRejectedProjects.filter(p => p.status === ProjectStatus.PENDING_REVIEW);
  const projectsAwaitingApproval = nonRejectedProjects.filter(p => p.status === ProjectStatus.PENDING_APPROVAL);
  const projectsAwaitingAcknowledgment = nonRejectedProjects.filter(
    p => p.status === ProjectStatus.AWAITING_ACKNOWLEDGMENT && p.submittedBy === currentUser.username
  );
  
  const canSeeApprovalQueue = currentUser.role === UserRole.AUTHORIZER || currentUser.role === UserRole.SUPER_ADMIN;

  return (
    <div className="space-y-8">
      {projectToDelete && (
        <Modal
          title="Confirm Deletion"
          message={`Are you sure you want to permanently delete the project "${projectToDelete.name}"? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setProjectToDelete(null)}
          confirmText="Delete Project"
          variant="danger"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-brand-primary rounded-md p-3">
               {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
               <ion-icon name="file-tray-stacked-outline" className="text-2xl text-blue-200"></ion-icon>
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
               {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
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
               {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
               <ion-icon name="time-outline" className="text-2xl text-yellow-300"></ion-icon>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Projects Pending Approval</p>
              <p className="text-2xl font-bold text-white">{pendingApprovalProjects}</p>
            </div>
          </div>
        </Card>
      </div>

      {currentUser.role === UserRole.LOGGER && projectsAwaitingAcknowledgment.length > 0 && (
          <Card>
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                  <ion-icon name="alert-circle-outline" className="mr-3 text-yellow-400 text-2xl"></ion-icon>
                  Action Required: Awaiting Your Acknowledgment
              </h2>
              <div className="space-y-4">
                {projectsAwaitingAcknowledgment.map(project => (
                    <div key={project.id} className="bg-gray-800/50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-700 hover:border-yellow-500/50 transition-colors">
                        <div className="flex-grow">
                            <p className="font-bold text-white text-lg">{project.name}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                                <span className="flex items-center">
                                    {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                                    <ion-icon name="pencil-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                    Changes made by {project.lastEditor || 'a reviewer'}
                                </span>
                                <span className="flex items-center">
                                    {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                                    <ion-icon name="calendar-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                    {project.lastEditDate ? new Date(project.lastEditDate).toLocaleDateString() : 'Recently'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 flex-shrink-0">
                            <Button onClick={() => onViewProject(project.id)} variant="secondary" size="sm" iconName="arrow-forward-outline">
                                Review Changes
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
          </Card>
      )}

      {currentUser.role === UserRole.CHECKER && projectsAwaitingReview.length > 0 && (
          <Card>
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
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
                                        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                                        <ion-icon name="person-circle-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                        {project.submittedBy}
                                    </span>
                                    <span className="flex items-center">
                                        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
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
      
      {canSeeApprovalQueue && projectsAwaitingApproval.length > 0 && (
          <Card>
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
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
                                        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                                        <ion-icon name="person-circle-outline" className="mr-1.5 align-middle text-base"></ion-icon>
                                        {project.submittedBy}
                                    </span>
                                    {project.checkedBy && (
                                       <span className="flex items-center">
                                            {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
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

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">All Projects</h2>
          {(currentUser.role === UserRole.LOGGER || currentUser.role === UserRole.CHECKER || currentUser.role === UserRole.AUTHORIZER) && (
            <Button onClick={() => onNavigate(Page.NEW_PROJECT)} variant="primary" size="sm" iconName="add-outline">
                Create Project
            </Button>
          )}
        </div>
        <ProjectList 
            projects={nonRejectedProjects} 
            onViewProject={onViewProject} 
            onEditProject={onEditProject} 
            onCloneProject={onCloneProject}
            onDeleteProject={handleRequestDelete}
            currentUser={currentUser} 
        />
      </Card>
      
      {rejectedProjects.length > 0 && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
              <ion-icon name="close-circle-outline" className="mr-3 text-red-400 text-2xl"></ion-icon>
              Rejected Projects
            </h2>
          </div>
          <ProjectList 
              projects={rejectedProjects}
              onViewProject={onViewProject} 
              onEditProject={onEditProject} 
              onCloneProject={onCloneProject}
              onDeleteProject={handleRequestDelete}
              currentUser={currentUser} 
          />
        </Card>
      )}
    </div>
  );
};