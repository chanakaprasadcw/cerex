// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../../types';
import React from 'react';
import type { Project } from '../../types';
import { Button } from './Button';
import { Card } from './Card';

interface EmailNotificationModalProps {
  project: Project;
  onSend: () => void;
  onClose: () => void;
}

const ADMIN_EMAIL = 'chanakaprasadcw@gmail.com';

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({ project, onSend, onClose }) => {
  const totalCost = project.bom.reduce((acc, item) => acc + item.price * item.quantityNeeded, 0);

  const subject = `Project Approval Request: ${project.name}`;
  const body = `A new project requires your approval.

Project Details:
- Name: ${project.name}
- Cost Center: ${project.costCenter}
- Submitted By: ${project.submittedBy}
- Submission Date: ${new Date(project.submissionDate).toLocaleDateString()}

Summary:
${project.details}

Financials:
- Total Estimated Budget: $${totalCost.toFixed(2)}

Please review the project details in the ProjectFlow application.`.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity p-4">
      <Card className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
            <ion-icon name="mail-outline" className="mr-3 text-2xl text-blue-400"></ion-icon>
            Simulated Email Notification
          </h2>
          <Button onClick={onClose} variant="secondary" size="sm" iconName="close-outline" />
        </div>
        <p className="text-sm text-gray-400 mb-6">
          This is a simulation of the email that will be sent to the administrator for project approval. Clicking "Send" will finalize the project submission.
        </p>
        <div className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center">
            <span className="text-gray-400 font-semibold w-20">To:</span>
            <span className="text-gray-200">{ADMIN_EMAIL}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 font-semibold w-20">Subject:</span>
            <span className="text-white font-medium">{subject}</span>
          </div>
          <div className="border-t border-gray-700 my-4"></div>
          <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed font-sans">
            {body}
          </pre>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={onSend} variant="primary" iconName="send-outline">
            Send Notification
          </Button>
        </div>
      </Card>
    </div>
  );
};