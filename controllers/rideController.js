import Ride from "../models/Ride.js";
import { sendResponse } from "../utils/response.js";

export const addRide = async (req, res) => {
  try {
    const ride = await Ride.create({ ...req.body, driverId: req.user._id });
    sendResponse(res, true, "Ride created", ride);
  } catch (error) {
    sendResponse(res, false, error.message);
  }
};

export const getRides = async (req, res) => {
  const rides = await Ride.find().populate("driverId", "name phone");
  sendResponse(res, true, "All rides", rides);
};

export const getRidesByDriver = async (req, res) => {
  const { driverId } = req.params;

  try {
    const rides = await Ride.find({ driverId }).populate(
      "driverId",
      "name phone"
    );
    if (!rides.length) {
      return sendResponse(res, false, "No rides found for this driver", []);
    }
    sendResponse(res, true, "Rides fetched successfully", rides);
  } catch (err) {
    console.error(err);
    sendResponse(res, false, "Server error", []);
  }
};
