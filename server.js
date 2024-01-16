import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import debug from 'debug';
const debugServer = debug('app:Server');

import { UserRouter } from './routes/api/user.js';
// import { ExpenseRouter } from './routes/api/expenses.js';

//To start front end make sure cd ExpenseTracker is open in terminal and run npm run dev
//To start backend open terminal and run npm run start-dev

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('reactApp/dist'));
const port = process.env.PORT || 2024;

//Api
app.get('/', (req, res) => {
  res.status(200).json('Hello from the API');
});

app.use('/api/user', UserRouter);
// app.use('/api/expense', ExpenseRouter);

app.listen(port, () => {
  debugServer(`Server running at http://localhost:${port}`);
});