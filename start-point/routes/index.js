'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var bodyParser = require('body-parser');

// body parsing middleware
router.use(bodyParser.urlencoded({ extended: true })); // for HTML form submits
router.use(bodyParser.json()); // would be for AJAX requests


module.exports = function makeRouterWithSockets (io, client) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT * FROM users INNER JOIN tweets ON users.id = tweets.userid', function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    client.query('SELECT * FROM users INNER JOIN tweets ON users.id = tweets.userid WHERE name = $1;', [req.params.username], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets });
    });
    // var tweetsForName = tweetBank.find({ name: req.params.username });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsForName,
    //   showForm: true,
    //   username: req.params.username
    // });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    client.query('SELECT * FROM users INNER JOIN tweets ON users.id = tweets.userid WHERE tweets.id = $1', [Number(req.params.id)], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets });
    });
    // var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsWithThatId // an array of only one element ;-)
    // });
  });

  // create a new tweet
 router.post('/tweets', function(req, res, next){
    var name = req.body.name;
    var content = req.body.content;
    client.query('SELECT * FROM users WHERE name = $1', [name],
      function(err,result){
        if (result.rowCount === 0) {
          client.query('INSERT INTO users (name, pictureurl) VALUES ($1,$2)',[name,"http://lorempixel.com/200/200/"],
            function(err,result){
              if(err) return next(err);
              client.query('SELECT id FROM users WHERE name = $1', [name],
                function (err,result){
                  if(err) return next(err);
                  var newid = result.rows[0].id;
                  client.query('INSERT INTO tweets (userid, content) VALUES ($1,$2)', [newid,content],
                    function (err,result){
                      if(err) return next(err);
                      res.redirect('/');
                  });
              });
          });
        } else {
              client.query('SELECT id FROM users WHERE name = $1', [name],
                function (err,result){
                  if(err) return next(err);
                  var newid = result.rows[0].id;
                  client.query('INSERT INTO tweets (userid, content) VALUES ($1,$2)', [newid,content],
                    function (err,result){
                      if(err) return next(err);
                      res.redirect('/');
                  });
              });
        }
    });
});

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
};
