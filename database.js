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

  getExpenses,
  getExpensesById,
};


ping();
