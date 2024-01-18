import express from 'express';
const router = express.Router();
import debug from 'debug';
import { newId, getUsers, getUsersById, registerUser, loginUser, logoutUser, updateUser, deleteUser } from '../../database.js';
import { validBody } from '../../middleware/validBody.js';
// import { valid } from '../../middleware/validBody.js';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const debugUser = debug('app:UserRouter');

//Schemas
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

const userLoginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().required(),
});

//Functions
async function issueAuthToken(user) {
  const payload = { _id: user._id, email: user.email, role: user.role };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: '1h' };

  // Add logic for fetching roles and merging permissions if needed
  // const roles = await fetchRoles(user, role => findRoleByName(role));
  // const permissions = mergePermissions(user, roles);
  // payload.permissions = permissions;

  const authToken = jwt.sign(payload, secret, options);
  return authToken;
}

function issueAuthCookie(res, authToken) {
  const cookieOptions = { httpOnly: true, maxAge: 1000 * 60 * 60 };
  res.cookie('authToken', authToken, cookieOptions);
}

//Routes
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

    // Hash the user's password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Create a new user object with the provided data and the new ID
    const newUser = {
      _id: newUserId,
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword, // Store the hashed password in the database
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

router.post('/login', validBody(userLoginSchema), async (req, res) => {
  try {
    debugUser(`Attempting Login user with email ${req.body.email}`);

    // Get the user from the database
    const user = await loginUser({ email: req.body.email });

    // Check if the user exists
    if (!user) {
      throw new Error('User does not exist');
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Password is incorrect');
    }

    // Generate and send an authentication token
    const authToken = await issueAuthToken(user);

    // Set the authentication token as an HTTP-only cookie
    issueAuthCookie(res, authToken);

    res.status(200).json({ message: 'Login successful', authToken });

  } catch (err) {
    // Handle the error appropriately and send a 400 status code (Bad Request)
    res.status(400).json({ error: err.message });
  }
});

// Logout route not working correctly come back to this when I get the chance
router.post('/logout', async (req, res) => {
  try {
    const authToken = req.cookies.authToken; // Assuming you store the authToken in a cookie

    // Call the logoutUser function
    const logoutResult = await logoutUser(authToken);

    if (logoutResult) {
      // Clear the authentication token cookie
      res.clearCookie('authToken');

      // Send a success response
      res.status(200).json({ message: 'Logout successful' });
    } else {
      // Send an appropriate error response
      res.status(500).json({ error: 'Logout failed' });
    }
  } catch (err) {
    // Log the error for debugging purposes
    console.error(err);

    // Handle the error appropriately and send a 500 status code (Internal Server Error)
    res.status(500).json({ error: err.message });
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
