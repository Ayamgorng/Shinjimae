// auth/index.js
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import db from './database/index.js'

const SECRET = process.env.JWT_SECRET || 'your_jwt_secret'

export async function register({ username, password }) {
  const exists = db.data.users.find(u => u.username === username)
  if (exists) throw new Error('User already exists')
  
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = {
    id: Date.now(),
    username,
    password: hashedPassword,
    role: 'user',
    createdAt: new Date()
  }
  
  db.data.users.push(user)
  await db.write()
  return user
}

export async function login({ username, password }) {
  const user = db.data.users.find(u => u.username === username)
  if (!user) throw new Error('User not found')
  
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid password')
  
  const token = jwt.sign(
    { id: user.id, role: user.role },
    SECRET,
    { expiresIn: '1d' }
  )
  
  return { user, token }
}
