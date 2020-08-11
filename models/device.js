let mongoose = require('mongoose');
const deviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,   
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,  
    },
    type: {
        type: String,
    }
});
module.exports = mongoose.model("Device",deviceSchema);