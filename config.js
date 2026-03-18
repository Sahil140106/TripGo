// TripGo Configuration
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8080/api' 
    : 'https://tripgo-backend.onrender.com/api'; // Replace with your Render URL after deployment

const AUTH_API_URL = `${API_BASE_URL}/auth`;
const CAR_API_URL = `${API_BASE_URL}/cars`;
const BOOKING_API_URL = `${API_BASE_URL}/bookings`;
const MESSAGE_API_URL = `${API_BASE_URL}/messages`;
const HANDOVER_API_URL = `${API_BASE_URL}/handovers`;

// OTP Service (Node.js) - If still using port 4000
const OTP_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:4000/api/otp'
    : 'https://tripgo-otp.onrender.com/api/otp'; // Replace with your Render URL

console.log("TripGo Config Loaded. Base URL:", API_BASE_URL);
