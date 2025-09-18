import { Router } from 'express';
import Team from '../models/Team.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams', details: error.message });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const teams = await Team.find({ 'members.userId': req.user.sub });
    res.json(teams);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    res.status(500).json({ error: 'Failed to fetch user teams', details: error.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    
    const teamId = `team_${Math.random().toString(36).slice(2, 9)}`;
    const team = await Team.create({
      id: teamId,
      name: name.trim(),
      description: description || '',
      settings: settings || {
        allowMemberInvites: true,
        allowTaskCreation: true,
        allowTaskAssignment: true,
        maxMembers: 10,
        visibility: 'public'
      },
      members: [{ 
        userId: req.user.sub, 
        email: req.user.email, 
        name: req.user.name || req.user.email,
        role: 'owner', 
        isActive: true 
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    const io = req.app.get('io');
    if (io) io.emit('team:created', team); // Broadcast team creation
    res.status(201).json({ ok: true, team });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team', details: error.message });
  }
});

router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const team = await Team.findOne({ id: req.params.id });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Check if user is already a member
    const existingMember = team.members.find(m => m.userId === req.user.sub);
    if (existingMember) {
      if (existingMember.isActive) {
        return res.json({ ok: true, message: 'Already a member of this team', team });
      } else {
        // Reactivate the member
        existingMember.isActive = true;
      }
    } else {
      // Add new member
      team.members.push({ 
        userId: req.user.sub, 
        email: req.user.email, 
        name: req.user.name || req.user.email,
        role: 'member', 
        isActive: true 
      });
    }
    
    team.updatedAt = new Date().toISOString();
    await team.save();
    
    const io = req.app.get('io');
    if (io) io.emit('team:updated', team); // Broadcast team update
    res.json({ ok: true, team });
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ error: 'Failed to join team', details: error.message });
  }
});

// Add similar socket emits for update and delete if you have those routes
export default router;