
import { useEffect, useState } from 'react';
import api from '../api';

export default function Roadmap({
  careers = [],
  selectedCareerId = '',
  recommendations = [],
  userId
}) {
  const [careerId, setCareerId] = useState(
    selectedCareerId || recommendations[0]?.id || careers[0]?.id || ''
  );

  const [customCareer, setCustomCareer] = useState('');
  const [roadmapSkills, setRoadmapSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);

  const isCustom = String(careerId) === 'custom';

  const customSlug = customCareer.trim().toLowerCase().replace(/\s+/g, '-');

  const storageKey = `careerpath_roadmap_${userId}_${
    isCustom ? `custom_${customSlug}` : careerId
  }`;

  useEffect(() => {
    if (!careerId || isCustom) {
      setRoadmapSkills([]);
      setGenerated(false);
      return;
    }

    loadCareerRoadmap();
  }, [careerId]);

  useEffect(() => {
    if (!careerId) return;

    try {
      const saved = localStorage.getItem(storageKey);
      setCompletedTasks(saved ? JSON.parse(saved) : []);
    } catch {
      setCompletedTasks([]);
    }
  }, [careerId, storageKey]);

  async function loadCareerRoadmap() {
    try {
      setLoading(true);
      setError('');
      setGenerated(false);

      const response = await api.get(`/careers/${careerId}/skill-gap`);
      const result = response.data.data || response.data;
      const skills = result.skills || [];

      if (!skills.length) {
        setRoadmapSkills([]);
        setError('No skills are available for this career yet.');
        return;
      }

      setRoadmapSkills(
        skills.map((item) => ({
          name: item.name || item.skillName || item.skill_name,
          level: item.level || item.studentLevel || 'beginner'
        }))
      );

      setGenerated(true);
    } catch (err) {
      setRoadmapSkills([]);
      setError(
        err.response?.data?.message ||
        'Unable to load this career roadmap. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateCustomRoadmap() {
    if (!customCareer.trim()) {
      setError('Please enter your target career.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setGenerated(false);

      const response = await api.post('/careers/custom-roadmap', {
        careerTitle: customCareer.trim()
      });

      const skills = response.data.skills || [];

      if (!skills.length) {
        setError('No related skills were found for this career.');
        return;
      }

      setRoadmapSkills(skills);

      const saved = localStorage.getItem(storageKey);
      try {
        setCompletedTasks(saved ? JSON.parse(saved) : []);
      } catch {
        setCompletedTasks([]);
      }

      setGenerated(true);
    } catch (err) {
      setRoadmapSkills([]);
      setError(
        err.response?.data?.message ||
        'Unable to generate this custom roadmap.'
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleTask(taskId) {
    setCompletedTasks((previous) => {
      const updated = previous.includes(taskId)
        ? previous.filter((id) => id !== taskId)
        : [...previous, taskId];

      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }

  const tasks = roadmapSkills.flatMap((skill, index) => [
    {
      id: `${index}-1`,
      skill: skill.name,
      title: `Learn the basics of ${skill.name}`,
      description: `Understand the important concepts and fundamentals of ${skill.name}.`
    },
    {
      id: `${index}-2`,
      skill: skill.name,
      title: `Practise ${skill.name}`,
      description: `Solve exercises and practise what you have learned.`
    },
    {
      id: `${index}-3`,
      skill: skill.name,
      title: `Build a small project using ${skill.name}`,
      description: `Apply your knowledge by completing a practical project.`
    }
  ]);

  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progress = totalTasks
    ? Math.round((completedCount / totalTasks) * 100)
    : 0;

  const selectedCareer = careers.find(
    (career) => String(career.id) === String(careerId)
  );

  return (
    <div className="roadmap-container">
      <div className="roadmap-heading">
        <h2>My Learning Roadmap</h2>
        <p>
          Choose your target career and generate a personalised learning plan.
        </p>
      </div>

      <div className="roadmap-generator">
        <label htmlFor="careerSelect">Select Your Target Career</label>

        <select
          id="careerSelect"
          value={careerId}
          onChange={(e) => {
            setCareerId(e.target.value);
            setError('');
            setGenerated(false);
            setRoadmapSkills([]);
            setCustomCareer('');
          }}
        >
          <option value="">-- Select a Career --</option>

          {careers.map((career) => (
            <option key={career.id} value={career.id}>
              {career.title}
            </option>
          ))}

          <option value="custom">Other - Enter Your Own Career</option>
        </select>

        {isCustom && (
          <div className="custom-career-form">
            <label htmlFor="customCareer">
              Enter Your Target Career
            </label>

            <input
              id="customCareer"
              type="text"
              placeholder="Example: UI/UX Designer"
              value={customCareer}
              onChange={(e) => {
                setCustomCareer(e.target.value);
                setGenerated(false);
                setError('');
              }}
            />

            <button
              type="button"
              onClick={generateCustomRoadmap}
              className="roadmap-generate-btn"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate My Roadmap'}
            </button>
          </div>
        )}

        {!isCustom && careerId && (
          <button
            type="button"
            onClick={loadCareerRoadmap}
            className="roadmap-generate-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Get Learning Roadmap'}
          </button>
        )}

        {error && <p className="roadmap-error">{error}</p>}
      </div>

      {generated && (
        <div className="roadmap-results">
          <div className="roadmap-progress-card">
            <h3>
              {isCustom ? customCareer : selectedCareer?.title || 'Your Career'} Roadmap
            </h3>

            <p>
              {completedCount} of {totalTasks} learning tasks completed
            </p>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <strong>{progress}% Completed</strong>
          </div>

          {roadmapSkills.map((skill, index) => (
            <div className="roadmap-card" key={`${skill.name}-${index}`}>
              <h3>
                Step {index + 1}: {skill.name}
              </h3>

              <div className="roadmap-tasks">
                {tasks
                  .filter((task) => task.skill === skill.name)
                  .map((task) => (
                    <label className="roadmap-checkbox" key={task.id}>
                      <input
                        type="checkbox"
                        checked={completedTasks.includes(task.id)}
                        onChange={() => toggleTask(task.id)}
                      />

                      <span>
                        <strong>{task.title}</strong>
                        <small>{task.description}</small>
                      </span>
                    </label>
                  ))}
              </div>

              <div className="roadmap-resources">
                <strong>Learning Resources:</strong>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(skill.name + ' tutorial for beginners')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  YouTube Tutorials
                </a>

                <a
                  href={`https://devdocs.io/#q=${encodeURIComponent(skill.name)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation
                </a>
              </div>
            </div>
          ))}

          {progress === 100 && (
            <div className="roadmap-success">
              Congratulations! You have completed your learning roadmap.
            </div>
          )}

          {isCustom && (
            <p className="custom-roadmap-note">
              This roadmap uses automatically suggested skills for your
              selected career.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
