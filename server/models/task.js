import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  teamId: { type: String }, // <-- Change from ObjectId to String
  title: String,
  description: String,
  assignedTo: String,
  status: String,
  priority: String,
  createdAt: String,
  updatedAt: String,
  createdBy: String,
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
