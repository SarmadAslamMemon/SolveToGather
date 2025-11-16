import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommunitySchema } from "@shared/schema";
import { sendVerificationEmail } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Health check endpoint for monitoring
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Community Routes
  app.get('/api/communities', async (req, res) => {
    try {
      const communities = await storage.getAllCommunities();
      const users = await storage.getAllUsers();
      
      // Enrich communities with actual member count and leader name
      const enrichedCommunities = await Promise.all(
        communities.map(async (community) => {
          // Calculate actual member count
          const actualMemberCount = users.filter(u => u.communityId === community.id).length;
          
          // Get leader name if exists
          let leaderName = null;
          if (community.leaderId) {
            const leader = users.find(u => u.id === community.leaderId);
            if (leader) {
              leaderName = `${leader.firstName} ${leader.lastName}`;
            }
          }
          
          return {
            ...community,
            memberCount: actualMemberCount,
            leaderName,
          };
        })
      );
      
      res.json(enrichedCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      res.status(500).json({ error: 'Failed to fetch communities' });
    }
  });

  app.get('/api/communities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const community = await storage.getCommunity(id);
      
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      return res.json(community);
    } catch (error) {
      console.error('Error fetching community:', error);
      return res.status(500).json({ error: 'Failed to fetch community' });
    }
  });

  app.post('/api/communities', async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertCommunitySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid community data', 
          details: validationResult.error.errors 
        });
      }

      const communityData = validationResult.data;
      const newCommunity = await storage.createCommunity(communityData);
      
      return res.status(201).json(newCommunity);
    } catch (error) {
      console.error('Error creating community:', error);
      return res.status(500).json({ error: 'Failed to create community' });
    }
  });

  app.put('/api/communities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedCommunity = await storage.updateCommunity(id, updates);
      res.json(updatedCommunity);
    } catch (error) {
      console.error('Error updating community:', error);
      res.status(500).json({ error: 'Failed to update community' });
    }
  });

  app.delete('/api/communities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️  Deleting community with ID: ${id}`);
      
      // Check if community exists
      const community = await storage.getCommunity(id);
      if (!community) {
        console.log(`❌ Community not found: ${id}`);
        return res.status(404).json({ error: 'Community not found' });
      }
      
      console.log(`✅ Found community: ${community.name}`);
      await storage.deleteCommunity(id);
      console.log(`✅ Successfully deleted community: ${id}`);
      
      return res.status(204).send();
    } catch (error) {
      console.error('❌ Error deleting community:', error);
      return res.status(500).json({ error: 'Failed to delete community' });
    }
  });

  app.post('/api/communities/:id/assign-leader', async (req, res) => {
    try {
      const { id } = req.params;
      const { leaderId } = req.body;
      
      if (!leaderId) {
        return res.status(400).json({ error: 'Leader ID is required' });
      }
      
      // Check if community already has a leader
      const community = await storage.getCommunity(id);
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      
      if (community.leaderId && community.leaderId !== null && community.leaderId !== '') {
        // Get the current leader's details
        const currentLeader = await storage.getUser(community.leaderId);
        const currentLeaderName = currentLeader ? `${currentLeader.firstName} ${currentLeader.lastName}` : 'Unknown';
        
        return res.status(409).json({ 
          error: 'Community already has a leader',
          currentLeader: {
            id: community.leaderId,
            name: currentLeaderName
          }
        });
      }
      
      await storage.assignLeaderToCommunity(id, leaderId);
      return res.json({ message: 'Leader assigned successfully' });
    } catch (error) {
      console.error('Error assigning leader:', error);
      return res.status(500).json({ error: 'Failed to assign leader' });
    }
  });

  app.delete('/api/communities/:id/remove-leader', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeLeaderFromCommunity(id);
      res.json({ message: 'Leader removed successfully' });
    } catch (error) {
      console.error('Error removing leader:', error);
      res.status(500).json({ error: 'Failed to remove leader' });
    }
  });

  // Auth Routes
  app.post('/api/auth/send-verification-email', async (req, res) => {
    try {
      console.log('[Server] 📧 Received email verification request');
      const { email, code } = req.body;
      console.log('[Server] Email:', email, 'Code:', code);

      if (!email || !code) {
        console.error('[Server] Missing email or code');
        return res.status(400).json({ error: 'Email and code are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('[Server] Invalid email format:', email);
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Try to send email via nodemailer
      const emailSent = await sendVerificationEmail(email, code);
      
      if (emailSent) {
        console.log(`[Server] ✅ Email sent successfully to ${email}`);
      } else {
        // If email sending failed, log the code for development
        console.log(`[Server] 📧 ==========================================`);
        console.log(`[Server] 📧 VERIFICATION CODE FOR ${email}`);
        console.log(`[Server] 📧 CODE: ${code}`);
        console.log(`[Server] 📧 This code expires in 15 minutes`);
        console.log(`[Server] 📧 ==========================================`);
        console.log(`[Server] ⚠️ Email not sent - check SMTP configuration`);
      }

      res.json({ 
        message: emailSent 
          ? 'Verification email sent successfully' 
          : 'Verification code generated (email not configured)',
        // In development or if email failed, include code for testing
        ...((process.env.NODE_ENV === 'development' || !emailSent) && { code })
      });
      console.log('[Server] ✅ Response sent successfully');
    } catch (error) {
      console.error('[Server] ❌ Error sending verification email:', error);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  });

  // User Routes
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Get the current user first
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(id, updates);
      return res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
