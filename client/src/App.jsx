import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import StudentProfile from './StudentProfile';
import StudentManagement from './StudentManagement';
import './index.css';

// ─── Toast ───
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{message}</div>;
}

// ─── Modal ───
function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="form-group"><label>{label}</label>{children}</div>;
}

// ─── AUTH PAGES ───
function AuthPage({ onAuth, toast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ Name: '', Email: '', Password: '', Department: '', Semester: '', DOB: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        console.log('[AuthPage] Attempting login...');
        result = await api.login({ Email: form.Email, Password: form.Password });
      } else {
        console.log('[AuthPage] Attempting registration...');
        result = await api.register({ ...form, Semester: Number(form.Semester) || null });
      }
      console.log('[AuthPage] Auth successful, result:', result);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      console.log('[AuthPage] Stored in localStorage:', { user: result.user, tokenLength: result.token.length });
      onAuth(result.user);
    } catch (e) {
      console.error('[AuthPage] Auth error:', e);
      toast(e.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>CampusClub</h1>
          <p>Collaboration Portal</p>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</button>
          <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Register</button>
        </div>
        <form onSubmit={submit}>
          {!isLogin && (
            <Field label="Full Name">
              <input required value={form.Name} onChange={e => setForm({...form, Name: e.target.value})} placeholder="Your full name" />
            </Field>
          )}
          <Field label="Email">
            <input required type="email" value={form.Email} onChange={e => setForm({...form, Email: e.target.value})} placeholder="your@email.com" />
          </Field>
          <Field label="Password">
            <input required type="password" value={form.Password} onChange={e => setForm({...form, Password: e.target.value})} placeholder="••••••••" />
          </Field>
          {!isLogin && (
            <>
              <div className="form-grid">
                <Field label="Department">
                  <input value={form.Department} onChange={e => setForm({...form, Department: e.target.value})} placeholder="CSE" />
                </Field>
                <Field label="Semester">
                  <input type="number" value={form.Semester} onChange={e => setForm({...form, Semester: e.target.value})} placeholder="4" />
                </Field>
              </div>
              <Field label="Date of Birth">
                <input type="date" value={form.DOB} onChange={e => setForm({...form, DOB: e.target.value})} />
              </Field>
            </>
          )}
          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        {isLogin && (
          <div className="auth-hint">
            <p>Demo: <strong>admin@vit.ac.in</strong> / admin123 (Admin)</p>
            <p>Demo: <strong>advika@vit.ac.in</strong> / student123 (Student)</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGES ───

function Dashboard({ stats }) {
  const items = [
    { icon: '👥', value: stats.students, label: 'Students' },
    { icon: '🏛️', value: stats.clubs, label: 'Clubs' },
    { icon: '📅', value: stats.events, label: 'Total Events' },
    { icon: '🔥', value: stats.upcomingEvents, label: 'Upcoming' },
    { icon: '📝', value: stats.proposals, label: 'Proposals' },
    { icon: '🤝', value: stats.memberships, label: 'Memberships' },
  ];
  return (
    <>
      <div className="page-header"><h1>Dashboard</h1><p>Campus Club Collaboration Portal — Overview</p></div>
      <div className="stats-grid">
        {items.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function StudentsPage({ toast, isAdmin }) {
  const [students, setStudents] = useState([]);
  const load = useCallback(() => api.getStudents().then(setStudents), []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    try { await api.deleteStudent(id); toast('Student deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-header"><h1>Students</h1><p>Registered students {!isAdmin && '(Read-only)'}</p></div>
      <div className="card">
        <div className="card-title">All Students</div>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Dept</th><th>Sem</th><th>Phones</th>{isAdmin && <th></th>}</tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.Student_ID}>
                <td>{s.Student_ID}</td><td>{s.Name}</td><td>{s.Email}</td>
                <td><span className={`badge ${s.Role === 'admin' ? 'badge-orange' : 'badge-blue'}`}>{s.Role}</span></td>
                <td><span className="badge badge-purple">{s.Department}</span></td>
                <td>{s.Semester}</td><td>{s.Phones || '—'}</td>
                {isAdmin && <td><button className="btn btn-danger btn-sm" onClick={() => remove(s.Student_ID)}>✕</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ClubsPage({ toast, isAdmin }) {
  const [clubs, setClubs] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ Club_Name: '', Description: '' });

  const load = useCallback(() => api.getClubs().then(setClubs), []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try { await api.addClub(form); setShow(false); setForm({ Club_Name: '', Description: '' }); toast('Club created!', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-header"><h1>Clubs</h1><p>Campus clubs and organizations</p></div>
      <div className="card">
        <div className="card-title">All Clubs {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>+ Add</button>}</div>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Members</th><th>Coordinators</th><th>Created</th>{isAdmin && <th></th>}</tr></thead>
          <tbody>
            {clubs.map(c => (
              <tr key={c.Club_ID}>
                <td>{c.Club_ID}</td><td><strong>{c.Club_Name}</strong></td><td>{c.Description}</td>
                <td><span className="badge badge-purple">{c.Total_Members}</span></td>
                <td>{c.Coordinators || '—'}</td><td>{c.Creation_Date}</td>
                {isAdmin && <td><button className="btn btn-danger btn-sm" onClick={async () => { try { await api.deleteClub(c.Club_ID); toast('Deleted','success'); load(); } catch(e) { toast(e.message,'error'); }}}>✕</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <Modal title="Create Club" onClose={() => setShow(false)}>
          <div className="form-grid">
            <Field label="Club Name"><input value={form.Club_Name} onChange={e => setForm({...form, Club_Name: e.target.value})} /></Field>
            <Field label="Description"><input value={form.Description} onChange={e => setForm({...form, Description: e.target.value})} /></Field>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Create</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function MembershipsPage({ toast, isAdmin, user }) {
  const [data, setData] = useState([]);
  const [students, setStudents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ Student_ID: '', Club_ID: '', Role: 'Regular Member' });

  const load = useCallback(() => {
    api.getMemberships().then(setData);
    api.getStudents().then(setStudents);
    api.getClubs().then(setClubs);
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      const body = isAdmin
        ? { Student_ID: Number(form.Student_ID), Club_ID: Number(form.Club_ID), Role: form.Role }
        : { Club_ID: Number(form.Club_ID) };
      await api.addMembership(body);
      setShow(false); toast('Membership added!', 'success'); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const canRemove = (m) => isAdmin || m.Student_ID === user.Student_ID;

  return (
    <>
      <div className="page-header"><h1>Memberships</h1><p>Student–Club membership records</p></div>
      <div className="card">
        <div className="card-title">All Memberships <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>{isAdmin ? '+ Add' : '+ Join Club'}</button></div>
        <table>
          <thead><tr><th>Student</th><th>Club</th><th>Role</th><th>Assigned</th><th></th></tr></thead>
          <tbody>
            {data.map(m => (
              <tr key={`${m.Student_ID}-${m.Club_ID}`}>
                <td>{m.Student_Name}</td><td>{m.Club_Name}</td>
                <td><span className={`badge ${m.Role === 'Organizer' ? 'badge-orange' : 'badge-blue'}`}>{m.Role}</span></td>
                <td>{m.Role_Assigned_Date}</td>
                <td>{canRemove(m) && <button className="btn btn-danger btn-sm" onClick={async () => { try { await api.deleteMembership({ Student_ID: m.Student_ID, Club_ID: m.Club_ID }); toast('Removed','success'); load(); } catch(e) { toast(e.message,'error'); }}}>✕</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <Modal title={isAdmin ? "Add Membership" : "Join a Club"} onClose={() => setShow(false)}>
          <div className="form-grid">
            {isAdmin && (
              <Field label="Student">
                <select value={form.Student_ID} onChange={e => setForm({...form, Student_ID: e.target.value})}>
                  <option value="">Select...</option>
                  {students.map(s => <option key={s.Student_ID} value={s.Student_ID}>{s.Name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Club">
              <select value={form.Club_ID} onChange={e => setForm({...form, Club_ID: e.target.value})}>
                <option value="">Select...</option>
                {clubs.map(c => <option key={c.Club_ID} value={c.Club_ID}>{c.Club_Name}</option>)}
              </select>
            </Field>
            {isAdmin && (
              <Field label="Role">
                <select value={form.Role} onChange={e => setForm({...form, Role: e.target.value})}>
                  <option>Regular Member</option><option>Organizer</option>
                </select>
              </Field>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{isAdmin ? 'Add' : 'Join'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function EventsPage({ toast, isAdmin }) {
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ Event_Name: '', Event_Date: '', Club_ID: '', Venue_ID: '' });

  const load = useCallback(() => {
    api.getEvents().then(setEvents);
    api.getClubs().then(setClubs);
    api.getVenues().then(setVenues);
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try { await api.addEvent({ ...form, Club_ID: Number(form.Club_ID), Venue_ID: Number(form.Venue_ID) }); setShow(false); toast('Event created!', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const statusBadge = (s) => {
    const map = { Upcoming: 'badge-orange', Completed: 'badge-green', Cancelled: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-blue'}`}>{s}</span>;
  };

  return (
    <>
      <div className="page-header"><h1>Events</h1><p>Club events and scheduling</p></div>
      <div className="card">
        <div className="card-title">All Events {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>+ Add</button>}</div>
        <table>
          <thead><tr><th>ID</th><th>Event</th><th>Club</th><th>Date</th><th>Venue</th><th>Status</th>{isAdmin && <th></th>}</tr></thead>
          <tbody>
            {events.map(e => (
              <tr key={e.Event_ID}>
                <td>{e.Event_ID}</td><td><strong>{e.Event_Name}</strong></td><td>{e.Club_Name}</td>
                <td>{e.Event_Date}</td><td>{e.Venue_Name} ({e.Location})</td><td>{statusBadge(e.Status)}</td>
                {isAdmin && <td><button className="btn btn-danger btn-sm" onClick={async () => { try { await api.deleteEvent(e.Event_ID); toast('Deleted','success'); load(); } catch(er) { toast(er.message,'error'); }}}>✕</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <Modal title="Add Event" onClose={() => setShow(false)}>
          <div className="form-grid">
            <Field label="Event Name"><input value={form.Event_Name} onChange={e => setForm({...form, Event_Name: e.target.value})} /></Field>
            <Field label="Date"><input type="date" value={form.Event_Date} onChange={e => setForm({...form, Event_Date: e.target.value})} /></Field>
            <Field label="Club">
              <select value={form.Club_ID} onChange={e => setForm({...form, Club_ID: e.target.value})}>
                <option value="">Select...</option>
                {clubs.map(c => <option key={c.Club_ID} value={c.Club_ID}>{c.Club_Name}</option>)}
              </select>
            </Field>
            <Field label="Venue">
              <select value={form.Venue_ID} onChange={e => setForm({...form, Venue_ID: e.target.value})}>
                <option value="">Select...</option>
                {venues.map(v => <option key={v.Venue_ID} value={v.Venue_ID}>{v.Venue_Name}</option>)}
              </select>
            </Field>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Create</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ProposalsPage({ toast, isAdmin, user }) {
  const [proposals, setProposals] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [show, setShow] = useState(false);
  const [voteModal, setVoteModal] = useState(null);
  const [voteType, setVoteType] = useState('Approve');
  const [form, setForm] = useState({ Title: '', Description: '', Club_ID: '' });

  const load = useCallback(() => {
    api.getProposals().then(setProposals);
    api.getClubs().then(setClubs);
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try { await api.addProposal({ Title: form.Title, Description: form.Description, Club_ID: Number(form.Club_ID) }); setShow(false); toast('Proposal submitted!', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const castVote = async () => {
    try { await api.addVote({ Proposal_ID: voteModal, Vote_Type: voteType }); setVoteModal(null); toast('Vote cast!', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-header"><h1>Proposals</h1><p>Event proposals and voting</p></div>
      <div className="card">
        <div className="card-title">All Proposals <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>+ New Proposal</button></div>
        <table>
          <thead><tr><th>Title</th><th>Club</th><th>By</th><th>Status</th><th>Votes</th><th>Approval</th><th></th></tr></thead>
          <tbody>
            {proposals.map(p => {
              const pct = p.Total_Votes > 0 ? Math.round((p.Approvals / p.Total_Votes) * 100) : 0;
              return (
                <tr key={p.Proposal_ID}>
                  <td><strong>{p.Title}</strong><br/><small style={{color:'var(--text-dim)'}}>{p.Description}</small></td>
                  <td>{p.Club_Name}</td><td>{p.Proposer_Name}</td>
                  <td><span className={`badge ${p.Status === 'Approved' ? 'badge-green' : p.Status === 'Rejected' ? 'badge-red' : 'badge-orange'}`}>{p.Status}</span></td>
                  <td><span className="badge badge-green">{p.Approvals}✓</span> <span className="badge badge-red">{p.Rejections}✗</span></td>
                  <td style={{minWidth:80}}>
                    <small>{pct}%</small>
                    <div className="vote-bar"><div className="vote-fill" style={{width:`${pct}%`, background: pct >= 50 ? 'var(--green)' : 'var(--red)'}}></div></div>
                  </td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => { setVoteModal(p.Proposal_ID); setVoteType('Approve'); }}>Vote</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {show && (
        <Modal title="New Proposal" onClose={() => setShow(false)}>
          <p style={{fontSize:'12px',color:'var(--text-dim)',marginBottom:'12px'}}>You must be a member of the club to propose.</p>
          <div className="form-grid">
            <Field label="Title"><input value={form.Title} onChange={e => setForm({...form, Title: e.target.value})} /></Field>
            <Field label="Description"><input value={form.Description} onChange={e => setForm({...form, Description: e.target.value})} /></Field>
            <Field label="Club">
              <select value={form.Club_ID} onChange={e => setForm({...form, Club_ID: e.target.value})}>
                <option value="">Select...</option>
                {clubs.map(c => <option key={c.Club_ID} value={c.Club_ID}>{c.Club_Name}</option>)}
              </select>
            </Field>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Submit</button>
          </div>
        </Modal>
      )}
      {voteModal && (
        <Modal title="Cast Vote" onClose={() => setVoteModal(null)}>
          <Field label="Your Vote">
            <select value={voteType} onChange={e => setVoteType(e.target.value)}>
              <option>Approve</option><option>Reject</option>
            </select>
          </Field>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setVoteModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={castVote}>Cast Vote</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function AttendancePage({ toast, isAdmin }) {
  const [data, setData] = useState([]);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ Event_ID: '', Student_ID: '', Participation_Status: 'Present' });

  const load = useCallback(() => {
    api.getAttendance().then(setData);
    api.getEvents().then(setEvents);
    api.getStudents().then(setStudents);
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try { await api.addAttendance({ ...form, Event_ID: Number(form.Event_ID), Student_ID: Number(form.Student_ID) }); setShow(false); toast('Recorded!', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-header"><h1>Attendance</h1><p>Event participation tracking {!isAdmin && '(Read-only)'}</p></div>
      <div className="card">
        <div className="card-title">Records {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>+ Record</button>}</div>
        <table>
          <thead><tr><th>Event</th><th>Student</th><th>Check-In</th><th>Status</th></tr></thead>
          <tbody>
            {data.map(a => (
              <tr key={`${a.Event_ID}-${a.Student_ID}`}>
                <td>{a.Event_Name}</td><td>{a.Student_Name}</td><td>{a.CheckIn_Time}</td>
                <td><span className={`badge ${a.Participation_Status === 'Present' ? 'badge-green' : 'badge-red'}`}>{a.Participation_Status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <Modal title="Record Attendance" onClose={() => setShow(false)}>
          <div className="form-grid">
            <Field label="Event">
              <select value={form.Event_ID} onChange={e => setForm({...form, Event_ID: e.target.value})}>
                <option value="">Select...</option>
                {events.map(ev => <option key={ev.Event_ID} value={ev.Event_ID}>{ev.Event_Name}</option>)}
              </select>
            </Field>
            <Field label="Student">
              <select value={form.Student_ID} onChange={e => setForm({...form, Student_ID: e.target.value})}>
                <option value="">Select...</option>
                {students.map(s => <option key={s.Student_ID} value={s.Student_ID}>{s.Name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.Participation_Status} onChange={e => setForm({...form, Participation_Status: e.target.value})}>
                <option>Present</option><option>Absent</option>
              </select>
            </Field>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Record</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function FacultyPage({ toast, isAdmin }) {
  const [data, setData] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ Name: '', Email: '', Department: '', Club_ID: '' });

  const load = useCallback(() => { api.getFaculty().then(setData); api.getClubs().then(setClubs); }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try { await api.addFaculty({ ...form, Club_ID: Number(form.Club_ID) }); setShow(false); toast('Faculty added!', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-header"><h1>Faculty Coordinators</h1><p>Club faculty advisors {!isAdmin && '(Read-only)'}</p></div>
      <div className="card">
        <div className="card-title">All Faculty {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>+ Add</button>}</div>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Club</th></tr></thead>
          <tbody>
            {data.map(f => (
              <tr key={f.Faculty_ID}>
                <td>{f.Faculty_ID}</td><td>{f.Name}</td><td>{f.Email}</td>
                <td><span className="badge badge-blue">{f.Department}</span></td><td>{f.Club_Name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <Modal title="Add Faculty" onClose={() => setShow(false)}>
          <div className="form-grid">
            <Field label="Name"><input value={form.Name} onChange={e => setForm({...form, Name: e.target.value})} /></Field>
            <Field label="Email"><input value={form.Email} onChange={e => setForm({...form, Email: e.target.value})} /></Field>
            <Field label="Department"><input value={form.Department} onChange={e => setForm({...form, Department: e.target.value})} /></Field>
            <Field label="Club">
              <select value={form.Club_ID} onChange={e => setForm({...form, Club_ID: e.target.value})}>
                <option value="">Select...</option>
                {clubs.map(c => <option key={c.Club_ID} value={c.Club_ID}>{c.Club_Name}</option>)}
              </select>
            </Field>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Add</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function VenuesPage({ toast, isAdmin }) {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ Venue_Name: '', Capacity: '', Location: '' });

  const load = useCallback(() => api.getVenues().then(setData), []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try { await api.addVenue({ ...form, Capacity: Number(form.Capacity) }); setShow(false); toast('Venue added!', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-header"><h1>Venues</h1><p>Event locations and capacity {!isAdmin && '(Read-only)'}</p></div>
      <div className="card">
        <div className="card-title">All Venues {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>+ Add</button>}</div>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Capacity</th><th>Location</th></tr></thead>
          <tbody>
            {data.map(v => (
              <tr key={v.Venue_ID}>
                <td>{v.Venue_ID}</td><td>{v.Venue_Name}</td><td>{v.Capacity}</td><td>{v.Location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <Modal title="Add Venue" onClose={() => setShow(false)}>
          <div className="form-grid">
            <Field label="Venue Name"><input value={form.Venue_Name} onChange={e => setForm({...form, Venue_Name: e.target.value})} /></Field>
            <Field label="Capacity"><input type="number" value={form.Capacity} onChange={e => setForm({...form, Capacity: e.target.value})} /></Field>
            <Field label="Location"><input value={form.Location} onChange={e => setForm({...form, Location: e.target.value})} /></Field>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Add</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── APP ───
const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'profile', icon: '👤', label: 'My Profile' },
  { key: 'students', icon: '👥', label: 'Students' },
  { key: 'registrations', icon: '📋', label: 'Student Registrations', adminOnly: true },
  { key: 'clubs', icon: '🏛️', label: 'Clubs' },
  { key: 'memberships', icon: '🤝', label: 'Memberships' },
  { key: 'events', icon: '📅', label: 'Events' },
  { key: 'proposals', icon: '📝', label: 'Proposals' },
  { key: 'attendance', icon: '✅', label: 'Attendance' },
  { key: 'faculty', icon: '🎓', label: 'Faculty' },
  { key: 'venues', icon: '📍', label: 'Venues' },
];

export default function App() {
  const [user, setUser] = useState(() => {
    try { 
      const stored = JSON.parse(localStorage.getItem('user'));
      console.log('[App] Loaded user from localStorage:', stored);
      return stored;
    } catch (e) {
      console.error('[App] Error loading user:', e);
      return null;
    }
  });
  const [page, setPage] = useState('dashboard');
  const [stats, setStats] = useState({ students: 0, clubs: 0, events: 0, proposals: 0, memberships: 0, upcomingEvents: 0 });
  const [toastData, setToastData] = useState(null);

  const toast = useCallback((message, type) => {
    setToastData({ message, type });
  }, []);
  const isAdmin = user?.Role === 'admin';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPage('dashboard');
  };

  useEffect(() => {
    if (user) api.getStats().then(setStats).catch(() => {});
  }, [page, user]);

  if (!user) return (
    <>
      <AuthPage onAuth={setUser} toast={toast} />
      {toastData && <Toast message={toastData.message} type={toastData.type} onClose={() => setToastData(null)} />}
    </>
  );

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard stats={stats} />;
      case 'profile': return <StudentProfile user={user} toast={toast} />;
      case 'students': return <StudentsPage toast={toast} isAdmin={isAdmin} />;
      case 'registrations': return isAdmin ? <StudentManagement toast={toast} /> : <Dashboard stats={stats} />;
      case 'clubs': return <ClubsPage toast={toast} isAdmin={isAdmin} />;
      case 'memberships': return <MembershipsPage toast={toast} isAdmin={isAdmin} user={user} />;
      case 'events': return <EventsPage toast={toast} isAdmin={isAdmin} />;
      case 'proposals': return <ProposalsPage toast={toast} isAdmin={isAdmin} user={user} />;
      case 'attendance': return <AttendancePage toast={toast} isAdmin={isAdmin} />;
      case 'faculty': return <FacultyPage toast={toast} isAdmin={isAdmin} />;
      case 'venues': return <VenuesPage toast={toast} isAdmin={isAdmin} />;
      default: return <Dashboard stats={stats} />;
    }
  };

  return (
    <>
      <nav className="sidebar">
        <div className="sidebar-logo">CampusClub<span>Collaboration Portal</span></div>
        {NAV.map(n => {
          // Hide admin-only items from non-admin users
          if (n.adminOnly && !isAdmin) return null;
          return (
            <div key={n.key} className={`nav-item ${page === n.key ? 'active' : ''}`} onClick={() => setPage(n.key)}>
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </div>
          );
        })}
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-name">{user.Name}</div>
            <div className="user-role"><span className={`badge ${isAdmin ? 'badge-orange' : 'badge-blue'}`}>{user.Role}</span></div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>
      <main className="main">{renderPage()}</main>
      {toastData && <Toast message={toastData.message} type={toastData.type} onClose={() => setToastData(null)} />}
    </>
  );
}
