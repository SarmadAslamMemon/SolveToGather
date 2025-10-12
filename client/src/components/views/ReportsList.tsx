import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getReportsForLeader, getReportsForSuperUser, updateReport, deleteReport } from '@/services/firebase';

interface ReportsListProps {
  mode: 'leader' | 'super';
}

export default function ReportsList({ mode }: ReportsListProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      if (mode === 'leader') {
        if (!currentUser?.communityId) {
          setReports([]);
        } else {
          const data = await getReportsForLeader(currentUser.communityId);
          setReports(data);
        }
      } else {
        const data = await getReportsForSuperUser();
        setReports(data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentUser?.communityId]);

  const handleToggleResolved = async (reportId: string, current: boolean) => {
    try {
      await updateReport(reportId, { isResolved: !current });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, isResolved: !current } : r));
      toast({ title: 'Updated', description: 'Report status updated.' });
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not update status.', variant: 'destructive' });
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast({ title: 'Deleted', description: 'Report deleted.' });
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not delete report.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="ml-64 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>{mode === 'leader' ? 'Community Reports' : 'All Reports'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-sm text-muted-foreground">No reports found.</div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-card-foreground truncate">{report.subject}</h3>
                      <Badge variant={report.isResolved ? 'secondary' : 'destructive'}>
                        {report.isResolved ? 'Resolved' : 'Open'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                    <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-4">
                      <span>From: {report.fromUserName}</span>
                      <span>To: {report.target === 'community_leader' ? 'Community Leader' : 'Super Admin'}</span>
                    </div>
                    <Button variant="link" className="px-0 mt-1" onClick={() => setSelectedReport(report)}>View</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleResolved(report.id, report.isResolved)}>
                      {report.isResolved ? 'Mark Open' : 'Mark Resolved'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(report.id)}>Delete</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="text-card-foreground">{selectedReport.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">From: {selectedReport.fromUserName}</div>
                <div className="text-sm text-muted-foreground">To: {selectedReport.target === 'community_leader' ? 'Community Leader' : 'Super Admin'}</div>
                <p className="text-card-foreground whitespace-pre-wrap">{selectedReport.description}</p>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
                  <Button onClick={() => { handleToggleResolved(selectedReport.id, selectedReport.isResolved); setSelectedReport({ ...selectedReport, isResolved: !selectedReport.isResolved }); }}>
                    {selectedReport.isResolved ? 'Mark Open' : 'Mark Resolved'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


