const express = require("express");
const router = express.Router();
const multer = require("multer");

// ✅ middleware
const { protect } = require("../middleware/auth");

// ✅ controller
const { analyzeResume } = require("../controllers/analyzeController");

// ✅ memory storage (for PDF buffer)
const upload = multer({
  storage: multer.memoryStorage(),
});

// ✅ POST /api/analyze
router.post(
  "/",
  protect,                    // 🔥 AUTH FIRST
  upload.single("resume"),   // 📄 FILE UPLOAD
  analyzeResume              // 🤖 CONTROLLER
);

module.exports = router;