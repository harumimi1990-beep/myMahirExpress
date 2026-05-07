const express = require( 'express' );
const bcrypt = require( 'bcrypt' );
const multer = require("multer");
const upload = multer();
const router = express.Router();
const db = require( '../../database' );
require('dotenv').config();
const jwt = require('jsonwebtoken');

// POST - Login
router.post('/login', upload.none(), async (req, res) => {
    // It's safer to only accept login credentials from the body, not the URL query
    const data = { ...req.body, ...req.query };
    const { email, password } = req.body; 
    const errors = [];

    // Validation Checks
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please enter a valid email address.');
    }

    if (!password || password.length < 8) {
        errors.push('Password needs to be at least 8 characters.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    try {
        // Search User In Database
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ? AND type = ?',
            [email, 'admin']
        );

        // Check if user exists
        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        } // <--- THIS WAS THE MISSING BRACE!

        const admin = rows[0];
        const isMatch = await bcrypt.compare(password, admin.hash_password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Generate Token (Valid For 1 Hour)
        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
            },
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Login failed due to a server error.', // Updated message to say Login instead of Registration
            error: err.message
        });
    }
});


// POST - Register
router.post( '/register', upload.none(), async (req, res) => {
  const data = { ...req.body, ...req.query };
  const { name, email, password } = data;
  const errors = [];

  // Validation Checks
  if ( !name || name.trim() === '' ) {
    errors.push( 'Name cannot be empty.' );
  }

  if ( !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email )) {
    errors.push( 'Please enter a valid email address and cannot be empty.' );
  }

  if ( !password || !/^.{8,}$/.test( password )) {
    errors.push( 'Password needs to be at least 8 characters.' );
  }

  // Validation Failed
  if ( errors.length > 0 ) {
    return res.status( 400 ).json({
      success: false,
      message: 'Validation failed.',
      errors
    });
  }
  const hashedPassword = await bcrypt.hash( password, 10 );

  try{
    const [ existingUser ] = await db.query( 'SELECT * FROM users WHERE email = ?', [ email ]);
      if ( existingUser.length > 0 ) {
        return res.status( 409 ).json({ 
        success: false, 
        message: 'Email already registered.' 
      });
    }
    const type = 'admin';
    const [ result ] = await db.query(
      'INSERT INTO users (name, email, hash_password, type) VALUES (?, ?, ?, ?)', [ name, email, hashedPassword, type ]
    );
    res.status( 201 ).json({
        success: true,
        message: 'User registered successfully.',
        data: {
        id: result.insertId,
        // name,
        // email,
        // hashedPassword,
        // type
        }
    });
    } catch(err){
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'An error occured, registration failed.',
            error: err.message
        });
    }


});

module.exports = router;
