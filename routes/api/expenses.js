import express from 'express';
const router = express.Router();
import debug from 'debug';
import { newId, getExpenses, getExpensesById, addExpense, updateUserExpenseDetails } from '../../database.js';
import { validBody } from '../../middleware/validBody.js';
import Joi from 'joi';

const debugUser = debug('app:ExpenseRouter');

const expenseSchema = Joi.object({
  expenseName: Joi.string().trim().required(),
  cost: Joi.number().precision(2).required(),
});

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

router.post('/add/:userId', validBody(expenseSchema), async (req, res) => {
  try {
    debugUser(`Attempting Adding expense with name ${req.body.expenseName}`);

    // Generate a new ID using newId function (adjust the path accordingly)
    const newExpenseId = newId();
    const userId = newId(req.params.userId); // Convert userId to ObjectId

    // Create a new expense object with the provided data and the new ID
    const newExpense = {
      _id: newExpenseId,
      userId: userId,
      expenseDetails: {
        expenseName: req.body.expenseName,
        cost: req.body.cost,
      },
    };

    // Add the new expense to the database
    const addedExpense = await addExpense(newExpense);

    // Update the user document to include the new expenseDetails in the expenses array
    await updateUserExpenseDetails(userId, newExpenseId, req.body.expenseName, req.body.cost);

    // Send the added expense as the response
    res.status(201).json(addedExpense);

  } catch (err) {
    res.status(500).json({ error: err.stack });
  }
});

export {
  router as ExpenseRouter,
};