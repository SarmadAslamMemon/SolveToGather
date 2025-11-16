import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createReport } from '@/services/firebase';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateReportModal({ isOpen, onClose }: CreateReportModalProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState<'community_leader' | 'super_user'>('community_leader');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setTarget('community_leader');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await createReport({
        target,
        subject: subject.trim(),
        description: description.trim(),
        fromUserId: currentUser.id,
        fromUserName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email,
        communityId: target === 'community_leader' ? currentUser.communityId || null : null,
      });

      toast({ title: 'Report submitted', description: 'Your report has been sent successfully.' });
      resetForm();
      onClose();
    } catch (error) {
      toast({ title: 'Failed to submit report', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); } }}>
      <DialogContent className="w-[95vw] sm:max-w-lg bg-card border-border p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl text-card-foreground">Submit a Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="report-target" className="text-card-foreground">Send To</Label>
            <Select value={target} onValueChange={(v: any) => setTarget(v)}>
              <SelectTrigger id="report-target" className="bg-input border-border text-card-foreground">
                <SelectValue placeholder="Choose recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="community_leader">Community Leader</SelectItem>
                <SelectItem value="super_user">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="report-subject" className="text-card-foreground">Subject</Label>
            <Input
              id="report-subject"
              type="text"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="bg-input border-border text-card-foreground"
              data-testid="input-modal-report-subject"
            />
          </div>
          <div>
            <Label htmlFor="report-description" className="text-card-foreground">Description</Label>
            <Textarea
              id="report-description"
              placeholder="Describe your report"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="bg-input border-border text-card-foreground"
              rows={4}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} disabled={isSubmitting} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting ? 'Submitting...' : 'Submit Report'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


