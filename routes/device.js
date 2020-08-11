const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Sensor = require("../models/sensor");
const DataPoint = require('../models/dataPoint');



/* Get Functions For Devices */


/* Function returns list of devices for that user*/
router.get('/', async (req, res) => {
    try {
        let devices = await Device.find({ user: req.user._id });
        res.json({
            success: true,
            devices: devices,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.toString(),
        })
    }
});


/* Function return the list of sensors for given device */
router.get('/:deviceid', async (req, res) => {
    try {
        let deviceId = req.params.deviceid;

        //Get Device information
        let device = await Device.findOne({ user: req.user._id, id: deviceId });
        if (!device) res.json({ success: false, message: `Device not found with ID ${deviceId}` });

        let sensors = await Sensor.find({ device: device._id });
        let data = sensors.map(sensor => DataPoint.find({ sensor: sensor._id }).sort({ time: -1 }).limit(1));
        data = await Promise.all(data);

        let payload = [...sensors];
        payload.forEach((load, i) => {
            if (data[i].length !== 0) payload[i] = { ...load.toJSON(), lastUpdate: data[i][0] }
        })
        res.json({
            success: true,
            device: device,
            sensors: payload,
            message: "Operation completed successfully!"
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.toString(),
        })
    }
});


/* Get Data of Sensor With limit */
router.get('/:deviceid/sensor/:sensorid/limit/:limit', async (req, res) => {
    try {
        let limit;
        try {
            limit = parseInt(req.params.limit);
        } catch (error) {
            res.json({
                success: false,
                message: `Limit must be an integer found ${req.params.limit}`
            });
        }
        let deviceId = req.params.deviceid;

        //Get Device information
        let device = await Device.findOne({ user: req.user._id, _id: deviceId });
        if (!device) res.json({ success: false, message: `Device not found with ID ${deviceID}` });

        //Get Sensor Info
        let sensor = await Sensor.findOne({ device: device._id, _id: req.params.sensorid });
        if (!sensor) res.json({ success: false, message: `Sensor not found with ID ${req.params.sensorid}` });

        let data = await DataPoint.find({ sensor: sensor._id }).sort({ time: -1 }).limit(limit);

        res.json({
            success: true,
            device: device,
            sensor: sensor,
            data: data
        });



    } catch (error) {
        res.json({
            success: false,
            message: error.toString()
        })
    }
});


// Get Data With Time Limit
router.get('/:deviceid/sensor/:sensorid/days/:days', async (req, res) => {
    try {
        let days;
        try {
            days = parseInt(req.params.days);
            if (!Number.isInteger(days)) throw "Day not a number";
        } catch (error) {
            res.json({
                success: false,
                message: `Days must be an integer found ${days} ${error.toString()}`
            });
        }
        let deviceId = req.params.deviceid;

        //Get Device information
        let device = await Device.findOne({ user: req.user._id, _id: deviceId });
        if (!device) res.json({ success: false, message: `Device not found with ID ${deviceID}` });

        //Get Sensor Info
        let sensor = await Sensor.findOne({ device: device._id, _id: req.params.sensorid });
        if (!sensor) res.json({ success: false, message: `Sensor not found with ID ${req.params.sensorid}` });

        let cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        let data = await DataPoint.find({ sensor: sensor._id, time: { $gt: cutoffDate } }).sort({ time: -1 })

        res.json({
            success: true,
            device: device,
            sensor: sensor,
            data: data
        });



    } catch (error) {
        res.json({
            success: false,
            message: error.toString()
        })
    }
});

/* Post Functions */


