


import React, { useState, useMemo } from 'react';
import type { Project, InventoryItem, TeamMember, BomItem, TimelineMilestone, User } from '../types';
import { ProjectStatus } from '../types';
import { generateProjectSummary } from '../services/geminiService';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { FileUpload } from './common/FileUpload';
import { StepIndicator } from './common/StepIndicator';
import { Spinner } from './common/Spinner';

interface NewProjectViewProps {
  inventory: InventoryItem[];
  teamMembers: TeamMember[];
  onSubmit: (project: Project) => void;
  onCancel: () => void;
  currentUser: User;
  projectToEdit?: Project | null;
  projectToClone?: Project | null;
}

const STEPS = [
  'Project Details',
  'Bill of Materials (BOM)',
  'Timeline & Team',
  'Review & Submit',
];

export const NewProjectView: React.FC<NewProjectViewProps> = ({ inventory, teamMembers, onSubmit, onCancel, currentUser, projectToEdit, projectToClone }) => {
  const isEditMode = !!projectToEdit;
  const isCloneMode = !!projectToClone && !isEditMode;

  const getInitialProjectState = (): Partial<Project> => {
    if (isEditMode && projectToEdit) {
      return projectToEdit;
    }
    if (isCloneMode && projectToClone) {
      // Clone the project but reset fields for a new submission
      const { id, status, submissionDate, submittedBy, ...rest } = projectToClone;
      return {
        ...rest,
        name: `Copy of ${projectToClone.name}`, // Suggest a new name
      };
    }
    return {
      name: '',
      costCenter: '',
      details: '',
      detailsFile: null,
      costingFile: null,
      bom: [],
      timeline: [],
      team: [],
      approvers: [],
    };
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [project, setProject] = useState<Partial<Project>>(getInitialProjectState());
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const updateProject = (data: Partial<Project>) => {
    setProject(prev => ({ ...prev, ...data }));
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setAiSummary('');
    const summary = await generateProjectSummary(project);
    setAiSummary(summary);
    setIsGenerating(false);
  };
  
  const handleSubmit = () => {
    const finalProject: Project = isEditMode
    ? ({
        ...projectToEdit,
        ...project,
      } as Project)
    : ({
        id: `proj-${Date.now()}`,
        status: ProjectStatus.PENDING_REVIEW,
        submittedBy: currentUser.username,
        submissionDate: new Date().toISOString(),
        ...project,
        details: project.details || aiSummary,
      } as Project);
    
    onSubmit(finalProject);
  };


  const totalCost = useMemo(() => 
    project.bom?.reduce((acc, item) => acc + item.quantityNeeded * item.price, 0) ?? 0,
    [project.bom]
  );
  
  const title = isEditMode ? 'Edit Project' : isCloneMode ? 'Clone Project' : 'Create New Project';
  const description = isEditMode
    ? 'Update the project details below.'
    : isCloneMode
    ? `Creating a new project based on "${projectToClone?.name}". Adjust details as needed.`
    : 'Follow the steps below to define and submit your project for approval.';


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{title}</h1>
      <p className="text-gray-400 mb-8">{description}</p>
      
      <StepIndicator steps={STEPS} currentStep={currentStep} />
      
      <Card className="mt-8">
        <div className="p-6">
            {currentStep === 1 && <ProjectDetailsStep project={project} updateProject={updateProject} />}
            {currentStep === 2 && <BomStep project={project} updateProject={updateProject} inventory={inventory} />}
            {currentStep === 3 && <TimelineTeamStep project={project} updateProject={updateProject} teamMembers={teamMembers} />}
            {currentStep === 4 && <ReviewStep project={project} totalCost={totalCost} onGenerateSummary={handleGenerateSummary} isGenerating={isGenerating} aiSummary={aiSummary} />}

            <div className="mt-8 flex justify-between items-center border-t border-gray-700 pt-6">
                <div>
                    {currentStep > 1 && <Button onClick={handleBack} variant="secondary">Back</Button>}
                </div>
                 <div className="space-x-4">
                     <Button onClick={onCancel} variant="danger-outline">Cancel</Button>
                    {currentStep < STEPS.length && <Button onClick={handleNext} variant="primary">Next</Button>}
                    {currentStep === STEPS.length && (
                        <Button onClick={handleSubmit} variant="primary" iconName={isEditMode ? "save-outline" : "send-outline"}>
                            {isEditMode ? 'Update Project' : 'Submit for Review'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
};

// Sub-components for each step
const ProjectDetailsStep: React.FC<{ project: Partial<Project>, updateProject: (data: Partial<Project>) => void }> = ({ project, updateProject }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-white">Step 1: Project Details</h2>
    <Input label="Project Name" value={project.name} onChange={e => updateProject({ name: e.target.value })} required />
    <Input label="Project Name and Cost Center" value={project.costCenter} onChange={e => updateProject({ costCenter: e.target.value })} required />
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Project Details / Description</label>
        <textarea
            rows={5}
            className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3"
            value={project.details}
            onChange={e => updateProject({ details: e.target.value })}
        ></textarea>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUpload label="Project Details (PDF/Word)" onFileSelect={file => updateProject({ detailsFile: file })} />
        <FileUpload label="Project Costing (Excel/CSV)" onFileSelect={file => updateProject({ costingFile: file })} />
    </div>
  </div>
);

const BomStep: React.FC<{ project: Partial<Project>, updateProject: (data: Partial<Project>) => void, inventory: InventoryItem[] }> = ({ project, updateProject, inventory }) => {
    const [newItem, setNewItem] = useState({ name: '', quantityNeeded: 1, price: 0, source: 'Purchase' as 'Purchase' | 'Inventory', inventoryItemId: '' });

    const handleAddItem = () => {
        if (!newItem.name || newItem.quantityNeeded <= 0 || newItem.price < 0) {
            if (newItem.source === 'Inventory' && !newItem.inventoryItemId) return;
        }
        
        let itemToAdd: BomItem;
        if (newItem.source === 'Inventory' && newItem.inventoryItemId) {
            const invItem = inventory.find(i => i.id === newItem.inventoryItemId);
            if (!invItem) return;
            itemToAdd = {
                inventoryItemId: invItem.id,
                name: invItem.name,
                quantityNeeded: Number(newItem.quantityNeeded),
                price: invItem.price,
                source: 'Inventory',
            };
        } else {
             itemToAdd = {
                inventoryItemId: `new-${Date.now()}`,
                name: newItem.name,
                quantityNeeded: Number(newItem.quantityNeeded),
                price: Number(newItem.price),
                source: 'Purchase',
            };
        }

        updateProject({ bom: [...(project.bom || []), itemToAdd] });
        setNewItem({ name: '', quantityNeeded: 1, price: 0, source: 'Purchase', inventoryItemId: '' });
    };

    const handleRemoveItem = (index: number) => {
        const newBom = [...(project.bom || [])];
        newBom.splice(index, 1);
        updateProject({ bom: newBom });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Step 2: Bill of Materials (BOM)</h2>
            
            {/* Form to add new item */}
            <div className="p-4 border border-gray-700 rounded-lg space-y-4">
                <h3 className="font-medium text-white">Add BOM Item</h3>
                <div className="flex space-x-2">
                    <button onClick={() => setNewItem({...newItem, source: 'Inventory'})} className={`px-3 py-2 text-sm rounded-md ${newItem.source === 'Inventory' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>From Inventory</button>
                    <button onClick={() => setNewItem({...newItem, source: 'Purchase'})} className={`px-3 py-2 text-sm rounded-md ${newItem.source === 'Purchase' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>New Purchase</button>
                </div>

                {newItem.source === 'Inventory' ? (
                     <select 
                        className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3"
                        onChange={e => setNewItem({...newItem, inventoryItemId: e.target.value})}
                        value={newItem.inventoryItemId}
                    >
                        <option value="">Select Inventory Item</option>
                        {inventory.map(item => <option key={item.id} value={item.id}>{item.name} (In stock: {item.quantity})</option>)}
                     </select>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        <Input label="Price" type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                    </div>
                )}
                 <Input label="Quantity Needed" type="number" value={newItem.quantityNeeded} onChange={e => setNewItem({...newItem, quantityNeeded: Number(e.target.value)})} />
                 <Button onClick={handleAddItem} variant="secondary">Add Item</Button>
            </div>

            {/* List of current BOM items */}
             <div>
                <h3 className="font-medium text-white mb-2">Current BOM</h3>
                 <ul className="space-y-2">
                    {project.bom?.map((item, index) => (
                        <li key={index} className="flex justify-between items-center bg-gray-800 p-3 rounded-md">
                            <div>
                                <p className="font-semibold text-white">{item.name}</p>
                                <p className="text-sm text-gray-400">
                                    {item.quantityNeeded} units @ ${item.price.toFixed(2)} each | 
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${item.source === 'Inventory' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{item.source}</span>
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="font-bold text-white">${(item.quantityNeeded * item.price).toFixed(2)}</span>
                                <Button onClick={() => handleRemoveItem(index)} variant="danger-outline" size="sm" iconName="trash-outline" />
                            </div>
                        </li>
                    ))}
                 </ul>
                 {project.bom?.length === 0 && <p className="text-gray-500 text-center py-4">No items added to BOM yet.</p>}
            </div>
        </div>
    );
};


const TimelineTeamStep: React.FC<{ project: Partial<Project>, updateProject: (data: Partial<Project>) => void, teamMembers: TeamMember[] }> = ({ project, updateProject, teamMembers }) => {
    const [milestone, setMilestone] = useState({ name: '', startDate: '', endDate: '' });
    const [selectedTeam, setSelectedTeam] = useState<string[]>(project.team?.map(t => t.id) || []);
    const [selectedApprovers, setSelectedApprovers] = useState<string[]>(project.approvers?.map(a => a.id) || []);

    const addMilestone = () => {
        if (!milestone.name || !milestone.startDate || !milestone.endDate) return;
        const newMilestone: TimelineMilestone = { ...milestone, id: `ms-${Date.now()}`, completed: false };
        updateProject({ timeline: [...(project.timeline || []), newMilestone] });
        setMilestone({ name: '', startDate: '', endDate: '' });
    };

    const handleTeamCheckboxChange = (memberId: string) => {
        const newSelectedTeam = selectedTeam.includes(memberId)
            ? selectedTeam.filter(id => id !== memberId)
            : [...selectedTeam, memberId];
        
        setSelectedTeam(newSelectedTeam);
        updateProject({ team: teamMembers.filter(tm => newSelectedTeam.includes(tm.id)) });
    };

    const handleApproverCheckboxChange = (memberId: string) => {
        const newSelectedApprovers = selectedApprovers.includes(memberId)
            ? selectedApprovers.filter(id => id !== memberId)
            : [...selectedApprovers, memberId];

        setSelectedApprovers(newSelectedApprovers);
        updateProject({ approvers: teamMembers.filter(tm => newSelectedApprovers.includes(tm.id)) });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Step 3: Timeline & Team Allocation</h2>
            {/* Timeline */}
            <div>
                 <h3 className="font-medium text-white mb-2">Project Timeline</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 p-4 border border-gray-700 rounded-lg">
                    <Input label="Milestone Name" value={milestone.name} onChange={e => setMilestone({ ...milestone, name: e.target.value })} />
                    <Input label="Start Date" type="date" value={milestone.startDate} onChange={e => setMilestone({ ...milestone, startDate: e.target.value })} />
                    <Input label="End Date" type="date" value={milestone.endDate} onChange={e => setMilestone({ ...milestone, endDate: e.target.value })} />
                    <div className="md:col-span-3">
                        <Button onClick={addMilestone} className="w-full md:w-auto">Add Milestone</Button>
                    </div>
                 </div>
                 <ul className="mt-4 space-y-2">
                     {project.timeline?.map((ms, i) => (
                         <li key={i} className="flex justify-between items-center bg-gray-800 p-3 rounded-md">
                             <p className="text-white">{ms.name}</p>
                             <p className="text-gray-400 text-sm">{new Date(ms.startDate).toLocaleDateString()} - {new Date(ms.endDate).toLocaleDateString()}</p>
                         </li>
                     ))}
                 </ul>
            </div>
            {/* Team Allocation */}
            <div>
                <h3 className="font-medium text-white mb-2">Team Allocation</h3>
                <p className="text-sm text-gray-400 mb-2">Select team members for this project.</p>
                <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-gray-900 border border-gray-700 rounded-md">
                    {teamMembers.map(tm => (
                        <label key={tm.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800/50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={selectedTeam.includes(tm.id)}
                                onChange={() => handleTeamCheckboxChange(tm.id)}
                                className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                            />
                            <div>
                                <span className="font-medium text-white">{tm.name}</span>
                                <span className="text-sm text-gray-400 ml-2">{`— ${tm.role}`}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
            {/* Approval Authority */}
            <div>
                <h3 className="font-medium text-white mb-2">Approval Authority</h3>
                 <p className="text-sm text-gray-400 mb-2">Select who needs to approve this project.</p>
                <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-gray-900 border border-gray-700 rounded-md">
                    {teamMembers.map(tm => (
                        <label key={tm.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800/50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={selectedApprovers.includes(tm.id)}
                                onChange={() => handleApproverCheckboxChange(tm.id)}
                                className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                            />
                            <div>
                                <span className="font-medium text-white">{tm.name}</span>
                                <span className="text-sm text-gray-400 ml-2">{`— ${tm.role}`}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};


const ReviewStep: React.FC<{ project: Partial<Project>, totalCost: number, onGenerateSummary: () => void, isGenerating: boolean, aiSummary: string }> = ({ project, totalCost, onGenerateSummary, isGenerating, aiSummary }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-white">Step 4: Review & Submit</h2>
    <div className="p-4 bg-gray-800 rounded-lg space-y-4">
        <div className="flex justify-between"><span className="text-gray-400">Project Name:</span> <span className="font-semibold text-white">{project.name}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Cost Center:</span> <span className="font-semibold text-white">{project.costCenter}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Total BOM Items:</span> <span className="font-semibold text-white">{project.bom?.length}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Team Members:</span> <span className="font-semibold text-white">{project.team?.length}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Approvers:</span> <span className="font-semibold text-white">{project.approvers?.length}</span></div>
        <div className="flex justify-between text-lg"><span className="text-gray-400">Estimated Total Cost:</span> <span className="font-bold text-blue-400">${totalCost.toFixed(2)}</span></div>
    </div>
    
    <div>
        <h3 className="font-medium text-white mb-2">AI-Generated Summary</h3>
        <p className="text-sm text-gray-400 mb-4">You can use Gemini to generate a professional summary for your approval email. This will be used as the project details if you haven't provided one.</p>
        <Button onClick={onGenerateSummary} disabled={isGenerating}>
            {isGenerating ? <Spinner /> : 'Generate Summary with AI'}
        </Button>
        {aiSummary && (
            <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-md">
                <p className="text-gray-300 whitespace-pre-wrap">{aiSummary}</p>
            </div>
        )}
    </div>

    <div className="text-center text-gray-400 pt-4">
        <p>Please review all the details carefully. Once submitted, the project will be sent to the selected approvers.</p>
    </div>
  </div>
);
