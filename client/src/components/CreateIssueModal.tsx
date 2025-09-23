import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createIssue, uploadFile } from '@/services/firebase';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateIssueModal({ isOpen, onClose }: CreateIssueModalProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of selectedFiles) {
        const imagePath = `issues/${currentUser.id}/${Date.now()}-${file.name}`;
        const url = await uploadFile(file, imagePath);
        imageUrls.push(url);
      }

      await createIssue({
        title: title.trim(),
        description: description.trim(),
        communityId: currentUser.communityId,
        authorId: currentUser.id,
        images: imageUrls,
      });

      toast({ title: 'Issue created', description: 'Your issue has been submitted.' });
      resetForm();
      onClose();
    } catch (error) {
      toast({ title: 'Failed to create issue', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); } }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Add Issue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="issue-title" className="text-card-foreground">Issue Title</Label>
            <Input
              id="issue-title"
              type="text"
              placeholder="Enter issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-input border-border text-card-foreground"
              data-testid="input-modal-issue-title"
            />
          </div>
          <div>
            <Label htmlFor="issue-description" className="text-card-foreground">Description</Label>
            <Textarea
              id="issue-description"
              placeholder="Describe the issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="bg-input border-border text-card-foreground"
              rows={4}
            />
          </div>
          <div>
            <Label className="text-card-foreground">Upload Images (optional)</Label>
            <Input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesChange} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Issue'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


