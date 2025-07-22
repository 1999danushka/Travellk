const express = require('express');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('DB Connection Error:', err);
  } else {
    console.log('MySQL Connected...');
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/api/book', (req, res) => {
  const {
    name, email, contact,
    arrival, departure, adults,
    kids, kid_ages, nationality
  } = req.body;

  const sql = `
    INSERT INTO bookings
    (name, email, contact, arrival, departure, adults, kids, kid_ages, nationality)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    name, email, contact,
    arrival, departure, adults,
    kids, kid_ages, nationality
  ], (err, result) => {
    if (err) {
      console.error('DB Insert Error:', err);
      return res.status(500).send('Database Error');
    }

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

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Email Error:', err);
        return res.status(500).send('Email Error');
      }

      res.status(200).send('Booking successful and email sent.');
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
