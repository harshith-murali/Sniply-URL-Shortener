import mongoose from 'mongoose'

let cached = global._mongoose

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn?.connection.readyState === 1) return cached.conn

  // A closed connection must not be reused after a serverless instance wakes up.
  if (cached.conn) {
    cached.conn = null
    cached.promise = null
  }

  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    const error = new Error('Database connection is not configured')
    error.code = 'DB_UNAVAILABLE'
    throw error
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    }).catch((cause) => {
      // Never cache a rejected promise: the next request must be able to retry.
      cached.conn = null
      cached.promise = null
      const error = new Error('Database connection is unavailable', { cause })
      error.code = 'DB_UNAVAILABLE'
      throw error
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
