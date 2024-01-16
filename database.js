import * as dotenv from 'dotenv';
dotenv.config();
import { MongoClient, ObjectId  } from 'mongodb';
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

async function registerUser(user) {
  try {
    const db = await connect();
    const registered = await db.collection("User").insertOne(user);
    debugDb(registered);
    return registered;
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
};

ping();
