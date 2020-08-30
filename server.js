// init project
'use strict';
const dotenv = require('dotenv').config();
const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	cors = require('cors'),
	mongodb = require('mongodb').MongoClient(),
	mongoose = require('mongoose'),
	bluebird = require('bluebird'),
	shortid = require('shortid'),
	moment = require('moment'),
	path = require('path'),
	port = process.env.PORT || 8080;

app.use(cors());

mongoose.Promise = require('bluebird');
const userInfo = require('./models/userDB');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Atlas Database Access Credentials
const dbUserName = process.env.USER_NAME;
const dbUserPass = process.env.USER_PASSWORD;
const dbName = process.env.DB_NAME;
const dbCluster = process.env.DB_CLUSTER;
const dbUrl = `mongodb+srv://${dbUserName}:${dbUserPass}@${dbCluster}/${dbName}?retryWrites=true&w=majority`;

mongoose.connect(
	dbUrl,
	{ useNewUrlParser: true, useUnifiedTopology: true },
	(err, db) => {
		if (err) {
			console.log('mongodb connection error ', err);
			process.exit(1);
		} else {
			console.log(
				'Successful database connection to Mongoose Atlas database named:',
				dbName
			);
		}
		app.get('/', (req, res) => {
			res.sendFile(__dirname + '/views/index.html');
		});

		// POST new user name with a generated id and empty exercises array to database
		// Check username does not exist by using mongoose findOne method
		app.post('/api/exercise/new-user', (req, res) => {
			let newUsername = req.body.username;
			let userid = shortid.generate();
			let newUser = new userInfo({
				username: req.body.username,
				userid: userid,
				exercise: [],
			});
			console.log('created new user ' + newUser);

			userInfo.findOne({ username: newUsername }, (err, user) => {
				if (user === '' || undefined) {
					res.json({ error: 'username required' });
				} else if (err) {
					console.log(err);
					return res.send('error: searching existing users');
				} else if (user !== null) {
					return res.send('username exists already');
				}
				newUser.save((err, user) => {
					if (err) throw err;
					res.json({
						username: newUsername,
						userid: userid,
					});
				});
				console.log('new user' + newUser);
			});
		});

		// POST exercise array to database by finding user using userid
		// Array unshift method used to add new item to beginning of exercise array
		// current date added as default if no user date input
		app.post('/api/exercise/add', (req, res) => {
			const user = req.body.userId;
			userInfo.findOne({ userid: user }, (err, user) => {
				console.log('user found: ', user);
				if (err) throw err;
				user.exercise.unshift({
					description: req.body.description,
					duration_in_minutes: req.body.duration,
					date: req.body.date ? req.body.date : moment().format('YYYY-MM-DD'),
				});
				user.save((err, user) => {
					if (err) throw err;
					res.json(user); //send back json object
				});
			});
		});

		// GET exercises from array using Array filter & slice methods
		app.get('/api/exercise/log', (req, res) => {
			const { userid, from, to } = req.query;

			const limit = req.query.limit || 10;

			console.log('userid = ' + userid, 'limit = ' + limit);
			console.log('from date is ' + from);
			console.log('to date is ' + to);

			if (!isNaN(limit)) {
				userInfo.findOne({ userid: userid }, (err, user) => {
					if (err) throw err;
					let exerciseLog = user.exercise.filter((value, index) => {
						if (index < limit) return value;
					});
					return res.json(exerciseLog);
				});
			} else if (moment(from) && moment(to)) {
				userInfo.findOne({ userid: userid }, (err, user) => {
					if (err) throw err;
					let exerciseLog = user.exercise.filter((value) => {
						if (
							moment(from).isBefore(value.date) &&
							moment(to).isAfter(value.date) &&
							moment(from).isBefore(moment(to))
						)
							return value.slice(limit).sort({ date: 1 });
					});
					return res.json(exerciseLog);
				});
			} else {
				userInfo.findOne({ userid: userid }, (err, user) => {
					return res.json(user);
				});
			}
		});

		// Not found middleware
		app.use((req, res, next) => {
			return next({ status: 404, message: 'not found' });
		});

		// Error Handling middleware
		app.use((err, req, res, next) => {
			let errCode, errMessage;

			if (err.errors) {
				// mongoose validation error
				errCode = 400;
				const keys = Object.keys(err.errors);
				// report the first validation error
				errMessage = err.errors[keys[0]].message;
			} else {
				// generic or custom error
				errCode = err.status || 500;
				errMessage = err.message || 'Internal Server Error';
			}
			res.status(errCode).type('txt').send(errMessage);
		});
	}
);

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
