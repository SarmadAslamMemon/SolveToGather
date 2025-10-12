import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createCampaign, createCampaignWithNotification, uploadFile } from '@/services/firebase';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCampaignModal({ isOpen, onClose }: CreateCampaignModalProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGoal('');
    setDuration('');
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
    if (!title.trim() || !description.trim() || !goal.trim() || !duration.trim()) return;

    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of selectedFiles) {
        const imagePath = `campaigns/${currentUser.id}/${Date.now()}-${file.name}`;
        const url = await uploadFile(file, imagePath);
        imageUrls.push(url);
      }

      await createCampaignWithNotification({
        title: title.trim(),
        description: description.trim(),
        goal: Number(goal),
        duration,
        communityId: currentUser.communityId,
        authorId: currentUser.id,
        images: imageUrls,
        paymentMethods: ['jazzcash', 'bank_transfer']
      });

      toast({ title: 'Campaign launched', description: 'Your campaign is now live.' });
      resetForm();
      onClose();
    } catch (error) {
      toast({ title: 'Failed to create campaign', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); } }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Raise Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="campaign-title" className="text-card-foreground">Campaign Title</Label>
            <Input
              id="campaign-title"
              type="text"
              placeholder="Enter campaign title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-input border-border text-card-foreground"
              data-testid="input-modal-campaign-title"
            />
          </div>
          <div>
            <Label htmlFor="campaign-description" className="text-card-foreground">Description</Label>
            <Textarea
              id="campaign-description"
              placeholder="Describe your campaign"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="bg-input border-border text-card-foreground"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="campaign-goal" className="text-card-foreground">Goal (PKR)</Label>
              <Input
                id="campaign-goal"
                type="number"
                min="0"
                placeholder="500000"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
                className="bg-input border-border text-card-foreground"
              />
            </div>
            <div>
              <Label htmlFor="campaign-duration" className="text-card-foreground">Duration</Label>
              <Input
                id="campaign-duration"
                type="text"
                placeholder="30 days"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                className="bg-input border-border text-card-foreground"
              />
            </div>
          </div>
          <div>
            <Label className="text-card-foreground">Upload Images (optional)</Label>
            <Input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesChange} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Launching...' : 'Launch Campaign'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


