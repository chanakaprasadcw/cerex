import React from 'react';
import type { Project, User } from '../types';
import { ProjectStatus, UserRole } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Modal } from './common/Modal';
import { TimelineChart } from './common/TimelineChart';

interface ProjectDetailsViewProps {
  project: Project;
  onApprove: (projectId: string) => void;
  onReject: (projectId: string) => void;
  onSubmitForApproval: (projectId: string) => void;
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

export const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = ({ project, onApprove, onReject, onSubmitForApproval, onBack, onEdit, onClone, currentUser }) => {
  const [showApproveModal, setShowApproveModal] = React.useState(false);
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  
  const totalCost = project.bom.reduce((acc, item) => acc + item.price * item.quantityNeeded, 0);

  const confirmApprove = () => {
    onApprove(project.id);
    setShowApproveModal(false);
  }

  const confirmReject = () => {
    onReject(project.id);
    setShowRejectModal(false);
  }

  const handleFileDownload = (file: File | null | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
        {showApproveModal && <Modal title="Confirm Approval" message="Approving this project will deduct items from inventory. This action cannot be undone." onConfirm={confirmApprove} onCancel={() => setShowApproveModal(false)} confirmText="Approve" />}
        {showRejectModal && <Modal title="Confirm Rejection" message="Are you sure you want to reject this project?" onConfirm={confirmReject} onCancel={() => setShowRejectModal(false)} confirmText="Reject" variant="danger" />}
      
      <div className="flex justify-between items-start mb-6">
        <div>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={onBack} variant="secondary" iconName="arrow-back-outline">Back to Dashboard</Button>
                <Button onClick={() => onEdit(project.id)} variant="secondary" iconName="pencil-outline">Edit Project</Button>
                <Button onClick={() => onClone(project.id)} variant="secondary" iconName="copy-outline">Clone Project</Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{project.name}</h1>
            <p className="text-gray-400 mt-1">{project.costCenter}</p>
        </div>
        <div className="text-right">
             <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusChipClass(project.status)}`}>
                {project.status}
            </span>
             <p className="text-gray-500 text-sm mt-2">Submitted: {new Date(project.submissionDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Project Details</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{project.details}</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {project.detailsFile && 
                        <div>
                            <p className="text-gray-400 mb-1">Details Document:</p>
                            <button onClick={() => handleFileDownload(project.detailsFile)} className="text-blue-400 hover:underline cursor-pointer flex items-center space-x-1.5 transition-colors hover:text-blue-300">
                                <ion-icon name="download-outline"></ion-icon>
                                <span>{project.detailsFile.name}</span>
                            </button>
                        </div>
                    }
                    {project.costingFile && 
                        <div>
                            <p className="text-gray-400 mb-1">Costing Sheet:</p>
                            <button onClick={() => handleFileDownload(project.costingFile)} className="text-blue-400 hover:underline cursor-pointer flex items-center space-x-1.5 transition-colors hover:text-blue-300">
                                <ion-icon name="download-outline"></ion-icon>
                                <span>{project.costingFile.name}</span>
                            </button>
                        </div>
                    }
                </div>
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
            {currentUser.role === UserRole.CHECKER && project.status === ProjectStatus.PENDING_REVIEW && (
                 <Card>
                    <h2 className="text-xl font-semibold text-white mb-4">Review Project</h2>
                    <p className="text-sm text-gray-400 mb-4">As a checker, you can submit this project for final approval or reject it.</p>
                    <div className="flex flex-col space-y-3">
                        <Button onClick={() => onSubmitForApproval(project.id)} variant="primary" iconName="send-outline">Submit for Approval</Button>
                        <Button onClick={() => setShowRejectModal(true)} variant="danger" iconName="close-circle-outline">Reject Project</Button>
                    </div>
                 </Card>
            )}
            {currentUser.role === UserRole.AUTHORIZER && project.status === ProjectStatus.PENDING_APPROVAL && (
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
