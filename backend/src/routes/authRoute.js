// Auth route
import express from 'express';
import { signupUser, loginUser, logoutUser } from '../controllers/authController.js';

const router = express.Router();

// Register route
router.post('/signup', signupUser);

// Login route
router.post('/login', loginUser);

//logout
router.post('/logout', logoutUser);



export default router;