// Server-side proxy for ElevenLabs. Keep the API key on the server, never in browser code.
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("audio/")) return cb(new Error("الملف لازم يكون تسجيل صوتي."));
    cb(null, true);
  }
});
app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));
const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_FILE = path.join(__dirname, ".mama-voice-id");

app.post("/api/clone-voice", upload.single("audio"), async (req, res) => {
  try {
    if (req.body.consent !== "true") return res.status(400).json({ error: "الموافقة الصريحة مطلوبة." });
    if (!req.file) return res.status(400).json({ error: "لم يصل ملف صوتي." });
    if (!API_KEY) return res.status(503).json({ error: "الخادم غير مُعدّ بعد: أضف ELEVENLABS_API_KEY إلى ملف .env." });
    const form = new FormData();
    form.append("name", String(req.body.voiceName || "Mama - Alif Baa").slice(0, 80));
    form.append("description", "Adult voice created with the speaker's explicit consent for an Arabic-learning app.");
    form.append("remove_background_noise", "true");
    form.append("files", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || "mama-sample.webm");
    const upstream = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST", headers: { "xi-api-key": API_KEY }, body: form
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.detail?.message || data.detail || data.message || "مزود الصوت رفض الطلب." });
    fs.writeFileSync(VOICE_FILE, data.voice_id, { mode: 0o600 });
    res.json({ voice_id: data.voice_id });
  } catch (err) { res.status(500).json({ error: err.message || "حدث خطأ في الخادم." }); }
});

app.post("/api/speak", async (req, res) => {
  try {
    if (!API_KEY) return res.status(503).json({ error: "الخادم غير مُعدّ بعد: أضف ELEVENLABS_API_KEY إلى ملف .env." });
    const text = String(req.body.text || "").trim().slice(0, 350);
    const voiceId = String(req.body.voiceId || (fs.existsSync(VOICE_FILE) ? fs.readFileSync(VOICE_FILE, "utf8").trim() : ""));
    if (!text) return res.status(400).json({ error: "اكتب جملة أولًا." });
    if (!voiceId) return res.status(400).json({ error: "أنشئ صوت ماما أولًا." });
    const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": API_KEY, "Content-Type": "application/json", "Accept": "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true } })
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: "فشل توليد الصوت. راجع إعدادات الخدمة والرصيد." });
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) { res.status(500).json({ error: err.message || "حدث خطأ في الخادم." }); }
});
app.use((err, req, res, next) => res.status(400).json({ error: err.message || "طلب غير صالح." }));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Alif Baa running at http://localhost:${port}`));
