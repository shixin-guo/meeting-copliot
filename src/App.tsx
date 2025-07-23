import "./App.css";
import ZoomMtgEmbedded from "@zoom/meetingsdk/embedded";
import { SignJWT } from "jose";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ManagementBar } from "@/components/animate-ui/ui-elements/management-bar";
import { Home } from "lucide-react";
import { Video, Sparkles, Copy, X, Sun, Moon } from "lucide-react";
import MeetingAIInput from "@/components/ui/ask-ai-input";
import { parseZoomMeetingLink } from "@/lib/utils";
import PostMeetingFollowUp from "@/components/PostMeetingFollowUp";
import LandingPage from "./LandingPage";

function App() {
  const [currentView, setCurrentView] = useState<"landing" | "meeting">("landing");

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

  // 文件上传
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

  // State for transcripts
  const [transcripts, setTranscripts] = useState<string[]>([]);

  // State for todos
  const [todos, setTodos] = useState<
    Array<{
      id: string;
      content: string;
      completed: boolean;
    }>
  >([]);

  // Meeting state
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  // Clipboard state
  const [clipboardMeeting, setClipboardMeeting] = useState<{
    meetingNumber: string;
    password?: string;
  } | null>(null);
  const [isReadingClipboard, setIsReadingClipboard] = useState(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

  const role = 0; // 0 for participant, 1 for host

  // Function to read clipboard and parse Zoom meeting link
  const handleReadClipboard = async () => {
    setIsReadingClipboard(true);
    setClipboardError(null);

    try {
      const text = await navigator.clipboard.readText();
      const parsedMeeting = parseZoomMeetingLink(text);

      if (parsedMeeting) {
        setClipboardMeeting(parsedMeeting);
        setMeetingNumber(parsedMeeting.meetingNumber);
        setPassWord(parsedMeeting.password || "");
      } else {
        setClipboardError("No valid Zoom meeting link found in clipboard");
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      setClipboardError("Failed to read clipboard. Please paste the link manually.");
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
      setIsInMeeting(true);
      setIsDialogOpen(false);
    } catch (e) {
      console.log("Failed to get signature:", e);
    }
  };

  // Function to call OpenRouter Vision Model for OCR/analysis
  async function fetchOcrResult(imageDataUrl: string): Promise<string> {
    try {
      const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY; // Replace with your key
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
                  text: "What's in this image? Please extract all content (OCR) and return the content in markdown format. first line is the topic (### topic), other lines are the content.",
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
    console.log("Screenshot taken:", screenshot);

    // Add screenshot to state immediately
    setScreenshots((prev) => [...prev, screenshot]);

    // Perform OCR analysis in background
    try {
      const ocrResult = await fetchOcrResult(screenshot.dataUrl);
      console.log("OCR result:", ocrResult);

      // Update screenshot with OCR result
      setScreenshots((prev) => prev.map((s) => (s.id === screenshot.id ? { ...s, ocrResult } : s)));
    } catch (error) {
      console.error("Failed to perform OCR:", error);
    }
  };

  const handleDeleteScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const startMeeting = async (signature: string) => {
    try {
      await client.init({
        zoomAppRoot: document.getElementById("meetingSDKElement")!,
        language: "en-US",
        patchJsMedia: true,
        leaveOnPageUnload: true,
        stayAwake: true,
      });

      await client.join({
        signature: signature,
        meetingNumber: meetingNumber,
        password: passWord,
        userName: userName,
        userEmail: "",
        tk: "",
        zak: "",
      });

      // Listen for meeting events
      client.on("meeting-status", (data: { meetingStatus: number; reason: string }) => {
        console.log("Meeting status:", data);
        if (data.meetingStatus === 3) {
          // Meeting ended
          handleMeetingEnd();
        }
      });

      // Listen for chat messages to capture transcripts
      client.on("chat-on-message", (data: any) => {
        console.log("Chat message:", data);
        if (data.message) {
          setTranscripts((prev) => [...prev, data.message]);
        }
      });

      console.log("Meeting started successfully");
    } catch (error) {
      console.error("Failed to start meeting:", error);
    }
  };

  // Function to handle meeting end and show follow-up
  const handleMeetingEnd = () => {
    setIsInMeeting(false);
    setMeetingEnded(true);
    setShowFollowUp(true);
  };

  // Mock meeting data for the follow-up component
  const mockMeetingData = {
    id: "meeting-123",
    title: "Team Sync Meeting",
    date: new Date(),
    participants: ["john@example.com", "jane@example.com", "bob@example.com"],
    transcripts: transcripts,
    screenshots: screenshots,
    summary: "Meeting summary will be generated...",
  };
  // dark mode 切换
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

  // Show landing page by default
  if (currentView === "landing") {
    return (
      <div className="relative">
        <LandingPage onStartMeeting={() => setCurrentView("meeting")} />
        {/* Floating action button to access meeting app */}
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            onClick={() => setCurrentView("meeting")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 px-6 py-6"
          >
            <Video className="mr-2 h-6 w-6" />
            Launch Meeting App
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-background">
      {/* Navigation */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => setCurrentView("landing")}
          variant="outline"
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>

      {/* Dark mode toggle button 右上角 */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDark}
          title={isDark ? "切换到浅色模式" : "切换到深色模式"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
      {showFollowUp ? (
        <PostMeetingFollowUp meetingData={mockMeetingData} onClose={() => setShowFollowUp(false)} />
      ) : (
        <main className="container mx-auto px-4 py-8">
          <div className="flex gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              <ManagementBar
                onScreenshotTaken={handleScreenshotTaken}
                todos={todos}
                setTodos={setTodos}
                transcripts={transcripts}
                screenshots={screenshots}
                onDeleteScreenshot={handleDeleteScreenshot}
              />
            </div>

            {/* Center Column */}
            <div className="flex-1 max-w-3xl mx-auto flex flex-col gap-6">
              {/* Join Meeting Dialog (centered at top of center column) */}
              {!isInMeeting && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-background/90 backdrop-blur-sm">
                      <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
                      AI Copilot Meeting Prep
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl px-6 py-8">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-blue-500" />
                        AI Copilot Meeting Preparation
                      </DialogTitle>
                      <DialogDescription>
                        You can use this AI input to customize your AI agent. Tell the AI what you
                        want help with during this meeting—such as inviting people, creating a todo
                        list, or summarizing key points.
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
                          <Copy className="text-muted-foreground" />
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
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Meeting View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    id="meetingSDKElement"
                    className="min-h-[600px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                  >
                    {isInMeeting ? (
                      <p className="text-gray-500">Meeting is active</p>
                    ) : (
                      <p className="text-gray-500">Meeting will appear here after joining</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
