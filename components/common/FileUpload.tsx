import React, { useState, useRef } from 'react';
// FIX: Changed to a value import to ensure global type declarations from types.ts are loaded.
import {} from '../../types';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setFileName(file ? file.name : null);
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-gray-500 transition"
        onClick={handleClick}
      >
        <div className="space-y-1 text-center">
          <ion-icon name="cloud-upload-outline" className="mx-auto h-12 w-12 text-gray-500"></ion-icon>
          <div className="flex text-sm text-gray-400">
            <p className="pl-1">{fileName ? fileName : 'Upload a file or drag and drop'}</p>
            <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
          </div>
          <p className="text-xs text-gray-500">PDF, DOCX, CSV, XLSX up to 10MB</p>
        </div>
      </div>
    </div>
  );
};
