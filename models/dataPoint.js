const mongoose = require('mongoose');
const DataPointSchema = new mongoose.Schema({
    value: {
        required:true,
        type: String,
    },
    sensor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sensor",
        required: true,
    },
    time: {
        type: Date,
        required: true,
        default: Date.now,
    }
});
module.exports = mongoose.model("DataPoint",DataPointSchema);