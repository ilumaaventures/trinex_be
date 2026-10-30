import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/trinix";

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if MongoDB not running
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    isConnected = false;
    console.warn(`[MongoDB] Connection failed at ${uri}: ${err.message}`);
    console.warn(`[MongoDB] Falling back to persistent JSON database mode.`);
    return null;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export default connectDB;
