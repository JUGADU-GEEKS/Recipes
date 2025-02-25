const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://kunnusherry:admin@cluster0.lprdi.mongodb.net/userModel');
const userSchema = mongoose.Schema({
    username : {type: String, required: true},
    email : { type: String, required: true},
    password: { type: String },
    googleId: { type: String },
    addedRecipe: [{type: mongoose.Schema.Types.ObjectId,
        ref: "recipe"
    }],
    favorites: [{type: Number}]
});

module.exports  = mongoose.model("user", userSchema); 