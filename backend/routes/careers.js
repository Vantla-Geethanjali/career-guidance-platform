
import { Router } from 'express';
import db from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Convert comma-separated input or an array into a clean list
function toList(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim().toLowerCase()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
  }

  return [];
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

// Check whether a student's skill matches a required skill
function skillMatches(studentSkill, requiredSkill) {
  return (
    studentSkill === requiredSkill ||
    studentSkill.includes(requiredSkill) ||
    requiredSkill.includes(studentSkill)
  );
}

// Get all careers
router.get('/', async (_req, res) => {
  try {
    const [careers] = await db.query(
      'SELECT id, title, description, category FROM careers ORDER BY title'
    );

    res.json(careers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load careers' });
  }
});

// Get personalised career recommendations
router.post('/recommendations', requireAuth, async (req, res) => {
  try {
    const studentSkills = toList(req.body.skills);
    const interests = toList(req.body.interests);

    if (studentSkills.length === 0 && interests.length === 0) {
      return res.status(400).json({
        message: 'Please enter at least one skill or interest'
      });
    }

    // Get careers and their required skills from the database
    const [rows] = await db.query(`
      SELECT
        c.id,
        c.title,
        c.description,
        c.category,
        s.name AS skillName,
        cs.importance
      FROM careers c
      LEFT JOIN career_skills cs ON cs.career_id = c.id
      LEFT JOIN skills s ON s.id = cs.skill_id
      ORDER BY c.title
    `);

    // Group required skills under each career
    const careerMap = new Map();

    for (const row of rows) {
      if (!careerMap.has(row.id)) {
        careerMap.set(row.id, {
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category,
          requiredSkills: []
        });
      }

      if (row.skillName) {
        careerMap.get(row.id).requiredSkills.push(row.skillName);
      }
    }

    // Calculate a match percentage for every career
    const recommendations = [...careerMap.values()].map(career => {
      const requiredSkills = career.requiredSkills.map(normalize);

      const matchedSkills = requiredSkills.filter(required =>
        studentSkills.some(student => skillMatches(student, required))
      );

      const missingSkills = career.requiredSkills.filter(required =>
        !studentSkills.some(student =>
          skillMatches(student, normalize(required))
        )
      );

      const careerText = normalize(
        `${career.title} ${career.category || ''} ${career.description || ''}`
      );

      const interestMatched = interests.some(interest =>
        careerText.includes(interest)
      );

      let score = 0;

      if (requiredSkills.length > 0 && interests.length > 0) {
        const skillScore =
          (matchedSkills.length / requiredSkills.length) * 70;

        const interestScore = interestMatched ? 30 : 0;
        score = skillScore + interestScore;
      } else if (requiredSkills.length > 0) {
        score = (matchedSkills.length / requiredSkills.length) * 100;
      } else if (interests.length > 0) {
        score = interestMatched ? 100 : 0;
      }

      return {
        id: career.id,
        title: career.title,
        description: career.description,
        category: career.category,
        matchPercentage: Math.round(score),
        skillsYouHave: matchedSkills.map(skill =>
          career.requiredSkills[requiredSkills.indexOf(skill)]
        ),
        skillsToLearn: missingSkills
      };
    });

    recommendations.sort(
      (a, b) => b.matchPercentage - a.matchPercentage
    );

    res.json({
  message: 'Career recommendations generated successfully',
  total: recommendations.length,
  recommendations
});

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not generate career recommendations'
    });
  }
});

