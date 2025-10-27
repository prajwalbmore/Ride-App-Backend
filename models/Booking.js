import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    pickup: {
      type: String,
      required: true,
      trim: true,
    },
    drop: {
      type: String,
      required: true,
      trim: true,
    },
    seats: {
      male: {
        type: Number,
        default: 0,
        min: 0,
      },
      female: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1, // at least 1 seat required
    },
    totalFare: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentScreenshotUrl: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
    rideStatus: {
      type: String,
      enum: ["pending", "confirmed", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Optional validation hook: ensure totalSeats = male + female
bookingSchema.pre("save", function (next) {
  this.totalSeats = this.seats.male + this.seats.female;
  if (this.totalSeats < 1) {
    return next(new Error("At least one seat must be selected (male or female)."));
  }
  next();
});

export default mongoose.model("Booking", bookingSchema);
