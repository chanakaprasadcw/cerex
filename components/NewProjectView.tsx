// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../types';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Project, InventoryItem, TeamMember, BomItem, TimelineMilestone, User, StoredFile } from '../types';
import { ProjectStatus, COST_CENTERS } from '../types';
import { generateProjectSummary } from '../services/geminiService';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { FileUpload } from './common/FileUpload';
import { DatePicker } from './common/DatePicker';
import { StepIndicator } from './common/StepIndicator';
import { Spinner } from './common/Spinner';
import { useToast } from '../hooks/useToast';

interface NewProjectViewProps {
  inventory: InventoryItem[];
  teamMembers: TeamMember[];
  onSubmit: (project: Project) => Promise<void>;
  onCancel: () => void;
  currentUser: User;
  projectToEdit?: Project | null;
  projectToClone?: Project | null;
  submissionError: string | null;
}

const STEPS = [
  'Project Details',
  'Bill of Materials (BOM)',
  'Timeline & Team',
  'Review & Submit',
];

// FIX: This function performs a deep sanitization to create a clean, plain JS object,
// stripping all of Firestore's internal properties and methods. This is crucial for
// preventing "circular structure" errors when editing or cloning.
const sanitizeProject = (p: Project | null): Partial<Project> => {
    if (!p) return {};
    
    // Explicitly create a new plain object to avoid any prototype chain issues or non-enumerable properties from Firestore objects.
    const cleanProject: Partial<Project> = {
        id: p.id,
        name: p.name,
        costCenter: p.costCenter,
        details: p.details,
        status: p.status,
        submittedBy: p.submittedBy,
        submissionDate: p.submissionDate,
        checkedBy: p.checkedBy,
        approvedBy: p.approvedBy,
        projectDocument: p.projectDocument ? { ...p.projectDocument } : null,
        bomDocument: p.bomDocument ? { ...p.bomDocument } : null,
        bom: p.bom ? p.bom.map(item => ({
            inventoryItemId: item.inventoryItemId,
            name: item.name,
            quantityNeeded: item.quantityNeeded,
            price: item.price,
            source: item.source,
        })) : [],
        timeline: p.timeline ? p.timeline.map(item => ({
            id: item.id,
            name: item.name,
            startDate: item.startDate,
            endDate: item.endDate,
            completed: item.completed,
        })) : [],
        team: p.team ? p.team.map(item => ({
            id: item.id,
            name: item.name,
            email: item.email,
            role: item.role,
        })) : [],
        approvers: p.approvers ? p.approvers.map(item => ({
            id: item.id,
            name: item.name,
            email: item.email,
            role: item.role,
        })) : [],
    };

    return cleanProject;
};


