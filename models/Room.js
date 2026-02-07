const mongoose = require("mongoose");

const giftPageSchema = new mongoose.Schema(
  {
    imageUrl: { type: String },  
    text: { type: String, maxlength: 500 }
  },
  { _id: false }
);
const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["multiple_choice", "text"], required: true },
    text: { type: String, required: true },

  
    options: {
      type: [
        {
          id: String,
          label: String,
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    partnerUsername: { type: String, trim: true }, 
    roomCodeHash: { type: String, required: true }, 
questions: { type: [questionSchema], default: [] },

    expectedAnswers: {
      type: Map,
      of: String,
      default: {}
    },

    gift: {
      title: { type: String, default: "Our Love Book" },
      pages: { type: [giftPageSchema], default: [] }
    },

    status: { type: String, enum: ["CREATED", "COMPLETED"], default: "CREATED" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
