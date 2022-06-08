const dotenv = require('dotenv');
const mongoose = require('mongoose');

// HANDLING UNCAUGHT EXCEPTIONS
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION. Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// CONNECTING TO config.env FILE
dotenv.config({ path: 'config.env' });
const app = require('./app');

// CONECTING TO THE DB
const DB = process.env.DATABASE.replace(
  /PASSWORD/g,
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => {
  console.log('DB connection successfull');
});

// START THE SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// HANDLING UNHANDLED REJECTION
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION. Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
