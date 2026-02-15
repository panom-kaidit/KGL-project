require('dotenv').config()
const mongoose = require('mongoose')
DB_URI = process.env.KGL_DB;

const connectDb = async ()=>{
    try{
        await mongoose.connect(DB_URI)
        console.log('Connected to database');

    } catch (err){
        console.log(`Connection to the data base failed`, err.message)
    }
    }
module.exports = connectDb;