
import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// Get all courses
router.get('/', async (_req, res) => {
  try {
    const [courses] = await db.query(`
      SELECT
        c.id,
        c.title,
        c.provider,
        c.url,
        c.skill_id AS skillId,
        s.name AS skillName
      FROM courses c
      LEFT JOIN skills s ON c.skill_id = s.id
      ORDER BY s.name, c.title
    `);

    res.json({
      success: true,
      total: courses.length,
      courses
    });

  } catch (error) {
    console.error('Courses loading error:', error);

    res.status(500).json({
      success: false,
      message: 'Could not load courses'
    });
  }
});

// Get courses by skill ID
router.get('/skill/:skillId', async (req, res) => {
  try {
    const skillId = Number(req.params.skillId);

    if (!Number.isInteger(skillId) || skillId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skill ID'
      });
    }

    const [courses] = await db.query(`
      SELECT
        c.id,
        c.title,
        c.provider,
        c.url,
        c.skill_id AS skillId,
        s.name AS skillName
      FROM courses c
      LEFT JOIN skills s ON c.skill_id = s.id
      WHERE c.skill_id = ?
      ORDER BY c.title
    `, [skillId]);

    res.json({
      success: true,
      total: courses.length,
      courses
    });

  } catch (error) {
    console.error('Skill courses error:', error);

    res.status(500).json({
      success: false,
      message: 'Could not load skill courses'
    });
  }
});

export default router;
