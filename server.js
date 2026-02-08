require("dotenv").config();
const express = require("express");
const path = require("path");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5050;
const HOST = "0.0.0.0";

// uploads statik
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ 1) əvvəl server port-a qalxsın (Render port görsün)
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // ✅ 2) sonra DB qoşulmağa çalış (retry ilə)
  startDB();
});

async function startDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI missing in env");
    return;
  }

  let attempt = 0;

  while (true) {
    try {
      attempt++;
      console.log(`🟡 Connecting to DB... (attempt ${attempt})`);
      await connectDB(uri);
      console.log("✅ DB connected");
      break;
    } catch (err) {
      console.error("❌ DB connect failed:", err?.message || err);
      // 5 saniyə gözlə, yenidən yoxla
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

// crash-ləri logla
process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});
