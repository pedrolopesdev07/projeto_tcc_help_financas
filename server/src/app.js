import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', message: 'Help Finanças backend está ativo.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  return res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor.' });
});

app.listen(port, () => {
  console.log(`Servidor Help Finanças rodando em http://localhost:${port}`);
});

export default app;
