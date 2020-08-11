const mongoose = require('mongoose');
const WidgetSchema = new mongoose.Schema({
    type: {
        required:true,
        type: String,
    },
    chartOptions: Object,
    options: Object,
    layout: {
        required: true,
        type: Object,
    },
    user: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    device: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device"
    },
    sensor: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sensor"
    },
    id: {required:true, type: String},
    days: {
        type: Number,
    }
})

module.exports = mongoose.model("Widget",WidgetSchema);
