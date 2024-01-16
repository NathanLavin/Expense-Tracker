import express from 'express';
const router = express.Router();
import debug from 'debug';
import { newId, getExpenses, getExpensesById, } from '../../database.js';
import { validBody } from '../../middleware/validBody.js';
import Joi from 'joi';

const debugUser = debug('app:ExpenseRouter');

router.get('/list', async (req, res) => {
  debugUser(`Getting all expenses, the query string is ${JSON.stringify(req.query)}`);

  try {
    // Get all users from the database
    const expenses = await getExpenses();

    // Send the users as the response
    res.status(200).json(expenses);

  } catch (err) {
    res.status(500).json({ error: err.stack });
  }
});

router.get('/:expenseId', async (req, res) => {
  debugUser(`Getting expense with id ${req.params.expenseId}`);

  try {
    // Get the user from the database
    const expense = await getExpensesById(req.params.expenseId);

    // Send the user as the response
    res.status(200).json(expense);

  } catch (err) {
    res.status(500).json({ error: err.stack });
  }
});

export {
  router as ExpenseRouter,
};