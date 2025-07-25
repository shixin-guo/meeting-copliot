import express from "express";
import crypto from "node:crypto";
import WebSocket from "ws";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { WebSocketServer } from "ws";
import { preloadRetrieverOnce, askLLMWithTranscript } from "./ragPipeline.js";
import cors from "cors";
import { extractTodosWithOpenRouter } from "./chatWithOpenaiJson.js";
import { saveRawVideo } from "./saveRawVideo.js";

await preloadRetrieverOnce();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let frameCounter = 0;

// Load environment variables from a .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 为 /recordings 路径下的请求加上 CORS 响应头
app.use('/recordings', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
// 静态服务 recordings 目录，供前端访问视频文件
app.use('/recordings', express.static(path.join(__dirname, 'recordings')));

// Remove in-memory transcript storage
// const storedTranscripts = [];
const TRANSCRIPTS_FILE = path.join(__dirname, "data", "transcripts.json");

function readTranscriptsFromFile() {
  try {
    if (!fs.existsSync(TRANSCRIPTS_FILE)) return [];
    const data = fs.readFileSync(TRANSCRIPTS_FILE, "utf-8");
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to read transcripts file:", err);
    return [];
  }
}

function appendTranscriptToFile(entry) {
  // let transcripts = readTranscriptsFromFile();
  // transcripts.push(entry);
  // try {
  //   fs.writeFileSync(TRANSCRIPTS_FILE, JSON.stringify(transcripts, null, 2), "utf-8");
  // } catch (err) {
  //   console.error("Failed to write transcripts file:", err);
  // }
}

const ZOOM_SECRET_TOKEN = process.env.ZOOM_SECRET_TOKEN;
const CLIENT_ID = process.env.ZM_CLIENT_ID;
const CLIENT_SECRET = process.env.ZM_CLIENT_SECRET;
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || "/webhook";

app.use(
  cors({
    origin: "*", // Or specify your frontend origin: 'http://localhost:9876'
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middleware to parse JSON bodies in incoming requests
app.use(express.json());

// Map to keep track of active WebSocket connections and audio chunks
const activeConnections = new Map();

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve the frontend page for Zoom iframe
app.get("/home", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Handle POST requests to the webhook endpoint

app.post(WEBHOOK_PATH, (req, res) => {
  console.log("RTMS Webhook received:", JSON.stringify(req.body, null, 2));
  const { event, payload } = req.body;

  // Handle URL validation event
  if (event === "endpoint.url_validation" && payload?.plainToken) {
    // Generate a hash for URL validation using the plainToken and a secret token
    const hash = crypto
      .createHmac("sha256", ZOOM_SECRET_TOKEN)
      .update(payload.plainToken)
      .digest("hex");
    console.log("Responding to URL validation challenge");
    return res.json({
      plainToken: payload.plainToken,
      encryptedToken: hash,
    });
  }

  // Handle RTMS started event
  if (event === "meeting.rtms_started") {
    console.log("RTMS Started event received");
    const { meeting_uuid, rtms_stream_id, server_urls } = payload;
    // Initiate connection to the signaling WebSocket server
    connectToSignalingWebSocket(meeting_uuid, rtms_stream_id, server_urls);
  }

  // Handle RTMS stopped event
  if (event === "meeting.rtms_stopped") {
    console.log("RTMS Stopped event received");
    const { meeting_uuid } = payload;

    // Close all active WebSocket connections for the given meeting UUID
    if (activeConnections.has(meeting_uuid)) {
      const connections = activeConnections.get(meeting_uuid);
      for (const conn of Object.values(connections)) {
        if (conn && typeof conn.close === "function") {
          conn.close();
        }
      }
      activeConnections.delete(meeting_uuid);
    }
  }

  // Respond with HTTP 200 status
  res.sendStatus(200);
});

// New API endpoint to ask LLM with transcript
app.post("/api/ask-kb", async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Missing or invalid question" });
  }
  try {
    const answer = await askLLMWithTranscript(question);
    res.json({ answer });
  } catch (err) {
    console.error("Error in /api/ask-kb:", err);
    res.status(500).json({ error: "Failed to get LLM response" });
  }
});

// New API endpoint to get the latest image from the recordings folder
app.get("/api/latest-image", async (_req, res) => {
  try {
    const recordingsDir = path.resolve("recordings");
    if (!fs.existsSync(recordingsDir)) {
      return res.status(404).json({ error: "No recordings directory found" });
    }
    // Get all jpg and png files
    const files = fs
      .readdirSync(recordingsDir)
      .filter((f) => f.endsWith(".jpg") || f.endsWith(".png"))
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(recordingsDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // newest first
    if (files.length === 0) {
      return res.status(404).json({ error: "No image files found" });
    }
    const latestFile = files[0].name;
    const filePath = path.join(recordingsDir, latestFile);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = latestFile.endsWith(".png") ? "png" : "jpeg";
    const dataUrl = `data:image/${ext};base64,${fileBuffer.toString("base64")}`;
    res.json({
      id: latestFile,
      dataUrl,
      timestamp: files[0].time,
    });
  } catch (err) {
    console.error("Error in /api/latest-image:", err);
    res.status(500).json({ error: "Failed to get latest image" });
  }
});

// New API endpoint to extract todos using OpenRouter JSON mode
app.post("/api/extract-todos", async (req, res) => {
  const { input } = req.body;
  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Missing or invalid input" });
  }
  try {
    const todos = await extractTodosWithOpenRouter(input);
    res.json({ todos });
  } catch (err) {
    console.error("Error in /api/extract-todos:", err);
    res.status(500).json({ error: "Failed to extract todos" });
  }
});

// New API endpoint for direct LLM call via OpenRouter
app.post("/api/llm-direct", async (req, res) => {
  const { message, model } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing or invalid message" });
  }
  try {
    // Dynamically import to avoid circular dependency if any
    const { chatWithOpenRouter } = await import("./chatWithOpenrouter.js");
    const llmResponse = await chatWithOpenRouter(message, model);
    res.json({ response: llmResponse });
  } catch (err) {
    console.error("Error in /api/llm-direct:", err);
    res.status(500).json({ error: "Failed to get LLM response" });
  }
});
// Add API endpoint to verify todos based on transcript
app.post("/api/verify-todos", (req, res) => {
  const { transcript, todos } = req.body;
  if (!Array.isArray(transcript) || !Array.isArray(todos)) {
    return res.status(400).json({ error: "transcript and todos must be arrays" });
  }

  // Mark todo as done if its text is mentioned in any transcript line (case-insensitive)
  const updatedTodos = todos.map((todo) => {
    const todoText = todo.text?.toLowerCase() || "";
    const mentioned = transcript.some(
      (line) => typeof line === "string" && line.toLowerCase().includes(todoText),
    );
    return { ...todo, done: mentioned };
  });

  res.json({ todos: updatedTodos });
});

// New API endpoint to get all stored transcripts
app.get("/api/transcripts", async (_req, res) => {
  try {
    const transcripts = readTranscriptsFromFile();
    res.json({
      transcripts,
      count: transcripts.length,
    });
  } catch (err) {
    console.error("Error in /api/transcripts:", err);
    res.status(500).json({ error: "Failed to get transcripts" });
  }
});

// New API endpoint to get all screenshots
app.get("/api/screenshots", async (_req, res) => {
  try {
    const recordingsDir = path.resolve("recordings");
    if (!fs.existsSync(recordingsDir)) {
      return res.status(404).json({ error: "No recordings directory found" });
    }

    // Get all jpg and png files
    const files = fs
      .readdirSync(recordingsDir)
      .filter((f) => f.endsWith(".jpg") || f.endsWith(".png"))
      .map((f) => ({
        name: f,
        timestamp: fs.statSync(path.join(recordingsDir, f)).mtime.getTime(),
        path: path.join(recordingsDir, f),
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // newest first

    // Limit to latest 20 screenshots
    const latestFiles = files.slice(0, 20);

    // Convert images to base64
    const screenshotsWithBase64 = await Promise.all(
      latestFiles.map(async (file) => {
        try {
          const imageBuffer = fs.readFileSync(file.path);
          const base64Data = imageBuffer.toString("base64");
          const fileExtension = path.extname(file.name).toLowerCase();
          const mimeType = fileExtension === ".png" ? "image/png" : "image/jpeg";

          return {
            name: file.name,
            timestamp: file.timestamp,
            base64: `data:${mimeType};base64,${base64Data}`,
            size: imageBuffer.length,
          };
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
          return null;
        }
      }),
    );

    // Filter out any failed reads
    const validScreenshots = screenshotsWithBase64.filter((screenshot) => screenshot !== null);

    res.json({
      screenshots: validScreenshots,
      count: validScreenshots.length,
    });
  } catch (err) {
    console.error("Error in /api/screenshots:", err);
    res.status(500).json({ error: "Failed to get screenshots" });
  }
});

// Function to generate a signature for authentication
function generateSignature(CLIENT_ID, meetingUuid, streamId, CLIENT_SECRET) {
  console.log("Generating signature with parameters:");
  console.log("meetingUuid:", meetingUuid);
  console.log("streamId:", streamId);

  // Create a message string and generate an HMAC SHA256 signature
  const message = `${CLIENT_ID},${meetingUuid},${streamId}`;
  return crypto.createHmac("sha256", CLIENT_SECRET).update(message).digest("hex");
}

// Function to connect to the signaling WebSocket server
function connectToSignalingWebSocket(meetingUuid, streamId, serverUrl) {
  console.log(`Connecting to signaling WebSocket for meeting ${meetingUuid}`);

  const ws = new WebSocket(serverUrl);

  // Store connection for cleanup later
  if (!activeConnections.has(meetingUuid)) {
    activeConnections.set(meetingUuid, {});
  }
  activeConnections.get(meetingUuid).signaling = ws;

  ws.on("open", () => {
    console.log(`Signaling WebSocket connection opened for meeting ${meetingUuid}`);
    const signature = generateSignature(CLIENT_ID, meetingUuid, streamId, CLIENT_SECRET);

    // Send handshake message to the signaling server
    const handshake = {
      msg_type: 1, // SIGNALING_HAND_SHAKE_REQ
      protocol_version: 1,
      meeting_uuid: meetingUuid,
      rtms_stream_id: streamId,
      sequence: Math.floor(Math.random() * 1e9),
      signature,
    };
    ws.send(JSON.stringify(handshake));
    console.log("Sent handshake to signaling server");
  });

  ws.on("message", (data) => {
    const msg = JSON.parse(data);
    //console.log('Signaling Message:', JSON.stringify(msg, null, 2));

    // Handle successful handshake response
    if (msg.msg_type === 2 && msg.status_code === 0) {
      // SIGNALING_HAND_SHAKE_RESP
      const mediaUrl = msg.media_server?.server_urls?.all;
      if (mediaUrl) {
        // Connect to the media WebSocket server using the media URL
        connectToMediaWebSocket(mediaUrl, meetingUuid, streamId, ws);
      }
    }

    // Respond to keep-alive requests
    if (msg.msg_type === 12) {
      // KEEP_ALIVE_REQ
      const keepAliveResponse = {
        msg_type: 13, // KEEP_ALIVE_RESP
        timestamp: msg.timestamp,
      };
      //console.log('Responding to Signaling KEEP_ALIVE_REQ:', keepAliveResponse);
      ws.send(JSON.stringify(keepAliveResponse));
    }
  });

  ws.on("error", (err) => {
    console.error("Signaling socket error:", err);
  });

  ws.on("close", () => {
    console.log("Signaling socket closed");
    if (activeConnections.has(meetingUuid)) {
      delete activeConnections.get(meetingUuid).signaling;
    }
  });
}

// Function to connect to the media WebSocket server
function connectToMediaWebSocket(mediaUrl, meetingUuid, streamId, signalingSocket) {
  console.log(`Connecting to media WebSocket at ${mediaUrl}`);

  const mediaWs = new WebSocket(mediaUrl, { rejectUnauthorized: false });

  // Store connection for cleanup later
  if (activeConnections.has(meetingUuid)) {
    activeConnections.get(meetingUuid).media = mediaWs;
  }

  mediaWs.on("open", () => {
    const signature = generateSignature(CLIENT_ID, meetingUuid, streamId, CLIENT_SECRET);
    const handshake = {
      msg_type: 3, // DATA_HAND_SHAKE_REQ
      protocol_version: 1,
      meeting_uuid: meetingUuid,
      rtms_stream_id: streamId,
      signature,
      media_type: 32, // AUDIO+VIDEO+TRANSCRIPT
      payload_encryption: false,
      media_params: {
        audio: {
          content_type: 1,
          sample_rate: 1,
          channel: 1,
          codec: 1,
          data_opt: 1,
          send_rate: 100,
        },
        video: {
          codec: 7, //H264
          resolution: 2,
          fps: 25,
        },
        deskshare: {
          codec: 5, //JPG
        },
        chat: {
          content_type: 5,
        },
      },
    };
    mediaWs.send(JSON.stringify(handshake));
  });

  mediaWs.on("message", async (data) => {
    try {
      // Try to parse as JSON first
      const msg = JSON.parse(data.toString());
      // debugging
      //console.log('Media JSON Message:', JSON.stringify(msg, null, 2));

      // Handle successful media handshake
      if (msg.msg_type === 4 && msg.status_code === 0) {
        // DATA_HAND_SHAKE_RESP
        signalingSocket.send(
          JSON.stringify({
            msg_type: 7, // CLIENT_READY_ACK
            rtms_stream_id: streamId,
          }),
        );
        console.log("Media handshake successful, sent start streaming request");
      }

      // Respond to keep-alive requests
      if (msg.msg_type === 12) {
        // KEEP_ALIVE_REQ
        mediaWs.send(
          JSON.stringify({
            msg_type: 13, // KEEP_ALIVE_RESP
            timestamp: msg.timestamp,
          }),
        );
        console.log("Responded to Media KEEP_ALIVE_REQ");
      }

      // Respond to keep-alive requests
      if (msg.msg_type === 12) {
        mediaWs.send(
          JSON.stringify({
            msg_type: 13,
            timestamp: msg.timestamp,
          }),
        );
        console.log("Responded to Media KEEP_ALIVE_REQ");
      }

      // Handle audio data
      if (msg.msg_type === 14 && msg.content && msg.content.data) {
        const { user_id, user_name, data: audioData } = msg.content;
        const buffer = Buffer.from(audioData, "base64");
        const timestamp = Date.now();
        //console.log('Audio data received');
      }

      // Handle video data
  
        // Handle video data
        if (msg.msg_type === 15 && msg.content && msg.content.data) {
             

          let { user_id, user_name, data: videoData, timestamp } = msg.content;
          let buffer = Buffer.from(videoData, 'base64');
          console.log('Video data received');
          saveRawVideo(buffer, user_name, timestamp, meetingUuid);
      }

      if (msg.msg_type === 16 && msg.content && msg.content.data) {
        let { user_id, user_name, data: shareData, timestamp } = msg.content;

        // Strip base64 prefix if present
        if (typeof shareData === "string" && shareData.startsWith("data:")) {
          shareData = shareData.split(",")[1];
        }

        const buffer = Buffer.from(shareData, "base64");

        // Detect file type
        let fileType = "unknown";
        let fileExt = "bin";

        const isJPEG = buffer.slice(0, 2).equals(Buffer.from([0xff, 0xd8]));
        const isJPEGEnd = buffer.slice(-2).equals(Buffer.from([0xff, 0xd9]));
        const isPNG = buffer
          .slice(0, 8)
          .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        const h264StartCodes = [
          Buffer.from([0x00, 0x00, 0x00, 0x01]),
          Buffer.from([0x00, 0x00, 0x01]),
        ];
        const isH264 = h264StartCodes.some((code) => buffer.indexOf(code) === 0);

        if (isJPEG && isJPEGEnd) {
          fileType = "jpeg";
          fileExt = "jpg";
        } else if (isPNG) {
          fileType = "png";
          fileExt = "png";
        } else if (isH264) {
          fileType = "h264";
          fileExt = "h264";
        }

        frameCounter++;

        // Ensure output folder exists
        const recordingsDir = path.resolve("recordings");
        if (!fs.existsSync(recordingsDir)) {
          fs.mkdirSync(recordingsDir, { recursive: true });
        }

        // Generate safe filename
        const safeUserId = user_id?.toString().replace(/[^\w-]/g, "_") || "unknown";
        const baseFilename = `${safeUserId}_${timestamp}`;
        const filePath = path.join(recordingsDir, `${baseFilename}.${fileExt}`);

        if (fileType === "jpeg") {
          const MIN_SIZE = 1000;
          if (buffer.length < MIN_SIZE) {
            console.warn(`⚠️ Skipping small JPEG (${buffer.length} bytes)`);
            return;
          }
          if (frameCounter <= 1000) {
            console.log(`⏭️ Skipping initial JPEG frame #${frameCounter}`);
            return;
          }

          fs.writeFileSync(filePath, buffer);
          // console.log(`💾 Saved JPEG to: ${filePath}`);
        } else if (fileType === "png") {
          fs.writeFileSync(filePath, buffer);
          // console.log(`💾 Saved PNG to: ${filePath}`);
        } else if (fileType === "h264") {
          // Reuse the same .h264 file — append data
          const h264FilePath = path.join(recordingsDir, `${safeUserId}.h264`);
          fs.appendFileSync(h264FilePath, buffer);
          console.log(`📹 Appended H.264 data to: ${h264FilePath}`);
        } else {
          console.warn("⚠️ Unknown or unsupported format — skipping");
        }
      }

      // Handle transcript data
      if (msg.msg_type === 17 && msg.content && msg.content.data) {
        console.log("Transcript data received");

        const transcriptEntry = {
          speaker: msg.content.user_name || "Unknown",
          timestamp: Date.now(),
          content: msg.content.data,
        };
        appendTranscriptToFile(transcriptEntry);

        //    const result = await askLLMWithTranscript( msg.content.data);

        broadcastToFrontendClients({
          type: "transcript",
          content: msg.content.data,
          user: msg.content.user_name,
          timestamp: Date.now(),
        });
      }
      if (msg.msg_type === 18 && msg.content && msg.content.data) {
        console.log("Chat data received");
      }
    } catch (err) {
      console.error("Error processing media message:", err);
    }
  });

  mediaWs.on("error", (err) => {
    console.error("Media socket error:", err);
  });

  mediaWs.on("close", () => {
    console.log("Media socket closed");
    if (activeConnections.has(meetingUuid)) {
      delete activeConnections.get(meetingUuid).media;
    }
  });
}

const server = http.createServer(app);

const frontendClients = new Set();

// Create a WebSocket server instance
const frontendWss = new WebSocketServer({ server, path: "/ws" });

frontendWss.on("connection", (ws) => {
  frontendClients.add(ws);
  console.log("🌐 Frontend client connected");

  ws.send("✅ Connected to RTMS backend");

  ws.on("close", () => {
    frontendClients.delete(ws);
    console.log("❌ Frontend client disconnected");
  });

  ws.on("error", (err) => {
    frontendClients.delete(ws);
    console.error("⚠️ WebSocket error:", err);
  });
});

function broadcastToFrontendClients(message) {
  const json = typeof message === "string" ? message : JSON.stringify(message);
  for (const client of frontendClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Frontend WebSocket available at ws://localhost:${port}/ws`);
  console.log(`Webhook endpoint available at http://localhost:${port}${WEBHOOK_PATH}`);
});
