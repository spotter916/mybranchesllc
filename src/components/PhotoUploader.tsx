import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface PhotoUploaderProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (photoUrl: string, updatedUser?: any) => void;
  title?: string;
  description?: string;
  acceptTypes?: string;
  maxSizeMB?: number;
  shape?: "circle" | "square" | "rectangle";
  size?: "sm" | "md" | "lg";
}

export default function PhotoUploader({
  currentPhotoUrl,
  onPhotoUploaded,
  title = "Upload Photo",
  description = "Choose a photo to upload",
  acceptTypes = "image/*",
  maxSizeMB = 5,
  shape = "circle",
  size = "md",
}: PhotoUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  };

  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-lg",
    rectangle: "rounded-lg aspect-video"
  };

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file.';
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB.`;
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid file",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // First, get the upload URL
      const uploadResponse = await apiRequest('POST', '/api/photos/upload-url', {
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        size: selectedFile.size,
      });

      const { uploadUrl, photoId } = await uploadResponse.json();

      // Upload the file directly to object storage
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload photo');
      }

      // Confirm the upload and get the photo URL
      const confirmResponse = await apiRequest('POST', '/api/photos/confirm-upload', {
        photoId,
        isProfilePhoto: true,
      });

      const responseData = await confirmResponse.json();
      const { photoUrl, user } = responseData;

      // Optimistically update the cache with the new photo URL
      queryClient.setQueryData(['/api/auth/user'], (prev: any) => {
        if (!prev) return prev;
        return { ...prev, profileImageUrl: photoUrl };
      });
      
      // Always invalidate to ensure fresh data reconciliation 
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      // Invalidate household-related queries to refresh member lists
      await queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      

      onPhotoUploaded(photoUrl, user);
      setIsOpen(false);
      setPreview(null);
      setSelectedFile(null);

      toast({
        title: "Success!",
        description: "Photo uploaded successfully.",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`relative ${sizeClasses[size]} ${shapeClasses[shape]} p-0 overflow-hidden hover:opacity-80 transition-opacity`}
          data-testid="button-photo-upload"
        >
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Current photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Camera className="h-4 w-4 text-white" />
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md" data-testid="dialog-photo-upload">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!preview ? (
            <Card 
              className={`border-2 border-dashed transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              data-testid="card-photo-drop-zone"
            >
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">{description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Drag and drop or click to browse
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-browse-files"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Photo
                    </Button>
                    
                  </div>
                  
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="text-xs">
                      Max {maxSizeMB}MB
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                      data-testid="img-photo-preview"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={clearSelection}
                      data-testid="button-clear-photo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {selectedFile && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>File: {selectedFile.name}</p>
                      <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={clearSelection}
                  disabled={isUploading}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
                <Button
                  onClick={uploadPhoto}
                  disabled={isUploading}
                  data-testid="button-confirm-upload"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileInputChange}
          className="hidden"
          data-testid="input-photo-file"
        />
      </DialogContent>
    </Dialog>
  );
}