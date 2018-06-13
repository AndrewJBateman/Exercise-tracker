//database structure
const mongoose = require('mongoose')

//const Schema = mongoose.Schema;

//exercise schema
const exerciseSchema = mongoose.Schema({
    description: { type: String, required: true },
    duration_in_minutes: { type: Number, required: true },
    date: { type: String, sort: "ASC"}
})

//user schema
const userSchema = mongoose.Schema({
    username: { type: String, required: true },
    userid: { type: String, required: true },
    exercise: [exerciseSchema]
},{
    versionKey: false }
)

const userInfo = module.exports = mongoose.model('User', userSchema, 'userDB')