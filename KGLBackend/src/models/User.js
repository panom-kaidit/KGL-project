const mongoose = require("mongoose");

const userSchema= new mongoose.Schema({
    name: {
        type:String,
        required
    },
    email:{
        type: String,
        unique: true,
        required
    },
    password: {
        type: String,
        required
    },
    role:{
        type: String
    }
});

module.exports = mongoose.model("User", userSchema)