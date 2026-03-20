// TripGo Configuration
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname || window.location.protocol === 'file:')
    ? 'http://localhost:8080/api' 
    : 'https://tripgo-backend-34la.onrender.com/api'; 

const AUTH_API_URL = `${API_BASE_URL}/auth`;
const CAR_API_URL = `${API_BASE_URL}/cars`;
const BOOKING_API_URL = `${API_BASE_URL}/bookings`;
const MESSAGE_API_URL = `${API_BASE_URL}/messages`;
const HANDOVER_API_URL = `${API_BASE_URL}/handovers`;

// OTP Service (Vercel)
const OTP_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:4000/api/otp'
    : 'https://tripgo-otp.vercel.app/api/otp'; 

const NOTIFY_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:4000/api/notify'
    : 'https://tripgo-otp.vercel.app/api/notify';

console.log("TripGo Config Loaded. Base URL:", API_BASE_URL);
