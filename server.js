const express = require("express");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname)));

const API_KEY = process.env.ELEVENLABS_API_KEY;
const DEFAULT_FREE_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/clone-voice", upload.single("audio"), async (req, res) => {
  try {
    if (!API_KEY) return res.status(503).json({ error: "أضف ELEVENLABS_API_KEY في إعدادات Vercel أولاً." });
    res.json({ voice_id: DEFAULT_FREE_VOICE_ID });
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ غير متوقع." });
  }
});

app.post("/api/speak", async (req, res) => {
  try {
    if (!API_KEY) return res.status(503).json({ error: "أضف ELEVENLABS_API_KEY في إعدادات Vercel أولاً." });
    const text = String(req.body.text || "").trim().slice(0, 350);
    const voiceId = String(req.body.voiceId || DEFAULT_FREE_VOICE_ID);
    if (!text) return res.status(400).json({ error: "اكتب جملة أولًا." });

    const upstream = await fetch(`https://elevenlabs.io{encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true }
      })
    });

    if (!upstream.ok) {
      const errData = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: errData.detail?.message || "فشل توليد الصوت." });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    res.status(500).json({ error: err.message || "حدث خطأ في الخادم." });
  }
});

app.use((err, req, res, next) => res.status(400).json({ error: err.message || "طلب غير صالح." }));

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Alif Baa running at http://localhost:${port}`));
}

module.exports = app;
