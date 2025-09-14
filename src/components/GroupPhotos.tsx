import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Camera, Plus, User, Upload } from 'lucide-react';

interface GroupPhoto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  objectPath: string;
  thumbnailPath: string | null;
  uploaderId: string;
  groupId: string | null;
  caption: string | null;
  isProfilePhoto: boolean | null;
  visibility: string | null;
  createdAt: string;
  uploader: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  } | null;
}

interface GroupPhotosProps {
  groupId: string;
  groupName: string;
}

export function GroupPhotos({ groupId, groupName }: GroupPhotosProps) {
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch group photos
  const { data: photos = [], isLoading } = useQuery<GroupPhoto[]>({
    queryKey: [`/api/groups/${groupId}/photos`],
    enabled: !!groupId,
  });

  // Upload mutation for group photos
  const uploadMutation = useMutation({
    mutationFn: async ({ filename, mimeType, size, caption }: { 
      filename: string; 
      mimeType: string; 
      size: number; 
      caption?: string; 
    }) => {
      return await apiRequest('POST', `/api/groups/${groupId}/photos/upload`, {
        filename,
        mimeType,
        size,
        caption,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Photo uploaded to group gallery successfully",
      });
      setCaption('');
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/photos`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Get upload URL
      const response = await uploadMutation.mutateAsync({
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        size: selectedFile.size,
        caption: caption.trim() || undefined,
      });

      // Upload file to the signed URL
      const uploadResponse = await fetch((response as any).uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (uploadResponse.ok) {
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/photos`] });
        setCaption('');
        setSelectedFile(null);
        toast({
          title: "Success",
          description: "Photo uploaded successfully",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getUploaderName = (uploader: GroupPhoto['uploader']) => {
    if (!uploader) return 'Unknown User';
    if (uploader.firstName || uploader.lastName) {
      return `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim();
    }
    return uploader.id;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="group-photos-container">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Group Photos ({photos.length})
        </h3>
        
        <div className="flex items-center gap-4">
          <Input
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-40"
            data-testid="input-photo-caption"
          />
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="group-photo-upload"
              data-testid="input-file-upload"
            />
            <label htmlFor="group-photo-upload">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Select Photo
                </span>
              </Button>
            </label>
            
            {selectedFile && (
              <Button 
                onClick={handleUpload}
                disabled={isUploading}
                size="sm"
                data-testid="button-upload-group-photo"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload
              </Button>
            )}
          </div>
        </div>
      </div>

      {photos.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Camera className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No photos yet
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Share memories with your {groupName} group by uploading the first photo
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(photos as GroupPhoto[]).map((photo: GroupPhoto) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={`/api/photos/${photo.id}`}
                  alt={photo.caption || photo.originalName}
                  className="w-full h-full object-cover"
                  data-testid={`img-group-photo-${photo.id}`}
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={photo.uploader?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {getUploaderName(photo.uploader)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(photo.createdAt)}
                    </p>
                    {photo.caption && (
                      <p className="text-sm text-foreground mt-2" data-testid={`text-photo-caption-${photo.id}`}>
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}