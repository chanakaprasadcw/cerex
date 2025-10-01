

import React from 'react';
import type { Project } from '../types';
import { ProjectStatus } from '../types';
import { Button } from './common/Button';

interface ProjectListProps {
  projects: Project[];
  onViewProject: (projectId: string) => void;
  onEditProject: (projectId: string) => void;
  onCloneProject: (projectId: string) => void;
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

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onViewProject, onEditProject, onCloneProject }) => {
  if (projects.length === 0) {
    return <div className="text-center py-10 text-gray-500">No projects found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
          <tr>
            <th scope="col" className="px-6 py-3">Project Name</th>
            <th scope="col" className="px-6 py-3">Cost Center</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Submitted</th>
            <th scope="col" className="px-6 py-3">Total Cost</th>
            <th scope="col" className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
              <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{project.name}</th>
              <td className="px-6 py-4">{project.costCenter}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(project.status)}`}>
                  {project.status}
                </span>
              </td>
              <td className="px-6 py-4">{new Date(project.submissionDate).toLocaleDateString()}</td>
              <td className="px-6 py-4 font-mono">${project.bom.reduce((acc, item) => acc + item.price * item.quantityNeeded, 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-right space-x-2">
                <Button onClick={() => onCloneProject(project.id)} variant="secondary" size="sm">
                  Clone
                </Button>
                <Button onClick={() => onEditProject(project.id)} variant="secondary" size="sm">
                  Edit
                </Button>
                <Button onClick={() => onViewProject(project.id)} variant="secondary" size="sm">
                  View Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
