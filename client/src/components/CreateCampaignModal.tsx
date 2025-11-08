import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createCampaign, createCampaignWithNotification, uploadFile, getPaymentMethods } from '@/services/firebase';

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
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch payment methods when modal opens
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (isOpen && currentUser?.communityId) {
        try {
          const methods = await getPaymentMethods(currentUser.communityId, currentUser.id);
          setAvailablePaymentMethods(methods);
          // Auto-select all available payment methods
          setSelectedPaymentMethods(methods.map((m: any) => m.type));
        } catch (error) {
          console.error('Error fetching payment methods:', error);
        }
      }
    };
    fetchPaymentMethods();
  }, [isOpen, currentUser?.communityId, currentUser?.id]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGoal('');
    setDuration('');
    setSelectedFiles([]);
    setSelectedPaymentMethods([]);
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
        paymentMethods: selectedPaymentMethods.length > 0 ? selectedPaymentMethods : ['jazzcash', 'easypaisa'] // Fallback to default
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
          {availablePaymentMethods.length > 0 && (
            <div>
              <Label className="text-card-foreground mb-2 block">Payment Methods</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select payment methods available for this campaign (added by your community leader)
              </p>
              <div className="space-y-2">
                {availablePaymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`payment-${method.id}`}
                      checked={selectedPaymentMethods.includes(method.type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPaymentMethods([...selectedPaymentMethods, method.type]);
                        } else {
                          setSelectedPaymentMethods(selectedPaymentMethods.filter(t => t !== method.type));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`payment-${method.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {method.type === 'jazzcash' ? 'JazzCash' : method.type === 'easypaisa' ? 'EasyPaisa' : method.type}
                      {method.accountNumber && ` (${method.accountNumber})`}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {availablePaymentMethods.length === 0 && currentUser?.communityId && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                No payment methods available. Ask your community leader to add payment methods.
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Launching...' : 'Launch Campaign'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