// Get a roadmap for a custom career
router.post('/custom-roadmap', requireAuth, async (req, res) => {
  try {
    const careerTitle = String(req.body.careerTitle || '').trim();

    if (!careerTitle) {
      return res.status(400).json({
        message: 'Please enter your target career.'
      });
    }

    const title = careerTitle.toLowerCase();

    // Predefined skill suggestions for common career paths
    const careerSkillRules = [
      {
        keywords: ['ui/ux', 'ui ux', 'ux designer', 'ui designer'],
        skills: ['Figma', 'UI Design', 'UX Research', 'Wireframing', 'Prototyping']
      },
      {
        keywords: ['data scientist', 'data science'],
        skills: ['Python', 'SQL', 'Statistics', 'Machine Learning', 'Data Visualization']
      },
      {
        keywords: ['data analyst', 'data analysis'],
        skills: ['Python', 'SQL', 'Excel', 'Statistics', 'Power BI']
      },
      {
        keywords: ['frontend', 'front-end', 'web designer'],
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design']
      },
      {
        keywords: ['backend', 'back-end'],
        skills: ['JavaScript', 'Node.js', 'Express.js', 'SQL', 'API Development']
      },
      {
        keywords: ['full stack', 'full-stack'],
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'SQL']
      },
      {
        keywords: ['software developer', 'software engineer'],
        skills: ['Programming', 'Java', 'Python', 'Data Structures', 'Problem Solving', 'SQL']
      },
      {
        keywords: ['ai engineer', 'artificial intelligence', 'machine learning', 'ml engineer'],
        skills: ['Python', 'Mathematics', 'Statistics', 'Machine Learning', 'Deep Learning']
      },
      {
        keywords: ['cybersecurity', 'security analyst'],
        skills: ['Networking', 'Linux', 'Cybersecurity Fundamentals', 'Ethical Hacking', 'Cryptography']
      },
      {
        keywords: ['cloud engineer', 'cloud computing'],
        skills: ['Linux', 'Networking', 'AWS', 'Cloud Computing', 'Docker']
      },
      {
        keywords: ['devops'],
        skills: ['Linux', 'Git', 'Docker', 'CI/CD', 'Cloud Computing']
      },
      {
        keywords: ['mobile app', 'android developer', 'ios developer'],
        skills: ['Programming', 'Java', 'Kotlin', 'Mobile UI Design', 'API Integration']
      },
      {
        keywords: ['graphic designer'],
        skills: ['Graphic Design', 'Adobe Photoshop', 'Adobe Illustrator', 'Typography', 'Color Theory']
      },
      {
        keywords: ['digital marketer', 'digital marketing'],
        skills: ['SEO', 'Social Media Marketing', 'Content Marketing', 'Google Analytics', 'Email Marketing']
      },
      {
        keywords: ['business analyst'],
        skills: ['Excel', 'SQL', 'Business Analysis', 'Data Visualization', 'Communication']
      }
    ];

    const matchedRule = careerSkillRules.find(rule =>
      rule.keywords.some(keyword => title.includes(keyword))
    );

    if (!matchedRule) {
      return res.status(400).json({
        message: 'We could not identify this career yet. Please enter a more specific career title.'
      });
    }

    res.json({
      success: true,
      career: careerTitle,
      source: 'rule-based skill suggestions',
      skills: matchedRule.skills.map(name => ({
        name,
        level: 'beginner'
      }))
    });

  } catch (error) {
    console.error('Custom roadmap error:', error);

    res.status(500).json({
      message: 'Could not generate a custom career roadmap.'
    });
  }
});

// Get skill gap analysis for a selected career
router.get('/:careerId/skill-gap', requireAuth, async (req, res) => {
  try {
    const careerId = Number(req.params.careerId);

    if (!Number.isInteger(careerId) || careerId <= 0) {
      return res.status(400).json({ message: 'Invalid career ID' });
    }

    const [careerRows] = await db.query(
      'SELECT id, title, description, category FROM careers WHERE id = ?',
      [careerId]
    );

    if (!careerRows.length) {
      return res.status(404).json({ message: 'Career not found' });
    }

    const [skills] = await db.query(
      `SELECT
          s.id AS skillId,
          s.name AS skillName,
          cs.importance,
          ss.level AS studentLevel
       FROM career_skills cs
       JOIN skills s ON s.id = cs.skill_id
       LEFT JOIN student_skills ss
          ON ss.skill_id = s.id
          AND ss.user_id = ?
       WHERE cs.career_id = ?
       ORDER BY s.name`,
      [req.user.id, careerId]
    );

    const analyzedSkills = skills.map(skill => ({
      ...skill,
      status: !skill.studentLevel
        ? 'Not learned'
        : skill.studentLevel === 'beginner'
        ? 'Beginner'
        : skill.studentLevel === 'intermediate'
        ? 'Intermediate'
        : 'Advanced'
    }));

    const missingSkills = analyzedSkills.filter(
      skill => !skill.studentLevel
    );

    const improvementSkills = analyzedSkills.filter(
      skill => skill.studentLevel === 'beginner'
    );

    res.json({
      career: careerRows[0],
      totalSkills: analyzedSkills.length,
      learnedSkills: analyzedSkills.length - missingSkills.length,
      missingSkillsCount: missingSkills.length,
      improvementSkillsCount: improvementSkills.length,
      skills: analyzedSkills,
      missingSkills,
      improvementSkills
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not generate skill gap analysis'
    });
  }
});

export default router;
