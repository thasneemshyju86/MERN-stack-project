const express=require('express')
const router=express.Router()
const auth=require('../../middleware/auth')
const User = require('../../models/User')
const jwt=require('jsonwebtoken')
const config=require('config')
const { check, validationResult } = require("express-validator");
const bcrypt=require('bcryptjs')

// @route   GET api/auth
// @desc    Test route
// @access  Public

router.get('/',auth,async(req,res)=>{
 // res.send('Auth route')) [this will give the response as auth route. instead of that we need to get the users data]

 try{
const user=await User.findById(req.user.id).select('-password')
res.json(user)
 } catch(err){
    console.error(err.message)
    res.status(500).send('Server Error')
 }
})


// @route    POST api/auth
// @desc     Authenticate the user & get token
// @access   Public
router.post(
	"/",
	
		check("email", "Please include a valid email").isEmail(),
		check(
			"password",
			"Password required"
		).exists(),
	
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { email, password } = req.body;
		// see if user exist
		try {
			let user = await User.findOne({ email });

			if (!user) {
				res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
			}

			// compare if the plain text password & encrypted password matches 

            const isMatch=await bcrypt.compare(password,user.password)

            if(!isMatch){
              return  res.status(400).json({errors:[{msg:"Invalid credentials"}]})
            }

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


module.exports=router