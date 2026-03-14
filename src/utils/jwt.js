import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// Generate JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpire
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};