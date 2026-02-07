require("dotenv").config();
const express = require("express");
const path = require("path");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5050;

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

(async () => {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})();
