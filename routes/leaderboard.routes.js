const router = require("express").Router();
const Submission = require("../models/Submission");

router.get("/", async (req, res, next) => {
  try {
    const top = await Submission.find({})
      .sort({ scorePercent: -1, createdAt: -1 })
      .limit(50)
      .select("partnerUsername scorePercent matchesCount totalQuestions createdAt");

    res.json({ items: top });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
