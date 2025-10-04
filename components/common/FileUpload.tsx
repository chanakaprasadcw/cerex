// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../../types';
import React, { useState, useRef, useCallback } from 'react';
import { Button } from './Button';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File | null) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/csv': '.csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};

type Status = 'idle' | 'success' | 'error';

export const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStatus('idle');
    setFileName(null);
    setErrorMessage(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Allow re-selecting the same file
    }
  };

  const processFile = useCallback((file: File | null) => {
    if (!file) {
      resetState();
      return;
    }

    // Validation
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File is too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      setStatus('error');
      onFileSelect(null);
      return;
    }
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      setErrorMessage(`Invalid file type. Allowed: ${Object.values(ALLOWED_FILE_TYPES).join(', ')}.`);
      setStatus('error');
      onFileSelect(null);
      return;
    }

    setStatus('success');
    setFileName(file.name);
    setErrorMessage(null);
    onFileSelect(file);
  }, [onFileSelect]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    processFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    processFile(file);
  };
  
  const handleClick = () => {
    if (status === 'idle' || status === 'error') {
        fileInputRef.current?.click();
    }
  };
  
  const containerClasses = [
    "mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors duration-200 min-h-[160px]",
    isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600',
    status === 'idle' && 'cursor-pointer hover:border-gray-500',
    status === 'error' && 'border-red-500/50 bg-red-500/10 cursor-pointer',
    status === 'success' && 'border-green-500/50 bg-green-500/10',
  ].join(' ');

  const renderContent = () => {
    switch (status) {
      case 'error':
        return (
          <div className="text-center">
            {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
            <ion-icon name="close-circle-outline" className="mx-auto h-12 w-12 text-red-400"></ion-icon>
            <p className="mt-2 text-sm text-red-300 font-semibold">{errorMessage}</p>
            <p className="text-xs text-red-400">Please try a different file.</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
            <ion-icon name="checkmark-done-circle-outline" className="mx-auto h-12 w-12 text-green-400"></ion-icon>
            <p className="mt-2 text-sm font-semibold text-white truncate max-w-xs" title={fileName || ''}>{fileName}</p>
            <p className="text-xs text-green-400">File selected successfully.</p>
            <Button onClick={resetState} variant="danger-outline" size="sm" iconName="trash-outline" className="mt-4">
              Remove
            </Button>
          </div>
        );
      default: // 'idle'
        return (
          <div className="space-y-1 text-center">
            {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
            <ion-icon name="cloud-upload-outline" className="mx-auto h-12 w-12 text-gray-500"></ion-icon>
            <div className="flex text-sm text-gray-400">
              <p className="pl-1">
                <span className="font-semibold text-blue-400">Upload a file</span> or drag and drop
              </p>
            </div>
            <p className="text-xs text-gray-500">PDF, DOCX, CSV, XLSX up to 10MB</p>
          </div>
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div
        className={containerClasses}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {renderContent()}
        <input 
          ref={fileInputRef} 
          type="file" 
          className="sr-only" 
          onChange={handleFileChange}
          accept={Object.keys(ALLOWED_FILE_TYPES).join(',')}
        />
      </div>
    </div>
  );
};