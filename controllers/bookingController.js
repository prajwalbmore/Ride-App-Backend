import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";
import { sendResponse } from "../utils/response.js";
import mongoose from "mongoose";

// Create Booking
export const createBooking = async (req, res) => {
  try {
    const {
      rideId,
      pickup,
      drop,
      maleSeats,
      femaleSeats,
      totalSeats,
      totalFare,
    } = req.body;

    // Validation
    if (!rideId || !pickup || !drop) {
      return sendResponse(res, false, "Ride, pickup, and drop are required");
    }

    // Check duplicate booking for same user and ride
    const existingBooking = await Booking.findOne({
      userId: req.user._id,
      rideId,
    });

    if (existingBooking) {
      return sendResponse(res, false, "You have already booked this ride");
    }
    const ride = await Ride.findById(rideId);
    if (totalSeats > ride.seatsAvailable) {
      return sendResponse(
        res,
        false,
        `Only ${ride.seatsAvailable} seats are available for booking`
      );
    }
    // Create booking
    const booking = await Booking.create({
      rideId,
      pickup,
      drop,
      seats: { male: maleSeats, female: femaleSeats },
      totalSeats,
      totalFare,
      userId: req.user._id,
      paymentScreenshotUrl: req.file?.filename || null,
      rideStatus: "pending",
      paymentStatus: "pending",
    });
    ride.seatsAvailable = parseInt(ride.seatsAvailable) - parseInt(totalSeats);
    await ride.save();
    sendResponse(res, true, "Booking submitted successfully", booking);
  } catch (error) {
    console.error(error);
    sendResponse(res, false, "Server Error: " + error.message);
  }
};

// Get Driver Bookings
export const getDriverBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name phone")
      .populate("rideId");
    sendResponse(res, true, "Driver bookings retrieved", bookings);
  } catch (error) {
    console.error(error);
    sendResponse(res, false, "Server Error: " + error.message);
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'confirm' or 'reject'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, false, "Invalid booking ID");
    }
    const existingBooking = await Booking.findById(id);
    const ride = await Ride.findById(existingBooking.rideId);
    // Determine new statuses
    let rideStatus, paymentStatus;
    if (action === "confirm") {
      rideStatus = "confirmed";
      paymentStatus = "verified";
    } else if (action === "reject") {
      rideStatus = "rejected";
      paymentStatus = "pending"; // or whatever is appropriate
    } else {
      return sendResponse(res, false, "Invalid action");
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { rideStatus, paymentStatus },
      { new: true }
    );
    // ride.seatsAvailable =
    //   parseInt(ride.seatsAvailable) - parseInt(existingBooking.totalSeats);
    ride.save();
    if (!booking) {
      return sendResponse(res, false, "Booking not found");
    }

    sendResponse(res, true, `Booking ${action}ed successfully`, booking);
  } catch (error) {
    console.error(error);
    sendResponse(res, false, "Server Error: " + error.message);
  }
};

export const getBookingsByRide = async (req, res) => {
  const { rideId } = req.params;

  try {
    const bookings = await Booking.find({ rideId })
      .populate("userId", "name phone")
      .populate("rideId");
    if (!bookings.length) {
      return sendResponse(res, false, "No bookings found for this ride", []);
    }
    sendResponse(res, true, "Bookings fetched successfully", bookings);
  } catch (err) {
    console.error(err);
    sendResponse(res, false, "Server error", []);
  }
};
