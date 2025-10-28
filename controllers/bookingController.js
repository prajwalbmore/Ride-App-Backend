import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";
import { sendEmail } from "../utils/email.js";
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

    // Fetch ride and driver
    const ride = await Ride.findById(rideId).populate(
      "driverId",
      "name email phone"
    );
    if (!ride) return sendResponse(res, false, "Ride not found");

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

    // Update available seats
    ride.seatsAvailable = parseInt(ride.seatsAvailable) - parseInt(totalSeats);
    await ride.save();

    // Send email to driver
    if (ride.driverId?.email) {
      await sendEmail({
        to: ride.driverId.email,
        subject: "New Booking Received 🚗",
        html: `
          <h2>Hello ${ride.driverId.name},</h2>
          <p>You have a new booking for your ride from <strong>${ride.from}</strong> to <strong>${ride.to}</strong>.</p>
          <p><strong>Pickup:</strong> ${pickup}</p>
          <p><strong>Drop:</strong> ${drop}</p>
          <p><strong>Total Seats Booked:</strong> ${totalSeats}</p>
          <p><strong>Total Fare:</strong> ₹${totalFare}</p>
          <br/>
          <p>Login to your dashboard to view full booking details.</p>
        `,
      });
    }

    return sendResponse(res, true, "Booking submitted successfully", booking);
  } catch (error) {
    console.error(error);
    return sendResponse(res, false, "Server Error: " + error.message);
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

    const existingBooking = await Booking.findById(id).populate(
      "userId",
      "name email"
    );
    if (!existingBooking) {
      return sendResponse(res, false, "Booking not found");
    }

    const ride = await Ride.findById(existingBooking.rideId).populate(
      "driverId",
      "name email"
    );
    if (!ride) {
      return sendResponse(res, false, "Ride not found");
    }

    // Determine new statuses
    let rideStatus, paymentStatus, emailSubject, emailBody;
    if (action === "confirm") {
      rideStatus = "confirmed";
      paymentStatus = "verified";
      emailSubject = "Your Booking is Confirmed ✅";
      emailBody = `
        <h2>Hello ${existingBooking.userId.name},</h2>
        <p>Your booking for the ride from <strong>${ride.from}</strong> to <strong>${ride.to}</strong> has been <strong style="color:green;">confirmed</strong> by the driver <strong>${ride.driverId.name}</strong>.</p>
        <p><strong>Pickup:</strong> ${existingBooking.pickup}</p>
        <p><strong>Drop:</strong> ${existingBooking.drop}</p>
        <p><strong>Total Seats:</strong> ${existingBooking.totalSeats}</p>
        <p><strong>Total Fare:</strong> ₹${existingBooking.totalFare}</p>
        <br/>
        <p>Enjoy your ride! 🚗</p>
      `;
    } else if (action === "reject") {
      rideStatus = "rejected";
      paymentStatus = "pending";

      // return seats to available count
      ride.seatsAvailable =
        parseInt(ride.seatsAvailable) + parseInt(existingBooking.totalSeats);
      await ride.save();

      emailSubject = "Your Booking was Rejected ❌";
      emailBody = `
        <h2>Hello ${existingBooking.userId.name},</h2>
        <p>Unfortunately, your booking for the ride from <strong>${ride.from}</strong> to <strong>${ride.to}</strong> has been <strong style="color:red;">rejected</strong> by the driver <strong>${ride.driverId.name}</strong>.</p>
        <p>If you made a payment, it will be reviewed shortly.</p>
        <p>You can try booking another ride.</p>
      `;
    } else {
      return sendResponse(res, false, "Invalid action");
    }

    // Update booking status
    const booking = await Booking.findByIdAndUpdate(
      id,
      { rideStatus, paymentStatus },
      { new: true }
    );

    if (!booking) {
      return sendResponse(res, false, "Booking not found");
    }

    // Send email to user
    if (existingBooking.userId?.email) {
      await sendEmail({
        to: existingBooking.userId.email,
        subject: emailSubject,
        html: emailBody,
      });
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
