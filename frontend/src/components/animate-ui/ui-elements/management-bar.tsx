"use client";
import * as React from "react";
import Draggable from "react-draggable";
import { Camera, Sparkles, MessageCircle } from "lucide-react";
// import { SlidingNumber } from '/components/animate-ui/text/sliding-number';
import { motion } from "motion/react";
import {
  AIInput,
  AIInputButton,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@/components/ui/ai-input";
import { AIResponse } from "@/components/ui/kibo-ui/ai/response";
import { GlobeIcon, MicIcon, PlusIcon, X } from "lucide-react";
import { type FormEventHandler, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScreenshotList } from "@/components/ui/screenshot-list";
import { InsightSentiment } from "@/components/ui/insight-sentiment";
import { InsightTopic } from "@/components/ui/insight-topic";
import { DropdownButton } from "@/components/ui/dropdown-button";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { CompetitorListData } from "@/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BUTTON_MOTION_CONFIG = {
  initial: "rest",
  whileHover: "hover",
  whileTap: "tap",
  variants: {
    rest: {},
    hover: {
      transition: { type: "spring", stiffness: 200, damping: 35, delay: 0.15 },
    },
    tap: { scale: 0.95 },
  },
  transition: { type: "spring", stiffness: 250, damping: 25 },
} as const;

interface ManagementBarProps {
  onScreenshotTaken?: (screenshot: { id: string; dataUrl: string; timestamp: Date }) => void;
  todos: Array<{ id: string; content: string; completed: boolean }>;
  setTodos: React.Dispatch<
    React.SetStateAction<Array<{ id: string; content: string; completed: boolean }>>
  >;
  transcripts: {
    user: string;
    timestamp: number;
    content: string;
  }[];
  screenshots: Array<{ id: string; dataUrl: string; timestamp: Date; ocrResult?: string }>;
  onDeleteScreenshot: (id: string) => void;
}

const competitorTopics = CompetitorListData.map((item) => item.topic.trim()).filter(Boolean);

