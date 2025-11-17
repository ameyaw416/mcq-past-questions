import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

const isProduction = process.env.NODE_ENV === 'production';

const parseDurationToMs = (value, fallbackMs) => {
  if (!value) return fallbackMs;
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) return fallbackMs;
  const qty = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'ms':
      return qty;
    case 's':
      return qty * 1000;
    case 'm':
      return qty * 60 * 1000;
    case 'h':
      return qty * 60 * 60 * 1000;
    case 'd':
      return qty * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
};

const accessCookieMaxAge = parseDurationToMs(ACCESS_EXPIRES_IN, 15 * 60 * 1000);
const refreshCookieMaxAge = parseDurationToMs(REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);

const generateTokens = (user) => {
  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  created_at: user.created_at,
});

export const signupUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role = 'student' } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required.' });
    }

    const userExists = await pool.query('SELECT id FROM Users WHERE email = $1', [email]);
    if (userExists.rowCount) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const insertResult = await pool.query(
      `INSERT INTO Users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, created_at`,
      [fullName, email, hashedPassword, role],
    );

    const user = insertResult.rows[0];
    const tokens = generateTokens(user);

    res
      .cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: accessCookieMaxAge,
      })
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: refreshCookieMaxAge,
        path: '/api/auth',
      })
      .status(201)
      .json({
      message: 'User registered successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await pool.query(
      'SELECT id, full_name, email, password_hash, role, created_at FROM Users WHERE email = $1',
      [email],
    );

    if (!result.rowCount) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const tokens = generateTokens(user);
    const safeUser = sanitizeUser(user);

    res
      .cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: accessCookieMaxAge,
      })
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: refreshCookieMaxAge,
        path: '/api/auth',
      })
      .status(200)
      .json({
      message: 'Login successful.',
      user: safeUser,
    });
  } catch (error) {
    console.error('loginUser error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const refreshTokens = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const result = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM Users WHERE id = $1',
      [decoded.userId],
    );

    if (!result.rowCount) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    const user = result.rows[0];
    const tokens = generateTokens(user);
    const safeUser = sanitizeUser(user);

    res
      .cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: accessCookieMaxAge,
      })
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: refreshCookieMaxAge,
        path: '/api/auth',
      })
      .status(200)
      .json({
        message: 'Tokens refreshed.',
        user: safeUser,
      });
  } catch (error) {
    console.error('refreshTokens error:', error);
    if (error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired.' });
    }
    if (error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const logoutUser = (req, res) => {
  res
    .clearCookie('accessToken')
    .clearCookie('refreshToken', { path: '/api/auth' })
    .status(200)
    .json({ message: 'Logout successful.' });
};
