import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Add string id
  name: String,
  description: String,
  members: [{ 
    userId: String, 
    email: String, 
    name: String,
    role: String, 
    isActive: Boolean 
  }],
  settings: Object,
  createdAt: String,
  updatedAt: String,
}, { timestamps: true });

export default mongoose.model('Team', teamSchema);