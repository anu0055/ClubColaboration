import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

function StudentManagement({ toast }) {
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getRegistrations();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format');
      }
      setRegistrations(data);
    } catch (e) {
      console.error('Error loading registrations:', e);
      // Use setTimeout to avoid dependency loop with toast
      setTimeout(() => {
        toast(e.message || 'Failed to load registrations', 'error');
      }, 0);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      try {
        await api.deleteStudent(studentId);
        toast('Student deleted successfully', 'success');
        load();
      } catch (e) {
        toast(e.message, 'error');
      }
    }
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter(s => {
    const matchesSearch = 
      s.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.Student_ID).includes(searchTerm);
    
    const matchesDept = filterDept === '' || s.Department === filterDept;
    
    return matchesSearch && matchesDept;
  });

  // Get unique departments
  const departments = [...new Set(registrations.map(s => s.Department).filter(Boolean))];

  if (loading) return (
    <div className="page-header">
      <h1>Loading...</h1>
      <p>Please wait while we fetch student registrations...</p>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h1>Student Registrations</h1>
        <p>Manage student registrations and view profiles</p>
      </div>

      <div className="card">
        <div className="card-title">All Student Registrations</div>
        
        <div className="filter-section">
          <div className="form-group">
            <input 
              type="text"
              placeholder="🔍 Search by name, email, or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="form-group">
            <select 
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="filter-select"
            >
              <option value="">All Departments</option>
              {departments.sort().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="stats-badge">
            Showing {filteredRegistrations.length} of {registrations.length} registrations
          </div>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div style={{textAlign: 'center', padding: '24px', color: 'var(--text-dim)'}}>
            <p>No registrations found</p>
          </div>
        ) : (
          <table className="registrations-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Phone Numbers</th>
                <th>Registration Date</th>
                <th>DOB</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map(student => (
                <tr key={student.Student_ID}>
                  <td>
                    <strong>{student.Student_ID}</strong>
                  </td>
                  <td>{student.Name}</td>
                  <td>
                    <a href={`mailto:${student.Email}`} style={{color: 'var(--blue)'}}>
                      {student.Email}
                    </a>
                  </td>
                  <td>
                    {student.Department ? (
                      <span className="badge badge-blue">{student.Department}</span>
                    ) : (
                      <span style={{color: 'var(--text-dim)'}}>—</span>
                    )}
                  </td>
                  <td>{student.Semester || '—'}</td>
                  <td>
                    {student.Phones ? (
                      <div className="phone-cell">
                        {student.Phones.split(',').map((phone, idx) => (
                          <div key={idx} style={{fontSize: '12px', padding: '2px 0'}}>
                            {phone}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{color: 'var(--text-dim)'}}>—</span>
                    )}
                  </td>
                  <td style={{fontSize: '12px'}}>{student.Registration_Date}</td>
                  <td>{student.DOB || '—'}</td>
                  <td>
                    <span className={`badge ${student.Role === 'admin' ? 'badge-orange' : 'badge-blue'}`}>
                      {student.Role}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(student.Student_ID, student.Name)}
                      title="Delete this student"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .filter-section {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
          align-items: center;
        }

        .search-input {
          padding: 8px 12px;
          border: 1px solid var(--bg-tertiary);
          border-radius: 6px;
          font-size: 14px;
          width: 100%;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid var(--bg-tertiary);
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .stats-badge {
          white-space: nowrap;
          font-size: 12px;
          color: var(--text-dim);
          padding: 6px 12px;
          background: var(--bg-tertiary);
          border-radius: 6px;
        }

        .phone-cell {
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .filter-section {
            grid-template-columns: 1fr;
          }
          
          .registrations-table {
            font-size: 12px;
          }
          
          .registrations-table th,
          .registrations-table td {
            padding: 8px 4px;
          }
        }
      `}</style>
    </>
  );
}

export default StudentManagement;
