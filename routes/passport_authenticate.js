var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

var models = require('../models/models');
var User = models.User;

passport.use(new LocalStrategy(
	{
    usernameField: 'email',
    passwordField: 'password'
  },
  function(username, password, done) {
		//console.log(username, password);
    User.findOne({ email: username }, function (err, user) {
			// console.log(username, password, user);
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
			if (user.password != password) {
				// !user.validPassword(password)
        return done(null, false, { message: 'Incorrect password.' });
      }
				return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
	// console.log(111, user);
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	// console.log(222, id);
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local'),
	function(req, res) {
		// successfully login fucntion
    res.json(req.user);
  }
	// fail will response 401
);

router.route('/logout')
	.get(function(req, res, next){
		req.logout();
		res.redirect('/');
	});
	
router.route('/check-authority')
	.post(function(req, res, next){
		if(req.user){
			res.json(req.user);
		}else{
			res.json(0);
		}
	});

// new User({username: 1, password: 2, first:'Gong', last: 'Chen', date_create: new Date()}).save();

module.exports = router;