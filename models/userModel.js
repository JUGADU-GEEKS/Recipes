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
    favorites: [{type: Number}],
    publicImage: {type: String, default: 'https://res.cloudinary.com/dk2toygoc/image/upload/v1740776557/profile_pictures/wgfvxuklhbdfe72ueru2.png'}
});

module.exports  = mongoose.model("user", userSchema); 