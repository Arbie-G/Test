import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://stellahime821_db_user:EJVg3jfXFzmY7J1G@pms.02mwxnz.mongodb.net/ayasynch?retryWrites=true&w=majority';

async function fixDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Drop the problematic id index
    try {
      await collection.dropIndex('id_1');
      console.log('Dropped id_1 index successfully');
    } catch (error) {
      console.log('Index id_1 does not exist or already dropped');
    }
    
    // List current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    await mongoose.disconnect();
    console.log('Database fix completed');
  } catch (error) {
    console.error('Error fixing database:', error);
  }
}

fixDatabase();
