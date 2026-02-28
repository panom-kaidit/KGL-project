// importing the path module
const path = require('path');

// importing swagger to server
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");

// creating express server and initialise it 
const express = require('express');
const app = express();
// initialising cors
const cors = require('cors');
app.use(cors());
// importing dotenv
require('dotenv').config();

const port = process.env.PORT;

// Importing the database
const connectDb = require(
  path.join(__dirname, 'src', 'config', 'db_Connect')
);

connectDb();
app.use(express.json());
// Importing the  routers
const procurementRoutes = require(path.join(__dirname,"src","routes","procurementRoutes"));
const salesRoutes = require(path.join(__dirname,"src","routes","salesRoutes"));
const userRoutes = require(path.join(__dirname,"src","routes","userRoutes"));
const statisticsRoutes = require(path.join(__dirname,"src","routes","statisticsRoutes"));
const inventoryRoutes = require(path.join(__dirname,"src","routes","inventoryRoutes"));
const creditRoutes = require(path.join(__dirname,"src","routes","creditRoutes"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/procurement", procurementRoutes);
app.use("/sales", salesRoutes);
app.use("/users", userRoutes);
app.use("/api/manager", statisticsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/credits", creditRoutes);
// server listening  on the specified port
app.listen(port,(err)=>{
    if(err){
        console.log(err)
    }else{
        console.log(`Listening on port ${port}`);
        
    }
})