const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User, validate} = require('../models/User');
const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();



// return the profile information from profile table
router.get('/me',auth, async (req, res) => {
    const user = await User.findByPk(req.user.id, { attributes: {exclude: ['password']} });
    res.send(user);
});

/**
 * Register a User:
 * Request
 * POST with JSON body in format:
 *  {    
 *      first_name: "<STRING>",
 *      last_name: "<STRING>",
 *      email: "<STRING>",
 *      password: "<STRING>"
 *  }
 * Response
 * JsonWebToken in header as x-auth-token
 * Json body of {id, name, email}
 */
router.post('/', async (req, res) => {
    const {error} = validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }
    let user = await User.findOne({where: {email: req.body.email}});
    if (user) {
        return res.status(400).send('User already registered');
    }
    user = User.build(_.pick(req.body, ['name', 'email', 'password']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    
    const token = user.generateAuthToken();
    res.header('x-auth-token', token).send(_.pick(user, ['id','name', 'email']));
});

module.exports = router;