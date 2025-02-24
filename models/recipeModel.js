const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://kunnusherry:admin@cluster0.lprdi.mongodb.net/userModel');
const recipeSchema = mongoose.Schema({
    title : {type: String, required: true},
    duration : { type: String, required: true},
    ingrediantsWithDetails: { type: String },
    user: {type: mongoose.Schema.Types.ObjectId, 
        ref: 'user'}
});

module.exports  = mongoose.model("recipe", recipeSchema); 