var express = require('express');
var router = express.Router();
var moment = require('moment');
var bcrypt = require('bcryptjs')
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var async = require('async');
const { check,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var Entry = require('../models/entry')
var User = require('../models/user')
var Category = require('../models/category')

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Frustrations Journal'});
	// after you finish this, you'll need to update the post request for adding entries
});

router.get('/journal', ensureAuthenticated, function(req, res, next) {
  //console.log(req.user);

  async.parallel({
  	entries: function(callback) {
  		Entry.find({'user': req.user._id}).populate('category').exec(callback);
  	}, 
  	categories: function(callback) {
  		Category.find({'user': req.user._id}).exec(callback)
  	}, 
  	}, function(err, results) {
  		if (err) { return next(err); }
  		//console.log(results.entries)
  		res.render('journal', { title: 'Frustrations Journal', entries: results.entries, categories: results.categories, filtered: false });
	});
});

// Get a single entry's details

router.get('/journal/:id', ensureAuthenticated, function(req, res, next) {
	Entry.findById(req.params.id)
	.populate('category')
	.exec(function(err, entry){
		if (err) { return next(err); }
		//console.log(entry)
		res.render('single-entry', {title: 'Entry Details', entry: entry})
	})
})

// Filter a user's entries by category

router.post('/journal', ensureAuthenticated, function(req, res, next) {
	var categories = req.body.category;
	//console.log(categories);

	async.parallel({
  	entries: function(callback) {
  		Entry.find({'user': req.user._id, 'category': {$in: categories}}).populate('category').exec(callback);
  	}, 
  	categories: function(callback) {
  		Category.find({'user': req.user._id}).exec(callback)
  	}, 
  	}, function(err, results) {
  		if (err) { return next(err); }
  		console.log(results.entries);
  		res.render('journal', { title: 'Frustrations Journal', entries: results.entries, categories: results.categories, filtered: true });
	});
})

// Add a category (from the add new entry form)

router.post('/add-category', ensureAuthenticated, 
	[
		check('name', 'Your category needs a name.').isLength({min:1}).trim()
	], 
	function(req, res, next) {
		const errors = validationResult(req);

		var category = new Category({
			name: req.body.name,
			user: req.user._id
		});

		if(!errors.isEmpty()) {
			req.flash('failure', 'You category wasn\'t added. Try again.')
			res.redirect('/add-entry');
			return;
		} else {
			category.save(function (err) {
				if(err) {
					return next(err);
				}
				//req.flash('success', 'Entry created.')
				res.redirect('/add-entry');
			})
		}

})

router.get('/add-entry', ensureAuthenticated, function(req, res, next) {
	Category.find({user: req.user._id}).exec(function(err, categories) {
		if (err) { return handleError(err); }
		res.render('add-entry', {title: 'Add Journal Entry', categories: categories});
	})
})

function ensureAuthenticated(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	res.redirect('/login');
}

router.post('/', 
	[
		check('title', 'Please enter a title.').isLength({min:1}).trim(),
		check('location', 'Please enter a location.').isLength({min:1}).trim(),
		check('description', 'Please enter a description.').isLength({min:1}).trim(),
		check('idea', 'Please enter an idea.').isLength({min:1}).trim(),
		check('category', 'Choose a cateogry.').isMongoId()
	], 
	function(req, res, next) {
		const errors = validationResult(req);
		var date = moment().format('MMM D, YYYY');
		var user = req.user._id;
		//console.log(req.body);

		var entry = new Entry({
			title: req.body.title,
			location: req.body.location,
			description: req.body.description,
			category: req.body.category,
			idea: req.body.idea,
			size: req.body.size,
			date: date,
			user: user
		});

		if(!errors.isEmpty()) {
			Category.find({user: req.user._id}).exec(function(err, categories) {
				if (err) { return handleError(err); }
				res.render('add-entry', {title: 'Add Journal Entry', categories: categories, entry: entry, errors:errors.array()});
				//console.log(entry);
			})
			//res.render('add-entry', {title: 'Add Entry', errors:errors.array()});
			return;
		} else {
			entry.save(function(err) {
				if(err) {
					return next(err);
				}
				req.flash('success', 'Entry created.')
				res.redirect('/journal');
			})
		}

})

router.get('/login', function(req, res, next) {
	res.render('login', {title: 'Login'});
})

router.post('/login', 
  passport.authenticate('local', 
  	{
  		successRedirect: '/journal',
  		failureRedirect: '/login',
  		failureFlash: true
  	}
  )
 );

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done) {
    // find user by username
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Email or password is wrong.' });
      } else {
      	bcrypt.compare(password, user.password, function(err, res) {
      		if(err) { return next(err); }
      		if(res) {
      			//console.log(user); // remove before going to production
      			return done(null, user);
      		} else {
      			return done(null, false, {message: 'Email or password is wrong.'});
      		}
      	})
      }
    });
}));

