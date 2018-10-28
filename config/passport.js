let passport = require('passport');let User = require('../models/user');let LocalStrategy = require('passport-local').Strategy;passport.serializeUser((user,done) => {    done(null, user.id);});passport.deserializeUser((id,done) => {    User.findById(id, (err,user) => {        done(err, user);    });});passport.use('local.signup', new LocalStrategy({    emailField: 'email',    passwordField: 'password',    passReqToCallback: true}, (req, email, password, done) => {    User.findOne({'email': email}, (err, user) => {       if(err) return done(err);       if(user) return done(null,false, { message: 'Email is already in use' });    });}));