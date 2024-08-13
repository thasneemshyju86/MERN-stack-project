const express=require('express')
const config=require('config')
const router=express.Router()
const auth=require('../../middleware/auth')
const { check, validationResult } = require("express-validator");

const Profile=require('../../models/Profile')
const User=require('../../models/User')

// @route  GET api/profile/me
// @desc    GET current users profile
// @access private

router.get("/me", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate(
			"user",
			["name", "avatar"]
		);

		if (!profile) {
			return res.status(400).json({ msg: "There is no profile for this user" });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

// @route  POST api/profile
// @desc   create & update user profile
// @access  private

router.post(
	"/",
	auth,
	check("status", "Status is required").not().isEmpty(),
	check("skills", "Skills is required").not().isEmpty(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// destructure the request
		const {
			website,
			skills,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook,
			company,
			location,
			bio,
			status,
			githubusername,
			//spread rest of the fields we dont  need to check
			...rest
		} = req.body;

		// Build profile object
		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(",").map((skill) => skill.trim());
		}

		//    Build social object
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (facebook) profileFields.social.facebook = facebook;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (instagram) profileFields.social.instagram = instagram;

		// update & insert the data
		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				//update
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },  //condition to update the document, here its looking for a profile document where user field matches 'req.user.id'
					{ $set: profileFields },  //$set operator replaces the value of the profileFields
					{ new: true }       // this species that the method should return the updated values not the original one
				);
                //return the entire profile
return res.json(profile)
			}

            //if the profile is not found we need to create it
            //create

            profile=new Profile(profileFields)
            await profile.save()   //saves the new profile to db
            res.json(profile)

		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server error");
		}
	}
);


// @route  GET api/profile
// @desc  GET all profiles
// @access  public

router.get('/',async (req,res)=>{
    try {
        const profiles= await Profile.find().populate('user',['name','avatar'])
        res.json(profiles)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
        
    }
})

//@route GET api/profile/user/:user_id
// @desc  GET profile by user_id
// @access public

router.get('/user/:user_id',async(req,res)=>{
    try {
        const profile=await Profile.findOne({user:req.params.user_id}).populate('user',['name','avatar'])

        if(!profile){
           return res.status(400).json({msg:'Profile not found'})
        }
        res.json(profile)
    } catch (err) {
        console.error(err.message)
        if(err.kind=='ObjectId'){
            return res.status(400).json({msg:'Profile not found'})
        }
        res.status(500).send('Server error')
        
    }
})

// @route   DELETE api/profile
// @desc    delete profile,user & posts
// @access  Private

router.delete('/',auth,async(req,res)=>{
    try {
       // delete profile
       await Profile.findOneAndDelete({user:req.user.id}) 
       //delete user
       await User.findOneAndDelete({_id:req.user.id})

       res.json({msg:'User deleted'})
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server error')
        
    }
})

module.exports=router