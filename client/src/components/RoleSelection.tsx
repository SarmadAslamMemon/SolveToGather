import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Settings, Heart, DollarSign, AlertTriangle } from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelected: (role: string) => void;
}

export default function RoleSelection({ onRoleSelected }: RoleSelectionProps) {
  const { currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    onRoleSelected(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Welcome, {currentUser?.firstName}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-2"
          >
            You are a Community Leader for <Badge variant="secondary" className="text-sm">{currentUser?.communityId}</Badge>
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 dark:text-gray-400"
          >
            Choose how you'd like to use the platform today
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Community Leader Role */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                selectedRole === 'leader' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => handleRoleSelect('leader')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                  Community Leader
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Manage your community and create content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="text-sm">Create community issues</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Launch fundraising campaigns</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">Manage community settings</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-purple-500" />
                    <span className="text-sm">View community analytics</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6" 
                  variant={selectedRole === 'leader' ? 'default' : 'outline'}
                >
                  Enter as Leader
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Community Member Role */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                selectedRole === 'member' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''
              }`}
              onClick={() => handleRoleSelect('member')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit">
                  <Heart className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl text-green-900 dark:text-green-100">
                  Community Member
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Engage with your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="text-sm">View and interact with issues</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Participate in campaigns</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-sm">Like and comment on posts</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-purple-500" />
                    <span className="text-sm">Connect with neighbors</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6" 
                  variant={selectedRole === 'member' ? 'default' : 'outline'}
                >
                  Enter as Member
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You can switch between roles anytime from the sidebar
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
