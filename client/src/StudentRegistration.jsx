import { useState } from 'react';
import { api } from './api';

function StudentRegistration({ onSuccess, toast }) {
  const [form, setForm] = useState({ 
    Name: '', 
    Email: '', 
    Password: '', 
    Department: '', 
    Semester: '', 
    DOB: '',
    Phones: ['']
  });
  const [loading, setLoading] = useState(false);

  const addPhoneField = () => {
    setForm({...form, Phones: [...form.Phones, '']});
  };

  const removePhoneField = (idx) => {
    const phones = form.Phones.filter((_, i) => i !== idx);
    setForm({...form, Phones: phones.length === 0 ? [''] : phones});
  };

  const updatePhone = (idx, value) => {
    const phones = [...form.Phones];
    phones[idx] = value;
    setForm({...form, Phones: phones});
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate required fields
      if (!form.Name.trim() || !form.Email.trim() || !form.Password.trim()) {
        toast('Name, Email, and Password are required', 'error');
        setLoading(false);
        return;
      }

      // Filter out empty phone numbers
      const phones = form.Phones.filter(p => p.trim());

      const result = await api.register({ 
        ...form, 
        Semester: Number(form.Semester) || null,
        Phones: phones 
      });
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      toast('Registration successful!', 'success');
      onSuccess && onSuccess(result.user);
    } catch (e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="registration-form">
      <h2>Create Your Account</h2>
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input 
            required 
            value={form.Name} 
            onChange={e => setForm({...form, Name: e.target.value})} 
            placeholder="Your full name" 
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input 
            required 
            type="email" 
            value={form.Email} 
            onChange={e => setForm({...form, Email: e.target.value})} 
            placeholder="your@email.com" 
          />
        </div>

        <div className="form-group">
          <label>Password * (min 6 chars, must contain letters)</label>
          <input 
            required 
            type="password" 
            value={form.Password} 
            onChange={e => setForm({...form, Password: e.target.value})} 
            placeholder="••••••••" 
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Department</label>
            <input 
              value={form.Department} 
              onChange={e => setForm({...form, Department: e.target.value})} 
              placeholder="CSE" 
            />
          </div>
          <div className="form-group">
            <label>Semester</label>
            <input 
              type="number" 
              value={form.Semester} 
              onChange={e => setForm({...form, Semester: e.target.value})} 
              placeholder="4" 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Date of Birth</label>
          <input 
            type="date" 
            value={form.DOB} 
            onChange={e => setForm({...form, DOB: e.target.value})} 
          />
        </div>

        <div className="form-group">
          <label>Phone Numbers</label>
          {form.Phones.map((phone, idx) => (
            <div key={idx} className="phone-input-group">
              <input 
                type="tel"
                value={phone} 
                onChange={e => updatePhone(idx, e.target.value)} 
                placeholder="e.g., +91-9876543210" 
              />
              {form.Phones.length > 1 && (
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm" 
                  onClick={() => removePhoneField(idx)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={addPhoneField}
            style={{marginTop: '8px'}}
          >
            + Add Phone
          </button>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary auth-btn" 
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

export default StudentRegistration;
