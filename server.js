import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import debug from 'debug';
const debugServer = debug('app:Server');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('reactApp/dist'));
const port = process.env.PORT || 2024;

//Api
app.get('/api/user/list', (req, res) => {
  res.status(200).json('Hello from the API');
});

app.listen(port, () => {
  debugServer(`Server running at http://localhost:${port}`);
});