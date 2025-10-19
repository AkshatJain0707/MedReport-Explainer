
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageSelected: (file: File, base64: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onImageSelected(file, base64String);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelected]);

  const onDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFileChange(file);
  };

  return (
    <div>
      <label
        htmlFor="image-upload"
        className={`relative block w-full h-64 border-2 ${isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 border-dashed'} rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ease-in-out`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {preview ? (
          <img src={preview} alt="Lab report preview" className="w-full h-full object-contain rounded-md" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <UploadIcon className="w-12 h-12 mx-auto text-slate-400" />
            <span className="mt-2 block text-sm font-medium text-slate-900">
              Drag & drop a report image
            </span>
            <span className="text-xs text-slate-500">or click to upload</span>
          </div>
        )}
        <input
          id="image-upload"
          name="image-upload"
          type="file"
          className="sr-only"
          accept="image/png, image/jpeg, image/webp"
          onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
        />
      </label>
    </div>
  );
};
