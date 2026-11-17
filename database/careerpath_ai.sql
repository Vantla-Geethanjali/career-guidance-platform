CREATE DATABASE IF NOT EXISTS careerpath_ai;
USE careerpath_ai;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id INT PRIMARY KEY,
  department VARCHAR(100),
  study_year VARCHAR(30),
  interests TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS student_skills (
  user_id INT NOT NULL,
  skill_id INT NOT NULL,
  level ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
  PRIMARY KEY (user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS careers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  category VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS career_skills (
  career_id INT NOT NULL,
  skill_id INT NOT NULL,
  importance ENUM('nice_to_have','important','required') DEFAULT 'important',
  PRIMARY KEY (career_id, skill_id),
  FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  provider VARCHAR(100),
  url VARCHAR(500),
  skill_id INT,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS roadmaps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  career_id INT,
  title VARCHAR(160) NOT NULL,
  steps JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO skills(name) VALUES
('HTML'),('CSS'),('JavaScript'),('Python'),('SQL'),('Communication'),('Problem Solving');

INSERT INTO careers(title, description, category)
SELECT 'Frontend Developer', 'Build accessible and responsive user interfaces for websites and applications.', 'Technology'
WHERE NOT EXISTS (SELECT 1 FROM careers WHERE title='Frontend Developer');

INSERT INTO careers(title, description, category)
SELECT 'Data Analyst', 'Use data, SQL, spreadsheets and visualisation to support decisions.', 'Data'
WHERE NOT EXISTS (SELECT 1 FROM careers WHERE title='Data Analyst');

INSERT INTO careers(title, description, category)
SELECT 'Backend Developer', 'Build server-side applications, APIs and database integrations.', 'Technology'
WHERE NOT EXISTS (SELECT 1 FROM careers WHERE title='Backend Developer');
