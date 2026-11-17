import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, department, studyYear, interests } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users(full_name,email,password_hash) VALUES(?,?,?)',
      [fullName, email, hash]
    );
    await db.query(
      'INSERT INTO student_profiles(user_id,department,study_year,interests) VALUES(?,?,?,?)',
      [result.insertId, department || null, studyYear || null, interests || null]
    );
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not register user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length || !(await bcrypt.compare(password || '', rows[0].password_hash))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }
    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not log in' });
  }
});

export default router;
