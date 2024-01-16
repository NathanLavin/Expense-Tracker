import express from 'express';
const router = express.Router();
import debug from 'debug';
import { newId, getUsers, getUsersById, registerUser } from '../../database.js';
import { validBody } from '../../middleware/validBody.js';
import Joi from 'joi';

const debugUser = debug('app:UserRouter');

const userRegisterSchema = Joi.object({  // Corrected to Joi.object
  name: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().required(),
  yearlyIncome: Joi.number(),
});

router.get('/list', async (req, res) => {
  debugUser(`Getting all users, the query string is ${JSON.stringify(req.query)}`);

  try {
    // Get all users from the database
    const users = await getUsers();

    // Send the users as the response
    res.status(200).json(users);

  } catch (err) {
    res.status(500).json({ error: err.stack });
  }
});

router.get('/:userId', async (req, res) => {
  debugUser(`Getting user with id ${req.params.userId}`);

  try {
    // Get the user from the database
    const user = await getUsersById(req.params.userId);

    // Send the user as the response
    res.status(200).json(user);

  } catch (err) {
    res.status(500).json({ error: err.stack });
  }
});

router.post('/register', validBody(userRegisterSchema), async (req, res) => {
  try {
    debugUser(`Attempting Registering user with name ${req.body.name}`);

    // Generate a new ID using newId function (adjust the path accordingly)
    const newUserId = newId();

    // Create a new user object with the provided data and the new ID
    const newUser = {
      _id: newUserId,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      yearlyIncome: req.body.yearlyIncome,
    };

    // Register the new user in the database
    await registerUser(newUser);

    // Get the user by ID to include the generated ID in the response
    const user = await getUsersById(newUserId);

    // Send the user as the response with a 201 status code (Created)
    res.status(201).json(user);

  } catch (err) {
    // Handle the error appropriately and send a 400 status code (Bad Request)
    res.status(400).json({ error: err.message });
  }
});

export {
  router as UserRouter
};
