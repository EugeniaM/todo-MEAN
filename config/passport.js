var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

//passport-local strategy that handles username/password authentication
module.exports = function(passport) {

    //sign-up logic
    passport.use('local-signup', new LocalStrategy(
        function(username, password, done) {
            process.nextTick(function() {
                User.findOne({ username:  username }, function(err, user) {
                    if (err) {
                        return done(err);
                    }
                    //if a username exists in the database, return the message
                    if (user) {
                        return done(null, false, { message: 'This username is already in use.'});
                    } else {
                        //otherwise create and save new user
                        var user = new User();
                        user.username = username;
                        user.setPassword(password)
                        user.save(function(err) {
                            if (err) {
                                throw err;
                            }
                            return done(null, user);
                        });
                    }
                });
            });
        }));

    //log-in logic
    passport.use('local-login', new LocalStrategy(
        function(username, password, done) {
            User.findOne({ username:  username }, function(err, user) {
                if (err) {
                    return done(err);
                }
                //if a username doesn't exist in the database, return the message
                if (!user) {
                    return done(null, false, {message: 'No user found.'});
                }
                //if a password is wrong, return the message
                if (!user.validPassword(password)) {
                    return done(null, false, {message: 'Wrong password.'});
                }
                //otherwise return user
                return done(null, user);
            });
        }));
};