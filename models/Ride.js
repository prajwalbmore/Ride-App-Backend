import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    from: String,
    to: String,
    date: String,
    departureTime: String, // Added
    arrivalTime: String, // Added
    fare: Number,
    seatsAvailable: Number,
    vehicle: {
      model: String,
      number: String,
    },
    status: { type: String, enum: ["active", "completed","ongoing"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Ride", rideSchema);