function highlightTopicsInContent(content: string, searchTerm?: string) {
  if (!content) {
    return content;
  }
  let result = content;

  // Highlight competitor topics
  competitorTopics.forEach((topic) => {
    if (!topic) {
      return;
    }
    // Escape RegExp special chars in topic
    const safeTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeTopic})`, "gi");
    result = result.replace(regex, '<span class="text-yellow-200 font-bold">$1</span>');
  });

  // Highlight search terms if provided
  if (searchTerm?.trim()) {
    const safeSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(`(${safeSearchTerm})`, "gi");
    result = result.replace(
      searchRegex,
      '<span class="bg-blue-500/30 text-blue-200 font-semibold">$1</span>',
    );
  }

  return result;
}

// Function to detect questions in transcript content
function extractQuestions(transcripts: { user: string; timestamp: number; content: string }[]) {
  const questions: Array<{ id: string; user: string; content: string; timestamp: number }> = [];

  transcripts.forEach((transcript, index) => {
    const content = transcript.content.trim();

    // Check if content contains question indicators
    const questionIndicators = [
      /\?$/, // Ends with question mark
      /^(what|how|why|when|where|who|which|can|could|would|will|do|does|did|is|are|was|were)/i, // Starts with question words
      /^(i wonder|i'm wondering|can you|could you|would you|will you)/i, // Question phrases
    ];

    const isQuestion = questionIndicators.some((indicator) => indicator.test(content));

    if (isQuestion && content.length > 5) {
      // Minimum length to avoid very short questions
      questions.push({
        id: `question-${index}`,
        user: transcript.user,
        content: content,
        timestamp: transcript.timestamp,
      });
    }
  });

  return questions;
}

function ManagementBar({
  onScreenshotTaken,
  todos,
  setTodos,
  transcripts,
  screenshots,
}: ManagementBarProps) {
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [text, setText] = useState<string>("");
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready" | "error">("ready");
  const [showResponse, setShowResponse] = useState(false);
  const [responseContent, setResponseContent] = useState("");
  const [newTodo, setNewTodo] = useState("");
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const askButtonRef = useRef<HTMLButtonElement>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = React.useState<{
    id: string;
    dataUrl: string;
    timestamp: Date;
    ocrResult?: string;
  } | null>(null);

  const managementBarRef = useRef<HTMLDivElement>(null);

  // Refs for dropdown buttons and contents
  const dropdownRefs = {
    todo: useRef<HTMLDivElement>(null),
    transcript: useRef<HTMLDivElement>(null),
    screenshots: useRef<HTMLDivElement>(null),
    analytics: useRef<HTMLDivElement>(null),
    ask: useRef<HTMLDivElement>(null),
    liveInsight: useRef<HTMLDivElement>(null),
  };
  const dropdownButtonRefs = {
    todo: useRef<HTMLButtonElement>(null),
    transcript: useRef<HTMLButtonElement>(null),
    screenshots: useRef<HTMLButtonElement>(null),
    analytics: useRef<HTMLButtonElement>(null),
    ask: askButtonRef,
    liveInsight: useRef<HTMLButtonElement>(null),
  };

  // Close dropdown when clicking outside any open dropdown and its button
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdowns.size === 0) {
        return;
      }

      // Check if click is inside any open dropdown or its button
      let clickedInsideAnyDropdown = false;

      for (const dropdownType of openDropdowns) {
        const btnRef = dropdownButtonRefs[dropdownType]?.current;
        const contentRef = dropdownRefs[dropdownType]?.current;

        if (btnRef?.contains(event.target as Node) || contentRef?.contains(event.target as Node)) {
          clickedInsideAnyDropdown = true;
          break;
        }
      }

      if (!clickedInsideAnyDropdown) {
        setOpenDropdowns(new Set());
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdowns, dropdownButtonRefs, dropdownRefs]);

  const captureScreenshot = async () => {
    if (isCapturing || !onScreenshotTaken) {
      return;
    }
    setIsCapturing(true);
    try {
      // Fetch the latest image from the backend
      const res = await fetch("http://localhost:3789/api/latest-image");
      if (!res.ok) {
        throw new Error("Failed to get latest image");
      }
      const data = await res.json();
      // Create screenshot object
      const newScreenshot = {
        id: data.id || Date.now().toString(),
        dataUrl: data.dataUrl,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      };
      // Call callback to add to list
      onScreenshotTaken(newScreenshot);
    } catch (error) {
      console.error("Screenshot failed:", error);
      alert("Failed to get screenshot from server, please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAskSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!text) {
      return;
    }
    setStatus("submitted");
    setShowResponse(true);
    setResponseContent("");
    try {
      setStatus("streaming");
      // Call the backend API with the question
      const res = await fetch("http://localhost:3789/api/ask-kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (!res.ok) {
        throw new Error("Failed to get response");
      }
      const data = await res.json();
      setResponseContent(data.answer || "No answer received.");
      setStatus("ready");
      // setText(""); // Clear text after submission
    } catch {
      setResponseContent("Error: Unable to get response from AI.");
      setStatus("error");
    }
  };

  // Helper function to toggle a dropdown
  const toggleDropdown = (dropdownType: string) => {
    const newDropdowns = new Set(openDropdowns);
    if (newDropdowns.has(dropdownType)) {
      newDropdowns.delete(dropdownType);
    } else {
      newDropdowns.add(dropdownType);
    }
    setOpenDropdowns(newDropdowns);
  };

  const toggleAskDropdown = () => {
    toggleDropdown("ask");

    if (!openDropdowns.has("ask")) {
      setShowResponse(false);
      setResponseContent("");
    }
  };

  // Function to handle clicking on a customer question
  const handleQuestionClick = (question: string) => {
    setText(question);
    // Open both Ask AI and Live Insight dropdowns
    setOpenDropdowns(new Set(["ask", "liveInsight"]));
    setShowResponse(false);
    setResponseContent("");
  };

  const finishedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  const handleToggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    );
  };

  // Filter transcripts based on search keyword
  const filteredTranscripts = transcripts.filter((transcript) => {
    if (!transcriptSearch.trim()) { return true; }
    const searchLower = transcriptSearch.toLowerCase();
    return (
      transcript.content.toLowerCase().includes(searchLower) ||
      transcript.user.toLowerCase().includes(searchLower)
    );
  });

  // Extract questions from transcripts
  const customerQuestions = extractQuestions(transcripts);

  // POC Phase: Mock questions for demonstration purposes
  // In production, these would be replaced by real-time question detection from transcripts
  const mockQuestions = [
    {
      id: "mock-3",
      user: "Customer 1",
      content: "Can you explain the technical requirements in detail?",
      timestamp: Date.now() - 180000, // 3 minutes ago
    },
    {
      id: "mock-4",
      user: "Customer 2",
      content: "How does this compare to our competitors' solutions?",
      timestamp: Date.now() - 90000, // 1.5 minutes ago
    },
    {
      id: "mock-5",
      user: "Shixin Guo",
      content: "Can we get a demo of the new features?",
      timestamp: Date.now() - 45000, // 45 seconds ago
    },
  ];

  // Use mock questions for POC, or real questions if available
  const displayQuestions = customerQuestions.length > 0 ? customerQuestions : mockQuestions;

  return (
    // dark is a hack way
    <div className="relative z-50 dark text-white" ref={managementBarRef}>
      <Draggable bounds={false} handle=".drag-handle" defaultPosition={{ x: 640, y: 100 }}>
        <div className="flex w-fit flex-nowrap items-center gap-y-1 rounded-full border border-border bg-background/70 backdrop-blur-sm  py-1 px-2 shadow-lg cursor-move drag-handle">
          {/* Ask AI Button */}
          <motion.button
            {...BUTTON_MOTION_CONFIG}
            ref={dropdownButtonRefs.ask}
            onClick={toggleAskDropdown}
            className={`flex items-center rounded-lg  px-1.5 py-1 mx-1 text-gray-700 dark:text-gray-300 transition-all duration-300`}
            aria-label="Ask AI"
          >
            <Sparkles size={20} className="text-blue-500" />
            <span className="overflow-hidden whitespace-nowrap text-sm ml-1">Ask AI</span>
          </motion.button>
          {/* Ask AI Dropdown */}
          <div style={{ display: "inline-block" }}>
            {openDropdowns.has("ask") && (
              <motion.div
                ref={dropdownRefs.ask}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-full left-0 mt-2 w-full bg-background/70 backdrop-blur-sm border border-border rounded-lg shadow-xl z-50"
              >
                <div className="p-2">
                  <AIInput onSubmit={handleAskSubmit} className="rounded-lg bg-background/20">
                    <AIInputTextarea
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setText(e.target.value)
                      }
                      value={text}
                      placeholder="Ask me anything..."
                    />
                    <AIInputToolbar>
                      <AIInputTools>
                        <AIInputButton>
                          <PlusIcon size={16} />
                        </AIInputButton>
                        <AIInputButton>
                          <MicIcon size={16} />
                        </AIInputButton>
                        <Toggle className="text-muted-foreground">
                          <GlobeIcon />
                          Search
                        </Toggle>
                        {/* Screenshot Button */}
                        <AIInputButton onClick={captureScreenshot}>
                          {isCapturing ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-300" />
                          ) : (
                            <Camera size={20} className="shrink-0" />
                          )}
                        </AIInputButton>
                      </AIInputTools>
                      <AIInputSubmit disabled={!text} status={status} />
                    </AIInputToolbar>
                    {/* Screenshot thumbnails and OCR results */}
                    {screenshots.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-4 px-1">
                        {(() => {
                          const s = screenshots[screenshots.length - 1];
                          return (
                            <div
                              key={s.id}
                              className="relative flex flex-col items-center rounded text-sm text-white"
                            >
                              <img
                                src={s.dataUrl}
                                alt="Screenshot"
                                style={{
                                  width: 60,
                                  height: "auto",
                                  borderRadius: 4,
                                  marginBottom: 4,
                                }}
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedScreenshot(s);
                                  setDialogOpen(true);
                                }}
                              />
                              {/* Delete button */}
                              <button
                                className="absolute top-0 right-0 bg-black/60 hover:bg-red-600 text-white rounded-full p-1"
                                style={{ transform: "translate(40%, -40%)" }}
                                onClick={() => {
                                  setDialogOpen(false);
                                  setSelectedScreenshot(null);
                                }}
                                aria-label="Remove screenshot from analysis"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {/* Screenshot Preview Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Screenshot Preview</DialogTitle>
                        </DialogHeader>
                        {selectedScreenshot && (
                          <div className="flex flex-col items-center gap-4">
                            <img
                              src={selectedScreenshot.dataUrl}
                              alt="Large Screenshot"
                              className="max-h-[400px] w-auto rounded shadow border"
                              style={{ maxWidth: "100%" }}
                            />
                            {selectedScreenshot.ocrResult && (
                              <div className="w-full bg-gray-50 dark:bg-gray-900 border rounded p-3 mt-2 text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                                {selectedScreenshot.ocrResult}
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </AIInput>
                </div>
                {/* AI Response */}
                {showResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="p-2 border border-border/10 rounded-lg relative"
                  >
                    <button
                      onClick={() => setShowResponse(false)}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/70 transition-colors"
                      aria-label="Close response"
                    >
                      <X size={16} />
                    </button>
                    <div className="pr-6">
                      <AIResponse className="max-h-[464px] overflow-y-auto">
                        {responseContent}
                      </AIResponse>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
          <div className="mx-2 hidden h-4 w-px bg-border sm:block rounded-full" />

          {/* Live Insight Button with dropdown */}
          <button
            ref={dropdownButtonRefs.liveInsight}
            onClick={() => toggleDropdown("liveInsight")}
            className={`flex items-center rounded-lg mx-1 px-2 py-1  transition-all duration-300 text-sm h-8 min-w-0`}
            aria-label={
              openDropdowns.has("liveInsight") ? "Stop Live Insight" : "Start Live Insight"
            }
            style={{ minWidth: 0 }}
          >
            <span className="flex items-end gap-0.5  h-4 relative top-[-4px]">
              <span className="bar bar1" />
              <span className="bar bar2" />
              <span className="bar bar3" />
            </span>
            <span className="whitespace-nowrap ml-2">Live Insight</span>
          </button>
          {openDropdowns.has("liveInsight") && (
            <motion.div
              ref={dropdownRefs.liveInsight}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`absolute top-full mt-2 bg-background/70 backdrop-blur-sm border border-border rounded-lg shadow-xl z-50 max-h-180 overflow-y-auto ${
                openDropdowns.has("ask")
                  ? "right-full mr-2 w-full" // Position to the left when Ask AI is open, keep original width
                  : "left-0 w-full" // Default position, keep original width
              }`}
            >
              <div>
                <div className="font-normal text-sm m-4 mb-0 flex items-center gap-2">
                  Questions Asked:
                </div>
                <div className="p-4 max-h-[300px] overflow-y-auto">
                  {displayQuestions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No questions detected yet</p>
                      <p className="text-xs">Questions will appear here automatically</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayQuestions.slice(0, 5).map((question) => (
                        <button
                          key={question.id}
                          onClick={() => handleQuestionClick(question.content)}
                          className="w-full text-left p-2 rounded-lg bg-background/20 hover:bg-background/40 transition-colors border border-border/20"
                        >
                          <div className="flex items-start gap-2">
                            <Avatar className="w-5 h-5 rounded-sm flex-shrink-0">
                              <AvatarFallback className="rounded-sm text-xs">
                                {question.user?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-blue-300 mb-1">
                                {question.user}
                              </div>
                              <div className="text-xs text-gray-300 leading-relaxed">
                                {question.content}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-1">
                                {new Date(question.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                      {displayQuestions.length > 5 && (
                        <div className="text-center text-xs text-gray-500 pt-2">
                          +{displayQuestions.length - 5} more questions
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-row">
                <div>
                  <div className="font-normal text-sm m-4 mb-0">Sentiment Score</div>
                  <InsightSentiment />
                </div>
                <div>
                  <div className="font-normal text-sm m-4 mb-0">Competitor Mentioned</div>
                  <InsightTopic />
                </div>
              </div>
            </motion.div>
          )}
          <div className="mx-2 hidden h-4 w-px bg-border sm:block rounded-full" />

          {/* Todo Progress Button */}
          <div style={{ display: "inline-block" }}>
            <DropdownButton
              label={`Tasks Completed${totalCount ? `: ${Math.round((finishedCount / (totalCount || 1)) * 100)}%` : ""} `}
              isOpen={openDropdowns.has("todo")}
              onToggle={() => toggleDropdown("todo")}
              ariaLabel="Todo Progress"
            >
              <div ref={dropdownRefs.todo}>
                {totalCount === 0 ? (
                  <div className="p-8 text-center  flex flex-col items-center justify-center">
                    {/* Robot icon for AI-powered todo list */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mx-auto mb-4 opacity-50"
                      width="48"
                      height="48"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <rect
                        x="5"
                        y="7"
                        width="14"
                        height="10"
                        rx="3"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                      />
                      <rect
                        x="9"
                        y="2"
                        width="6"
                        height="4"
                        rx="1"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                      />
                      <circle cx="8.5" cy="12" r="1" fill="currentColor" />
                      <circle cx="15.5" cy="12" r="1" fill="currentColor" />
                      <path d="M8 17v2m8-2v2" strokeWidth="2" stroke="currentColor" />
                    </svg>
                    <p>AI-powered real-time todo list</p>
                    <p className="text-sm mt-2">
                      Task completion status is automatically updated by AI. Add a todo to try it
                      out!
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {todos.map((todo) => (
                      <li key={todo.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => handleToggleTodo(todo.id)}
                        />
                        <span className={todo.completed ? "line-through text-gray-400" : ""}>
                          {todo.content}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Add new todo input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newTodo.trim()) {
                      return;
                    }
                    setTodos((prev) => [
                      ...prev,
                      { id: Date.now().toString(), content: newTodo.trim(), completed: false },
                    ]);
                    setNewTodo("");
                  }}
                  className="flex gap-2 mt-4"
                >
                  <Input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Add a new todo..."
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    Add
                  </Button>
                </form>
              </div>
            </DropdownButton>
          </div>
          <div className="mx-2 hidden h-4 w-px bg-border sm:block rounded-full" />

          <div style={{ display: "inline-block" }}>
            <DropdownButton
              label="Contents"
              isOpen={openDropdowns.has("analytics")}
              onToggle={() => toggleDropdown("analytics")}
              ariaLabel="Analytics"
            >
              <div ref={dropdownRefs.analytics}>
                <Tabs defaultValue="transcript" className="w-full bg-background/20 rounded-lg">
                  <TabsList className="">
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
                  </TabsList>
                  <TabsContent value="transcript" className="min-h-[200px]">
                    {/* Search input */}
                    <div className="p-3 border-b border-border/20">
                      <Input
                        type="text"
                        placeholder="Search transcripts..."
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                        className="w-full bg-background/20 border-border/30 text-sm"
                      />
                    </div>

                    {transcripts.length === 0 ? (
                      <div className="p-8 text-center  flex flex-col items-center justify-center">
                        {/* Muted microphone icon for no transcript */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mx-auto mb-4 opacity-50"
                          width="48"
                          height="48"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19h6m-3 0v-1m-4-4V9a4 4 0 118 0v5m-8 0a4 4 0 008 0m-8 0v1a4 4 0 008 0v-1m-8 0L4 21m16-2l-2-2"
                          />
                        </svg>
                        <p>No transcript yet</p>
                        <p className="text-sm mt-2">Transcripts will appear here when available.</p>
                      </div>
                    ) : filteredTranscripts.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mx-auto mb-4 opacity-50"
                          width="48"
                          height="48"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <p>No results found</p>
                        <p className="text-sm mt-2">Try adjusting your search terms.</p>
                      </div>
                    ) : (
                      <div className="space-y-1 font-mono text-xs max-h-[400px] overflow-y-auto">
                        {filteredTranscripts.map((line, idx) => {
                          const prev = filteredTranscripts[idx - 1];
                          const showMeta = !prev || prev.user !== line.user;
                          const time = new Date(line.timestamp);
                          const timeStr = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}:${time.getSeconds().toString().padStart(2, "0")}`;
                          return (
                            <div key={`transcript-${line.timestamp}-${idx}`} className="">
                              {showMeta ? (
                                <>
                                  <div className="flex gap-2 justify-center items-center">
                                    <div className="flex flex-col items-center min-w-[40px]">
                                      <Avatar className="w-6 h-6 rounded-sm">
                                        <AvatarFallback className="rounded-sm">
                                          {line.user?.[0] || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div className="flex-1">
                                      <span className="font-semibold mr-2">{line.user}</span>
                                      <span className="text-[10px] text-gray-400 mt-1">
                                        {timeStr}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-2 mt-1">
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: highlightTopicsInContent(
                                          line.content,
                                          transcriptSearch,
                                        ),
                                      }}
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="flex-1 ml-2 mt-1">
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: highlightTopicsInContent(
                                        line.content,
                                        transcriptSearch,
                                      ),
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="screenshots" className="min-h-[200px]">
                    <div>
                      <ScreenshotList screenshots={screenshots} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </DropdownButton>
          </div>
        </div>
      </Draggable>
      <style>{`
        .bar {
          display: inline-block;
          width: 2px;
          background: red;
          border-radius: 1px;
          margin: 0 0.5px;
          animation: sound 1.2s infinite ease-in-out;
        }
        .bar1 { height: 7px; animation-delay: 0s; }
        .bar2 { height: 9px; animation-delay: 0.2s; }
        .bar3 { height: 6px; animation-delay: 0.4s; }
        @keyframes sound {
          0%, 100% { transform: scaleY(0.8); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  );
}

export { ManagementBar };