router.get('/register', function(req, res, next) {
	res.render('register', {title: 'Create Account'});
})


router.post('/register', [
		check('username', 'Please enter a valid email address.').isLength({min:1}).isEmail().trim(),
		check('password', 'Your password should be at least 6 characters long.').isLength({min:6})
	], 
	function(req, res, next) {
		const errors = validationResult(req);

		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(req.body.password, salt);

		var user = new User({
			username: req.body.username,
			password: hash
		});

		if(!errors.isEmpty()) {
			res.render('register', {title: 'Create Account', errors:errors.array(), username: user.username});
			return;
		} else {
			User.find({'username': req.body.username}, function(err, result){
				if (err) return handleError(err);
				if (result.length !== 0) {
					//console.log(result);
					res.render('register', {title: 'Create Account', field:'username', message:'Please choose a different email.'})
				} else {
					user.save(function(err) {
						if(err) {
							return next(err);
						}
						req.flash('success', 'Registration Success! You can now log in.')
						res.redirect('login');
					})
				}
			})
		}
	}
);

router.get('/logout', function(req, res) {
	req.logout();
	req.flash('success', 'You were logged out.');
	res.redirect('/login');
});

router.get('/profile', ensureAuthenticated, function(req, res, next) {
	var username = req.user.username;
	res.render('profile', {title: 'My Profile', username: username})
})

router.get('/profile/change-email', ensureAuthenticated, function(req, res, next) {
	var username = req.user.username;
	res.render('change-email', {title: 'Change Email Address', username:username})
})

router.post('/profile/change-email', [
	check('new_username', 'Please enter a valid email address.').isLength({min:1}).isEmail().trim(),
	check('match_new_username', 'This should match your new email address.').equals('new_username')
	], 
	ensureAuthenticated, function(req, res, next) {
		const errors = validationResult(req);

		var username = req.user.username;
		var updated_username = req.body.new_username

		if(!errors.isEmpty()) {
			res.render('change-email', {title: 'Change Email Address', errors:errors.array(), username: username});
			return;
		} else {
			User.findOneAndUpdate({username: username}, {username: updated_username}, {}, function(err, result){
				if(err) {
					return next(err);
				}	
				req.flash('success', 'Success! You changed your email address.')
				res.redirect('/profile');
			})
		}
	}
)

router.get('/profile/change-password', ensureAuthenticated, function(req, res, next) {
	res.render('change-password', {title: 'Change Password'})
})

router.post('/profile/change-password', ensureAuthenticated, [
		check('newPassword', 'Your password should be at least 6 characters long.').isLength({min:6}),
		//check('newPassword2', 'This should match your new password.').equals('newPassword')
	], function(req, res, next) {
		const errors = validationResult(req);

		var username = req.user.username;
		var new_password = req.body.new_password
		var match_new_password = req.body.match_new_password
		var salt = bcrypt.genSaltSync(10);
		var hash_current_password = bcrypt.hashSync(req.body.password, salt);
		var hash_new_password = bcrypt.hashSync(req.body.newPassword, salt);

		if(!errors.isEmpty()) {
			//console.log(new_password)
			//console.log(match_new_password)
			res.render('change-password', {title: 'Change Password', errors:errors.array()});
			return;
		} else if (new_password !== match_new_password) {
			res.render('change-password', {title: 'Change Password', error_type: 'password_match', message: 'This should match your new password.'});
		} else {
			User.update({username: username}, {password: hash_new_password}, {}, function(err, result){
				if(err) {return next(err);}
				req.logout();
				req.flash('success', 'Success! You changed your password. Please log in again.');
				res.redirect('/login');
			})
			// bcrypt.compare(req.body.password, req.user.password, function(err, res) {
			// 	if(err) {return next(err);}
			// 	if(res) {
			// 		User.update({username: username}, {password: hash_new_password}, {}, function(err, result){
			// 			if(err) {return next(err);}
			// 			req.logout();
			// 			req.flash('success', 'Success! You changed your password. Please log in again.');
			// 			res.redirect('/login');
			// 		})
			// 	}
			// })
		}
		// else if (hash_current_password !== req.user.password) {
		// 	console.log(req.user.password)
		// 	console.log(hash_current_password)
		// 	res.render('change-password', {title: 'Change Password', error_type: 'incorrect_password', message: 'Your password is incorrect.'});
		// } 
})

module.exports = router;
