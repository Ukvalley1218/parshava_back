import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  accountgstKey: process.env.ACCOUNTGST_KEY,
  accountgstCompany: process.env.ACCOUNTGST_COMPANY
};