import express from 'express';
import cors from 'cors';
import db, { hashPassword, createToken, verifyToken, validateEmail, validatePassword, validatePhoneNumber } from './db.js';

const app = express();

// CORS Configuration - Allow frontend URLs
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// ─── Auth Middleware ───
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.user = payload;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// ─── AUTH ROUTES ───
app.post('/api/auth/register', (req, res) => {
  const { Name, Email, Password, Department, Semester, DOB, Phones } = req.body;
  if (!Name || !Email || !Password) return res.status(400).json({ error: 'Name, Email, Password required' });
  
  // Validate email
  if (!validateEmail(Email)) return res.status(400).json({ error: 'Invalid email format' });
  
  // Validate password
  const pwCheck = validatePassword(Password);
  if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });
  
  try {
    const hashed = hashPassword(Password);
    const info = db.prepare('INSERT INTO STUDENT (Name, Email, Password, Role, Department, Semester, DOB) VALUES (?,?,?,?,?,?,?)')
      .run(Name, Email, hashed, 'student', Department || null, Number(Semester) || null, DOB || null);
    
    let studentId = info.lastInsertRowid;
    console.log('[REGISTER] Insert result:', { lastInsertRowid: studentId, changes: info.changes });
    
    // Fallback: if lastInsertRowid didn't work, query by email
    if (!studentId || studentId === null || studentId === undefined) {
      console.log('[REGISTER] lastInsertRowid failed, querying by email as fallback...');
      const student = db.prepare('SELECT Student_ID FROM STUDENT WHERE Email = ?').get(Email);
      if (student) {
        studentId = student.Student_ID;
        console.log('[REGISTER] Found student by email fallback:', studentId);
      } else {
        throw new Error('Failed to get Student_ID - student not found after insert');
      }
    }
    
    console.log('[REGISTER] New Student Created:', { studentId, Name, Email });
    
    // Add phone numbers if provided
    if (Array.isArray(Phones) && Phones.length > 0) {
      for (const phone of Phones) {
        if (phone && validatePhoneNumber(phone)) {
          db.prepare('INSERT INTO STUDENT_PHONE (Student_ID, Phone) VALUES (?,?)').run(studentId, phone);
        }
      }
    }
    
    const user = { Student_ID: studentId, Name, Email, Role: 'student' };
    console.log('[REGISTER] Response:', { user, tokenLength: createToken(user).length });
    res.json({ user, token: createToken(user) });
  } catch (e) {
    console.error('[REGISTER] Error:', e.message);
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'Email already registered' : e.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { Email, Password } = req.body;
  if (!Email || !Password) return res.status(400).json({ error: 'Email and Password required' });
  const user = db.prepare('SELECT Student_ID, Name, Email, Role, Department, Semester FROM STUDENT WHERE Email = ? AND Password = ?')
    .get(Email, hashPassword(Password));
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ user, token: createToken(user) });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT Student_ID, Name, Email, Role, Department, Semester FROM STUDENT WHERE Student_ID = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ─── STUDENT PROFILE ROUTES ───
app.get('/api/students/profile/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  console.log('[GET PROFILE] Request:', { id, req_user_id: req.user.id, req_user_role: req.user.role });
  
  if (id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const user = db.prepare(`
      SELECT Student_ID, Name, Email, Role, Department, Semester, Registration_Date, DOB
      FROM STUDENT
      WHERE Student_ID = ?
    `).get(id);
    
    console.log('[GET PROFILE] Query result:', user);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Fetch phone numbers separately
    const phoneRecords = db.prepare('SELECT Phone FROM STUDENT_PHONE WHERE Student_ID = ?').all(id);
    const phones = phoneRecords.map(p => p.Phone).join(',');
    
    const result = { ...user, Phones: phones || null };
    console.log('[GET PROFILE] Sending response:', result);
    res.json(result);
  } catch (e) {
    console.error('[GET PROFILE] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/students/profile/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  if (id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  const { Name, Department, Semester, DOB } = req.body;
  try {
    db.prepare('UPDATE STUDENT SET Name = ?, Department = ?, Semester = ?, DOB = ? WHERE Student_ID = ?')
      .run(Name, Department || null, Number(Semester) || null, DOB || null, id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/students/:id/phone', auth, (req, res) => {
  const id = Number(req.params.id);
  const { Phone } = req.body;
  
  if (id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  if (!Phone || !validatePhoneNumber(Phone)) return res.status(400).json({ error: 'Invalid phone number' });
  
  try {
    db.prepare('INSERT INTO STUDENT_PHONE (Student_ID, Phone) VALUES (?,?)').run(id, Phone);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('PRIMARY KEY') ? 'Phone already added' : e.message });
  }
});

app.delete('/api/students/:id/phone/:phone', auth, (req, res) => {
  const id = Number(req.params.id);
  const phone = req.params.phone;
  
  if (id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  db.prepare('DELETE FROM STUDENT_PHONE WHERE Student_ID = ? AND Phone = ?').run(id, phone);
  res.json({ ok: true });
});

// ─── REGISTRATIONS (Admin only) ───
app.get('/api/registrations', auth, adminOnly, (_, res) => {
  try {
    const students = db.prepare(`
      SELECT Student_ID, Name, Email, Role, Department, Semester, Registration_Date, DOB
      FROM STUDENT
      ORDER BY Registration_Date DESC
    `).all();
    
    // Fetch phones for each student
    const result = students.map(s => {
      const phoneRecords = db.prepare('SELECT Phone FROM STUDENT_PHONE WHERE Student_ID = ?').all(s.Student_ID);
      const phones = phoneRecords.map(p => p.Phone).join(',');
      return { ...s, Phones: phones || null };
    });
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── STUDENTS (read: all, delete: admin) ───
app.get('/api/students', auth, (_, res) => {
  try {
    const students = db.prepare(`
      SELECT Student_ID, Name, Email, Role, Department, Semester, Registration_Date, DOB
      FROM STUDENT
    `).all();
    
    // Fetch phones for each student
    const result = students.map(s => {
      const phoneRecords = db.prepare('SELECT Phone FROM STUDENT_PHONE WHERE Student_ID = ?').all(s.Student_ID);
      const phones = phoneRecords.map(p => p.Phone).join(',');
      return { ...s, Phones: phones || null };
    });
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/students/:id', auth, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  db.prepare('DELETE FROM STUDENT WHERE Student_ID = ?').run(id);
  res.json({ ok: true });
});

// ─── CLUBS (read: all, write/delete: admin) ───
app.get('/api/clubs', auth, (_, res) => {
  res.json(db.prepare(`
    SELECT c.*, COUNT(m.Student_ID) as Total_Members,
    (SELECT GROUP_CONCAT(fc.Name) FROM FACULTY_COORDINATOR fc WHERE fc.Club_ID = c.Club_ID) as Coordinators
    FROM CLUB c LEFT JOIN MEMBERSHIP m ON c.Club_ID = m.Club_ID GROUP BY c.Club_ID
  `).all());
});

app.post('/api/clubs', auth, adminOnly, (req, res) => {
  const { Club_Name, Description } = req.body;
  const info = db.prepare('INSERT INTO CLUB (Club_Name, Description) VALUES (?,?)').run(Club_Name, Description);
  res.json({ Club_ID: info.lastInsertRowid });
});

app.delete('/api/clubs/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM CLUB WHERE Club_ID = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─── MEMBERSHIPS (read: all, add: all, delete: admin or self) ───
app.get('/api/memberships', auth, (_, res) => {
  res.json(db.prepare(`
    SELECT m.*, s.Name as Student_Name, c.Club_Name
    FROM MEMBERSHIP m JOIN STUDENT s ON m.Student_ID = s.Student_ID JOIN CLUB c ON m.Club_ID = c.Club_ID
  `).all());
});

app.post('/api/memberships', auth, (req, res) => {
  const Student_ID = req.user.role === 'admin' ? Number(req.body.Student_ID) : req.user.id;
  const { Club_ID, Role } = req.body;
  const role = req.user.role === 'admin' ? (Role || 'Regular Member') : 'Regular Member';
  try {
    db.prepare('INSERT INTO MEMBERSHIP (Student_ID, Club_ID, Role) VALUES (?,?,?)').run(Student_ID, Number(Club_ID), role);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/memberships', auth, (req, res) => {
  const { Student_ID, Club_ID } = req.body;
  if (req.user.role !== 'admin' && Number(Student_ID) !== req.user.id) {
    return res.status(403).json({ error: 'Can only remove your own membership' });
  }
  db.prepare('DELETE FROM MEMBERSHIP WHERE Student_ID = ? AND Club_ID = ?').run(Number(Student_ID), Number(Club_ID));
  res.json({ ok: true });
});

// ─── EVENTS (read: all, write/delete: admin) ───
app.get('/api/events', auth, (_, res) => {
  res.json(db.prepare(`
    SELECT e.*, c.Club_Name, v.Venue_Name, v.Location
    FROM EVENT e JOIN CLUB c ON e.Club_ID = c.Club_ID JOIN VENUE v ON e.Venue_ID = v.Venue_ID
  `).all());
});

app.post('/api/events', auth, adminOnly, (req, res) => {
  const { Event_Name, Event_Date, Status, Club_ID, Venue_ID } = req.body;
  const info = db.prepare('INSERT INTO EVENT (Event_Name, Event_Date, Status, Club_ID, Venue_ID) VALUES (?,?,?,?,?)')
    .run(Event_Name, Event_Date, Status || 'Upcoming', Number(Club_ID), Number(Venue_ID));
  res.json({ Event_ID: info.lastInsertRowid });
});

app.delete('/api/events/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM EVENT WHERE Event_ID = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─── VENUES (read: all, write: admin) ───
app.get('/api/venues', auth, (_, res) => {
  res.json(db.prepare('SELECT * FROM VENUE').all());
});

app.post('/api/venues', auth, adminOnly, (req, res) => {
  const { Venue_Name, Capacity, Location } = req.body;
  const info = db.prepare('INSERT INTO VENUE (Venue_Name, Capacity, Location) VALUES (?,?,?)').run(Venue_Name, Number(Capacity), Location);
  res.json({ Venue_ID: info.lastInsertRowid });
});

// ─── FACULTY (read: all, write: admin) ───
app.get('/api/faculty', auth, (_, res) => {
  res.json(db.prepare('SELECT fc.*, c.Club_Name FROM FACULTY_COORDINATOR fc JOIN CLUB c ON fc.Club_ID = c.Club_ID').all());
});

app.post('/api/faculty', auth, adminOnly, (req, res) => {
  const { Name, Email, Department, Club_ID } = req.body;
  const info = db.prepare('INSERT INTO FACULTY_COORDINATOR (Name, Email, Department, Club_ID) VALUES (?,?,?,?)')
    .run(Name, Email, Department, Number(Club_ID));
  res.json({ Faculty_ID: info.lastInsertRowid });
});

// ─── PROPOSALS (read: all, create: members, vote: all students) ───
app.get('/api/proposals', auth, (_, res) => {
  res.json(db.prepare(`
    SELECT p.*, s.Name as Proposer_Name, c.Club_Name,
      (SELECT COUNT(*) FROM VOTE v WHERE v.Proposal_ID = p.Proposal_ID AND v.Vote_Type = 'Approve') as Approvals,
      (SELECT COUNT(*) FROM VOTE v WHERE v.Proposal_ID = p.Proposal_ID AND v.Vote_Type = 'Reject') as Rejections,
      (SELECT COUNT(*) FROM VOTE v WHERE v.Proposal_ID = p.Proposal_ID) as Total_Votes
    FROM PROPOSAL p JOIN STUDENT s ON p.Student_ID = s.Student_ID JOIN CLUB c ON p.Club_ID = c.Club_ID
  `).all());
});

app.post('/api/proposals', auth, (req, res) => {
  const { Title, Description, Club_ID } = req.body;
  const Student_ID = req.user.id;
  try {
    const info = db.prepare('INSERT INTO PROPOSAL (Title, Description, Student_ID, Club_ID) VALUES (?,?,?,?)')
      .run(Title, Description, Student_ID, Number(Club_ID));
    res.json({ Proposal_ID: info.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: 'You must be a member of this club to propose. ' + e.message }); }
});

// ─── VOTES ───
app.get('/api/votes', auth, (_, res) => {
  res.json(db.prepare('SELECT v.*, p.Title, s.Name as Voter_Name FROM VOTE v JOIN PROPOSAL p ON v.Proposal_ID = p.Proposal_ID JOIN STUDENT s ON v.Student_ID = s.Student_ID').all());
});

app.post('/api/votes', auth, (req, res) => {
  const { Proposal_ID, Vote_Type } = req.body;
  try {
    db.prepare('INSERT INTO VOTE (Proposal_ID, Student_ID, Vote_Type) VALUES (?,?,?)').run(Number(Proposal_ID), req.user.id, Vote_Type);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: 'Already voted or invalid data. ' + e.message }); }
});

// ─── ATTENDANCE (read: all, record: admin) ───
app.get('/api/attendance', auth, (_, res) => {
  res.json(db.prepare('SELECT a.*, s.Name as Student_Name, e.Event_Name FROM ATTENDANCE a JOIN STUDENT s ON a.Student_ID = s.Student_ID JOIN EVENT e ON a.Event_ID = e.Event_ID').all());
});

app.post('/api/attendance', auth, adminOnly, (req, res) => {
  const { Event_ID, Student_ID, Participation_Status } = req.body;
  try {
    db.prepare('INSERT INTO ATTENDANCE (Event_ID, Student_ID, Participation_Status) VALUES (?,?,?)')
      .run(Number(Event_ID), Number(Student_ID), Participation_Status || 'Present');
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── STATS ───
app.get('/api/stats', auth, (_, res) => {
  res.json({
    students: db.prepare('SELECT COUNT(*) as c FROM STUDENT').get().c,
    clubs: db.prepare('SELECT COUNT(*) as c FROM CLUB').get().c,
    events: db.prepare('SELECT COUNT(*) as c FROM EVENT').get().c,
    proposals: db.prepare('SELECT COUNT(*) as c FROM PROPOSAL').get().c,
    memberships: db.prepare('SELECT COUNT(*) as c FROM MEMBERSHIP').get().c,
    upcomingEvents: db.prepare("SELECT COUNT(*) as c FROM EVENT WHERE Status = 'Upcoming'").get().c,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
