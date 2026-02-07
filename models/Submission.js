const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, unique: true },
    partnerUsername: { type: String, required: true },

    answersActual: {
      type: Map,
      of: String,
      default: {}
    },

    matchesCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    scorePercent: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
