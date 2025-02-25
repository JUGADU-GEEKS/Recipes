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
const recipeModel = require('./models/recipeModel')

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
app.use(cookieParser());


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
        image : recipe.image,
        id: recipe.id
    }))
    res.redirect(`/recipes?data=${encodeURIComponent(JSON.stringify(recipes))}`);
})
app.get("/recipes", async (req, res)=>{
    const recipes = JSON.parse(decodeURIComponent(req.query.data)); // Get recipes from query params
    res.render("recipespage.ejs", { recipes });
})
app.get("/search", (req,res)=>{
    res.render("ingrediants");
})

app.get("/recipeDesc", async(req, res)=>{
    const id = req.query.id;
    const response = await axios.get(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${process.env.SPOONACULAR_API_KEY}`)
    const desc = {
        title: response.data.title,
        time: response.data.readyInMinutes,
        ingredients: response.data.extendedIngredients.map(ing => ing.original), // Get ingredient names
        description: response.data.summary
    };
    res.render("recipeDesc.ejs", { desc });
})
app.get('/profile',isLoggedIn, async(req,res)=>{
    let user = await userModel.findOne({email: req.user.email}).populate('addedRecipe');
    res.render("profile.ejs", { user });
})
app.get("/addyourown", (req,res)=>{
    res.render("addRecipe");
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
            let token = jwt.sign({email}, 'kunal_secret');
            res.cookie('token', token);
            res.redirect("/home"); 
        })
    })
    
})
app.post('/login', async(req,res)=>{
    let {email, password} = req.body;
    let user = await userModel.findOne({email});
    if(!user){
        res.redirect('/error/Error in fetching the user !');
    }
    bcrypt.compare(password, user.password, (err,matched)=>{
        if(matched){
            let token = jwt.sign({email}, 'kunal_secret');
            res.cookie('token', token);
            res.redirect("/home");
        }
        else{
            res.redirect('/error/Password might be wrong');
        }
    })
})
app.post('/search', async(req,res)=>{
    const { ingredients } = req.body;
    const formattedIngredients = ingredients.join(",+");
    const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.SPOONACULAR_API_KEY}&ingrediants=${formattedIngredients}&number=10`);
    const recipes = response.data.results.map(recipe=>({
        title : recipe.title,
        image : recipe.image,
        id : recipe.id
    }))
    res.redirect(`/recipes?data=${encodeURIComponent(JSON.stringify(recipes))}`);

})
app.post('/addRecipe', isLoggedIn, async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email});
    let {title, duration, ingredients} = req.body;
    let recipe = await recipeModel.create({
        title,
        duration,
        ingrediantsWithDetails: ingredients
    })
    user.addedRecipe.push(recipe._id);
    await user.save();
    res.redirect('/home');
})



//isLoggedIn Function
function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/error/You are not Logged In');
    }
    try {
        let data = jwt.verify(token, "kunal_secret");
        req.user = data;
        next();
    } catch (error) {
        return res.redirect('/error/Invalid or Expired Token');
    }
}



//running the app
app.listen(3000);