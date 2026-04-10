import initSqlJs from 'sql.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'campus_club.db');

// ─── Password hashing ───
export function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

// ─── Validation utilities ───
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) return { valid: false, error: 'Password must contain letters' };
  return { valid: true };
}

export function validatePhoneNumber(phone) {
  const re = /^[0-9\-\+\(\)\s]{7,15}$/;
  return re.test(phone);
}

// ─── Token utils (no dependencies needed) ───
const SECRET = 'campus-club-secret-2026';
export function createToken(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.Student_ID, role: user.Role })).toString('base64');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}
export function verifyToken(token) {
  try {
    const [payload, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(payload, 'base64').toString());
  } catch { return null; }
}

// ─── sql.js wrapper (mimics better-sqlite3 API) ───
function createWrapper(sqlDb) {
  const save = () => fs.writeFileSync(DB_PATH, Buffer.from(sqlDb.export()));

  return {
    exec(sql) { sqlDb.run(sql); save(); },
    prepare(sql) {
      return {
        all(...params) {
          const stmt = sqlDb.prepare(sql);
          if (params.length) stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        run(...params) {
          if (params.length) {
            sqlDb.run(sql, params);
          } else {
            sqlDb.run(sql);
          }
          save();
          
          // Get last insert rowid using a more robust method
          let lastId = null;
          try {
            const result = sqlDb.exec("SELECT last_insert_rowid() as id");
            if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
              lastId = result[0].values[0][0];
            }
          } catch (e) {
            console.error('[DB] Error getting lastInsertRowid:', e);
          }
          
          const changes = sqlDb.getRowsModified();
          console.log('[DB.run] Executed:', { params_count: params.length, lastId, changes });
          return { lastInsertRowid: lastId, changes };
        },
        get(...params) {
          const stmt = sqlDb.prepare(sql);
          if (params.length) stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : undefined;
          stmt.free();
          return row;
        }
      };
    }
  };
}

// ─── Init ───
const SQL = await initSqlJs();
let sqlDb;
if (fs.existsSync(DB_PATH)) {
  sqlDb = new SQL.Database(fs.readFileSync(DB_PATH));
} else {
  sqlDb = new SQL.Database();
}
const db = createWrapper(sqlDb);
sqlDb.run("PRAGMA foreign_keys = ON");

// ─── Schema ───
db.exec(`
  CREATE TABLE IF NOT EXISTS STUDENT (
    Student_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    Role TEXT DEFAULT 'student' CHECK(Role IN ('student','admin')),
    Department TEXT,
    Semester INTEGER,
    Registration_Date TEXT DEFAULT (date('now')),
    DOB TEXT
  );
  CREATE TABLE IF NOT EXISTS STUDENT_PHONE (
    Student_ID INTEGER, Phone TEXT,
    PRIMARY KEY (Student_ID, Phone),
    FOREIGN KEY (Student_ID) REFERENCES STUDENT(Student_ID) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS CLUB (
    Club_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Club_Name TEXT NOT NULL, Description TEXT,
    Creation_Date TEXT DEFAULT (date('now'))
  );
  CREATE TABLE IF NOT EXISTS FACULTY_COORDINATOR (
    Faculty_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL, Email TEXT, Department TEXT,
    Club_ID INTEGER NOT NULL,
    FOREIGN KEY (Club_ID) REFERENCES CLUB(Club_ID) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS VENUE (
    Venue_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Venue_Name TEXT NOT NULL, Capacity INTEGER, Location TEXT
  );
  CREATE TABLE IF NOT EXISTS EVENT (
    Event_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Event_Name TEXT NOT NULL, Event_Date TEXT,
    Status TEXT DEFAULT 'Upcoming',
    Club_ID INTEGER, Venue_ID INTEGER,
    FOREIGN KEY (Club_ID) REFERENCES CLUB(Club_ID) ON DELETE CASCADE,
    FOREIGN KEY (Venue_ID) REFERENCES VENUE(Venue_ID)
  );
  CREATE TABLE IF NOT EXISTS MEMBERSHIP (
    Student_ID INTEGER, Club_ID INTEGER,
    Role TEXT DEFAULT 'Regular Member',
    Role_Assigned_Date TEXT DEFAULT (date('now')),
    PRIMARY KEY (Student_ID, Club_ID),
    FOREIGN KEY (Student_ID) REFERENCES STUDENT(Student_ID) ON DELETE CASCADE,
    FOREIGN KEY (Club_ID) REFERENCES CLUB(Club_ID) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS PROPOSAL (
    Proposal_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL, Description TEXT,
    Proposed_Date TEXT DEFAULT (date('now')),
    Status TEXT DEFAULT 'Pending',
    Student_ID INTEGER, Club_ID INTEGER,
    FOREIGN KEY (Student_ID, Club_ID) REFERENCES MEMBERSHIP(Student_ID, Club_ID)
  );
  CREATE TABLE IF NOT EXISTS VOTE (
    Proposal_ID INTEGER, Student_ID INTEGER,
    Vote_Type TEXT CHECK(Vote_Type IN ('Approve','Reject')),
    Vote_Date TEXT DEFAULT (date('now')),
    PRIMARY KEY (Proposal_ID, Student_ID),
    FOREIGN KEY (Proposal_ID) REFERENCES PROPOSAL(Proposal_ID) ON DELETE CASCADE,
    FOREIGN KEY (Student_ID) REFERENCES STUDENT(Student_ID) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS ATTENDANCE (
    Event_ID INTEGER, Student_ID INTEGER,
    CheckIn_Time TEXT DEFAULT (datetime('now')),
    Participation_Status TEXT DEFAULT 'Present',
    PRIMARY KEY (Event_ID, Student_ID),
    FOREIGN KEY (Event_ID) REFERENCES EVENT(Event_ID) ON DELETE CASCADE,
    FOREIGN KEY (Student_ID) REFERENCES STUDENT(Student_ID) ON DELETE CASCADE
  );
`);

