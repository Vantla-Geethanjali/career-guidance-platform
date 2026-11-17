
import { useEffect, useState, useRef } from 'react';
import api from './api';
import Roadmap from './pages/Roadmap';

const menu = [
  ['Overview', '⌂'],
  ['Careers', '◈'],
  ['Skills', '✧'],
  ['Roadmap', '▤'],
  ['Courses', '▣'],
  ['AI Assistant', '✦'],
  ['My Profile', '○']
];

function App() {
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('Overview');
  const [careers, setCareers] = useState([]);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
    studyYear: ''
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile editing states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    department: '',
    studyYear: '',
    interests: ''
  });

  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Skill gap states
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [skillGap, setSkillGap] = useState(null);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsMessage, setSkillsMessage] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  // Dashboard progress
  const [dashboardSkillGap, setDashboardSkillGap] = useState(null);

  // Career recommendation states
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [interestInput, setInterestInput] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState('');

  // Courses states
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesMessage, setCoursesMessage] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedCourseLevel, setSelectedCourseLevel] = useState('All');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseTab, setCourseTab] = useState('Recommended For You');
  const [personalizedCourses, setPersonalizedCourses] = useState([]);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [personalizedMessage, setPersonalizedMessage] = useState('');

  // AI Assistant states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatRequestLock = useRef(false);

  // My Learning
  const [myLearning, setMyLearning] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('careerpath_my_learning') || '[]'
      );
    } catch {
      return [];
    }
  });

  // Restore logged-in user
  useEffect(() => {
    const token = localStorage.getItem('careerpath_token');

    if (token) {
      api.get('/profile/me')
        .then(res => {
          setUser(res.data.user || res.data);
        })
        .catch(() => {
          localStorage.removeItem('careerpath_token');
        });
    }
  }, []);

  // Load careers
  useEffect(() => {
    if (!user) return;

    api.get('/careers')
      .then(res => {
        const data = res.data.data || res.data;
        const careerList = Array.isArray(data) ? data : [];

        setCareers(careerList);

        setSelectedCareerId(current => {
          if (careerList.some(c => String(c.id) === current)) {
            return current;
          }

          return careerList.length
            ? String(careerList[0].id)
            : '';
        });
      })
      .catch(error => {
        console.error('Career loading error:', error);
        setCareers([]);
      });
  }, [user]);

  // Load Skill Gap Analysis
  useEffect(() => {
    if (!user || page !== 'Skills' || !selectedCareerId) {
      return;
    }

    let active = true;

    async function loadSkillGap() {
      setSkillsLoading(true);
      setSkillsMessage('');

      try {
        const { data } = await api.get(
          `/careers/${selectedCareerId}/skill-gap`
        );

        if (active) {
          setSkillGap(data);
        }
      } catch (error) {
        if (active) {
          setSkillGap(null);
          setSkillsMessage(
            error.response?.data?.message ||
            'Could not load skill analysis.'
          );
        }
      } finally {
        if (active) {
          setSkillsLoading(false);
        }
      }
    }

    loadSkillGap();

    return () => {
      active = false;
    };
  }, [user, page, selectedCareerId]);

  // Load dashboard skill progress
  useEffect(() => {
    if (!user || page !== 'Overview' || !selectedCareerId) {
      return;
    }

    let active = true;

    async function loadDashboardProgress() {
      try {
        const { data } = await api.get(
          `/careers/${selectedCareerId}/skill-gap`
        );

        if (active) {
          setDashboardSkillGap(data);
        }
      } catch (error) {
        console.error('Dashboard progress error:', error);

        if (active) {
          setDashboardSkillGap(null);
        }
      }
    }

    loadDashboardProgress();

    return () => {
      active = false;
    };
  }, [user, page, selectedCareerId]);

  // Load courses and personalized recommendations
  useEffect(() => {
    if (!user || page !== 'Courses') return;

    let active = true;

    async function loadCourses() {
      setCoursesLoading(true);
      setCoursesMessage('');

      try {
        const { data } = await api.get('/courses');

        if (active) {
          setCourses(data.courses || []);
        }
      } catch (error) {
        if (active) {
          setCourses([]);
          setCoursesMessage(
            error.response?.data?.message ||
            'Could not load courses.'
          );
        }
      } finally {
        if (active) {
          setCoursesLoading(false);
        }
      }
    }

    async function loadPersonalizedCourses() {
      setPersonalizedLoading(true);
      setPersonalizedMessage('');

      try {
        const { data } = await api.get('/courses/recommendations');

        if (active) {
          setPersonalizedCourses(data.recommendations || []);
        }
      } catch (error) {
        if (active) {
          setPersonalizedCourses([]);
          setPersonalizedMessage(
            error.response?.data?.message ||
            'Could not load personalized recommendations.'
          );
        }
      } finally {
        if (active) {
          setPersonalizedLoading(false);
        }
      }
    }

    loadCourses();
    loadPersonalizedCourses();

    return () => {
      active = false;
    };
  }, [user, page]);

  // Update registration form
  const update = (e) => {
    setForm(previous => ({
      ...previous,
      [e.target.name]: e.target.value
    }));
  };

  // Login and Registration
  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await api.post('/auth/register', form);

        setMessage('Account created successfully. Please sign in.');
        setMode('login');
      } else {
        const { data } = await api.post('/auth/login', {
          email: form.email,
          password: form.password
        });

        localStorage.setItem('careerpath_token', data.token);
        setUser(data.user);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Unable to complete your request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Generate career recommendations
  async function generateRecommendations() {
    const skillNames = [
      ...new Set(
        skillInput
          .split(',')
          .map(skill => skill.trim())
          .filter(Boolean)
      )
    ];

    if (!skillNames.length && !interestInput.trim()) {
      setRecommendationMessage(
        'Please enter at least one skill or an interest.'
      );
      return;
    }

    setRecommendationLoading(true);
    setRecommendationMessage('');
    setRecommendations([]);

    try {
      await api.put('/profile/me', {
        fullName: user.fullName || user.full_name,
        department: user.department || '',
        studyYear: user.studyYear || user.study_year || '',
        interests: interestInput.trim()
      });

      if (skillNames.length) {
        await api.post('/profile/skills', {
          skills: skillNames.map(name => ({
            name,
            level: skillLevel
          }))
        });
      }

      const { data } = await api.post('/careers/recommendations', {
        skills: skillNames,
        interests: interestInput.trim()
      });

      const results = Array.isArray(data)
        ? data
        : data?.recommendations || data?.data || [];

      setRecommendations(results);

      if (!results.length) {
        setRecommendationMessage(
          'No matching careers found. Try adding more skills or interests.'
        );
      }

      setUser(previous => ({
        ...previous,
        interests: interestInput.trim()
      }));
    } catch (error) {
      console.error('Recommendation error:', error);

      setRecommendationMessage(
        error.response?.data?.message ||
        'Could not generate recommendations. Please try again.'
      );
    } finally {
      setRecommendationLoading(false);
    }
  }

  // Save skills from Skill Gap Analysis
  async function saveStudentSkills() {
    if (!skillGap) return;

    const skillsToSave = skillGap.skills
      .filter(skill => skill.studentLevel)
      .map(skill => ({
        skillId: skill.skillId,
        level: skill.studentLevel
      }));

    if (!skillsToSave.length) {
      setSkillsMessage('Please select at least one skill level.');
      return;
    }

    setSavingSkills(true);
    setSkillsMessage('');

    try {
      await api.post('/profile/skills', {
        skills: skillsToSave
      });

      const { data } = await api.get(
        `/careers/${selectedCareerId}/skill-gap`
      );

      setSkillGap(data);
      setSkillsMessage('Your skills have been saved successfully!');
    } catch (error) {
      setSkillsMessage(
        error.response?.data?.message ||
        'Could not save your skills.'
      );
    } finally {
      setSavingSkills(false);
    }
  }

  // Save edited profile
  async function saveProfile(e) {
    e.preventDefault();

    if (!profileForm.fullName.trim()) {
      setProfileMessage('Full name cannot be empty.');
      return;
    }

    setProfileSaving(true);
    setProfileMessage('');

    try {
      await api.put('/profile/me', {
        fullName: profileForm.fullName.trim(),
        department: profileForm.department.trim(),
        studyYear: profileForm.studyYear,
        interests: profileForm.interests.trim()
      });

      setUser(previous => ({
        ...previous,
        fullName: profileForm.fullName.trim(),
        full_name: profileForm.fullName.trim(),
        department: profileForm.department.trim(),
        studyYear: profileForm.studyYear,
        study_year: profileForm.studyYear,
        interests: profileForm.interests.trim()
      }));

      setProfileEditing(false);
      setProfileMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);

      setProfileMessage(
        error.response?.data?.message ||
        'Could not update profile. Please try again.'
      );
    } finally {
      setProfileSaving(false);
    }
  }

  // Start a course and add it to My Learning
  function startCourse(course) {
    const alreadyAdded = myLearning.some(
      item => item.id === course.id
    );

    if (!alreadyAdded) {
      const updated = [
        ...myLearning,
        {
          ...course,
          startedAt: new Date().toISOString()
        }
      ];

      setMyLearning(updated);

      localStorage.setItem(
        'careerpath_my_learning',
        JSON.stringify(updated)
      );
    }

    if (course.url) {
      window.open(course.url, '_blank', 'noopener,noreferrer');
    }
  }

  // Remove a course from My Learning
  function removeCourse(courseId) {
    const updated = myLearning.filter(
      course => course.id !== courseId
    );

    setMyLearning(updated);

    localStorage.setItem(
      'careerpath_my_learning',
      JSON.stringify(updated)
    );
  }

  // Send a message to the AI Assistant
  async function sendChatMessage(text = chatInput) {
    const question = text.trim();

    if (!question || chatRequestLock.current) return;

    chatRequestLock.current = true;

    const history = chatMessages.map(item => ({
      role: item.role,
      content: item.content
    }));

    setChatMessages(previous => [
      ...previous,
      { role: 'user', content: question }
    ]);

    setChatInput('');
    setChatLoading(true);
    setChatError('');

    try {
      const { data } = await api.post('/ai/chat', {
        message: question,
        history
      });

      if (!data.success || !data.reply) {
        throw new Error(data.message || 'Empty AI response.');
      }

      setChatMessages(previous => [
        ...previous,
        { role: 'assistant', content: data.reply }
      ]);
    } catch (error) {
      console.error('AI Chat Error:', error);

      setChatError(
        error.response?.data?.message ||
        error.message ||
        'Unable to connect to AI Assistant.'
      );
    } finally {
      chatRequestLock.current = false;
      setChatLoading(false);
    }
  }

  // Logout
  function logout() {
    localStorage.removeItem('careerpath_token');

    setUser(null);
    setPage('Overview');
    setCareers([]);
    setSelectedCareerId('');
    setSkillGap(null);
    setDashboardSkillGap(null);
    setRecommendations([]);
    setSkillInput('');
    setInterestInput('');
    setCourses([]);
    setPersonalizedCourses([]);
    setChatMessages([]);
    setChatInput('');
    setChatError('');
    setSelectedSkill('All');
    setCourseSearch('');
    setCourseTab('Recommended For You');
    setCoursesMessage('');
    setPersonalizedMessage('');
    setMessage('');

    setProfileEditing(false);
    setProfileMessage('');
  }

  // Login / Registration screen
  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-left">
          <div className="brand">
            <span className="brand-icon">C</span>
            CareerPath AI
          </div>

          <div className="auth-hero">
            <span className="eyebrow">YOUR FUTURE STARTS HERE</span>

            <h1>
              Discover your path.
              <br />
              <span>Build your future.</span>
            </h1>

            <p>
              Explore career opportunities, discover the skills you need
              and create a learning journey designed around your goals.
            </p>

            <div className="hero-points">
              <span>✓ Career discovery</span>
              <span>✓ Skill development</span>
              <span>✓ Personal learning roadmap</span>
            </div>
          </div>

          <p className="auth-bottom">
            Learn today. Lead tomorrow.
          </p>
        </section>

        <section className="auth-right">
          <form className="auth-card" onSubmit={submit}>
            <span className="eyebrow">WELCOME TO CAREERPATH AI</span>

            <h2>
              {mode === 'login'
                ? 'Welcome back!'
                : 'Create your account'}
            </h2>

            <p className="muted">
              {mode === 'login'
                ? 'Sign in to continue your career journey.'
                : 'Start planning your career journey today.'}
            </p>

            {mode === 'register' && (
              <>
                <label>
                  Full name
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={update}
                    placeholder="Enter your full name"
                    required
                  />
                </label>

                <label>
                  Department
                  <input
                    name="department"
                    value={form.department}
                    onChange={update}
                    placeholder="e.g. Computer Science"
                  />
                </label>

                <label>
                  Study year
                  <select
                    name="studyYear"
                    value={form.studyYear}
                    onChange={update}
                  >
                    <option value="">Select study year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </label>
              </>
            )}

            <label>
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={update}
                placeholder="At least 8 characters"
                minLength="8"
                required
              />
            </label>

            <button className="primary-btn" disabled={loading}>
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign in →'
                  : 'Create account →'}
            </button>

            {message && (
              <p className="form-message">{message}</p>
            )}

            <p className="auth-switch">
              {mode === 'login'
                ? "Don't have an account?"
                : 'Already registered?'}

              <button
                type="button"
                className="text-btn"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setMessage('');
                }}
              >
                {mode === 'login' ? 'Create account' : 'Sign in'}
              </button>
            </p>
          </form>
        </section>
      </main>
    );
  }

  const name = user.fullName || user.full_name || 'Student';

  const progressPercentage = dashboardSkillGap?.totalSkills
    ? Math.min(
        100,
        Math.round(
          (dashboardSkillGap.learnedSkills /
            dashboardSkillGap.totalSkills) * 100
        )
      )
    : 0;

  return (
    <div className="app-layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">C</span>
          CareerPath <span className="brand-ai">AI</span>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {menu.map(([item, icon]) => (
            <button
              key={item}
              className={`nav-item ${page === item ? 'active' : ''}`}
              onClick={() => setPage(item)}
            >
              <span>{icon}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-profile">
            <div className="avatar">
              {name.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{name}</strong>
              <small>Student account</small>
            </div>
          </div>

          <button className="logout-btn" onClick={logout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">
              CAREER DEVELOPMENT PLATFORM
            </span>
            <h2>{page}</h2>
          </div>

          <div className="top-user">
            <span className="online-dot"></span>
            Welcome, {name}
          </div>
        </header>

        {/* Dashboard */}
        {page === 'Overview' && (
          <div className="dashboard-layout">

            <div className="dashboard-center">

              <section className="dashboard-welcome">
                <span className="banner-label">
                  YOUR JOURNEY STARTS HERE
                </span>

                <h1>Hello, {name}! 👋</h1>

                <p>
                  Keep building your skills and take the next step
                  towards your dream career.
                </p>

                <button
                  className="banner-btn"
                  onClick={() => setPage('Careers')}
                >
                  Explore careers →
                </button>
              </section>

              {/* Dashboard statistics */}
              <section className="dashboard-stats">

                <div className="dashboard-panel">
                  <span className="feature-icon">◈</span>
                  <h2>{careers.length}</h2>
                  <p>Available Careers</p>
                </div>

                <div className="dashboard-panel">
                  <span className="feature-icon">✧</span>
                  <h2>{dashboardSkillGap?.learnedSkills ?? 0}</h2>
                  <p>Skills Added</p>
                </div>

                <div className="dashboard-panel">
                  <span className="feature-icon">▣</span>
                  <h2>{myLearning.length}</h2>
                  <p>Courses Started</p>
                </div>

              </section>

              {/* Progress and learning */}
              <div className="dashboard-middle-grid">

                <section className="dashboard-panel">
                  <h3>Career Skill Progress</h3>

                  <p className="muted">
                    Your progress for the selected career.
                  </p>

                  {dashboardSkillGap ? (
                    <>
                      <h2>
                        {dashboardSkillGap.learnedSkills || 0}
                        {' / '}
                        {dashboardSkillGap.totalSkills || 0}
                      </h2>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${progressPercentage}%`
                          }}
                        />
                      </div>

                      <p className="muted">
                        {progressPercentage}% skills added
                      </p>
                    </>
                  ) : (
                    <p className="muted">
                      Select a career and add your skill levels
                      to see your progress.
                    </p>
                  )}

                  <button
                    className="outline-btn"
                    onClick={() => setPage('Skills')}
                  >
                    View skills →
                  </button>
                </section>

                <section className="dashboard-panel">
                  <h3>Learning Summary</h3>

                  <p className="muted">
                    Your learning activity at a glance.
                  </p>

                  <h2>{myLearning.length}</h2>
                  <p>Courses started</p>

                  <button
                    className="outline-btn"
                    onClick={() => {
                      setPage('Courses');
                      setCourseTab('My Learning');
                    }}
                  >
                    Continue learning →
                  </button>
                </section>

              </div>

              {/* Quick actions */}
              <section className="dashboard-panel dashboard-quick-panel">
                <h3>Quick Actions</h3>

                <div className="dashboard-quick-actions">
                  <button onClick={() => setPage('Careers')}>
                    ◈ Explore Careers
                  </button>

                  <button onClick={() => setPage('Skills')}>
                    ✧ Check Skills
                  </button>

                  <button onClick={() => setPage('Roadmap')}>
                    ▤ View Roadmap
                  </button>

                  <button onClick={() => setPage('AI Assistant')}>
                    ✦ Ask AI Assistant
                  </button>
                </div>
              </section>

              {/* Career preview */}
              <section className="content-card">
                <div className="section-heading">
                  <div>
                    <h3>Explore Career Options</h3>
                    <p>
                      Career paths available in your career library.
                    </p>
                  </div>

                  <button
                    className="outline-btn"
                    onClick={() => setPage('Careers')}
                  >
                    View all →
                  </button>
                </div>

                {careers.length ? (
                  careers.slice(0, 5).map(career => (
                    <div className="career-row" key={career.id}>
                      <div>
                        <strong>{career.title}</strong>
                        <p>{career.description}</p>
                      </div>

                      <span className="category-tag">
                        {career.category || 'Career'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    No career options available yet.
                  </p>
                )}
              </section>

            </div>

            {/* Right profile panel */}
            <aside className="dashboard-right">
              <section className="dashboard-profile-panel">
                <div className="avatar">
                  {name.charAt(0).toUpperCase()}
                </div>

                <h3>{name}</h3>
                <p className="muted">Student account</p>

                <div className="profile-row">
                  <span>Department</span>
                  <strong>{user.department || 'Not added'}</strong>
                </div>

                <div className="profile-row">
                  <span>Study year</span>
                  <strong>
                    {user.studyYear || user.study_year || 'Not added'}
                  </strong>
                </div>

                <button
                  className="outline-btn"
                  onClick={() => setPage('My Profile')}
                >
                  View Profile →
                </button>
              </section>
            </aside>

          </div>
        )}

        {/* Careers */}
        {page === 'Careers' && (
          <section className="content-card">
            <h3>Discover Your Career Path</h3>

            <p className="muted">
              Enter your skills and interests to discover career options
              that match your profile.
            </p>

            <label>
              Your existing skills
              <textarea
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                placeholder="Example: Python, Java, C++, HTML, Communication"
                rows={4}
              />
            </label>

            <label>
              Your skill proficiency
              <select
                value={skillLevel}
                onChange={e => setSkillLevel(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label>
              Your interests (Optional)
              <textarea
                value={interestInput}
                onChange={e => setInterestInput(e.target.value)}
                placeholder="Example: Data Science, Web Development, AI, Cybersecurity"
                rows={3}
              />
            </label>

            <button
              className="primary-btn"
              onClick={generateRecommendations}
              disabled={recommendationLoading}
            >
              {recommendationLoading
                ? 'Finding careers...'
                : 'Get Career Recommendations →'}
            </button>

            {recommendationMessage && (
              <p className="form-message">
                {recommendationMessage}
              </p>
            )}

            {recommendations.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3>Your Recommended Careers</h3>

                <p className="muted">
                  Career suggestions based on your entered skills and interests.
                </p>

                {recommendations.map(career => (
                  <div className="career-row" key={career.id}>
                    <div style={{ flex: 1 }}>
                      <strong>{career.title}</strong>
                      <p>{career.description}</p>

                      <span className="category-tag">
                        {career.category || 'Career'}
                      </span>

                      <p>
                        <strong>
                          Match: {career.matchPercentage ?? 0}%
                        </strong>
                      </p>

                      {career.skillsYouHave?.length > 0 && (
                        <p>
                          Skills you have:{' '}
                          {career.skillsYouHave.join(', ')}
                        </p>
                      )}

                      {career.skillsToLearn?.length > 0 && (
                        <p>
                          Skills to learn:{' '}
                          {career.skillsToLearn.join(', ')}
                        </p>
                      )}
                    </div>

                    <button
                      className="outline-btn"
                      onClick={() => {
                        setSelectedCareerId(String(career.id));
                        setPage('Skills');
                      }}
                    >
                      View Skill Gap →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Skill Gap Analysis */}
        {page === 'Skills' && (
          <section className="content-card">
            <h3>Skill Gap Analysis</h3>

            <p className="muted">
              Compare your current skills with the requirements of your target career.
            </p>

            <label>
              Select your career
              <select
                value={selectedCareerId}
                onChange={e => {
                  setSelectedCareerId(e.target.value);
                  setSkillGap(null);
                  setSkillsMessage('');
                }}
              >
                <option value="">Choose a career</option>

                {careers.map(career => (
                  <option key={career.id} value={career.id}>
                    {career.title}
                  </option>
                ))}
              </select>
            </label>

            {skillsLoading && (
              <p className="muted">Loading skill analysis...</p>
            )}

            {skillsMessage && (
              <p className="form-message">{skillsMessage}</p>
            )}

            {skillGap && (
              <>
                <div className="feature-grid">
                  <div className="feature-card">
                    <h3>{skillGap.totalSkills}</h3>
                    <p>Total required skills</p>
                  </div>

                  <div className="feature-card">
                    <h3>{skillGap.learnedSkills}</h3>
                    <p>Skills added</p>
                  </div>

                  <div className="feature-card">
                    <h3>{skillGap.missingSkillsCount}</h3>
                    <p>Missing skills</p>
                  </div>
                </div>

                <h3>Assess your skills</h3>

                {skillGap.skills.map(skill => (
                  <div className="career-row" key={skill.skillId}>
                    <div>
                      <strong>{skill.skillName}</strong>
                      <p>Importance: {skill.importance}</p>
                      <small>Status: {skill.status}</small>
                    </div>

                    <select
                      value={skill.studentLevel || ''}
                      onChange={e => {
                        const level = e.target.value;

                        setSkillGap(previous => ({
                          ...previous,
                          skills: previous.skills.map(item =>
                            item.skillId === skill.skillId
                              ? {
                                  ...item,
                                  studentLevel: level || null,
                                  status: !level
                                    ? 'Not learned'
                                    : level.charAt(0).toUpperCase() +
                                      level.slice(1)
                                }
                              : item
                          )
                        }));
                      }}
                    >
                      <option value="">Not learned</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                ))}

                <button
                  className="primary-btn"
                  onClick={saveStudentSkills}
                  disabled={savingSkills}
                >
                  {savingSkills ? 'Saving...' : 'Save My Skills'}
                </button>

                <div className="info-panel">
                  <span>✧</span>

                  <div>
                    <strong>Skills to improve</strong>

                    <p>
                      {skillGap.missingSkillsCount > 0
                        ? skillGap.missingSkills
                            .map(skill => skill.skillName)
                            .join(', ')
                        : 'No missing skills identified.'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* Roadmap */}
        {page === 'Roadmap' && (
          <Roadmap
            careers={careers}
            selectedCareerId={selectedCareerId}
            recommendations={recommendations}
            userId={user.id}
          />
        )}

        {/* Courses */}
        {page === 'Courses' && (
          <section className="content-card">
            <h3>Learning Hub</h3>

            <p className="muted">
              Discover courses based on your interests, skills and career goals.
            </p>

            <div className="course-tabs">
              {[
                'Recommended For You',
                'Explore Courses',
                'My Learning'
              ].map(tab => (
                <button
                  key={tab}
                  className={`outline-btn ${courseTab === tab ? 'active' : ''}`}
                  onClick={() => setCourseTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Recommended For You */}
            {courseTab === 'Recommended For You' && (
              <div>
                <h3>Recommended For You</h3>

                <p className="muted">
                  Courses selected using your interests, existing skills,
                  selected career, department and study year.
                </p>

                {personalizedLoading && (
                  <p className="muted">Finding courses for you...</p>
                )}

                {personalizedMessage && (
                  <p className="form-message">
                    {personalizedMessage}
                  </p>
                )}

                {!personalizedLoading &&
                  personalizedCourses.length > 0 && (
                    <div className="feature-grid">
                      {personalizedCourses.map(course => (
                        <div className="feature-card" key={course.id}>
                          <span className="feature-icon">✦</span>
                          <h3>{course.title}</h3>

                          <p>
                            Provider: {course.provider || 'Not specified'}
                          </p>

                          <span className="category-tag">
                            {course.skillName || course.category || 'General'}
                          </span>

                          <p>Level: {course.level || 'Beginner'}</p>

                          <p>
                            <strong>
                              Recommendation score: {course.score}
                            </strong>
                          </p>

                          {course.reasons?.map((reason, index) => (
                            <p key={index}>✓ {reason}</p>
                          ))}

                          <button
                            className="banner-btn"
                            onClick={() => startCourse(course)}
                            disabled={!course.url}
                          >
                            {myLearning.some(
                              item => item.id === course.id
                            )
                              ? 'Continue Learning →'
                              : 'Start Learning →'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                {!personalizedLoading &&
                  !personalizedMessage &&
                  personalizedCourses.length === 0 && (
                    <div className="info-panel">
                      <span>✧</span>

                      <div>
                        <strong>
                          No personalized recommendations yet
                        </strong>

                        <p>
                          Add your interests and skills, select a career
                          and complete your student profile to receive
                          suitable course recommendations.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Explore Courses */}
            {courseTab === 'Explore Courses' && (
              <div>
                <h3>Explore All Courses</h3>

                <label>
                  Search courses
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={e => setCourseSearch(e.target.value)}
                    placeholder="Search Python, Java, HTML..."
                  />
                </label>

                <label>
                  Filter by skill
                  <select
                    value={selectedSkill}
                    onChange={e => setSelectedSkill(e.target.value)}
                  >
                    <option value="All">All Skills</option>

                    {[...new Set(
                      courses
                        .map(course => course.skillName)
                        .filter(Boolean)
                    )].map(skill => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Filter by level
                  <select
                    value={selectedCourseLevel}
                    onChange={e => setSelectedCourseLevel(e.target.value)}
                  >
                    <option value="All">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>

                {coursesLoading && (
                  <p className="muted">Loading courses...</p>
                )}

                {coursesMessage && (
                  <p className="form-message">{coursesMessage}</p>
                )}

                {!coursesLoading && (
                  <div className="feature-grid">
                    {courses
                      .filter(course => {
                        const matchesSkill =
                          selectedSkill === 'All' ||
                          course.skillName === selectedSkill;

                        const searchText = [
                          course.title,
                          course.provider,
                          course.skillName,
                          course.category
                        ]
                          .filter(Boolean)
                          .join(' ')
                          .toLowerCase();

                        const matchesSearch = searchText.includes(
                          courseSearch.toLowerCase().trim()
                        );

                        const matchesLevel =
                          selectedCourseLevel === 'All' ||
                          (course.level || 'Beginner').toLowerCase() ===
                            selectedCourseLevel.toLowerCase();

                        return matchesSkill && matchesSearch && matchesLevel;
                      })
                      .map(course => (
                        <div className="feature-card" key={course.id}>
                          <span className="feature-icon">▣</span>
                          <h3>{course.title}</h3>

                          <p>
                            Provider: {course.provider || 'Not specified'}
                          </p>

                          <span className="category-tag">
                            {course.skillName || course.category || 'General'}
                          </span>

                          <p>Level: {course.level || 'Beginner'}</p>

                          <button
                            className="banner-btn"
                            onClick={() => startCourse(course)}
                            disabled={!course.url}
                          >
                            {myLearning.some(
                              item => item.id === course.id
                            )
                              ? 'Continue Learning →'
                              : 'Start Learning →'}
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {!coursesLoading &&
                  courses.length === 0 &&
                  !coursesMessage && (
                    <p className="muted">
                      No courses available right now.
                    </p>
                  )}
              </div>
            )}

            {/* My Learning */}
            {courseTab === 'My Learning' && (
              <div>
                <h3>My Learning</h3>

                <p className="muted">
                  Courses you have started will appear here.
                </p>

                {myLearning.length > 0 ? (
                  <div className="feature-grid">
                    {myLearning.map(course => (
                      <div className="feature-card" key={course.id}>
                        <span className="feature-icon">✓</span>
                        <h3>{course.title}</h3>

                        <p>
                          Provider: {course.provider || 'Not specified'}
                        </p>

                        <span className="category-tag">
                          {course.skillName || 'General'}
                        </span>

                        <button
                          className="banner-btn"
                          onClick={() => {
                            if (course.url) {
                              window.open(
                                course.url,
                                '_blank',
                                'noopener,noreferrer'
                              );
                            }
                          }}
                        >
                          Continue Learning →
                        </button>

                        <button
                          className="outline-btn"
                          onClick={() => removeCourse(course.id)}
                        >
                          Remove from My Learning
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="info-panel">
                    <span>▣</span>

                    <div>
                      <strong>No courses started yet</strong>

                      <p>
                        Explore courses and click Start Learning.
                        Your selected courses will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* AI Assistant */}
        {page === 'AI Assistant' && (
          <section className="content-card ai-chat-page">
            <div className="ai-chat-heading">
              <div className="ai-chat-heading-icon">✦</div>

              <div>
                <h3>AI Learning Assistant</h3>
                <p className="muted">
                  Ask about careers, skills, or free learning resources.
                </p>
              </div>
            </div>

            <div className="ai-chat-window" aria-live="polite">
              {chatMessages.length === 0 ? (
                <div className="ai-chat-empty">
                  <div className="ai-chat-empty-icon">✦</div>

                  <h3>How can I help you today?</h3>

                  <p>
                    I can help you explore careers, understand technical skills,
                    create learning plans, and find learning resources.
                  </p>

                  <div className="ai-suggestions">
                    {[
                      'Which career is suitable for a Python beginner?',
                      'What skills are needed to become a Data Analyst?',
                      'Give me a free roadmap to learn web development.',
                      'How can I prepare for a technical interview?'
                    ].map(question => (
                      <button
                        type="button"
                        className="ai-suggestion"
                        key={question}
                        onClick={() => sendChatMessage(question)}
                        disabled={chatLoading}
                      >
                        {question} <span>↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ai-chat-messages">
                  {chatMessages.map((item, index) => (
                    <div
                      className={`ai-message-row ${
                        item.role === 'user'
                          ? 'user-message-row'
                          : 'assistant-message-row'
                      }`}
                      key={`${item.role}-${index}`}
                    >
                      {item.role === 'assistant' && (
                        <div className="ai-message-avatar">✦</div>
                      )}

                      <div
                        className={`ai-message-bubble ${
                          item.role === 'user'
                            ? 'user-bubble'
                            : 'assistant-bubble'
                        }`}
                      >
                        {item.content}
                      </div>

                      {item.role === 'user' && (
                        <div className="ai-user-avatar">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="ai-message-row assistant-message-row">
                      <div className="ai-message-avatar">✦</div>

                      <div className="ai-message-bubble assistant-bubble ai-typing">
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {chatError && (
              <p className="form-message ai-chat-error">
                {chatError}
              </p>
            )}

            <form
              className="ai-chat-form"
              onSubmit={event => {
                event.preventDefault();
                sendChatMessage();
              }}
            >
              <textarea
                value={chatInput}
                onChange={event => setChatInput(event.target.value)}
                placeholder="Type your question here..."
                rows={2}
                disabled={chatLoading}
              />

              <button
                type="submit"
                className="primary-btn ai-send-button"
                disabled={chatLoading || !chatInput.trim()}
              >
                {chatLoading ? 'Sending...' : 'Send ↗'}
              </button>
            </form>

            <p className="ai-chat-note">
              CareerPath AI can make mistakes. Check important information
              with reliable sources.
            </p>
          </section>
        )}

        {/* My Profile */}
        {page === 'My Profile' && (
          <section className="content-card profile-page">

            <div className="section-heading">
              <div>
                <h3>My Profile</h3>
                <p className="muted">
                  Manage your personal and academic information.
                </p>
              </div>

              {!profileEditing && (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setProfileForm({
                      fullName: user.fullName || user.full_name || '',
                      department: user.department || '',
                      studyYear: user.studyYear || user.study_year || '',
                      interests: user.interests || ''
                    });

                    setProfileMessage('');
                    setProfileEditing(true);
                  }}
                >
                  Edit Profile ✎
                </button>
              )}
            </div>

            {profileEditing ? (
              <form onSubmit={saveProfile}>

                <label>
                  Full Name
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={e =>
                      setProfileForm(previous => ({
                        ...previous,
                        fullName: e.target.value
                      }))
                    }
                    placeholder="Enter your full name"
                    required
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                  />
                  <small className="muted">
                    Email cannot be changed here.
                  </small>
                </label>

                <label>
                  Department
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={e =>
                      setProfileForm(previous => ({
                        ...previous,
                        department: e.target.value
                      }))
                    }
                    placeholder="Enter your department"
                  />
                </label>

                <label>
                  Study Year
                  <select
                    value={profileForm.studyYear}
                    onChange={e =>
                      setProfileForm(previous => ({
                        ...previous,
                        studyYear: e.target.value
                      }))
                    }
                  >
                    <option value="">Select study year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </label>

                <label>
                  Career Interests
                  <textarea
                    value={profileForm.interests}
                    onChange={e =>
                      setProfileForm(previous => ({
                        ...previous,
                        interests: e.target.value
                      }))
                    }
                    placeholder="Example: Web Development, AI, Data Science"
                    rows={4}
                  />
                </label>

                <div className="profile-actions">
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={profileSaving}
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    className="outline-btn"
                    disabled={profileSaving}
                    onClick={() => {
                      setProfileEditing(false);
                      setProfileMessage('');
                    }}
                  >
                    Cancel
                  </button>
                </div>

              </form>
            ) : (
              <>
                <div className="profile-row">
                  <span>Full Name</span>
                  <strong>{name}</strong>
                </div>

                <div className="profile-row">
                  <span>Email</span>
                  <strong>{user.email || 'Not added'}</strong>
                </div>

                <div className="profile-row">
                  <span>Department</span>
                  <strong>{user.department || 'Not added'}</strong>
                </div>

                <div className="profile-row">
                  <span>Study Year</span>
                  <strong>
                    {user.studyYear || user.study_year || 'Not added'}
                  </strong>
                </div>

                <div className="profile-row">
                  <span>Interests</span>
                  <strong>{user.interests || 'Not added'}</strong>
                </div>
              </>
            )}

            {profileMessage && (
              <p className="form-message">{profileMessage}</p>
            )}

          </section>
        )}

        <footer className="app-footer">
          CareerPath AI · Learn today. Lead tomorrow.
        </footer>
      </main>
    </div>
  );
}

export default App;
