const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const DataPoint = require('../models/dataPoint');
const Sensor = require('../models/sensor');
const Widget = require('../models/Widget');
const uid = require('uuid');
const { json } = require('body-parser');
const uuid = uid.v4;


//Get Functions
router.get('/:id?', async (req, res) => {
    try {
        let Dashboard;
        if (req.params.id) {
            //Dashboard = await Dashboard.find({id: req.params.id}).limit(1) FUTURE MULTIPLE DASHBOARDS
            res.json({
                success: false,
                message: "ID is not supported for this version",
            });
        }
        else {
            Dashboard = await Widget.find({ user: req.user._id });
        }
        res.json({
            success: true,
            widgets: Dashboard,
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.toString(),
        })
    }

});

//Delete function
router.delete('/widget/:widget', async (req,res) => {
    try {
        let widgetId = req.params.widget;
        if (!widgetId) res.json({success: false, message:"Widget ID is required"});

        let deletedWidget = await Widget.deleteOne({_id: widgetId});
        if (deletedWidget) {
            res.json({
                success: true,
                message: "Widget Deleted Successfully",
                widget: deletedWidget,
            })
        } else {
            res.json({
                success: false,
                message: "An unknown error occured",
            })
        }
        
    } catch (error) {
        res.json({
            success: false,
            message: error.toString(),
        })
    }
})

//Put Functions
router.put('/:id?', async (req, res) => {
    try {
        let widgets = req.body.widgets;
        let promises = widgets.map(w => Widget.findOneAndUpdate({id: w.id},w));
        promises = await Promise.all(promises);

        if (promises.filter(p => p === null).length === 0) {
            res.json({
                success: true,
                widgets: promises,
            });
        } else {
            res.json({
                success: false,
                widget: promises,
                message: "Some or all all widgets failed to update."
            });
        }
        
    } catch (error) {
        res.json({
            success: false,
            message: error.toString(),
        })
    }
})

//Post Functions
router.post('/chart/:type/:device/:sensor/:days?', async (req, res) => {
    try {
        //Device Validation
        let deviceId = req.params.device;

        //Get Device information
        let device = await Device.findOne({ user: req.user._id, id: deviceId });
        if (!device) res.json({ success: false, message: `Device not found with ID ${deviceId}` });

        //Sensor Validation
        let sensorId = req.params.sensor;
        let sensor = await Sensor.findOne({ id: sensorId });
        if (!sensor) res.json({ success: false, message: `Sensor not found with ID ${sensorId}` });


        //Days Validation
        let days;
        if (req.params.days) {
            days = parseInt(req.params.days);
            if (!Number.isInteger(days)) res.json({ success: false, message: "Expected days to be a number found " + days });
        }
        let newID = uuid();


        //Create Widget
        let createdWidget = await Widget.create({
            id: newID,
            type: req.params.type,
            chartOptions: {
                id: newID,
                stroke : {      
                    curve:'straight',
                },
                xaxis : {
                    type: req.params.type == 'line'?'datetime':'category',
                },
                theme: {
                    palette: `pallete${parseInt(Math.random()*10%10 + 1)}`
                }
            },
            layout: {
                i: newID,
                x: 0,
                y: 0,
                h: 5,
                w: 7,
            },
            user: req.user._id,
            device: device._id,
            sensor: sensor._id,
            days: days,
        });

        let newDashboard = await Widget.find({ user: req.user._id });
        res.json({
            success: true,
            widgets: newDashboard,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.toString(),
        })
    }


})
router.post('/thermometer/:device/:sensor', async (req, res) => {
    try {
        //Device Validation
        let deviceId = req.params.device;

        //Get Device information
        let device = await Device.findOne({ user: req.user._id, id: deviceId });
        if (!device) res.json({ success: false, message: `Device not found with ID ${deviceId}` });

        //Sensor Validation
        let sensorId = req.params.sensor;
        let sensor = await Sensor.findOne({ id: sensorId });
        if (!sensor) res.json({ success: false, message: `Sensor not found with ID ${sensorId}` });


        //Days Validation
        
        let newID = uuid();


        //Create Widget
        let createdWidget = await Widget.create({
            id: newID,
            type: 'thermometer',
            layout: {
                i: newID,
                x: 0,
                y: 0,
                h: 5,
                w: 1,
                minH: 5,
            },
            user: req.user._id,
            device: device._id,
            sensor: sensor._id,
        });

        let newDashboard = await Widget.find({ user: req.user._id });
        res.json({
            success: true,
            widgets: newDashboard,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.toString(),
        })
    }


})
function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = (performance && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}


module.exports = router;
