var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    password: {
        required:true,
        type: String,
    },
    type: {
        required: true,
        type: String
    },
    email: {
        required: true,
        type: String,
    },
    phone:String,

});
module.exports = mongoose.model('User',userSchema);