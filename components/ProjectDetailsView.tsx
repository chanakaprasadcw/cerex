// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../types';
import React from 'react';
import type { Project, User, StoredFile } from '../types';
import { ProjectStatus, UserRole } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Modal } from './common/Modal';
import { TimelineChart } from './common/TimelineChart';
import { useToast } from '../hooks/useToast';

interface ProjectDetailsViewProps {
  project: Project;
  onApprove: (projectId: string) => void;
  onReject: (projectId: string) => void;
  onSubmitForApproval: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onAcknowledgeChanges: (projectId: string) => void;
  onBack: () => void;
  onEdit: (projectId: string) => void;
  onClone: (projectId: string) => void;
  currentUser: User;
}

const getStatusChipClass = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.PENDING_REVIEW:
      return 'bg-cyan-500/20 text-cyan-400';
    case ProjectStatus.PENDING_APPROVAL:
      return 'bg-yellow-500/20 text-yellow-400';
    case ProjectStatus.AWAITING_ACKNOWLEDGMENT:
      return 'bg-yellow-500/20 text-yellow-400';
    case ProjectStatus.APPROVED:
    case ProjectStatus.IN_PROGRESS:
      return 'bg-green-500/20 text-green-400';
    case ProjectStatus.REJECTED:
      return 'bg-red-500/20 text-red-400';
    case ProjectStatus.COMPLETED:
      return 'bg-blue-500/20 text-blue-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = ({ project, onApprove, onReject, onSubmitForApproval, onDeleteProject, onBack, onEdit, onClone, onAcknowledgeChanges, currentUser }) => {
  const [showApproveModal, setShowApproveModal] = React.useState(false);
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const { addToast } = useToast();
  
  const totalCost = project.bom.reduce((acc, item) => acc + item.price * item.quantityNeeded, 0);

  const isSubmitter = currentUser.username === project.submittedBy;
  const isAwaitingAcknowledgment = project.status === ProjectStatus.AWAITING_ACKNOWLEDGMENT;
  const isAuthorizerLevel = currentUser.role === UserRole.AUTHORIZER || currentUser.role === UserRole.SUPER_ADMIN;

  const canDelete = (project: Project, user: User): boolean => {
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }
    if (user.role === UserRole.CHECKER && project.status === ProjectStatus.PENDING_REVIEW) {
        return true;
    }
    if (user.role === UserRole.AUTHORIZER && (project.status === ProjectStatus.PENDING_REVIEW || project.status === ProjectStatus.PENDING_APPROVAL || project.status === ProjectStatus.REJECTED)) {
        return true;
    }
    return false;
  };

  const confirmApprove = () => {
    onApprove(project.id);
    setShowApproveModal(false);
  }

  const confirmReject = () => {
    onReject(project.id);
    setShowRejectModal(false);
  }
  
  const confirmDelete = () => {
    onDeleteProject(project.id);
    setShowDeleteModal(false);
  }
  
  const handleViewDocument = (file: StoredFile | null | undefined) => {
    if (!file || !file.data) {
        addToast("Document data is not available.", 'error');
        return;
    }
    try {
        const dataUrl = `data:${file.type};base64,${file.data}`;
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
            newWindow.document.title = file.name;
        } else {
            throw new Error("Could not open new window. Please check your browser's pop-up settings.");
        }
    } catch (e: any) {
        console.error("Error opening document:", e);
        addToast(e.message || "Could not display document.", 'error');
    }
  };


  return (
    <div className="space-y-8">
        {showApproveModal && <Modal title="Confirm Approval" message="Approving this project will deduct items from inventory. This action cannot be undone." onConfirm={confirmApprove} onCancel={() => setShowApproveModal(false)} confirmText="Approve" />}
        {showRejectModal && <Modal title="Confirm Rejection" message="Are you sure you want to reject this project?" onConfirm={confirmReject} onCancel={() => setShowRejectModal(false)} confirmText="Reject" variant="danger" />}
        {showDeleteModal && <Modal title="Confirm Deletion" message={`Are you sure you want to permanently delete the project "${project.name}"? This action cannot be undone.`} onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} confirmText="Delete Project" variant="danger" />}
      
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
        <div>
            <Button onClick={onBack} variant="secondary" iconName="arrow-back-outline" className="mb-4">Back to Dashboard</Button>
            <h1 className="text-4xl font-bold tracking-tight text-white">{project.name}</h1>
            <p className="text-gray-400 mt-1">{project.costCenter}</p>
        </div>
        <div className="text-right flex-shrink-0">
             <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusChipClass(project.status)}`}>
                {project.status}
            </span>
             <p className="text-gray-500 text-sm mt-2">Submitted by: <span className="font-medium text-gray-300">{project.submittedBy}</span></p>
             <p className="text-gray-500 text-sm">on {new Date(project.submissionDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
            <Card>
                <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Project Details</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{project.details}</p>
            </Card>
            
            <Card>
                <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Timeline</h2>
                <TimelineChart timeline={project.timeline} />
            </Card>

            <Card>
                <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Bill of Materials (BOM)</h2>
                <ul className="space-y-3">
                    {project.bom.map((item, index) => (
                         <li key={index} className="flex justify-between items-center bg-gray-800/50 p-3 rounded-md">
                            <div>
                                <p className="font-semibold text-white">{item.name}</p>
                                <p className="text-sm text-gray-400">
                                    {item.quantityNeeded} units @ ${item.price.toFixed(2)} | 
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${item.source === 'Inventory' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{item.source}</span>
                                </p>
                            </div>
                            <span className="font-bold text-white">${(item.quantityNeeded * item.price).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                    <p className="text-lg font-bold text-white">Total Cost: <span className="text-blue-400">${totalCost.toFixed(2)}</span></p>
                </div>
            </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
                <div className="flex flex-wrap gap-2">
                    {project.status !== ProjectStatus.REJECTED && (
                        <>
                            <Button onClick={() => onEdit(project.id)} variant="secondary" iconName="pencil-outline">Edit</Button>
                            <Button onClick={() => onClone(project.id)} variant="secondary" iconName="copy-outline">Clone</Button>
                        </>
                    )}
                    {canDelete(project, currentUser) && (
                        <Button onClick={() => setShowDeleteModal(true)} variant="danger-outline" iconName="trash-outline">Delete</Button>
                    )}
                </div>
            </Card>

            {isSubmitter && isAwaitingAcknowledgment && (
                <Card>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                        {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                        <ion-icon name="alert-circle-outline" className="mr-3 text-yellow-400 text-2xl"></ion-icon>
                        Action Required
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                        <span className="font-bold text-white">{project.lastEditor}</span> has made changes to this project. Please review the updates and either acknowledge them to continue the approval process or reject the project.
                    </p>
                    <div className="flex flex-col space-y-3">
                        <Button onClick={() => onAcknowledgeChanges(project.id)} variant="primary" iconName="checkmark-done-outline">Acknowledge Changes</Button>
                        <Button onClick={() => setShowRejectModal(true)} variant="danger" iconName="close-circle-outline">Reject Project</Button>
                    </div>
                </Card>
            )}

            {!isAwaitingAcknowledgment && currentUser.role === UserRole.CHECKER && project.status === ProjectStatus.PENDING_REVIEW && (
                 <Card>
                    <h2 className="text-xl font-semibold text-white mb-4">Review Project</h2>
                    <p className="text-sm text-gray-400 mb-4">As a checker, you can submit this project for final approval or reject it.</p>
                    <div className="flex flex-col space-y-3">
                        <Button onClick={() => onSubmitForApproval(project.id)} variant="primary" iconName="send-outline">Submit for Approval</Button>
                        <Button onClick={() => setShowRejectModal(true)} variant="danger" iconName="close-circle-outline">Reject Project</Button>
                    </div>
                 </Card>
            )}
            {!isAwaitingAcknowledgment && isAuthorizerLevel && project.status === ProjectStatus.PENDING_APPROVAL && (
                 <Card>
                    <h2 className="text-xl font-semibold text-white mb-4">Respond to Approval Request</h2>
                    <p className="text-sm text-gray-400 mb-4">As an authorizer, you can approve or reject this project submission.</p>
                    <div className="flex flex-col space-y-3">
                        <Button onClick={() => setShowApproveModal(true)} variant="primary" iconName="checkmark-circle-outline">Approve Project</Button>
                        <Button onClick={() => setShowRejectModal(true)} variant="danger" iconName="close-circle-outline">Reject Project</Button>
                    </div>
                 </Card>
            )}

            <Card>
                <h2 className="text-xl font-semibold text-white mb-4">Documents</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    {project.projectDocument ? (
                        <Button 
                            onClick={() => handleViewDocument(project.projectDocument)} 
                            variant="secondary" 
                            iconName="document-text-outline"
                        >
                            Project Doc
                        </Button>
                    ) : <p className="text-sm text-gray-500">No Project Document.</p>}
                    {project.bomDocument ? (
                        <Button 
                            onClick={() => handleViewDocument(project.bomDocument)} 
                            variant="secondary" 
                            iconName="document-text-outline"
                        >
                            BOM Doc
                        </Button>
                    ) : <p className="text-sm text-gray-500">No BOM Document.</p>}
                </div>
            </Card>

            <Card>
                 <h2 className="text-xl font-semibold text-white mb-4">Team</h2>
                 <ul className="space-y-3">
                    {project.team.map(member => (
                        <li key={member.id} className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-blue-300">{member.name.charAt(0)}</div>
                            <div>
                                <p className="font-medium text-white">{member.name}</p>
                                <p className="text-sm text-gray-400">{member.role}</p>
                            </div>
                        </li>
                    ))}
                 </ul>
            </Card>
             <Card>
                 <h2 className="text-xl font-semibold text-white mb-4">Approvers</h2>
                 <ul className="space-y-3">
                    {project.approvers.map(member => (
                        <li key={member.id} className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-yellow-300">{member.name.charAt(0)}</div>
                            <div>
                                <p className="font-medium text-white">{member.name}</p>
                                <p className="text-sm text-gray-400">{member.role}</p>
                            </div>
                        </li>
                    ))}
                 </ul>
            </Card>
        </div>
      </div>
    </div>
  );
};