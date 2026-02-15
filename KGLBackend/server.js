// importing the path module
const path = require('path');

// creating express server and initialise it 
const express = require('express');
const app = express();

// importing dotenv
require('dotenv').config();

const port = process.env.PORT;

// Importing the database
const connectDb = require(
  path.join(__dirname, 'src', 'config', 'db_Connect')
);

connectDb();
// server listening
app.listen(port,(err)=>{
    if(err){
        console.log(err)
    }else{
        console.log('Listening to the port');
        
    }
})