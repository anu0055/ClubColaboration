// Use environment variable for API URL, fallback to localhost for development
const API = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log(`[API] ${options.method || 'GET'} ${path}`, { token: token ? 'present' : 'missing', ...options });

  const res = await fetch(`${API}${path}`, {
    headers,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  
  console.log(`[API] Response for ${path}:`, { status: res.status, ok: res.ok, data });
  
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  getMe: () => request('/auth/me'),

  // Student Profile
  getStudentProfile: (id) => request(`/students/profile/${id}`),
  updateStudentProfile: (id, body) => request(`/students/profile/${id}`, { method: 'PUT', body }),
  addPhoneNumber: (id, phone) => request(`/students/${id}/phone`, { method: 'POST', body: { Phone: phone } }),
  removePhoneNumber: (id, phone) => request(`/students/${id}/phone/${phone}`, { method: 'DELETE' }),
  getRegistrations: () => request('/registrations'),

  // Data
  getStats: () => request('/stats'),
  getStudents: () => request('/students'),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  getClubs: () => request('/clubs'),
  addClub: (body) => request('/clubs', { method: 'POST', body }),
  deleteClub: (id) => request(`/clubs/${id}`, { method: 'DELETE' }),
  getMemberships: () => request('/memberships'),
  addMembership: (body) => request('/memberships', { method: 'POST', body }),
  deleteMembership: (body) => request('/memberships', { method: 'DELETE', body }),
  getEvents: () => request('/events'),
  addEvent: (body) => request('/events', { method: 'POST', body }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  getVenues: () => request('/venues'),
  addVenue: (body) => request('/venues', { method: 'POST', body }),
  getFaculty: () => request('/faculty'),
  addFaculty: (body) => request('/faculty', { method: 'POST', body }),
  getProposals: () => request('/proposals'),
  addProposal: (body) => request('/proposals', { method: 'POST', body }),
  getVotes: () => request('/votes'),
  addVote: (body) => request('/votes', { method: 'POST', body }),
  getAttendance: () => request('/attendance'),
  addAttendance: (body) => request('/attendance', { method: 'POST', body }),
};
