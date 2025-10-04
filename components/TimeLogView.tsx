import '../types';
import React, { useState } from 'react';
import type { Project, User } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Button } from './common/Button';
import { DatePicker } from './common/DatePicker';
import { useToast } from '../hooks/useToast';
import { Spinner } from './common/Spinner';
import type { TimeLogData } from '../hooks/useProjectData';

interface TimeLogViewProps {
  projects: Project[];
  currentUser: User;
  addTimeLog: (data: TimeLogData, user: User) => Promise<void>;
  onCancel: () => void;
}

const initialLogState = {
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    note: '',
};

export const TimeLogView: React.FC<TimeLogViewProps> = ({ projects, currentUser, addTimeLog, onCancel }) => {
    const [logDetails, setLogDetails] = useState(initialLogState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLogDetails(prev => ({...prev, [name]: value}));
    };
    
    const handleDateChange = (date: string) => {
        setLogDetails(prev => ({...prev, date: date}));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const hours = parseFloat(logDetails.hours);
        if (!logDetails.projectId || !logDetails.date || isNaN(hours) || hours <= 0 || !logDetails.note.trim()) {
            addToast("Please fill all fields correctly. Hours must be a positive number.", 'error');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await addTimeLog({ ...logDetails, hours }, currentUser);
            addToast(`Successfully logged ${hours} hours.`, 'success');
            setLogDetails(initialLogState);
        } catch (error: any) {
            console.error("Failed to log time:", error);
            addToast(error.message || "An error occurred while logging time.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-white">Log Your Time</h1>
                <Button onClick={onCancel} variant="secondary" iconName="arrow-back-outline">
                  Back to Dashboard
                </Button>
            </div>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
                      <select name="projectId" value={logDetails.projectId} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3" required>
                          <option value="">-- Select a Project --</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DatePicker label="Date" value={logDetails.date} onChange={handleDateChange} />
                        <Input label="Hours Worked" name="hours" type="number" step="0.1" min="0.1" value={logDetails.hours} onChange={handleChange} required />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Work Description</label>
                        <textarea name="note" value={logDetails.note} onChange={handleChange} rows={4} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3" placeholder="What did you work on?" required />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-700">
                        <Button type="submit" variant="primary" iconName="save-outline" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner /> : 'Save Log Entry'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};