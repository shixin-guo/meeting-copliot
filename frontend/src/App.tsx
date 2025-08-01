import "./App.css";
import ZoomMtgEmbedded, { type SuspensionViewType } from "@zoom/meetingsdk/embedded";
import { SignJWT } from "jose";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ManagementBar } from "@/components/animate-ui/ui-elements/management-bar";
import { Video, Sparkles, ClipboardList, MessageCircle, Sun, Moon, Star, X } from "lucide-react";
import MeetingAIInput from "@/components/ui/ask-ai-input";
import { parseZoomMeetingLink } from "@/lib/utils";
import PostMeetingFollowUp from "@/components/PostMeetingFollowUp";

function App() {
  const client = ZoomMtgEmbedded.createClient();

  // Configuration - read from environment variables
  const ZOOM_MEETING_SDK_KEY = import.meta.env.VITE_ZOOM_MEETING_SDK_KEY;
  const ZOOM_MEETING_SDK_SECRET = import.meta.env.VITE_ZOOM_MEETING_SDK_SECRET;

  // Validate that environment variables are properly loaded
  if (!ZOOM_MEETING_SDK_KEY || !ZOOM_MEETING_SDK_SECRET) {
    console.error(
      "Please ensure VITE_ZOOM_MEETING_SDK_KEY and VITE_ZOOM_MEETING_SDK_SECRET are set in .env file",
    );
  }

  // State for meeting inputs
  const [meetingNumber, setMeetingNumber] = useState("");
  const [passWord, setPassWord] = useState("");
  const [userName] = useState("Shixin Guo");

  // File upload
  type UploadedDoc = { name: string; file: File; processing: boolean };
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  // State for screenshots
  const [screenshots, setScreenshots] = useState<
    Array<{
      id: string;
      dataUrl: string;
      timestamp: Date;
      ocrResult?: string;
    }>
  >([]);

  // State for dialog and meeting status
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  type MeetingStep = "before" | "in" | "after";
  const [meetingStep, setMeetingStep] = useState<MeetingStep>("before");

  // State for live transcripts
  type TranscriptLine = {
    user: string;
    timestamp: number;
    content: string;
  };
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);

  // Add a ref to store the meeting start time
  const meetingStartTimeRef = useRef<number | null>(null);

  const role = 0;
  const userEmail = "";
  const registrantToken = "";
  const zakToken = "";

  // Remove meetingLink state, add clipboard read logic
  // Remove: const [meetingLink, setMeetingLink] = useState("");
  // Remove: const [isLinkCopied, setIsLinkCopied] = useState(false);
  // Add state for clipboard parse feedback
  const [clipboardMeeting, setClipboardMeeting] = useState<{
    meetingNumber: string;
    password: string;
  } | null>(null);
  const [clipboardError, setClipboardError] = useState<string>("");
  const [isReadingClipboard, setIsReadingClipboard] = useState(false);

  // Clipboard handler
  const handleReadClipboard = async () => {
    setIsReadingClipboard(true);
    setClipboardError("");
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseZoomMeetingLink(text);
      if (parsed) {
        setClipboardMeeting(parsed);
        setMeetingNumber(parsed.meetingNumber);
        setPassWord(parsed.password);
      } else {
        setClipboardMeeting(null);
        setMeetingNumber("");
        setPassWord("");
        setClipboardError("No valid Zoom meeting link found in clipboard.");
      }
    } catch {
      setClipboardMeeting(null);
      setMeetingNumber("");
      setPassWord("");
      setClipboardError("Failed to read clipboard.");
    } finally {
      setIsReadingClipboard(false);
    }
  };

  // Function to generate JWT token
  const generateJWT = async () => {
    try {
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 60 * 60 * 2; // 2 hours expiration

      const payload = {
        appKey: ZOOM_MEETING_SDK_KEY,
        sdkKey: ZOOM_MEETING_SDK_KEY,
        mn: meetingNumber,
        role: role,
        iat: iat,
        exp: exp,
        tokenExp: exp,
        video_webrtc_mode: 1,
      };

      // Convert secret to Uint8Array
      const secret = new TextEncoder().encode(ZOOM_MEETING_SDK_SECRET);

      // Generate JWT using jose library
      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(secret);

      return jwt;
    } catch (error) {
      console.error("Error generating JWT:", error);
      throw error;
    }
  };

  const getSignature = async () => {
    try {
      // Generate JWT token directly in browser
      const signature = await generateJWT();
      await startMeeting(signature);
      setMeetingStep("in");
      setIsDialogOpen(false);
    } catch (e) {
      console.log("Failed to get signature:", e);
    }
  };

  // Function to call OpenRouter Vision Model for OCR/analysis
  async function fetchOcrResult(imageDataUrl: string): Promise<string> {
    console.log("fetchOcrResult");
    try {
      const API_KEY = import.meta.env.VITE_NEW_OPENROUTER_API_KEY; // Replace with your key
      const MODEL = "google/gemini-2.0-flash-001"; // Or another vision model you have access to

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `What's in this image? 
                  Please extract main content (OCR) and return the content in markdown format. 
                  first line is the topic (### topic),
                   other lines are the content. 
                   remove the meaningless words`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageDataUrl, // data URL is fine
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Error with OpenRouter:", errorData || response.statusText);
        throw new Error(errorData?.error || response.statusText);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No OCR result found.";
    } catch (err) {
      console.error("❌ OCR error:", err);
      return "OCR failed.";
    }
  }

  // Screenshot handlers
  const handleScreenshotTaken = async (screenshot: {
    id: string;
    dataUrl: string;
    timestamp: Date;
  }) => {
    // Add screenshot with placeholder OCR result
    setScreenshots((prev) => [{ ...screenshot, ocrResult: "Analyzing..." }, ...prev]);
    // Fetch OCR result
    console.log("screenshot.dataUrl", screenshot.dataUrl);
    const ocrResult = await fetchOcrResult(screenshot.dataUrl);
    setScreenshots((prev) => prev.map((s) => (s.id === screenshot.id ? { ...s, ocrResult } : s)));
  };

  const handleDeleteScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  // Simulate RAG AI analysis process
  useEffect(() => {
    const processingDocs = uploadedDocs.filter((doc) => doc.processing);
    if (processingDocs.length === 0) {
      return;
    }
    // Only process the first document that is processing, avoid multiple setTimeout
    const timer = setTimeout(() => {
      setUploadedDocs((prev) =>
        prev.map((doc) => (doc.processing ? { ...doc, processing: false } : doc)),
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [uploadedDocs]);

  // WebSocket for live transcript
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3789/ws");
    socket.onopen = () => {
      console.log("✅ WebSocket connected");
    };
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "transcript") {
          setTranscripts((prev) => [
            ...prev,
            {
              user: msg.user,
              timestamp: msg.timestamp,
              content: msg.content,
            },
          ]);
        }
      } catch {
        // err removed, linter fix
        console.warn("Non-JSON or invalid message:", event.data);
      }
    };
    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
    socket.onclose = () => {
      console.warn("WebSocket connection closed");
    };
    return () => {
      socket.close();
    };
  }, []);
  const [todos, setTodos] = useState<Array<{ id: string; content: string; completed: boolean }>>(
    [],
  );

  async function startMeeting(signature: string) {
    // Set meeting start time when meeting actually starts
    meetingStartTimeRef.current = Date.now();
    const meetingSDKElement = document.getElementById("meetingSDKElement")!;
    try {
      await client.init({
        zoomAppRoot: meetingSDKElement,
        language: "en-US",
        patchJsMedia: true,
        leaveOnPageUnload: true,
        customize: {
          video: {
            viewSizes: {
              default: {
                width: 1204 * 0.8,
                height: 980 * 0.8,
              },
            },
            defaultViewType: "active" as SuspensionViewType,
          },
        },
      });
      await client.join({
        signature: signature,
        meetingNumber: meetingNumber,
        password: passWord,
        userName: userName,
        userEmail: userEmail,
        tk: registrantToken,
        zak: zakToken,
      });
      console.log("joined successfully");
      /**
       * Listens for the events and handles them.
       * For example:
       * ```javascript
       * on("connection-change", (payload) => {
       *  if (payload.state === 'Closed) {
       *    console.log("Meeting ended")
       *  }
       * })
       * ```
       * @param event Event name (for meeting end event, set the event to "connection-change").
       * @param callback Event handler (for meeting end event, the payload of the callback is payload.state === 'Closed').
       */
      client.on("connection-change", (payload) => {
        if (payload.state === "Closed") {
          console.log("Meeting ended");
          handleMeetingEnd();
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Function to handle meeting end and show follow-up
  const handleMeetingEnd = () => {
    setMeetingStep("after");
  };

  // Mock meeting data for the follow-up component
  const mockMeetingData = {
    id: "demo-meeting-001",
    title: "AI Meeting Copilot Product Demo",
    date: new Date("2024-07-28T14:00:00"),
    participants: ["shixin.guo@company.com", "eric.yuan@zoom.com", "sarah.tech@client.com", "mike.cto@client.com"],
    transcripts: transcripts,
    screenshots: screenshots,
    summary: "Product demonstration meeting showcasing AI Meeting Copilot features to potential enterprise client. Discussion covered real-time in-meeting AI capabilities, and competitive advantages. Shixin Guo is the customer, Eric Yuan is the sales representative",
  };

  // Dark mode toggle
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });
  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const features = [
    {
      icon: <Star className="h-7 w-7 text-blue-500" />,
      title: "AI Meeting Preparation",
      stage: "prepare",
      points: [
        "Chat with AI before meetings",
        "Auto-extract todos",
        "Set goals and agenda",
        "Import and analyze documents",
      ],
    },
    {
      icon: <MessageCircle className="h-7 w-7 text-green-500" />,
      title: "Real-time Analysis Conversation",
      stage: "in",
      points: ["Customize Analyze visuals", "Extract Action Items(Todos)", "OCR for screenshots"],
    },
    {
      icon: <Sparkles className="h-7 w-7 text-yellow-500" />,
      title: "AI Meeting Assistant",
      stage: "in",
      points: ["Live Q&A", "Context-aware answers", "Knowledge base support"],
    },
    {
      icon: <Video className="h-7 w-7 text-pink-500" />,
      title: "AI Meeting Insights",
      stage: "post",
      points: [
        "Meeting summary",
        "Ask Anything about the meeting",
        "Email / Calendar follow-up",
        "Detect Competitors",
        "Analyze sentiment Score",
        "Highlight key moments",
        "Recognize tasks / action items",
        "Task management",
      ],
    },
  ];

  function FeatureLanding() {
    const stages = [
      { key: "prepare", label: "Prepare Meeting" },
      { key: "in", label: "In-Meeting" },
      { key: "post", label: "Post-Meeting" },
    ];
    return (
      <section className="w-full h-screen flex flex-col items-center justify-center px-4 pt-20 pb-8 bg-gradient-to-br from-white to-blue-50 dark:from-background dark:to-blue-950 overflow-y-auto">
        {/* Main Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 flex items-center justify-center gap-4">
            <Sparkles className="h-12 w-12 text-blue-500 animate-bounce" />
            Meetings AI Copilot
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Supercharge your meetings with real-time AI assistance, smart insights, and seamless
            collaboration.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl">
          {stages.map((stage) => {
            return (
              <div key={stage.key} className="flex flex-col">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                    {stage.label}
                  </h3>
                  <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full" />
                </div>
                <div className="space-y-4">
                  {features
                    .filter((f) => f.stage === stage.key)
                    .map((feature) => (
                      <>
                        <div
                          key={feature.title}
                          className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl p-6 flex flex-col items-start border border-gray-200 dark:border-gray-700 hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl"
                        >
                          <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                            {feature.title}
                          </h4>
                          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                            {feature.points.map((point) => (
                              <li key={point} className="text-sm">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="App min-h-screen bg-background">
      {/* Dark mode toggle button top right corner */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDark}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      {meetingStep === "before" && (
        <div className="fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-background z-40 overflow-y-auto">
          <FeatureLanding />
          <div className="flex flex-1 items-center justify-center w-full bg-blue-50 p-8">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm mx-auto text-lg px-8 py-4 shadow-xl border-2 border-blue-200 hover:border-blue-400 transition-all"
                >
                  <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
                  Start AI Copilot Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl px-6 py-8">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-blue-500" />
                    AI Copilot Meeting Preparation
                  </DialogTitle>
                  <DialogDescription>
                    You can use this AI input to customize your AI agent. Tell the AI what you want
                    help with during this meeting—such as inviting people, creating a todo list, or
                    summarizing key points.
                  </DialogDescription>
                </DialogHeader>
                {/* Only AI input remains above, meeting join row below */}
                <div className="flex flex-col gap-6 mt-4">
                  <MeetingAIInput
                    onContentChange={(content) => {
                      console.log("MeetingAIInput content:", content);
                    }}
                    onFilesChange={(files) => {
                      console.log("MeetingAIInput files:", files);
                    }}
                    onTodosChange={(newTodos) => {
                      setTodos((prev) => [
                        ...newTodos.map((content) => ({
                          id: `${Date.now()}-${Math.random()}`,
                          content,
                          completed: false,
                        })),
                        ...prev,
                      ]);
                    }}
                  />
                </div>
                {/* Clipboard + Start Meeting row */}
                <div className="flex flex-row items-center gap-3 mt-6 pt-4 border-t w-full justify-between">
                  {/* Left: Copy button and tip/error */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleReadClipboard}
                      disabled={isReadingClipboard}
                      title="Paste Zoom meeting link from clipboard"
                    >
                      <ClipboardList className="text-muted-foreground" />
                    </Button>
                    {!clipboardMeeting && (
                      <span className="text-xs text-gray-400">
                        Paste meeting link here
                        {clipboardError && (
                          <span className="ml-2 text-red-500">{clipboardError}</span>
                        )}
                      </span>
                    )}
                    {clipboardMeeting && (
                      <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        <span className="text-xs text-gray-600">
                          Meeting:{" "}
                          <span className="font-mono font-semibold">
                            {clipboardMeeting.meetingNumber}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1 p-1 h-6 w-6"
                          onClick={() => {
                            setClipboardMeeting(null);
                            setMeetingNumber("");
                            setPassWord("");
                          }}
                          title="Remove meeting link"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* Right: Join meeting button */}
                  <Button
                    onClick={getSignature}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
                    disabled={!clipboardMeeting}
                  >
                    <Video className="mr-2 h-5 w-5" />
                    Start AI-Powered Meeting
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-6 fixed top-[100px] left-0 w-full z-50">
        {meetingStep === "in" && (
          <ManagementBar
            onScreenshotTaken={handleScreenshotTaken}
            todos={todos}
            setTodos={setTodos}
            transcripts={transcripts}
            screenshots={screenshots}
            onDeleteScreenshot={handleDeleteScreenshot}
          />
        )}
      </div>

      {meetingStep === "after" && (
        <PostMeetingFollowUp
          meetingData={mockMeetingData}
          onClose={() => setMeetingStep("before")}
        />
      )}

      {meetingStep !== "after" && (
        <main className="container max-w-none">
          <div className="flex gap-6">
            <div className="flex-1 w-full mx-auto flex flex-col gap-6">
              <div
                id="meetingSDKElement"
                className="h-screen flex items-center justify-center bg-black/50"
              />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
