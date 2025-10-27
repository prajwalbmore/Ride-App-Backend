import express from "express";
import {
  addRide,
  getRides,
  getRidesByDriver,
} from "../controllers/rideController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, addRide);
router.get("/", getRides);
router.get("/:driverId", getRidesByDriver);

export default router;
