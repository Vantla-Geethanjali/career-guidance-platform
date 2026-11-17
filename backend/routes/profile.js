import { Router } from 'express';
import db from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const validLevels = ['beginner', 'intermediate', 'advanced'];

// Get student profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.full_name AS fullName, u.email,
              p.department, p.study_year AS studyYear, p.interests
       FROM users u
       LEFT JOIN student_profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load profile' });
  }
});

// Update student profile and interests
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { fullName, department, studyYear, interests } = req.body;

    if (fullName !== undefined && !String(fullName).trim()) {
      return res.status(400).json({ message: 'Full name cannot be empty' });
    }

    if (fullName !== undefined) {
      await db.query(
        'UPDATE users SET full_name = ? WHERE id = ?',
        [String(fullName).trim(), req.user.id]
      );
    }

    await db.query(
      `INSERT INTO student_profiles (user_id, department, study_year, interests)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         department = VALUES(department),
         study_year = VALUES(study_year),
         interests = VALUES(interests)`,
      [
        req.user.id,
        department || null,
        studyYear || null,
        interests || null
      ]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update profile' });
  }
});

// Get skills saved by the logged-in student
router.get('/skills', requireAuth, async (req, res) => {
  try {
    const [skills] = await db.query(
      `SELECT s.id, s.name, ss.level
       FROM student_skills ss
       JOIN skills s ON s.id = ss.skill_id
       WHERE ss.user_id = ?
       ORDER BY s.name`,
      [req.user.id]
    );

    res.json(skills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load skills' });
  }
});

// Add or update student skills
// Accepts either { name, level } or { skillId, level }
router.post('/skills', requireAuth, async (req, res) => {
  let connection;

  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        message: 'Skills must be an array'
      });
    }

    for (const skill of skills) {
      const hasName = typeof skill.name === 'string' && skill.name.trim();
      const hasId = Number.isInteger(Number(skill.skillId)) &&
                    Number(skill.skillId) > 0;

      if (
        (!hasName && !hasId) ||
        !validLevels.includes(skill.level)
      ) {
        return res.status(400).json({
          message: 'Each skill needs a valid name or skill ID and level'
        });
      }

      if (hasName && skill.name.trim().length > 100) {
        return res.status(400).json({
          message: 'Skill names must be 100 characters or fewer'
        });
      }
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    for (const skill of skills) {
      let skillId;

      if (typeof skill.name === 'string' && skill.name.trim()) {
        const skillName = skill.name.trim();

        // Create the skill if it is not already in the database
        await connection.query(
          'INSERT IGNORE INTO skills (name) VALUES (?)',
          [skillName]
        );

        const [rows] = await connection.query(
          'SELECT id FROM skills WHERE name = ?',
          [skillName]
        );

        if (!rows.length) {
          throw new Error(`Could not find skill: ${skillName}`);
        }

        skillId = rows[0].id;
      } else {
        skillId = Number(skill.skillId);

        const [rows] = await connection.query(
          'SELECT id FROM skills WHERE id = ?',
          [skillId]
        );

        if (!rows.length) {
          throw new Error(`Skill ID ${skillId} does not exist`);
        }
      }

      await connection.query(
        `INSERT INTO student_skills (user_id, skill_id, level)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE level = VALUES(level)`,
        [req.user.id, skillId, skill.level]
      );
    }

    await connection.commit();

    res.json({
      message: 'Student skills saved successfully'
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(error);
    res.status(500).json({
      message: 'Could not save student skills'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;