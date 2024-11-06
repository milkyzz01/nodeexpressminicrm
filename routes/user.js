const db = require('../config/db');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const verifyJWT = require('../middleware/authmiddleware'); 

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET

//login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: 'Username and password are required' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';

    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ message: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(401).send({ message: 'Invalid credentials' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).send({ message: 'Error comparing passwords' });
            }

            if (isMatch) {
                // Generate the JWT token
                const payload = {
                    id: user.iser_id,
                    username: user.username,
                };

                const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

                
                res.cookie('token', token, {
                    httpOnly: true,  // Prevents access to cookie via JavaScript
                    secure: process.env.NODE_ENV === 'production', 
                    maxAge: 3600000, // Cookie expiry (1 hour)
                    sameSite: 'None'  
                });

                return res.status(200).send({ message: 'Login successful' });
            } else {
                return res.status(401).send({ message: 'Invalid credentials' });
            }
        });
    });
});

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;
  
    // Basic validation (ensure username and password are provided)
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    try {
      // Check if username already exists
      db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Database query error' });
        }
  
        if (results.length > 0) {
          return res.status(400).json({ message: 'Username already taken' });
        }
  
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
  
        // Insert the new user into the database
        const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(query, [username, hashedPassword], (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Error saving user to database' });
          }
  
          res.status(201).json({ message: 'User registered successfully' });
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Logout route
router.get('/logout', (req, res) => {
    // Clear the 'token' cookie by setting its expiration date to a past date
    res.clearCookie('token', {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'None',  
    });
  
    // Send response indicating successful logout
    return res.status(200).send({ message: 'Logged out successfully' });
  });

module.exports = router;