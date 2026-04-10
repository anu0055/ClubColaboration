import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

function Field({ label, children }) {
  return <div className="form-group"><label>{label}</label>{children}</div>;
}

function StudentProfile({ user, toast }) {
  // Validate user object
  if (!user) {
    return (
      <div className="page-header">
        <h1>Error</h1>
        <p>User information is missing. Please log in again.</p>
      </div>
    );
  }

  // Fallback: if Student_ID is missing, try to get it from auth
  const studentId = user.Student_ID || user.id;
  
  if (!studentId) {
    return (
      <div className="page-header">
        <h1>Error</h1>
        <p>Student ID not found. Please log out and log in again.</p>
      </div>
    );
  }

  const [profile, setProfile] = useState(null);
  const [phones, setPhones] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[StudentProfile] Loading profile for Student_ID:', studentId);
      console.log('[StudentProfile] User object:', user);
      
      const data = await api.getStudentProfile(studentId);
      
      console.log('[StudentProfile] Profile data received:', data);
      
      if (!data) {
        throw new Error('Failed to load profile data - received empty response');
      }
      
      setProfile(data);
      
      // Handle phones - split by comma if present, or empty array if null/undefined
      const phonesList = data.Phones ? String(data.Phones).split(',').filter(p => p.trim()) : [];
      setPhones(phonesList);
      
      setForm({
        Name: data.Name || '',
        Department: data.Department || '',
        Semester: data.Semester || '',
        DOB: data.DOB || ''
      });
    } catch (e) {
      console.error('[StudentProfile] Error loading profile:', e);
      console.error('[StudentProfile] Error message:', e.message);
      console.error('[StudentProfile] Error stack:', e.stack);
      // Use setTimeout to avoid dependency loop with toast
      setTimeout(() => {
        toast(e.message || 'Failed to load profile', 'error');
      }, 0);
    } finally {
      setLoading(false);
    }
  }, [studentId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async () => {
    try {
      await api.updateStudentProfile(studentId, form);
      setProfile({...profile, ...form});
      setEditing(false);
      toast('Profile updated successfully!', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const addPhone = async (e) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      toast('Please enter a phone number', 'error');
      return;
    }
    try {
      await api.addPhoneNumber(studentId, newPhone);
      setNewPhone('');
      toast('Phone number added!', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const removePhone = async (phone) => {
    try {
      await api.removePhoneNumber(studentId, phone);
      toast('Phone number removed!', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (loading) return (
    <div className="page-header">
      <h1>Loading Profile...</h1>
      <p>Please wait...</p>
    </div>
  );
  if (!profile) return (
    <div className="page-header">
      <h1>Error Loading Profile</h1>
      <p>Unable to load your profile. Please try refreshing the page.</p>
      <button className="btn btn-primary" onClick={load}>Retry</button>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your student information</p>
      </div>

      <div className="card">
        <div className="card-title">Basic Information</div>
        
        {!editing ? (
          <div className="profile-view">
            <div className="profile-section">
              <div className="profile-label">Student ID</div>
              <div className="profile-value">{profile.Student_ID}</div>
            </div>
            <div className="profile-section">
              <div className="profile-label">Full Name</div>
              <div className="profile-value">{profile.Name}</div>
            </div>
            <div className="profile-section">
              <div className="profile-label">Email</div>
              <div className="profile-value">{profile.Email}</div>
            </div>
            <div className="profile-section">
              <div className="profile-label">Department</div>
              <div className="profile-value">{profile.Department || '—'}</div>
            </div>
            <div className="profile-section">
              <div className="profile-label">Semester</div>
              <div className="profile-value">{profile.Semester || '—'}</div>
            </div>
            <div className="profile-section">
              <div className="profile-label">Date of Birth</div>
              <div className="profile-value">{profile.DOB || '—'}</div>
            </div>
            <div className="profile-section">
              <div className="profile-label">Registration Date</div>
              <div className="profile-value">{profile.Registration_Date}</div>
            </div>
            <div className="profile-section">
              <div className="profile-label">Role</div>
              <div className="profile-value">
                <span className={`badge ${profile.Role === 'admin' ? 'badge-orange' : 'badge-blue'}`}>
                  {profile.Role}
                </span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="profile-edit">
            <Field label="Full Name">
              <input 
                value={form.Name} 
                onChange={e => setForm({...form, Name: e.target.value})} 
              />
            </Field>
            <Field label="Department">
              <input 
                value={form.Department} 
                onChange={e => setForm({...form, Department: e.target.value})} 
              />
            </Field>
            <Field label="Semester">
              <input 
                type="number" 
                value={form.Semester} 
                onChange={e => setForm({...form, Semester: e.target.value})} 
              />
            </Field>
            <Field label="Date of Birth">
              <input 
                type="date" 
                value={form.DOB} 
                onChange={e => setForm({...form, DOB: e.target.value})} 
              />
            </Field>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveProfile}>
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Phone Numbers</div>
        
        <div className="phone-list">
          {phones.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Phone Number</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {phones.map((phone, idx) => (
                  <tr key={idx}>
                    <td>{phone}</td>
                    <td>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => removePhone(phone)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{color: 'var(--text-dim)'}}>No phone numbers added yet</p>
          )}
        </div>

        <form onSubmit={addPhone} className="add-phone-form">
          <div className="form-group">
            <label>Add New Phone Number</label>
            <div className="phone-input-group">
              <input 
                type="tel"
                value={newPhone} 
                onChange={e => setNewPhone(e.target.value)} 
                placeholder="e.g., +91-9876543210" 
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Add
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default StudentProfile;