/* Function requires unique deviceId. Throws Error if device Id and name is not present
* Also can throw error if device id is not unique. Optionally device type can be supplied
* Returns information about device if operation successfull else returns error with success false
*/
router.post('/initialize', async (req, res) => {
    try {
        //First of all check that all parameters are present
        let errors = [];
        if (!req.body.id) {
            errors.push("A Device ID is required");
        }
        if (!req.body.name) {
            errors.push("A Device Name is required");
        }
        if (errors.length !== 0) {
            res.json({
                success: false,
                message: errors.join("\n")
            });
            return;
        }


        //Check Device ID is unique for this user
        let devices = await Device.find({ user: req.user._id, id: req.body.id });

        if (devices.length !== 0) {
            res.json({
                success: false,
                message: 'Please use a unique Id. A device already exists with the id ' + devices[0].id
            });
            return;
        }

        //Create Device since all tests have passed
        let createdDevice = await Device.create({
            id: req.body.id,
            name: req.body.name,
            user: req.user._id,
            type: req.body.type || "Default Device"
        });
        //If Device has been created successfully
        if (createdDevice) {
            res.json({
                success: true,
                message: "Device created successfully!",
                device: createdDevice
            })
        } else { // Some error occured (Database or schema error)
            res.json({
                success: false,
                message: "An unknown error occurred"
            })
        }

    } catch (err) {
        res.json({
            success: false,
            message: err.toString()
        })
    }
});


/* 
* This endpoint create sensor for the given device
* Required Paramaters are
* id: the id for the sensor
* name: the name for the sensor
* device: the device id to which the sensor will belong
* the function will return the sensor otherwise a error with success false and message in message field
*/
router.post('/sensor/create', async (req, res) => {

    try {
        //Handle validation errors
        let errors = [];
        if (!req.body.id) errors.push("A sensor id is required");
        if (!req.body.name) errors.push("A sensor name is required");
        if (!req.body.device) errors.push("A device id is required");
        if (errors.length !== 0) {
            res.json({
                success: false,
                message: errors.join("\n"),
            })
        }

        //Check if device exists
        let device = await Device.findOne({ id: req.body.device });
        if (!device) {
            res.json({
                success: false,
                message: `The device ${req.body.device} does not exist`,
            })
        };

        //Check if sensor id is unique
        let sensors = await Sensor.find({ id: req.body.id });
        if (sensors.length !== 0) {
            res.json({
                success: false,
                message: `The sensor ${sensors[0].id} already exists`
            });
        }

        //Create sensor
        let createdSensor = await Sensor.create({
            id: req.body.id,
            name: req.body.name,
            device: device._id,
            type: req.body.type || "Default Sensor",
        });
        if (createdSensor) {
            res.json({
                success: true,
                message: 'Sensor created successfully',
                sensor: createdSensor,
            })
        } else {
            res.json({
                success: false,
                message: "An unknown error occured"
            })
        };
    } catch (error) {
        res.json({
            success: false,
            message: error.toString(),
        });
    }

});


/*
* Add Data Point
* A Batch endpoint that can add data from list 
*/
router.post('/updatedata', async (req, res) => {
    //Validate Data
    try {
        let errors = [];
        req.body.data.forEach((dataPoint, i) => {
            if (!dataPoint.sensor) errors.push(`Sensor ID required for Data at Index ${i}`);
            if (!dataPoint.value && dataPoint.value !== 0) errors.push(`Sensor data missing for Data at Index ${i}`);
        });

        //Check if sensor exists
        let promises = req.body.data.map(dataPoint => Sensor.findOne({ id: dataPoint.sensor }));
        let SolvedPromises = await Promise.all(promises);

        SolvedPromises.forEach((sensor, i) => {
            if (sensor === null) errors.push(`Sensor ${req.body.data[i].sensor} does not exist`);
        });

        if (errors.length !== 0) {
            res.json({
                success: false,
                message: errors.join('\n'),
            })
        }
        promises = [];

        //Place Create data and start inserting in DB
        req.body.data.forEach((dataPoint, i) => {
            promises.push(DataPoint.create({
                value: dataPoint.value,
                sensor: SolvedPromises[i]._id,
                time: dataPoint.time || Date.now(),
            }));
        });
        SolvedPromises = await Promise.all(promises);
        if (SolvedPromises.filter(dP => dP === null).length === 0) {
            res.json({
                success: true,
                message: "All data inserted successfully",
                data: SolvedPromises,
            })
        } else {
            res.json({
                success: false,
                message: "Failed to insert some or all of the data. Inserted data is returned in the response",
                data: SolvedPromises,
            })
        }
    } catch (error) {
        res.json({
            success: false,
            message: error.toString(),
        })
    }



})

module.exports = router;