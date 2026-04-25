import express from "express";
import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, "data");
const uploadDir = path.join(dataDir, "uploads");
const tmpDir = path.join(dataDir, "tmp");
const artworksFile = path.join(dataDir, "artworks.json");
const seedDir = path.join(__dirname, "seed");
const adminPassword = process.env.ADMIN_PASSWORD || "amy-gallery";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const upload = multer({
  dest: tmpDir,
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 12
  },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.mimetype)) {
      cb(new Error("Only JPG, PNG, and WEBP images are supported."));
      return;
    }
    cb(null, true);
  }
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir, {
  maxAge: "1h",
  etag: true
}));

app.get("/api/artworks", async (_req, res) => {
  const artworks = await readArtworks();
  res.json(artworks);
});

app.post("/api/admin/upload", requireAdmin, upload.array("artworks", 12), async (req, res) => {
  const artworks = await readArtworks();
  const uploaded = [];

  for (const file of req.files || []) {
    const createdAt = new Date();
    const artist = normalizeArtist(req.body.artist);
    const filename = await nextFilename(createdAt, file.originalname, artist);
    const finalPath = path.join(uploadDir, filename);
    await fs.rename(file.path, finalPath);

    const description = await describeArtwork(finalPath, file.mimetype, artworks.length + uploaded.length + 1, artist);
    const artwork = {
      id: cryptoRandomId(),
      artist,
      title: description.title,
      date: formatDisplayDate(createdAt),
      medium: description.medium,
      category: description.category,
      image: `/uploads/${filename}`,
      note: description.note,
      createdAt: createdAt.toISOString()
    };

    uploaded.push(artwork);
  }

  const nextArtworks = [...artworks, ...uploaded];
  await writeArtworks(nextArtworks);
  res.json({ ok: true, uploaded, artworks: nextArtworks });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function initStorage() {
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.mkdir(tmpDir, { recursive: true });

  const seededArtworks = await readJsonIfExists(path.join(seedDir, "artworks.json"));
  if (!(await exists(artworksFile)) && seededArtworks) {
    await writeArtworks(seededArtworks);
  }

  const seedUploadDir = path.join(seedDir, "uploads");
  if (await exists(seedUploadDir)) {
    const seedFiles = await fs.readdir(seedUploadDir);
    for (const filename of seedFiles) {
      const source = path.join(seedUploadDir, filename);
      const target = path.join(uploadDir, filename);
      if (!(await exists(target))) {
        await fs.copyFile(source, target);
      }
    }
  }
}

async function readArtworks() {
  const artworks = await readJsonIfExists(artworksFile);
  return Array.isArray(artworks)
    ? artworks.map((artwork) => ({ artist: "amy", ...artwork }))
    : [];
}

async function writeArtworks(artworks) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(artworksFile, JSON.stringify(artworks, null, 2), "utf8");
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const password = req.get("x-admin-password") || req.body?.password;
  if (!password || password !== adminPassword) {
    res.status(401).json({ ok: false, error: "Password is incorrect." });
    return;
  }
  next();
}

async function nextFilename(date, originalName, artist) {
  const ext = safeExtension(originalName);
  const day = formatFileDate(date);
  const files = await fs.readdir(uploadDir).catch(() => []);
  const prefix = `${artist}-${day}-`;
  const existingNumbers = files
    .filter((name) => name.startsWith(prefix))
    .map((name) => Number(name.slice(prefix.length, prefix.length + 2)))
    .filter(Number.isFinite);
  const next = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}${String(next).padStart(2, "0")}${ext}`;
}

function safeExtension(originalName) {
  const ext = path.extname(originalName || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return ".jpg";
}

async function describeArtwork(filePath, mimetype, index, artist) {
  if (!openai) return fallbackDescription(index);

  try {
    const image = await fileToDataUrl(filePath, mimetype);
    const artistName = artist === "nancy" ? "Nancy" : "Amy";
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "你是一个克制、专业、温柔的青少年艺术作品策展助理。请用中文写展签，不要幼稚，不要过度夸张。"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `这张画的作者是 ${artistName}。请根据这张画生成 JSON：title 字段是简短中文标题；medium 字段从铅笔素描、针管笔与彩铅、纸上绘画、角色设定稿、纸本绘画、水彩、综合材料中选择或自行简短判断；category 字段只能是 study、color、line 三者之一；note 字段写 45-80 字中文说明，像画展展签，关注线条、人物、构图、色彩或创作练习。`
            },
            {
              type: "image_url",
              image_url: { url: image }
            }
          ]
        }
      ],
      max_tokens: 300
    });

    const content = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return normalizeDescription(parsed, index);
  } catch (error) {
    console.warn("AI description failed:", error.message);
    return fallbackDescription(index);
  }
}

async function fileToDataUrl(filePath, mimetype) {
  const chunks = [];
  for await (const chunk of createReadStream(filePath)) {
    chunks.push(chunk);
  }
  return `data:${mimetype};base64,${Buffer.concat(chunks).toString("base64")}`;
}

function normalizeDescription(value, index) {
  const fallback = fallbackDescription(index);
  const category = ["study", "color", "line"].includes(value.category) ? value.category : fallback.category;
  return {
    title: cleanText(value.title, fallback.title, 24),
    medium: cleanText(value.medium, fallback.medium, 30),
    category,
    note: cleanText(value.note, fallback.note, 120)
  };
}

function cleanText(value, fallback, maxLength) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function fallbackDescription(index) {
  return {
    title: `新作品 ${String(index).padStart(2, "0")}`,
    medium: "纸上绘画",
    category: "study",
    note: "这张作品已自动加入 Amy 的画展档案。可以看到她在人物、线条和画面关系上的持续练习。"
  };
}

function normalizeArtist(value) {
  return value === "nancy" || value === "mom" ? "nancy" : "amy";
}

function formatFileDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function formatDisplayDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join(".");
}

function cryptoRandomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

initStorage()
  .then(() => {
    app.listen(port, () => {
      console.log(`Amy gallery is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
