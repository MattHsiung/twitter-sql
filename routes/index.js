'use strict';
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var User = require('../models').User;
var Tweet = require('../models').Tweet;

module.exports =  {
   makeRouterWithSockets: function(io) {
      // a reusable function
      //updateTweets();
      var allTheTweets;
      function updateTweets() {
         console.log("called update");
         allTheTweets=[];
          User.findAll({ include: [ {model: Tweet, as: 'Text', where: {}} ] }).then(function(users) {
          JSON.parse(JSON.stringify(users)).forEach(function(el){
          for (var tweetNo=0;tweetNo<el.Text.length;tweetNo++)
              allTheTweets.push({name: el.name, text: el.Text[tweetNo].tweet, id: el.Text[tweetNo].id});
          });
          console.log(allTheTweets);
          });
      }
      //updateTweets();
      function respondWithAllTweets (req, res, next){
   //updateTweets();
         allTheTweets=[];
         User.findAll({ include: [ {model: Tweet, as: 'Text', where: {}} ] })
         .then(function(users) {
            console.log(JSON.parse(JSON.stringify(users)));
            JSON.parse(JSON.stringify(users)).forEach(function(el){
            for (var tweetNo=0;tweetNo<el.Text.length;tweetNo++)
                allTheTweets.push({name: el.name, text: el.Text[tweetNo].tweet, id: el.Text[tweetNo].id});
            });
            return allTheTweets;
         })
         .then(function(result) {
            res.render('index', {
              title: 'Twitter.js',
              tweets: result,
              showForm: true
            });
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
         User.findOrCreate({where:{name: req.body.name}}).then(function(user){
            var newUser=JSON.parse(JSON.stringify(user));
            Tweet.create({UserId: newUser[0].id,tweet:req.body.text});
            res.redirect('/');
         });
       var newTweet={name: req.body.name, text: req.body.text};
       io.sockets.emit('new_tweet', newTweet);

      });
      return router;
    }
}
