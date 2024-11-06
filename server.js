const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const user =  require('./routes/user');
const companies = require('./routes/company');
const path = require('path');
const employees = require('./routes/employee');
const cookieParser = require('cookie-parser');


dotenv.config()

const app = express();
const port = 3000;

const corsOptions = {
    origin: 'http://localhost:4200', // Replace with your actual frontend URL
    credentials: true,  // This allows cookies to be sent along with the request
  };

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/', user);
app.use('/', companies);
app.use('/', employees);


app.listen(port, () =>{
    console.log(`app running on port ${port}`);
});