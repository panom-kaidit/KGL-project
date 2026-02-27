const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["Manager", "Sales-agent", "Director"],
    default: "sales agent",
    required: true
  },
  branch: {
    type: String,
    enum: ["Maganjo", "Matugga"]
  },
  phone: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  profilePicture: {
    type: String,
    default: ""
  }
});

const UserModel = mongoose.model('Users', userSchema)

module.exports = UserModel