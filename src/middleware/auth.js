 const jwt = require('jsonwebtoken')
 const User = require('../models/user')
 
 // register custom middleware
 const auth = async (req, res, next) => {
     try{
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // decoded._id = id of the user
        const user = await User.findOne({_id: decoded._id, 'tokens.token':token})
        
        if(!user){
            throw {error: 'Authorization fails'}
        }

        // add token info to req object 
        req.token = token
        // add fetched user info to req object so the handler don't have to fetch again
        // req.user is a custom field, any name other than 'user' is ok
        req.user = user 
        
        next() // run the middleware
    }catch(error){
         res.status(401).send(error)
     }
 }

 module.exports = auth 