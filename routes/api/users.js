const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route    GET api/users
// @route    POST api/users
// @desc     Test route
// @desc     Register user
// @access   Public
router.post(
	"/",
	[
		check("name", "Name is required").not().isEmpty(),
		check("email", "Please include a valid email").isEmail(),
		check(
			"password",
			"please enter a password with min 6 or more characters"
		).isLength({ min: 6 }),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, email, password } = req.body;
		// see if user exist
		try {
			let user = await User.findOne({ email });

			if (user) {
				res.status(400).json({ errors: [{ msg: "User already exists" }] });
			}

			//get users gravatar
			const avatar = gravatar.url(email, {
				s: "200",
				r: "pg",
				d: "mm",
			});
			// create an instance of the user
			user = new User({
				name,
				email,
				avatar,
				password,
			});

			//encrypt password
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);
			await user.save();

			//return jsonwebtoken
			// res.send("User registered");
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(
                payload, 
                config.get("jwtToken"),
                {expiresIn:36000},
                (err,token)=>{   //callback
                    if(err) throw err
                    res.json({token})
                }
            );
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server error");
		}

		// in order for the req.body to work we need to initialize middleware for the bodyparser.
	}
);

module.exports = router;
