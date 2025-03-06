//Requiring the libraries
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const passport = require('./utilities/passport-config');
const session = require('express-session');
const axios = require('axios');
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const multer = require('multer');
require('dotenv').config();


//Setting up the storage
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "profile_pictures", // Folder in Cloudinary
        allowed_formats: ["jpg", "png"],
    },
});
const upload = multer({ storage });



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
app.get("/", (req,res)=>{
    res.redirect("/signup");
})
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
app.get("/home",isLoggedIn, async(req,res)=>{
    let user = await userModel.findOne({ email: req.user.email });
    res.render("home", {user});
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
app.get("/recipes", isLoggedIn, async (req, res)=>{
    let user = await userModel.findOne({ email: req.user.email })
    const recipes = JSON.parse(decodeURIComponent(req.query.data)); // Get recipes from query params
    res.render("recipespage.ejs", { recipes, user });
})
app.get("/search", isLoggedIn, async(req,res)=>{
    let user = await userModel.findOne({ email: req.user.email })
    res.render("ingrediants", {user});
})

app.get("/recipeDesc", isLoggedIn, async(req, res)=>{
    const id = req.query.id;
    let user = await userModel.findOne({ email: req.user.email })
    const response = await axios.get(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${process.env.SPOONACULAR_API_KEY}`)
    const desc = {
        title: response.data.title,
        time: response.data.readyInMinutes,
        ingredients: response.data.extendedIngredients.map(ing => ing.original), // Get ingredient names
        description: response.data.summary,
        id: response.data.id
    };
    res.render("recipeDesc.ejs", { desc, user });
})
app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email }).populate('addedRecipe');
        const ids = user.favorites;
        
        // Fetch favorite recipes
        const recipes = await Promise.all(ids.map(async (id) => {
            const response = await axios.get(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${process.env.SPOONACULAR_API_KEY}`);
            return {
                title: response.data.title,
                time: response.data.readyInMinutes,
                ingredients: response.data.extendedIngredients.map(ing => ing.original),
                description: response.data.summary,
                id: response.data.id
            };
        }));

        res.render("profile.ejs", { user, recipes });

    } catch (error) {
        console.error("Error fetching favorite recipes:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get('/profilecpy', isLoggedIn, async (req, res) => {
         let user = await userModel.findOne({ email: req.user.email }).populate('addedRecipe');
        const ids = user.favorites;
        res.render("profilecopy.ejs", { user });
});
app.get("/addyourown", isLoggedIn, async(req,res)=>{
    let user = await userModel.findOne({ email: req.user.email })
    res.render("addRecipe", {user});
})
app.get('/about',isLoggedIn, async(req,res)=>{
    let user = await userModel.findOne({ email: req.user.email })
    res.render('aboutus.ejs', {user});
})
app.get('/contact', isLoggedIn, async(req,res)=>{
    let user = await userModel.findOne({ email: req.user.email })
    res.render('contactus.ejs', {user});
})
app.get('/logout', async(req,res)=>{
    res.cookie("token", "");
    res.redirect('/login');
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
    const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.SPOONACULAR_API_KEY}&includeIngredients=${formattedIngredients}&number=10`);
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

app.post("/addToFav", isLoggedIn, async(req,res)=>{
    const {id} = req.body;
    if(id){
        console.log("id received");
    }
    const user = await userModel.findOne({email: req.user.email});
    user.favorites.push(Number(id));
    await user.save();
    res.redirect('/home');
})
app.post("/updateProfile", isLoggedIn, upload.single("profilePic"), async (req, res) => {
    try {
        const user = await userModel.findOne({email: req.user.email});
        user.publicImage = req.file.path; // Cloudinary URL
        await user.save();
        res.redirect("/profile"); // Reload profile page
    } catch (error) {
        console.error(error);
        res.status(500).send("Error uploading file");
    }
});

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
app.listen(3000)