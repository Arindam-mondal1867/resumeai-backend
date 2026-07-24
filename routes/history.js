const express = require("express");
const router = express.Router();
const History = require("../models/History");
const { protect } = require("../middleware/auth");

// ===============================
// GET ALL HISTORY
// ===============================
router.get("/", protect, async (req, res) => {
  try {
    const history = await History.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      history,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ===============================
// DELETE SINGLE
// ===============================
router.delete("/:id", protect, async (req, res) => {
  try {
    await History.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ===============================
// DELETE ALL
// ===============================
router.delete("/", protect, async (req, res) => {
  try {
    await History.deleteMany({ userId: req.user._id });

    res.json({ success: true, message: "All history cleared" });
  } catch (err) {
    res.status(500).json({ error: "Clear failed" });
  }
});

module.exports = router;