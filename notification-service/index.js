const express = require('express');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Firebase Initialization ---
// You need to place your serviceAccountKey.json in the same directory
try {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin Initialized");
} catch (error) {
    console.warn("❌ Firebase not initialized: serviceAccountKey.json not found or corrupted.");
    console.error(error);
}

const db = admin.firestore?.();

// --- Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS?.replace(/\s/g, '')
    }
});

transporter.verify((error) => {
    if (error) {
        console.error("❌ SMTP Connection Error:", error.message);
    } else {
        console.log("✅ SMTP Server is ready to send emails");
    }
});

// --- OTP Generation ---
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- Endpoints ---

// 1. Send OTP
app.post('/api/otp/send', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    try {
        // Store OTP in Firebase Firestore
        if (db) {
            await db.collection('otps').doc(email).set({
                otp,
                expiresAt
            });
        }

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Verification Code',
            text: `Your OTP for verification is: ${otp}. It will expire in 10 minutes.`
        };

        console.log(`📧 Attempting to send OTP to: ${email}`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent successfully to: ${email}`);

        res.json({ status: 'success', message: 'OTP sent successfully' });
    } catch (error) {
        console.error("❌ Error sending OTP:", error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 2. Verify OTP
app.post('/api/otp/verify', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ status: 'error', message: 'Email and OTP are required' });
    }

    try {
        if (!db) {
            return res.status(500).json({ status: 'error', message: 'Firebase not configured' });
        }

        const doc = await db.collection('otps').doc(email).get();

        if (!doc.exists) {
            return res.status(400).json({ status: 'error', message: 'OTP not found' });
        }

        const data = doc.data();
        if (data.otp === otp && data.expiresAt > Date.now()) {
            // Success! Delete OTP after verification
            await db.collection('otps').doc(email).delete();
            res.json({ status: 'success', message: 'OTP verified successfully' });
        } else {
            res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ status: 'error', message: 'Verification failed', detail: error.message });
    }
});

const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Notification service running on http://localhost:${PORT}`);
});
