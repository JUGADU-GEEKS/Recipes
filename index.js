//Requiring the libraries
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const passport = require('./utilities/passport-config');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

//Requiring the DataBases
const userModel = require('./models/userModel')

//Making the app from express for routes and other functionalities
const app = express();

//using app.use
app.use(express.json()); //for converting to json data
app.use(express.urlencoded({extended: true})); //for easy parsing
app.use(express.static(path.join(__dirname, "public")));  //reading the public folder and setting it to static
app.use(session({
    secret: 'kunal_secret',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

//Setting the view engine to ejs format
app.set('view engine', "ejs"); 

//GET requests
app.get("/signup", (req,res)=>{
    res.render("signup");
})
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
)
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/error/Google Sign-In Failed!' }),
    (req, res) => {
        // Successful authentication, redirect to home.
        res.redirect('/home');
    }
);
app.get("/login", (req,res)=>{
    res.render("login");
})
app.get("/error/:given", (req,res)=>{
    let e = req.params.given;
    res.render("error", {errorMessage: e});
})
app.get("/home",(req,res)=>{
    res.render("home");
})
app.get("/vegan", async (req, res)=>{
    const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.SPOONACULAR_API_KEY}&diet=vegan`)
    const recipes = response.data.results.map(recipe=>({
        title : recipe.title,
        image : recipe.image
    }))
    res.render("recipespage.ejs", { recipes });
})

//POST requests
app.post('/signup', async(req,res)=>{
    let {username, email, password} = req.body;
    let user = await userModel.findOne({email});
    if(user){
        res.redirect('/error/User Already Exists !');
    }
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password, salt, async(err,hash)=>{
            let createdUser = await userModel.create({
                username,
                email,
                password: hash
            })
            let token = jwt.sign({email}, 'kunal');
            res.cookie('token', token);
            res.redirect("/home"); 
        })
    })
    
})
app.post('/login', async(req,res)=>{
    let {username, password} = req.body;
    let user = await userModel.findOne({username});
    if(!user){
        res.redirect('/error/Error in fetching the user !');
    }
    bcrypt.compare(password, user.password, (err,matched)=>{
        if(matched){
            let token = jwt.sign({username}, 'kunal');
            res.cookie('token', token);
            res.redirect("/home");
        }
        else{
            res.redirect('/error/Password might be wrong');
        }
    })
})

//running the app
app.listen(3000);