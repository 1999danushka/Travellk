require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test database connection
pool.getConnection()
  .then(conn => {
    console.log('MySQL Connected...');
    conn.release();
  })
  .catch(err => {
    console.error('DB Connection Error:', err);
  });

// Booking endpoint
app.post('/api/book', async (req, res) => {
  try {
    const {
      name, email, contact,
      arrival, departure, adults,
      kids, kid_ages, nationality
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO bookings 
      (name, email, contact, arrival, departure, adults, kids, kid_ages, nationality)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, contact, arrival, departure, adults, kids, kid_ages, nationality]
    );

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Booking Received',
      text: `
        New booking received:
        Name: ${name}
        Email: ${email}
        Contact: ${contact}
        Arrival: ${arrival}
        Departure: ${departure}
        Adults: ${adults}
        Kids: ${kids}
        Kid Ages: ${kid_ages}
        Nationality: ${nationality}
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ 
      success: true,
      message: 'Booking successful and email sent',
      bookingId: result.insertId
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, batch, phone } = req.body;
    
    // Input validation
    if (!name || !email || !batch) {
      throw new Error('Missing required fields');
    }

    const [result] = await pool.execute(
      'INSERT INTO attendees (name, email, batch, phone) VALUES (?, ?, ?, ?)',
      [name, email, batch, phone]
    );

    res.status(201).json({ 
      success: true,
      id: result.insertId
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message.includes('Duplicate') 
        ? 'Email already registered' 
        : error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
