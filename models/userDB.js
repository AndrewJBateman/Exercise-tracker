//database structure
const mongoose = require('mongoose')

//const Schema = mongoose.Schema;

//exercise schema
const exerciseSchema = mongoose.Schema({
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: String }
})

//user schema
const userSchema = mongoose.Schema({
    username: { type: String, required: true },
    userid: { type: String, required: true },
    exercise: [exerciseSchema],
    count: { type: Number }
},{
    versionKey: false }
)

const userInfo = module.exports = mongoose.model('User', userSchema, 'userDB')