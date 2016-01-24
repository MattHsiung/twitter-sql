'use strict';
var express = require('express');
var router = express.Router();
// pull in the Sequelize library
var Sequelize = require('sequelize');
var _ = require('lodash');
// create an instance of a database connection
// which abstractly represents our app's mysql database
var twitterjsDB = new Sequelize('twitterjs', 'root', null, {
    dialect: "mysql",
    port:    3306,
});

// open the connection to our database
twitterjsDB
  .authenticate()
  .catch(function(err) {
    console.log('Unable to connect to the database:', err);
  })
  .then(function() {
    console.log('Connection has been established successfully.');
  });

var Tweet = require('./tweet')(twitterjsDB);
var User = require('./user')(twitterjsDB);

// adds a UserId foreign key to the `Tweet` table
User.hasMany(Tweet);
User.hasMany(Tweet,{as: 'Text' });
Tweet.belongsTo(User);

var allTheTweets=[];
User.findAll({ include: [ {model: Tweet, as: 'Text', where: {}} ] }).then(function(users) {
   JSON.parse(JSON.stringify(users)).forEach(function(el){
      for (var tweetNo=0;tweetNo<el.Text.length;tweetNo++)
         allTheTweets.push({name: el.name, text: el.Text[tweetNo].tweet, id: el.Text[tweetNo].id});
   });
   //console.log(allTheTweets);
});

module.exports = {
    User: User,
    Tweet: Tweet,
    makeRouterWithSockets: function(io) {
      // a reusable function
      function respondWithAllTweets (req, res, next){
        res.render('index', {
          title: 'Twitter.js',
          tweets: allTheTweets,
          showForm: true
        });
      }
      // here we basically treet the root view and tweets view as identical
      router.get('/', respondWithAllTweets);
      router.get('/tweets', respondWithAllTweets);

      // single-user page
      router.get('/users/:username', function(req, res, next){
        var tweetsForName = _.filter(allTheTweets,{ name: req.params.username });
        res.render('index', {
          title: 'Twitter.js',
          tweets: tweetsForName,
          showForm: true,
          username: req.params.username
        });
      });

      // single-tweet page
      router.get('/tweets/:id', function(req, res, next){
        var tweetsWithThatId = _.filter(allTheTweets,{ id: Number(req.params.id) });
        res.render('index', {
          title: 'Twitter.js',
          tweets: tweetsWithThatId // an array of only one element ;-)
        });
      });

      //create a new tweet
      router.post('/tweets', function(req, res, next){
         // User.findOrCreate(where:{name: req.body.name}).then(function(){
         //
         // };

        var newTweet = tweetBank.add(req.body.name, req.body.text);
        io.sockets.emit('new_tweet', newTweet);
        res.redirect('/');
      });

      return router;
    }
};
