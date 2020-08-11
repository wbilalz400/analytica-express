const mongoose = require('mongoose');
const SensorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: true,
    },
    device: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Device',
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    type: {
        type: String,
        default:"Default Sensor",
    }
});
module.exports = mongoose.model("Sensor",SensorSchema);