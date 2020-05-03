const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true,
        trim:true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid email')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Invalid password')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value){
            if(value < 0){
                throw new Error('Age must be positive')
            }
        }
    },
    tokens: [{
        token:{
            type: String,
            required: true
        }
    }],
    avatar:{
        type: Buffer
    }
}, {
    timestamps: true
})

// link user to task
// .virtual for virtual data (i.e., not stored in the database)
userSchema.virtual('tasks', {
    ref: 'Task',
    localField:'_id',
    foreignField: 'owner'
})

// overload .toJSON 
// when pass an object to res.send(), JSON.stringify get call
// .toJSON controls how the document is converted to JSON before that
userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// For document user: .methods
userSchema.methods.generateAuthToken = async function () {
    const user = this
    // generate a token
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)

    // save the token associate with this user
    user.tokens = user.tokens.concat({token: token})
    await user.save()

    return token
}

// For collection User: .statics
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email:email})
    if(!user){
        // an Error object is converted to {} when sending back the client
        // throw new Error('Wrong email')
        
        // throw an object will be converted to JSON
        throw {error: 'Wrong email'} 
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        // throw new Error('Wrong password')
        throw {error: 'Wrong password'} 
    }

    return user
}

// set-up middleware for password hashing
// cannot use arrow function here since arrow function is non-binding (aka we need the 'this' pointer)
userSchema.pre('save', async function(next){
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next() // run the middleware
})

userSchema.pre('remove', async function(next){
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User