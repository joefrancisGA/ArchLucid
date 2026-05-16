"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "./ui/button"; // Assuming standard shadcn-like buttons
import { Progress } from "./ui/progress"; // Assuming progress component
import { X, UploadCloud, AlertCircle } from "lucide-react";

export interface BulkEvidenceUploadProps {
  runId: string;
}

const MAX_FILES = 30;

export function BulkEvidenceUpload({ runId }: BulkEvidenceUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (selectedFiles: FileList | File[]) => {
    setError(null);
    setSuccess(false);
    
    const newFiles = Array.from(selectedFiles);
    const totalFiles = files.length + newFiles.length;

    if (totalFiles > MAX_FILES) {
      const excess = totalFiles - MAX_FILES;
      setError(`Maximum ${MAX_FILES} files per upload. Please remove ${excess} files or upload in multiple batches.`);
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [files]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (error) setError(null);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));

      // Fake progress
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 200);

      const response = await fetch(`/v1/architecture/run/${runId}/evidence/bulk`, {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) {
        let msg = "Upload failed.";
        try {
          const problem = await response.json();
          if (problem.detail) msg = problem.detail;
        } catch {
          // ignore
        }
        setError(msg);
      } else {
        setSuccess(true);
        setFiles([]);
      }
    } catch (err) {
      setError("An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-medium">Add evidence</h3>
      <p className="text-sm text-neutral-500">Upload up to {MAX_FILES} files per action</p>
      
      <div 
        className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-lg p-6 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => inputRef.current?.click()}
        aria-label="Drag and drop evidence files here, or click to browse"
        role="button"
        tabIndex={0}
      >
        <UploadCloud className="w-8 h-8 text-neutral-400 mb-2" />
        <p className="text-sm font-medium text-neutral-700">Drag files here or click to browse</p>
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={inputRef} 
          aria-label="Drag and drop evidence files here"
          data-testid="evidence-file-input"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            // Reset so same file can be selected again if needed
            e.target.value = "";
          }} 
          aria-describedby="upload-error"
        />
      </div>

      <div aria-live="polite" className="sr-only">
        {files.length} out of {MAX_FILES} files selected
      </div>

      <div className="flex justify-between items-center text-sm font-medium">
        <span>{files.length} / {MAX_FILES} files</span>
      </div>

      {error && (
        <div id="upload-error" className="flex items-center text-red-600 text-sm bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
          Evidence successfully uploaded.
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2 max-h-48 overflow-y-auto border rounded p-2 bg-white">
          {files.map((f, i) => (
            <li key={i} className="flex justify-between items-center text-sm p-1 hover:bg-neutral-50">
              <span className="truncate max-w-[200px]" title={f.name}>{f.name}</span>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }} 
                className="text-neutral-500 hover:text-red-500 p-1"
                aria-label={`Remove ${f.name}`}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {uploading && <Progress value={progress} className="w-full h-2" />}

      <Button 
        onClick={uploadFiles} 
        disabled={files.length === 0 || uploading || !!error}
        className="w-full"
      >
        {uploading ? "Uploading..." : "Upload Evidence"}
      </Button>
    </div>
  );
}
