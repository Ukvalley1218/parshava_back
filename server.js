import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';
import customerRoutes from './src/routes/customer.routes.js';
import productRoutes from './src/routes/product.routes.js';
import syncRoutes from './src/routes/sync.routes.js';
import { errorHandler, notFound } from './src/middleware/error.middleware.js';
import { startCronJobs } from './src/utils/cronJobs.js';
import inquiryRoutes from './src/routes/inquiry.routes.js'
import orderRoutes from './src/routes/order.routes.js'
import dashboardRoutes from './src/routes/dashboard.routes.js'
import schemeRoutes from './src/routes/scheme.routes.js'
import notificationRoutes from './src/routes/notification.routes.js'
import adminRoutes from './src/routes/admin/index.js'

dotenv.config();
startCronJobs()

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Paarshva Infotech API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sync', syncRoutes);
app.use("/api/inquiries", inquiryRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/schemes", schemeRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/admin", adminRoutes)

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

export default app;