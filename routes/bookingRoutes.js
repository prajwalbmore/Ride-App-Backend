import express from "express";
import {
  createBooking,
  getDriverBookings,
  getBookingsByRide,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", protect, upload.single("paymentScreenshot"), createBooking);
router.get("/", protect, getDriverBookings);
router.put("/confirm/:id", protect, updateBookingStatus);
router.get("/:rideId", getBookingsByRide);

export default router;
