import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/response.js";

const generateToken = (payload) =>
  jwt.sign({ user: payload }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async (req, res) => {
  try {
    const user = await User.create(req.body);
    sendResponse(res, true, "User registered", user);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, false, error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return sendResponse(res, false, "Invalid credentials");
    }
    sendResponse(res, true, "Login successful", {
      token: generateToken(user),
      user,
    });
  } catch (error) {
    sendResponse(res, false, error.message);
  }
};
