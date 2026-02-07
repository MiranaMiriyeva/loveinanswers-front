const router = require("express").Router();
const bcrypt = require("bcrypt");

const auth = require("../middleware/auth");
const Room = require("../models/Room");
const Submission = require("../models/Submission");
const { computeScore } = require("../utils/score");

router.post("/", auth, async (req, res, next) => {
  try {
 const { partnerUsername, roomCode, questions, expectedAnswers, gift } = req.body;


    if (!roomCode) return res.status(400).json({ message: "roomCode required" });

    const roomCodeHash = await bcrypt.hash(roomCode, 12);

    const room = await Room.create({
      ownerUserId: req.user.userId,
      partnerUsername: partnerUsername || undefined,
      roomCodeHash,
    questions: questions || [],
expectedAnswers: expectedAnswers || {},

      gift: gift || undefined
    });

    res.status(201).json({
      roomId: room._id,
      sharePath: `/room/${room._id}`
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/:roomId", auth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.ownerUserId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (room.status === "COMPLETED") {
      return res.status(409).json({ message: "Room already completed, cannot edit" });
    }

    const { expectedAnswers, gift, partnerUsername } = req.body;

    if (expectedAnswers) room.expectedAnswers = expectedAnswers;
    if (gift) room.gift = gift;
    if (partnerUsername !== undefined) room.partnerUsername = partnerUsername;

    await room.save();
    res.json({ ok: true, roomId: room._id });
  } catch (e) {
    next(e);
  }
});

const jwt = require("jsonwebtoken");
function signRoomToken(roomId, partnerUsername) {
  return jwt.sign({ roomId, partnerUsername }, process.env.JWT_SECRET, { expiresIn: "2h" });
}

router.post("/:roomId/enter", async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { partnerUsername, roomCode } = req.body;

    if (!partnerUsername || !roomCode) {
      return res.status(400).json({ message: "partnerUsername and roomCode required" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.partnerUsername && room.partnerUsername !== partnerUsername) {
      return res.status(401).json({ message: "Wrong username" });
    }

    const ok = await bcrypt.compare(roomCode, room.roomCodeHash);
    if (!ok) return res.status(401).json({ message: "Wrong room code" });

    const existing = await Submission.findOne({ roomId: room._id });
    const token = signRoomToken(room._id.toString(), partnerUsername);

    res.json({
      roomToken: token,
      alreadySubmitted: !!existing
    });
  } catch (e) {
    next(e);
  }
});

function roomAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.roomUser = payload; 
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

router.get("/:roomId/state", roomAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (req.roomUser.roomId !== roomId) return res.status(403).json({ message: "Forbidden" });

    const room = await Room.findById(roomId).select("status gift partnerUsername ownerUserId");
    if (!room) return res.status(404).json({ message: "Room not found" });

    const submission = await Submission.findOne({ roomId: room._id });

    res.json({
      status: room.status,
      alreadySubmitted: !!submission,
      giftPreview: room.gift ? { title: room.gift.title, pagesCount: room.gift.pages.length } : null
    });
  } catch (e) {
    next(e);
  }
});

router.post("/:roomId/submit", roomAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (req.roomUser.roomId !== roomId) return res.status(403).json({ message: "Forbidden" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });



    const existing = await Submission.findOne({ roomId: room._id });
    if (existing) return res.status(409).json({ message: "Already submitted" });

    const { answersActual } = req.body;
    if (!answersActual || typeof answersActual !== "object") {
      return res.status(400).json({ message: "answersActual object required" });
    }
const expectedObj = Object.fromEntries(room.expectedAnswers || []);
const actualObj = answersActual;

const { computeScoreWithQuestions } = require("../utils/score");
const { matches, total, percent } = computeScoreWithQuestions(room.questions, expectedObj, actualObj);



    const submission = await Submission.create({
      roomId: room._id,
      partnerUsername: req.roomUser.partnerUsername,
      answersActual: actualObj,
      matchesCount: matches,
      totalQuestions: total,
      scorePercent: percent
    });

    room.status = "COMPLETED";
    await room.save();

    res.status(201).json({
      scorePercent: submission.scorePercent,
      matchesCount: submission.matchesCount,
      totalQuestions: submission.totalQuestions,
      gift: room.gift || null
    });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Already submitted" });
    next(e);
  }
});

router.get("/:roomId/result", roomAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (req.roomUser.roomId !== roomId) return res.status(403).json({ message: "Forbidden" });

    const submission = await Submission.findOne({ roomId });
    if (!submission) return res.status(404).json({ message: "No submission yet" });

    const room = await Room.findById(roomId).select("gift");
    res.json({
      scorePercent: submission.scorePercent,
      matchesCount: submission.matchesCount,
      totalQuestions: submission.totalQuestions,
      gift: room?.gift || null
    });
  } catch (e) {
    next(e);
  }
});
router.get("/:roomId/questions", roomAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (req.roomUser.roomId !== roomId) return res.status(403).json({ message: "Forbidden" });

    const room = await Room.findById(roomId).select("questions status gift");
    if (!room) return res.status(404).json({ message: "Room not found" });

    res.json({
      status: room.status,
      questions: room.questions || [],
      giftPreview: room.gift ? { title: room.gift.title, pagesCount: room.gift.pages.length } : null,
    });
  } catch (e) {
    next(e);
  }
});


module.exports = router;
