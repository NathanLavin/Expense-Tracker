import express from 'express';
const router = express.Router();
import debug from 'debug';
import { newId, getUsers, getUsersById, registerUser, loginUser, updateUser, deleteUser } from '../../database.js';
import { validBody } from '../../middleware/validBody.js';
import Joi from 'joi';

const debugUser = debug('app:UserRouter');

const userRegisterSchema = Joi.object({  // Corrected to Joi.object
  name: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().required(),
  yearlyIncome: Joi.number(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim(),
  email: Joi.string().trim().email(),
  password: Joi.string().trim(),
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

//bcrypt this and issueAuthToken this has not been fully implemented yet
router.post('/login', async (req, res) => {
  try {
    debugUser(`Attempting Login user with email ${req.body.email}`);

    // Get the user from the database
    const user = await loginUser(req.body.email);

    // Check if the user exists
    if (!user) {
      throw new Error('User does not exist');
    }

    // Check if the password is correct
    if (user.password !== req.body.password) {
      throw new Error('Password is incorrect');
    }

    // Send the user as the response with a 200 status code (OK)
    res.status(200).json(user);

  } catch (err) {
    // Handle the error appropriately and send a 400 status code (Bad Request)
    res.status(400).json({ error: err.message });
  }
});

router.put('/update/:userId', validBody(updateUserSchema), async (req, res) => {
  try {
    debugUser(`Attempting Updating user with name ${req.body.name}`);

    // Extract _id from req.params
    const userId = req.params.userId;

    // Extract update data from req.body based on the schema
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      yearlyIncome: req.body.yearlyIncome,
    };

    // Update the user in the database
    const updatedUser = await updateUser(userId, updateData);

    // Send the updated user as the response
    res.status(200).json(updatedUser);
  } catch (err) {
    // Log the error for debugging purposes
    console.error(err);

    // Handle the error appropriately and send a 500 status code (Internal Server Error)
    res.status(500).json({ error: err.message });
  }
});

router.delete('/delete/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Delete the user
    const deleteResult = await deleteUser(userId);

    // Send a success response
    res.status(200).json({ message: `User with _id ${userId} deleted` });
  } catch (err) {
    // Log the error for debugging purposes
    console.error(err);

    // Handle the error appropriately and send a 500 status code (Internal Server Error)
    res.status(500).json({ error: err.message });
  }
});



export {
  router as UserRouter
};