// ─── Seed ───
const count = db.prepare('SELECT COUNT(*) as c FROM STUDENT').get();
if (count.c === 0) {
  const adminPw = hashPassword('admin123');
  const studentPw = hashPassword('student123');

  db.exec(`
    INSERT INTO STUDENT (Name, Email, Password, Role, Department, Semester, DOB) VALUES
      ('Admin User', 'admin@vit.ac.in', '${adminPw}', 'admin', 'CSE', 4, '2004-01-01');
    INSERT INTO STUDENT (Name, Email, Password, Role, Department, Semester, DOB) VALUES
      ('Advika Bhargav', 'advika@vit.ac.in', '${studentPw}', 'student', 'CSE', 4, '2005-06-15');
    INSERT INTO STUDENT (Name, Email, Password, Role, Department, Semester, DOB) VALUES
      ('Rahul Sharma', 'rahul@vit.ac.in', '${studentPw}', 'student', 'ECE', 3, '2005-08-22');
    INSERT INTO STUDENT (Name, Email, Password, Role, Department, Semester, DOB) VALUES
      ('Priya Patel', 'priya@vit.ac.in', '${studentPw}', 'student', 'CSE', 4, '2005-01-10');
    INSERT INTO STUDENT (Name, Email, Password, Role, Department, Semester, DOB) VALUES
      ('Arjun Kumar', 'arjun@vit.ac.in', '${studentPw}', 'student', 'MECH', 2, '2006-03-05');
    INSERT INTO STUDENT (Name, Email, Password, Role, Department, Semester, DOB) VALUES
      ('Sneha Reddy', 'sneha@vit.ac.in', '${studentPw}', 'student', 'IT', 3, '2005-11-18');

    INSERT INTO STUDENT_PHONE VALUES (2,'9876543210');
    INSERT INTO STUDENT_PHONE VALUES (2,'9876543211');
    INSERT INTO STUDENT_PHONE VALUES (3,'9123456789');
    INSERT INTO STUDENT_PHONE VALUES (4,'9988776655');

    INSERT INTO CLUB (Club_Name, Description) VALUES
      ('CodeCraft', 'Competitive programming and hackathons'),
      ('IEEE Student Branch', 'Technical papers and workshops'),
      ('Drama Club', 'Theatrical performances and skits'),
      ('Robotics Club', 'Building and programming robots');

    INSERT INTO FACULTY_COORDINATOR (Name, Email, Department, Club_ID) VALUES
      ('Dr. Meena Iyer', 'meena@vit.ac.in', 'CSE', 1),
      ('Prof. Anand Rao', 'anand@vit.ac.in', 'ECE', 2),
      ('Dr. Sunita Das', 'sunita@vit.ac.in', 'ENG', 3),
      ('Prof. Vikram Singh', 'vikram@vit.ac.in', 'MECH', 4);

    INSERT INTO VENUE (Venue_Name, Capacity, Location) VALUES
      ('Auditorium A', 500, 'Main Block'),
      ('Seminar Hall B', 100, 'Tech Park'),
      ('Open Air Theatre', 300, 'Central Campus'),
      ('Lab 301', 60, 'CS Block');

    INSERT INTO MEMBERSHIP (Student_ID, Club_ID, Role) VALUES
      (2,1,'Organizer'),(2,2,'Regular Member'),
      (3,1,'Regular Member'),(3,4,'Organizer'),
      (4,1,'Regular Member'),(4,3,'Organizer'),
      (5,4,'Regular Member'),(5,3,'Regular Member'),
      (6,2,'Regular Member'),(6,1,'Regular Member');

    INSERT INTO EVENT (Event_Name, Event_Date, Status, Club_ID, Venue_ID) VALUES
      ('Hackathon 2026', '2026-04-15', 'Upcoming', 1, 1),
      ('IEEE Workshop', '2026-03-20', 'Completed', 2, 2),
      ('Annual Drama Fest', '2026-05-01', 'Upcoming', 3, 3),
      ('Robo Wars', '2026-04-25', 'Upcoming', 4, 4);

    INSERT INTO PROPOSAL (Title, Description, Status, Student_ID, Club_ID) VALUES
      ('Weekend Coding Bootcamp', 'Two-day intensive coding workshop', 'Pending', 2, 1),
      ('Guest Lecture Series', 'Monthly guest lectures from industry', 'Approved', 6, 2),
      ('Inter-college Drama', 'Invite other colleges for drama fest', 'Pending', 4, 3);

    INSERT INTO VOTE (Proposal_ID, Student_ID, Vote_Type) VALUES
      (1,3,'Approve'),(1,4,'Approve'),(1,6,'Reject'),
      (2,2,'Approve'),(2,3,'Approve'),
      (3,5,'Approve'),(3,2,'Reject');

    INSERT INTO ATTENDANCE (Event_ID, Student_ID, Participation_Status) VALUES
      (2,2,'Present'),(2,6,'Present'),(2,3,'Absent');
  `);
}

export default db;
