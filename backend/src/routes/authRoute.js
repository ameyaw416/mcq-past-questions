// Auth route
import express from 'express';
import { signupUser, loginUser, logoutUser, refreshTokens } from '../controllers/authController.js';
import { validateLogin, validateSignup } from '../middlewares/inputValidatorMiddleware.js';

const router = express.Router();

// Register route
router.post('/signup',validateSignup, signupUser);

// Login route
router.post('/login', validateLogin, loginUser);

//logout
router.post('/logout', logoutUser);

// refresh tokens
router.post('/refresh', refreshTokens);



export default router;
