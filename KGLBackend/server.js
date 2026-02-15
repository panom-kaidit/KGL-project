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

// Importing the  routers
const procurementRoutes = require(path.join(__dirname,"src","routes","procurementRoutes"));
const salesRoutes = require(path.join(__dirname,"src","routes","salesRoutes"));
const userRoutes = require(path.join(__dirname,"src","routes","userRoutes"));

app.use("/procurement", procurementRoutes);
app.use("/sales", salesRoutes);
app.use("/users", userRoutes);
// server listening
app.listen(port,(err)=>{
    if(err){
        console.log(err)
    }else{
        console.log('Listening to the port');
        
    }
})