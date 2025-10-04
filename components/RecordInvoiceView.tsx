import '../types';
import React, { useState } from 'react';
import type { Project, User, CostCenterType } from '../types';
import { COST_CENTERS } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Button } from './common/Button';
import { FileUpload } from './common/FileUpload';
import { DatePicker } from './common/DatePicker';
import { useToast } from '../hooks/useToast';
import type { InvoiceSubmissionData } from '../hooks/useProjectData';
import { Spinner } from './common/Spinner';

interface RecordInvoiceViewProps {
  submitInvoice: (payload: InvoiceSubmissionData, user: User) => Promise<void>;
  projects: Project[];
  currentUser: User;
  onCancel: () => void;
}

const initialInvoiceState = {
    vendorName: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    totalAmount: '',
    costCenterType: Object.keys(COST_CENTERS)[0] as CostCenterType,
    projectId: '',
};

export const RecordInvoiceView: React.FC<RecordInvoiceViewProps> = ({ submitInvoice, projects, currentUser, onCancel }) => {
  const [invoiceDetails, setInvoiceDetails] = useState(initialInvoiceState);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());
  const { addToast } = useToast();

  const handleInvoiceDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoiceDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInvoiceDateChange = (date: string) => {
    setInvoiceDetails(prev => ({...prev, invoiceDate: date}));
  };

  const handleClearForm = () => {
    setInvoiceDetails(initialInvoiceState);
    setInvoiceFile(null);
    setIsSubmitting(false);
    setFormKey(Date.now()); // Resets the FileUpload component
  };
  
  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseFloat(invoiceDetails.totalAmount);
    if (!invoiceDetails.vendorName || !invoiceDetails.invoiceNumber || !invoiceFile || isNaN(totalAmount) || totalAmount <= 0) {
        addToast("Please fill all required fields and upload the invoice file.", 'error');
        return;
    }
    if (invoiceDetails.costCenterType === 'Customer Project Costing' && !invoiceDetails.projectId) {
        addToast("Please select a project for this cost center.", 'error');
        return;
    }

    setIsSubmitting(true);
    try {
        const payload: InvoiceSubmissionData = {
            ...invoiceDetails,
            totalAmount,
            invoiceFile,
        };
        await submitInvoice(payload, currentUser);
        addToast("Invoice submitted successfully!", 'success');
        handleClearForm();
    } catch (error: any) {
        console.error("Failed to submit invoice:", error);
        addToast(error.message || "An error occurred. Please try again.", 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Record New Invoice</h1>
        <Button onClick={onCancel} variant="secondary" iconName="arrow-back-outline">
          Back to Dashboard
        </Button>
      </div>
      <Card>
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Invoice Details</h2>
              <Button onClick={handleClearForm} variant="secondary" size="sm" iconName="refresh-outline" title="Clear form" />
          </div>
          
          <form onSubmit={handleSubmitInvoice} className="space-y-4">
              <Input label="Vendor Name" name="vendorName" value={invoiceDetails.vendorName} onChange={handleInvoiceDetailsChange} required />
              <Input label="Invoice Number" name="invoiceNumber" value={invoiceDetails.invoiceNumber} onChange={handleInvoiceDetailsChange} required />
              <DatePicker label="Invoice Date" value={invoiceDetails.invoiceDate} onChange={handleInvoiceDateChange} />
              <Input label="Total Amount" name="totalAmount" type="number" step="0.01" min="0.01" value={invoiceDetails.totalAmount} onChange={handleInvoiceDetailsChange} required />
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cost Center</label>
                  <select name="costCenterType" value={invoiceDetails.costCenterType} onChange={handleInvoiceDetailsChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                     {Object.keys(COST_CENTERS).map(cc => <option key={cc} value={cc}>{cc}</option>)}
                  </select>
              </div>
              {invoiceDetails.costCenterType === 'Customer Project Costing' && (
                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Related Project</label>
                      <select name="projectId" value={invoiceDetails.projectId} onChange={handleInvoiceDetailsChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3" required>
                          <option value="">-- Select a Project --</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>
              )}
              <FileUpload key={formKey} label="Upload Invoice (Required)" onFileSelect={file => setInvoiceFile(file)} />
              <div className="pt-4 border-t border-gray-700">
                  <Button type="submit" variant="primary" iconName="send-outline" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Spinner /> : 'Submit Invoice for Review'}
                  </Button>
              </div>
          </form>
      </Card>
    </div>
  );
};
