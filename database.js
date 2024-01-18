import * as dotenv from 'dotenv';
dotenv.config();
import { MongoClient, ObjectId } from 'mongodb';
import debug from 'debug';
const debugDb = debug('app:Database');

const newId = (str) => new ObjectId(str);

let db = null;

async function connect() {
  if (!db) {
    const dbUrl = process.env.DB_URL;
    const dbName = process.env.DB_NAME;
    const client = await MongoClient.connect(dbUrl);
    db = client.db(dbName);
    debugDb('Connected.');
  }
  return db;
}

//User functions
async function getUsers() {
  const database = await connect();
  const users = await database.collection('Users').find().toArray();
  debugDb(users);
  return users;
}

async function getUsersById(userId) {
  const database = await connect();
  const user = await database.collection('Users').findOne({ _id: newId(userId) });
  debugDb(user);
  return user;
}

async function isEmailExists(email) {
  const database = await connect();
  const existingUser = await database.collection('Users').findOne({ email });
  return !!existingUser;
}

async function registerUser(user) {
  try {
    const emailExists = await isEmailExists(user.email);
    if (emailExists) {
      throw new Error('Email already exists. Please use a different email.');
    }

    const db = await connect();
    const registered = await db.collection('Users').insertOne(user);
    debugDb(registered);
    return registered;
  } catch (error) {
    throw error;
  }
}

async function loginUser(user) {
  try {
    const db = await connect();
    const registered = await db.collection('Users').findOne(user);
    debugDb(registered);
    return registered;
  } catch (error) {
    throw error;
  }
}

async function logoutUser(authToken) {
  try {
    const db = await connect();

    // Your logic to logout the user, update any necessary fields, clear tokens, etc.

    debugDb(`User with authentication token ${authToken} logged out`);
    return true; // Return true if the user was successfully logged out
  } catch (error) {
    throw error;
  }
}

async function updateUser(userId, updateData) {
  try {
    const db = await connect();

    // Convert userId to ObjectId
    const objectIdUserId = newId(userId);

    // Build the update object based on provided non-null values
    const updateObject = {};
    if (updateData.name !== null && updateData.name !== undefined) {
      updateObject.name = updateData.name;
    }
    if (updateData.email !== null && updateData.email !== undefined) {
      updateObject.email = updateData.email;
    }
    if (updateData.password !== null && updateData.password !== undefined) {
      updateObject.password = updateData.password;
    }
    if (updateData.yearlyIncome !== null && updateData.yearlyIncome !== undefined) {
      updateObject.yearlyIncome = updateData.yearlyIncome;
    }

    // Update the user in the database
    const updateResult = await db.collection('Users').updateOne(
      { _id: objectIdUserId },
      {
        $set: updateObject
      }
    );

    // Check if any modifications were made
    if (updateResult.matchedCount === 0) {
      throw new Error(`User not found for _id: ${userId}`);
    }

    // Retrieve the updated user after the update operation
    const updatedUser = await db.collection('Users').findOne({ _id: objectIdUserId });
    debugDb(updatedUser);
    return updatedUser;
  } catch (error) {
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    const db = await connect();

    // Convert userId to ObjectId
    const objectIdUserId = newId(userId);

    // Delete the user from the database
    const deleteResult = await db.collection('Users').deleteOne({ _id: objectIdUserId });

    // Check if any user was deleted
    if (deleteResult.deletedCount === 0) {
      throw new Error(`User not found for _id: ${userId}`);
    }

    debugDb(`User with _id ${userId} deleted`);
    return deleteResult;
  } catch (error) {
    throw error;
  }
}



//Expense functions
async function getExpenses() {
  const database = await connect();
  const expenses = await database.collection('Expenses').find().toArray();
  debugDb(expenses);
  return expenses;
}

async function getExpensesById(expenseId) {
  const database = await connect();
  const expense = await database.collection('Expenses').findOne({ _id: newId(expenseId) });
  debugDb(expense);
  return expense;
}

async function addExpense(expense) {
  try {
    const db = await connect();
    const added = await db.collection('Expenses').insertOne(expense);
    debugDb(added);
    return added;
  } catch (error) {
    throw error;
  }
}

async function updateUserExpenseDetails(userId, newExpenseId, expenseName, cost) {
  try {
    const db = await connect();
    // Update the user document to include the new expenseDetails
    const updatedUser = await db.collection('Users').updateOne(
      { _id: userId },
      {
        $addToSet: {
          expenses: {
            _id: newExpenseId,
            expenseName: expenseName,
            cost: cost,
          }
        }
      }
    );

    debugDb(updatedUser);
    return updatedUser;
  } catch (error) {
    throw error;
  }
}

async function deleteExpense(expenseId) {
  try {
    const db = await connect();

    // Convert expenseId to ObjectId
    const objectIdExpenseId = newId(expenseId);

    // Delete the expense from the Expenses collection
    const deleteExpenseResult = await db.collection('Expenses').deleteOne({ _id: objectIdExpenseId });

    // Check if any expense was deleted
    if (deleteExpenseResult.deletedCount === 0) {
      throw new Error(`Expense not found for _id: ${expenseId}`);
    }

    // Delete the expense from the corresponding user's expenses array in the Users collection
    const deleteFromUserResult = await db.collection('Users').updateOne(
      { 'expenses._id': objectIdExpenseId },
      {
        $pull: {
          expenses: { _id: objectIdExpenseId }
        }
      }
    );

    // Check if any modification was made in the user's expenses array
    if (deleteFromUserResult.modifiedCount === 0) {
      throw new Error(`Expense not found for _id: ${expenseId} in the user's expenses`);
    }

    debugDb(`Expense with _id ${expenseId} deleted`);
    return { deleteExpenseResult, deleteFromUserResult };
  } catch (error) {
    throw error;
  }
}

async function updateExpensePrice(expenseId, newCost) {
  try {
    const db = await connect();

    // Convert expenseId to ObjectId
    const objectIdExpenseId = newId(expenseId);

    // Update the price of the expense in the Expenses collection
    const updateResult = await db.collection('Expenses').updateOne(
      { _id: objectIdExpenseId },
      {
        $set: { 'expenseDetails.cost': newCost }
      }
    );

    // Check if any modifications were made
    if (updateResult.matchedCount === 0) {
      throw new Error(`Expense not found for _id: ${expenseId}`);
    }

    // Update the cost in the corresponding user's expenses array
    const updateUserResult = await db.collection('Users').updateOne(
      { 'expenses._id': objectIdExpenseId },
      {
        $set: { 'expenses.$.cost': newCost }
      }
    );

    // Check if any modifications were made to the user document
    if (updateUserResult.matchedCount === 0) {
      throw new Error(`User not found for expense _id: ${expenseId}`);
    }

    debugDb(`Expense with _id ${expenseId} updated with new cost: ${newCost}`);
    return updateResult;
  } catch (error) {
    throw error;
  }
}



async function ping() {
  const database = await connect();
  await database.command({ ping: 1 });
  debugDb('Ping.');
}

export {
  connect,
  ping,
  newId,
  getUsers,
  getUsersById,
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
  getExpenses,
  getExpensesById,
  addExpense,
  updateUserExpenseDetails,
  deleteExpense,
  updateExpensePrice,
};


ping();
