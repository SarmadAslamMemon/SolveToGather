import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, HandHeart, User, MapPin, CreditCard, Phone } from 'lucide-react';
import { getCommunities } from '@/services/firebase';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  address: string;
  nic: string;
  phoneNumber: string;
  communityId: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  nic?: string;
  phoneNumber?: string;
  communityId?: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  
  // Signup form fields
  const [signupData, setSignupData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    address: '',
    nic: '',
    phoneNumber: '',
    communityId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [communities, setCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  
  const { login, register } = useAuth();
  const { toast } = useToast();

  // Fetch communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      setLoadingCommunities(true);
      try {
        console.log('🔍 Fetching communities...');
        const communitiesData = await getCommunities();
        console.log('📊 Communities fetched:', communitiesData);
        
        if (!communitiesData || communitiesData.length === 0) {
          console.warn('⚠️ No communities found in database');
          toast({
            title: "No Communities Available",
            description: "Please contact the administrator to create communities first.",
            variant: "destructive",
          });
        }
        
        setCommunities(communitiesData);
      } catch (error) {
        console.error('❌ Error fetching communities:', error);
        toast({
          title: "Error",
          description: "Failed to load communities. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingCommunities(false);
      }
    };

    if (isRegister) {
      fetchCommunities();
    }
  }, [isRegister, toast]);

  const validateSignupForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(signupData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signupData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // First name validation
    if (!signupData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (signupData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters long';
    }

    // Last name validation
    if (!signupData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (signupData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters long';
    }

    // Address validation
    if (!signupData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (signupData.address.length < 10) {
      newErrors.address = 'Address must be at least 10 characters long';
    }

    // NIC validation (Pakistani NIC format)
    const nicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!signupData.nic) {
      newErrors.nic = 'NIC is required';
    } else if (!nicRegex.test(signupData.nic)) {
      newErrors.nic = 'NIC must be in format: 12345-1234567-1';
    }

    // Phone number validation (Pakistani format)
    const phoneRegex = /^(\+92|0)?3\d{9}$/;
    if (!signupData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(signupData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be a valid Pakistani number (e.g., 03001234567)';
    }

    // Community validation
    if (!signupData.communityId) {
      newErrors.communityId = 'Please select a community';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignupFieldChange = (field: keyof SignupFormData, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!validateSignupForm()) {
          setIsLoading(false);
          return;
        }
        
        await register(signupData);
        toast({
          title: "Account created successfully!",
          description: "Please log in with your credentials to continue.",
        });
        // Reset form and switch to login mode
        resetForm();
        setIsRegister(false);
      } else {
        await login(email, password);
        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setSignupData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      address: '',
      nic: '',
      phoneNumber: '',
      communityId: '',
    });
    setErrors({});
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    resetForm();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background Slider */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/80 to-blue-700/80"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-orange-400/80 to-orange-500/80"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 15, repeat: Infinity, delay: 5 }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/80 to-purple-700/80"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          animate={{ opacity: [0, 0, 1, 0] }}
          transition={{ duration: 15, repeat: Infinity, delay: 10 }}
        />
      </div>

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl mx-auto p-6"
      >
        <Card className="glass-effect border-border shadow-2xl">
          <CardContent className="p-8">
            {/* Logo and Branding */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 savetogather-gradient rounded-full mb-4 shadow-lg">
                <HandHeart className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold font-serif text-gradient mb-2">SolveToGather</h1>
              <p className="text-muted-foreground">Building stronger communities together</p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegister ? (
                // Enhanced Signup Form
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="block text-sm font-medium text-card-foreground mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        value={signupData.firstName}
                        onChange={(e) => handleSignupFieldChange('firstName', e.target.value)}
                        className={`bg-input border-border text-card-foreground ${errors.firstName ? 'border-red-500' : ''}`}
                        data-testid="input-first-name"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="block text-sm font-medium text-card-foreground mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter your last name"
                        value={signupData.lastName}
                        onChange={(e) => handleSignupFieldChange('lastName', e.target.value)}
                        className={`bg-input border-border text-card-foreground ${errors.lastName ? 'border-red-500' : ''}`}
                        data-testid="input-last-name"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={signupData.email}
                      onChange={(e) => handleSignupFieldChange('email', e.target.value)}
                      className={`bg-input border-border text-card-foreground ${errors.email ? 'border-red-500' : ''}`}
                      data-testid="input-email"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phoneNumber" className="block text-sm font-medium text-card-foreground mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone Number *
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="03001234567"
                        value={signupData.phoneNumber}
                        onChange={(e) => handleSignupFieldChange('phoneNumber', e.target.value)}
                        className={`bg-input border-border text-card-foreground ${errors.phoneNumber ? 'border-red-500' : ''}`}
                        data-testid="input-phone"
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="nic" className="block text-sm font-medium text-card-foreground mb-2">
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        NIC Number *
                      </Label>
                      <Input
                        id="nic"
                        type="text"
                        placeholder="12345-1234567-1"
                        value={signupData.nic}
                        onChange={(e) => handleSignupFieldChange('nic', e.target.value)}
                        className={`bg-input border-border text-card-foreground ${errors.nic ? 'border-red-500' : ''}`}
                        data-testid="input-nic"
                      />
                      {errors.nic && (
                        <p className="text-red-500 text-xs mt-1">{errors.nic}</p>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address" className="block text-sm font-medium text-card-foreground mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address *
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your complete address"
                      value={signupData.address}
                      onChange={(e) => handleSignupFieldChange('address', e.target.value)}
                      className={`bg-input border-border text-card-foreground resize-none ${errors.address ? 'border-red-500' : ''}`}
                      rows={3}
                      data-testid="textarea-address"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                    )}
                  </div>

                  {/* Community Selection */}
                  <div>
                    <Label htmlFor="communityId" className="block text-sm font-medium text-card-foreground mb-2">
                      <HandHeart className="w-4 h-4 inline mr-1" />
                      Select Your Community *
                    </Label>
                    <select
                      id="communityId"
                      value={signupData.communityId}
                      onChange={(e) => handleSignupFieldChange('communityId', e.target.value)}
                      className={`w-full px-3 py-2 bg-input border border-border text-card-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.communityId ? 'border-red-500' : ''}`}
                      disabled={loadingCommunities || communities.length === 0}
                    >
                      <option value="">
                        {loadingCommunities 
                          ? 'Loading communities...' 
                          : communities.length === 0 
                            ? 'No communities available' 
                            : 'Choose your community...'}
                      </option>
                      {communities.map((community) => (
                        <option key={community.id} value={community.id}>
                          {community.name} {community.location ? `(${community.location})` : ''}
                        </option>
                      ))}
                    </select>
                    {loadingCommunities && (
                      <p className="text-muted-foreground text-xs mt-1">Loading communities...</p>
                    )}
                    {!loadingCommunities && communities.length === 0 && (
                      <p className="text-amber-500 text-xs mt-1">
                        No communities available. Please contact the administrator.
                      </p>
                    )}
                    {!loadingCommunities && communities.length > 0 && (
                      <p className="text-muted-foreground text-xs mt-1">
                        Found {communities.length} {communities.length === 1 ? 'community' : 'communities'}
                      </p>
                    )}
                    {errors.communityId && (
                      <p className="text-red-500 text-xs mt-1">{errors.communityId}</p>
                    )}
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
                        <Lock className="w-4 h-4 inline mr-1" />
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={signupData.password}
                          onChange={(e) => handleSignupFieldChange('password', e.target.value)}
                          className={`bg-input border-border text-card-foreground pr-10 ${errors.password ? 'border-red-500' : ''}`}
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 text-muted-foreground hover:text-card-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="block text-sm font-medium text-card-foreground mb-2">
                        <Lock className="w-4 h-4 inline mr-1" />
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={signupData.confirmPassword}
                          onChange={(e) => handleSignupFieldChange('confirmPassword', e.target.value)}
                          className={`bg-input border-border text-card-foreground pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                          data-testid="input-confirm-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 text-muted-foreground hover:text-card-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Login Form
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="login-email" className="block text-sm font-medium text-card-foreground mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-input border-border text-card-foreground"
                      data-testid="input-login-email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="block text-sm font-medium text-card-foreground mb-2">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-input border-border text-card-foreground pr-10"
                        data-testid="input-login-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-muted-foreground hover:text-card-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-login-password"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="w-4 h-4 text-primary border-border rounded" />
                      <span className="ml-2 text-sm text-muted-foreground">Remember me</span>
                    </label>
                    <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:opacity-90"
                data-testid="button-submit"
              >
                {isLoading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="text-primary hover:underline"
                  data-testid="button-toggle-mode"
                >
                  {isRegister ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
