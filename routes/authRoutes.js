import express from "express";
import { register, login, addQR } from "../controllers/authController.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/add-qr", protect, upload.single("qrCode"), addQR);

export default router;
