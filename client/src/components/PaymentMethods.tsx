import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  QrCode, 
  Upload, 
  X,
  Smartphone,
  Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/services/firebase';
import LoadingSkeleton from './LoadingSkeleton';

interface PaymentMethod {
  id: string;
  type: 'jazzcash' | 'easypaisa';
  accountNumber: string;
  userName: string;
  userNic: string;
  qrImageUrl: string;
  isActive: boolean;
  communityId?: string;
  leaderId?: string;
  createdAt: any;
  updatedAt: any;
}

export default function PaymentMethods() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'jazzcash' as 'jazzcash' | 'easypaisa',
    accountNumber: '',
    userName: '',
    userNic: '',
    qrImageUrl: '',
    isActive: true
  });

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!currentUser?.communityId) {
        return;
      }

      try {
        setLoading(true);
        
        // First, try to get all documents without any filters to test the connection
        const allDocsSnapshot = await getDocs(collection(db, 'paymentMethod'));
        
        // Now try with the community filter
        const q = query(
          collection(db, 'paymentMethod'),
          where('communityId', '==', currentUser.communityId)
        );
        
        const snapshot = await getDocs(q);
        
        const methods = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Convert Firestore timestamps to Date objects if needed
          const processTimestamp = (timestamp: any) => {
            if (!timestamp) return new Date();
            return timestamp.toDate ? timestamp.toDate() : timestamp;
          };
          
          return {
            id: doc.id,
            type: data.type || 'jazzcash', // Default type
            accountNumber: data.accountNumber || '',
            userName: data.userName || '',
            userNic: data.userNic || '',
            qrImageUrl: data.qrImageUrl || '',
            isActive: data.isActive !== undefined ? data.isActive : true,
            communityId: data.communityId || currentUser.communityId,
            leaderId: data.leaderId || currentUser.id,
            createdAt: processTimestamp(data.createdAt),
            updatedAt: processTimestamp(data.updatedAt)
          } as PaymentMethod;
        });
        
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        toast({
          title: "Error",
          description: "Failed to load payment methods. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [currentUser?.communityId, toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const imagePath = `payment-methods/${currentUser?.communityId}/${Date.now()}-${file.name}`;
      const imageUrl = await uploadFile(file, imagePath);
      setFormData(prev => ({ ...prev, qrImageUrl: imageUrl }));
      toast({
        title: "Success",
        description: "QR code image uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!currentUser?.communityId) return;

    try {
      const paymentMethodData = {
        ...formData,
        communityId: currentUser.communityId,
        leaderId: currentUser.id, // Store the leader ID
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'paymentMethod'), paymentMethodData);
      
      toast({
        title: "Success",
        description: "Payment method added successfully.",
      });

      setIsAddModalOpen(false);
      resetForm();
      
      // Refresh the list
      const q = query(
        collection(db, 'paymentMethod'),  // Changed from 'paymentMethods' to 'paymentMethod'
        where('communityId', '==', currentUser.communityId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const methods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentMethod[];
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: "Failed to add payment method. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditPaymentMethod = async () => {
    if (!editingMethod) return;

    try {
      const paymentMethodData = {
        ...formData,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'paymentMethod', editingMethod.id), paymentMethodData);
      
      toast({
        title: "Success",
        description: "Payment method updated successfully.",
      });

      setIsEditModalOpen(false);
      setEditingMethod(null);
      resetForm();
      
      // Refresh the list
      const q = query(
        collection(db, 'paymentMethods'),
        where('communityId', '==', currentUser?.communityId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const methods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentMethod[];
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast({
        title: "Error",
        description: "Failed to update payment method. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'paymentMethod', id));
      
      toast({
        title: "Success",
        description: "Payment method deleted successfully.",
      });

      setPaymentMethods(prev => prev.filter(method => method.id !== id));
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: "Error",
        description: "Failed to delete payment method. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      await updateDoc(doc(db, 'paymentMethods', method.id), {
        isActive: !method.isActive,
        updatedAt: new Date()
      });

      setPaymentMethods(prev => 
        prev.map(m => 
          m.id === method.id 
            ? { ...m, isActive: !m.isActive }
            : m
        )
      );

      toast({
        title: "Success",
        description: `Payment method ${!method.isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment method status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'jazzcash',
      accountNumber: '',
      userName: '',
      userNic: '',
      qrImageUrl: '',
      isActive: true
    });
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      type: method.type,
      accountNumber: method.accountNumber,
      userName: method.userName,
      userNic: method.userNic,
      qrImageUrl: method.qrImageUrl,
      isActive: method.isActive
    });
    setIsEditModalOpen(true);
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'jazzcash':
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'easypaisa':
        return <Wallet className="w-5 h-5 text-green-600" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPaymentMethodName = (type: string) => {
    switch (type) {
      case 'jazzcash':
        return 'JazzCash';
      case 'easypaisa':
        return 'EasyPaisa';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Payment Methods</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Loading payment methods...</p>
          </div>
        </div>
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
              Payment Methods
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage JazzCash and EasyPaisa payment methods for your community</p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white w-full sm:w-auto text-sm sm:text-base"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Add Payment Method</span>
            <span className="sm:hidden">Add Method</span>
          </Button>
        </div>
      </motion.div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {paymentMethods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="bg-card border-border hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                    {getPaymentMethodIcon(method.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate">{getPaymentMethodName(method.type)}</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{method.accountNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                    <Badge variant={method.isActive ? "default" : "secondary"} className="text-xs">
                      {method.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(method)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Account Holder</Label>
                    <p className="text-xs sm:text-sm truncate">{method.userName}</p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">NIC Number</Label>
                    <p className="text-xs sm:text-sm truncate">{method.userNic}</p>
                  </div>
                  {method.qrImageUrl && (
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-muted-foreground">QR Code</Label>
                      <div className="mt-2">
                        <img
                          src={method.qrImageUrl}
                          alt="QR Code"
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-border"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Status</Label>
                    <Switch
                      checked={method.isActive}
                      onCheckedChange={() => handleToggleActive(method)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {paymentMethods.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-card-foreground mb-2">No Payment Methods</h3>
          <p className="text-muted-foreground mb-6">Add JazzCash and EasyPaisa payment methods to start accepting donations.</p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </motion.div>
      )}

      {/* Add Payment Method Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] bg-card text-card-foreground p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-bold">Add Payment Method</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Add a new JazzCash or EasyPaisa payment method for your community.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Payment Method Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'jazzcash' | 'easypaisa' }))}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
              </select>
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Enter account number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="userName">Account Holder Name</Label>
              <Input
                id="userName"
                value={formData.userName}
                onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                placeholder="Enter account holder name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="userNic">NIC Number</Label>
              <Input
                id="userNic"
                value={formData.userNic}
                onChange={(e) => setFormData(prev => ({ ...prev, userNic: e.target.value }))}
                placeholder="Enter NIC number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="qrImage">QR Code Image</Label>
              <div className="mt-1">
                <input
                  type="file"
                  id="qrImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="qrImage"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  ) : formData.qrImageUrl ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={formData.qrImageUrl}
                        alt="QR Code"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <span className="text-sm text-muted-foreground mt-2">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload QR Code</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active Status</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                disabled={!formData.accountNumber || !formData.userName || !formData.userNic}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white text-sm sm:text-base"
              >
                Add Payment Method
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Method Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] bg-card text-card-foreground p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-bold">Edit Payment Method</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Update the payment method details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-type">Payment Method Type</Label>
              <select
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'jazzcash' | 'easypaisa' }))}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
              </select>
            </div>

            <div>
              <Label htmlFor="edit-accountNumber">Account Number</Label>
              <Input
                id="edit-accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Enter account number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-userName">Account Holder Name</Label>
              <Input
                id="edit-userName"
                value={formData.userName}
                onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                placeholder="Enter account holder name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-userNic">NIC Number</Label>
              <Input
                id="edit-userNic"
                value={formData.userNic}
                onChange={(e) => setFormData(prev => ({ ...prev, userNic: e.target.value }))}
                placeholder="Enter NIC number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-qrImage">QR Code Image</Label>
              <div className="mt-1">
                <input
                  type="file"
                  id="edit-qrImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="edit-qrImage"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  ) : formData.qrImageUrl ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={formData.qrImageUrl}
                        alt="QR Code"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <span className="text-sm text-muted-foreground mt-2">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload QR Code</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">Active Status</Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingMethod(null);
                  resetForm();
                }}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditPaymentMethod}
                disabled={!formData.accountNumber || !formData.userName || !formData.userNic}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white text-sm sm:text-base"
              >
                Update Payment Method
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