export const NewProjectView: React.FC<NewProjectViewProps> = ({ inventory, teamMembers, onSubmit, onCancel, currentUser, projectToEdit, projectToClone, submissionError }) => {
  const isEditMode = !!projectToEdit;
  const isCloneMode = !!projectToClone && !isEditMode;

  const getInitialProjectState = (): Partial<Project> => {
    const sourceProject = isEditMode ? projectToEdit : projectToClone;
    const sanitized = sanitizeProject(sourceProject);

    if (isEditMode) {
      return sanitized;
    }
    if (isCloneMode) {
        // Clone the project but reset fields for a new submission
        const { id, status, submissionDate, submittedBy, checkedBy, approvedBy, ...rest } = sanitized;
        return {
          ...rest,
          name: `Copy of ${sourceProject?.name || ''}`, // Suggest a new name
        };
    }
    return {
      name: '',
      costCenter: '',
      details: '',
      projectDocument: null,
      bomDocument: null,
      bom: [],
      timeline: [],
      team: [],
      approvers: [],
    };
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [project, setProject] = useState<Partial<Project>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use useEffect to initialize state to prevent issues with stale closures
  useEffect(() => {
    setProject(getInitialProjectState());
  }, [projectToEdit, projectToClone]);


  const validateStep = (step: number): boolean => {
    setValidationError(null); // Clear previous errors
    switch (step) {
      case 1:
        if (!project.name?.trim() || !project.costCenter?.trim() || !project.details?.trim()) {
          setValidationError('Project Name, Cost Center, and Details are required fields.');
          return false;
        }
        if (!project.projectDocument || !project.bomDocument) {
          setValidationError('Both a Project Document and a BOM Document must be uploaded.');
          return false;
        }
        break;
      case 2:
        if (!project.bom || project.bom.length === 0) {
          setValidationError('The Bill of Materials (BOM) must contain at least one item.');
          return false;
        }
        break;
      case 3:
        if (!project.timeline || project.timeline.length === 0) {
          setValidationError('Please add at least one timeline milestone.');
          return false;
        }
        if (!project.team || project.team.length === 0) {
          setValidationError('Please assign at least one team member.');
          return false;
        }
        if (!project.approvers || project.approvers.length === 0) {
          setValidationError('Please select at least one approver.');
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setValidationError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

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
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const finalProject = {
        ...project,
        id: isEditMode ? project.id : `proj-${Date.now()}`,
        status: isEditMode ? project.status : ProjectStatus.PENDING_REVIEW,
        submittedBy: isEditMode ? project.submittedBy : currentUser.username,
        submissionDate: isEditMode ? project.submissionDate : new Date().toISOString(),
        details: project.details || aiSummary,
      } as Project;
    
    try {
      await onSubmit(finalProject);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{title}</h1>
      <p className="text-gray-400 mb-8">{description}</p>
      
      <div className="my-12">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>
      
      <Card>
        <div className="p-6">
            {validationError && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center" role="alert">
                {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                <ion-icon name="alert-circle-outline" className="text-xl mr-3"></ion-icon>
                <span>{validationError}</span>
              </div>
            )}
             {submissionError && !isEditMode && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center" role="alert">
                {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                <ion-icon name="close-circle-outline" className="text-xl mr-3"></ion-icon>
                <span>{submissionError}</span>
              </div>
            )}
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
                        <Button onClick={handleSubmit} variant="primary" iconName={isEditMode ? "save-outline" : "send-outline"} disabled={isSubmitting}>
                           {isSubmitting ? <Spinner /> : isEditMode ? 'Update Project' : 'Submit for Review'}
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
const ProjectDetailsStep: React.FC<{ project: Partial<Project>, updateProject: (data: Partial<Project>) => void }> = ({ project, updateProject }) => {
    
    const handleFileSelect = (file: File | null, field: 'projectDocument' | 'bomDocument') => {
        if (!file) {
            updateProject({ [field]: null });
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                const data = (e.target.result as string).split(',')[1]; // Get base64 part
                updateProject({
                    [field]: {
                        name: file.name,
                        type: file.type,
                        data: data,
                    }
                });
            }
        };
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            updateProject({ [field]: null });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-semibold text-white">Step 1: Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Project Name" value={project.name} onChange={e => updateProject({ name: e.target.value })} required />
                <div>
                    <label htmlFor="costCenter" className="block text-sm font-medium text-gray-300 mb-2">Cost Center</label>
                    <select
                        id="costCenter"
                        name="costCenter"
                        value={project.costCenter || ''}
                        onChange={e => updateProject({ costCenter: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3"
                        required
                    >
                        <option value="" disabled>-- Select a Cost Center --</option>
                        {Object.keys(COST_CENTERS).map(cc => <option key={cc} value={cc}>{cc}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Details / Description</label>
                <textarea
                    rows={5}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3"
                    value={project.details}
                    onChange={e => updateProject({ details: e.target.value })}
                    required
                ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload label="Project Document (Required)" onFileSelect={file => handleFileSelect(file, 'projectDocument')} />
                <FileUpload label="BOM Document (Required)" onFileSelect={file => handleFileSelect(file, 'bomDocument')} />
            </div>
        </div>
    );
};

const BomStep: React.FC<{ project: Partial<Project>, updateProject: (data: Partial<Project>) => void, inventory: InventoryItem[] }> = ({ project, updateProject, inventory }) => {
    const [newItem, setNewItem] = useState({ name: '', quantityNeeded: 1, price: 0, source: 'Purchase' as 'Purchase' | 'Inventory', inventoryItemId: '' });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingItemData, setEditingItemData] = useState<BomItem | null>(null);
    const [splitMessage, setSplitMessage] = useState<string | null>(null);
    const { addToast } = useToast();

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleAddItem = () => {
        if (newItem.quantityNeeded <= 0) return;
        setSplitMessage(null);

        let itemsToAdd: BomItem[] = [];

        if (newItem.source === 'Inventory' && newItem.inventoryItemId) {
            const invItem = inventory.find(i => i.id === newItem.inventoryItemId);
            if (!invItem) return;

            const requestedQuantity = Number(newItem.quantityNeeded);
            const availableQuantity = invItem.quantity;

            if (requestedQuantity > availableQuantity) {
                const shortfall = requestedQuantity - availableQuantity;

                if (availableQuantity > 0) {
                    itemsToAdd.push({
                        inventoryItemId: invItem.id,
                        name: invItem.name,
                        quantityNeeded: availableQuantity,
                        price: invItem.price,
                        source: 'Inventory',
                    });
                }
                
                itemsToAdd.push({
                    inventoryItemId: `purchase-${invItem.name.replace(/\s+/g, '-')}-${Date.now()}`,
                    name: invItem.name,
                    quantityNeeded: shortfall,
                    price: invItem.price,
                    source: 'Purchase',
                });
                
                setSplitMessage(`Only ${availableQuantity} units of "${invItem.name}" are in stock. The remaining ${shortfall} units have been added as a new item to be purchased.`);
            } else {
                itemsToAdd.push({
                    inventoryItemId: invItem.id,
                    name: invItem.name,
                    quantityNeeded: requestedQuantity,
                    price: invItem.price,
                    source: 'Inventory',
                });
            }
        } else {
            if (!newItem.name || newItem.price <= 0) {
                 addToast("Item name and a price greater than 0 are required for purchased items.", 'error');
                 return;
            }
            itemsToAdd.push({
                inventoryItemId: `purchase-${newItem.name.replace(/\s+/g, '-')}-${Date.now()}`,
                name: newItem.name,
                quantityNeeded: Number(newItem.quantityNeeded),
                price: Number(newItem.price),
                source: 'Purchase',
            });
        }
        
        const currentBom = project.bom || [];
        updateProject({ bom: [...currentBom, ...itemsToAdd] });
        setNewItem({ name: '', quantityNeeded: 1, price: 0, source: 'Purchase', inventoryItemId: '' });
    };
    
    const handleStartEdit = (index: number) => {
        setEditingIndex(index);
        setEditingItemData({ ...(project.bom?.[index] ?? {}) } as BomItem);
    };

    const handleUpdateItem = () => {
        if (editingIndex === null || !editingItemData) return;
        
        const updatedBom = [...(project.bom ?? [])];
        updatedBom[editingIndex] = editingItemData;
        updateProject({ bom: updatedBom });

        setEditingIndex(null);
        setEditingItemData(null);
    };
    
     const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditingItemData(null);
    };

    const handleDeleteItem = (index: number) => {
        const updatedBom = project.bom?.filter((_, i) => i !== index) ?? [];
        updateProject({ bom: updatedBom });
    };

    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const source = e.target.value as 'Purchase' | 'Inventory';
        setNewItem(prev => ({ ...prev, source, name: '', price: 0, inventoryItemId: '' }));
    };

    const handleInventoryItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const invItem = inventory.find(i => i.id === selectedId);
        if (invItem) {
            setNewItem(prev => ({
                ...prev,
                inventoryItemId: selectedId,
                name: invItem.name,
                price: invItem.price,
            }));
        }
    };
    
    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        let bom = [...(project.bom ?? [])];
        const draggedItemContent = bom.splice(dragItem.current, 1)[0];
        bom.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        updateProject({ bom });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Step 2: Bill of Materials (BOM)</h2>
            
            {splitMessage && (
              <div className="bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 px-4 py-3 rounded-lg flex items-center" role="alert">
                {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                <ion-icon name="information-circle-outline" className="text-xl mr-3"></ion-icon>
                <span>{splitMessage}</span>
              </div>
            )}

            {/* Add Item Form */}
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="font-medium text-white mb-4">Add New Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
                        <select value={newItem.source} onChange={handleSourceChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                            <option value="Purchase">Purchase</option>
                            <option value="Inventory">From Inventory</option>
                        </select>
                    </div>
                    
                    {newItem.source === 'Inventory' ? (
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Select Inventory Item</label>
                            <select value={newItem.inventoryItemId} onChange={handleInventoryItemSelect} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                                <option value="">-- Choose an item --</option>
                                {inventory.map(item => <option key={item.id} value={item.id}>{item.name} (In stock: {item.quantity})</option>)}
                            </select>
                        </div>
                    ) : (
                         <>
                            <Input label="Item Name" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
                            <Input label="Price" type="number" step="0.01" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: Number(e.target.value) }))} />
                         </>
                    )}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-4">
                    <Input label="Quantity Needed" type="number" min="1" value={newItem.quantityNeeded} onChange={e => setNewItem(p => ({ ...p, quantityNeeded: Number(e.target.value) }))} />
                    <div className="md:col-span-2">
                        <Button onClick={handleAddItem} iconName="add-circle-outline" className="w-full justify-center">Add to BOM</Button>
                    </div>
                </div>
            </div>

            {/* BOM Table */}
            <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="bg-gray-700/50 text-xs uppercase text-gray-400">
                        <tr>
                            <th className="px-6 py-3 w-12"></th>
                            <th className="px-6 py-3">Item Name</th>
                            <th className="px-6 py-3">Source</th>
                            <th className="px-6 py-3">Quantity</th>
                            <th className="px-6 py-3">Unit Price</th>
                            <th className="px-6 py-3">Total Price</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {project.bom?.map((item, index) => (
                            editingIndex === index ? (
                                // Editing Row
                                <tr key={item.inventoryItemId} className="bg-gray-700">
                                    <td className="px-6 py-4"></td>
                                    <td className="px-6 py-4">
                                        <Input value={editingItemData?.name} onChange={e => setEditingItemData(p => ({...p!, name: e.target.value}))} disabled={item.source === 'Inventory'} />
                                    </td>
                                    <td className="px-6 py-4">{item.source}</td>
                                    <td className="px-6 py-4">
                                        <Input type="number" value={editingItemData?.quantityNeeded} onChange={e => setEditingItemData(p => ({...p!, quantityNeeded: Number(e.target.value)}))} />
                                    </td>
                                     <td className="px-6 py-4">
                                        <Input type="number" step="0.01" value={editingItemData?.price} onChange={e => setEditingItemData(p => ({...p!, price: Number(e.target.value)}))} disabled={item.source === 'Inventory'} />
                                    </td>
                                    <td className="px-6 py-4">${((editingItemData?.quantityNeeded || 0) * (editingItemData?.price || 0)).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button onClick={handleUpdateItem} size="sm" iconName="save-outline" />
                                        <Button onClick={handleCancelEdit} variant="secondary" size="sm" iconName="close-outline" />
                                    </td>
                                </tr>
                            ) : (
                                // Display Row
                                <tr 
                                    key={item.inventoryItemId} 
                                    className="bg-gray-800 border-b border-gray-700 last:border-b-0 hover:bg-gray-750"
                                    draggable
                                    onDragStart={() => dragItem.current = index}
                                    onDragEnter={() => dragOverItem.current = index}
                                    onDragEnd={handleDragSort}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <td className="px-6 py-4 text-gray-500 cursor-move text-center">
                                        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                                        {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                                        <ion-icon name="menu-outline" className=""></ion-icon>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${item.source === 'Inventory' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{item.source}</span>
                                    </td>
                                    <td className="px-6 py-4">{item.quantityNeeded}</td>
                                    <td className="px-6 py-4">${item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4">${(item.quantityNeeded * item.price).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button onClick={() => handleStartEdit(index)} variant="secondary" size="sm" iconName="pencil-outline" />
                                        <Button onClick={() => handleDeleteItem(index)} variant="danger-outline" size="sm" iconName="trash-outline" />
                                    </td>
                                </tr>
                            )
                        ))}
                         {(!project.bom || project.bom.length === 0) && (
                            <tr><td colSpan={7} className="text-center py-10 text-gray-500">No items in BOM. Add items using the form above.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// FIX: Created missing 'TimelineTeamStep' component to resolve 'Cannot find name' error.
const TimelineTeamStep: React.FC<{
  project: Partial<Project>;
  updateProject: (data: Partial<Project>) => void;
  teamMembers: TeamMember[];
}> = ({ project, updateProject, teamMembers }) => {
  const [newMilestone, setNewMilestone] = useState({ name: '', startDate: '', endDate: '' });

  const addMilestone = () => {
    if (!newMilestone.name || !newMilestone.startDate || !newMilestone.endDate) return;
    const milestone: TimelineMilestone = {
      ...newMilestone,
      id: `ms-${Date.now()}`,
      completed: false
    };
    updateProject({ timeline: [...(project.timeline || []), milestone] });
    setNewMilestone({ name: '', startDate: '', endDate: '' });
  };
  
  const removeMilestone = (id: string) => {
    updateProject({ timeline: project.timeline?.filter(m => m.id !== id) });
  };
  
  const handleTeamSelect = (member: TeamMember) => {
    const isSelected = project.team?.some(t => t.id === member.id);
    const newTeam = isSelected
      ? project.team?.filter(t => t.id !== member.id)
      : [...(project.team || []), member];
    updateProject({ team: newTeam });
  };

  const handleApproverSelect = (member: TeamMember) => {
    const isSelected = project.approvers?.some(a => a.id === member.id);
    const newApprovers = isSelected
      ? project.approvers?.filter(a => a.id !== member.id)
      : [...(project.approvers || []), member];
    updateProject({ approvers: newApprovers });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Step 3: Timeline & Team</h2>
      {/* Timeline Section */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Project Timeline</h3>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4 items-end">
          <Input label="Milestone Name" value={newMilestone.name} onChange={e => setNewMilestone(p => ({ ...p, name: e.target.value }))} />
          <DatePicker label="Start Date" value={newMilestone.startDate} onChange={date => setNewMilestone(p => ({...p, startDate: date}))} />
          <DatePicker label="End Date" value={newMilestone.endDate} onChange={date => setNewMilestone(p => ({...p, endDate: date}))} min={newMilestone.startDate} />
          <Button onClick={addMilestone} iconName="add-circle-outline">Add</Button>
        </div>
        <ul className="mt-4 space-y-2">
          {project.timeline?.map(m => (
            <li key={m.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-md">
              <span className="text-white">{m.name}</span>
              <span className="text-sm text-gray-400">{new Date(m.startDate+'T00:00:00').toLocaleDateString()} - {new Date(m.endDate+'T00:00:00').toLocaleDateString()}</span>
              <Button onClick={() => removeMilestone(m.id)} variant="danger-outline" size="sm" iconName="close-outline" />
            </li>
          ))}
        </ul>
      </div>

      {/* Team Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <h3 className="text-lg font-medium text-white mb-4">Assign Team Members</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {teamMembers.map(member => (
                    <label key={member.id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${project.team?.some(t => t.id === member.id) ? 'bg-blue-600/30' : 'bg-gray-800 hover:bg-gray-700/50'}`}>
                        <input type="checkbox" className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-blue-600 focus:ring-blue-500" checked={project.team?.some(t => t.id === member.id)} onChange={() => handleTeamSelect(member)} />
                        <span className="ml-3 text-white">{member.name}</span>
                        <span className="ml-auto text-sm text-gray-400">{member.role}</span>
                    </label>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-lg font-medium text-white mb-4">Select Approvers</h3>
             <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {teamMembers.map(member => (
                    <label key={member.id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${project.approvers?.some(a => a.id === member.id) ? 'bg-yellow-600/30' : 'bg-gray-800 hover:bg-gray-700/50'}`}>
                        <input type="checkbox" className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-yellow-600 focus:ring-yellow-500" checked={project.approvers?.some(a => a.id === member.id)} onChange={() => handleApproverSelect(member)} />
                        <span className="ml-3 text-white">{member.name}</span>
                         <span className="ml-auto text-sm text-gray-400">{member.role}</span>
                    </label>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};


// FIX: Created missing 'ReviewStep' component to resolve 'Cannot find name' error.
const ReviewStep: React.FC<{
  project: Partial<Project>;
  totalCost: number;
  onGenerateSummary: () => void;
  isGenerating: boolean;
  aiSummary: string;
}> = ({ project, totalCost, onGenerateSummary, isGenerating, aiSummary }) => (
  <div className="space-y-8">
    <h2 className="text-xl font-semibold text-white">Step 4: Review & Submit</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Project Data Summary */}
      <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2">Project Summary</h3>
        <p><strong className="text-gray-400">Name:</strong> <span className="text-white">{project.name}</span></p>
        <p><strong className="text-gray-400">Cost Center:</strong> <span className="text-white">{project.costCenter}</span></p>
        <p><strong className="text-gray-400">Items in BOM:</strong> <span className="text-white">{project.bom?.length}</span></p>
        <p><strong className="text-gray-400">Timeline Milestones:</strong> <span className="text-white">{project.timeline?.length}</span></p>
        <p><strong className="text-gray-400">Team Members:</strong> <span className="text-white">{project.team?.length}</span></p>
        <p className="text-2xl font-bold text-blue-400 pt-2 border-t border-gray-700">Total Cost: ${totalCost.toFixed(2)}</p>
      </div>
      
      {/* AI Summary Section */}
      <div>
        <Button onClick={onGenerateSummary} disabled={isGenerating} iconName="sparkles-outline" className="mb-4">
          {isGenerating ? 'Generating...' : 'Generate AI Summary for Email'}
        </Button>
        <textarea
          rows={10}
          className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm text-white p-3"
          value={isGenerating ? 'Generating summary, please wait...' : aiSummary}
          placeholder="AI-generated summary will appear here. You can edit it before submission."
          readOnly={isGenerating}
        ></textarea>
      </div>
    </div>
  </div>
);