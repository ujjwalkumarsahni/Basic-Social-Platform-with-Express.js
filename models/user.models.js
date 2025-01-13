const mongoose = require('mongoose');

require('dotenv').config();
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Error connecting to MongoDB:', err));


const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    age: Number,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ]
});

const User = mongoose.model('user', userSchema);

module.exports = User;