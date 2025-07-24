"use client";
import * as React from "react";
import Draggable from "react-draggable";
import { Camera, Sparkles } from "lucide-react";
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
  transcripts: string[];
  screenshots: Array<{ id: string; dataUrl: string; timestamp: Date; ocrResult?: string }>;
  onDeleteScreenshot: (id: string) => void;
}

function ManagementBar({
  onScreenshotTaken,
  todos,
  setTodos,
  transcripts,
  screenshots,
}: ManagementBarProps) {
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [openDropdown, setOpenDropdown] = useState<
    null | "todo" | "transcript" | "screenshots" | "analytics" | "ask" | "liveInsight"
  >(null);
  const [text, setText] = useState<string>("");
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready" | "error">("ready");
  const [showResponse, setShowResponse] = useState(false);
  const [responseContent, setResponseContent] = useState("");
  const [newTodo, setNewTodo] = useState("");
  const askButtonRef = useRef<HTMLButtonElement>(null);
  const askDropdownRef = useRef<HTMLDivElement>(null);
  const liveInsightDropdownRef = useRef<HTMLDivElement>(null);

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
      if (!openDropdown) {
        return;
      }

      // Get button and content refs based on dropdown type
      let btnRef: HTMLElement | null = null;
      let contentRef: HTMLElement | null = null;

      if (openDropdown === "liveInsight") {
        btnRef = dropdownButtonRefs.liveInsight.current;
        contentRef = liveInsightDropdownRef.current;
      } else {
        btnRef = dropdownButtonRefs[openDropdown]?.current;
        contentRef = dropdownRefs[openDropdown]?.current;
      }

      if (btnRef?.contains(event.target as Node) || contentRef?.contains(event.target as Node)) {
        return;
      }
      setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    openDropdown,
    dropdownButtonRefs.liveInsight.current,
    dropdownButtonRefs[openDropdown]?.current,
    dropdownRefs[openDropdown]?.current,
  ]);

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
      setText(""); // Clear text after submission
    } catch {
      setResponseContent("Error: Unable to get response from AI.");
      setStatus("error");
    }
  };

  const toggleAskDropdown = () => {
    setOpenDropdown(openDropdown === "ask" ? null : "ask");
    if (openDropdown !== "ask") {
      setShowResponse(false);
      setResponseContent("");
    }
  };

  const finishedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  const handleToggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    );
  };

  return (
    <div className="relative z-50" ref={managementBarRef}>
      <Draggable bounds="body" defaultPosition={{ x: 0, y: 0 }} handle=".drag-handle">
        <div className="flex w-fit flex-nowrap items-center gap-y-1 rounded-full border border-border bg-background/30  py-1 px-2 shadow-lg cursor-move drag-handle">
          {/* Ask AI Button */}
          <motion.button
            {...BUTTON_MOTION_CONFIG}
            ref={askButtonRef}
            onClick={toggleAskDropdown}
            className={`flex items-center rounded-lg  px-1.5 py-1 mx-1 text-gray-700 dark:text-gray-300 transition-all duration-300`}
            aria-label="Ask AI"
          >
            <Sparkles size={20} />
            <span className="overflow-hidden whitespace-nowrap text-sm ml-1">Ask AI</span>
          </motion.button>
          <div className="mx-2 hidden h-4 w-px bg-border sm:block rounded-full" />

          {/* Live Insight Button with dropdown */}
          <button
            ref={dropdownButtonRefs.liveInsight}
            onClick={() => setOpenDropdown(openDropdown === "liveInsight" ? null : "liveInsight")}
            className={`flex items-center rounded-lg mx-1 px-2 py-1  transition-all duration-300 text-sm h-8 min-w-0`}
            aria-label={openDropdown === "liveInsight" ? "Stop Live Insight" : "Start Live Insight"}
            style={{ minWidth: 0 }}
          >
            <span className="flex items-end gap-0.5  h-4 relative top-[-4px]">
              <span className="bar bar1" />
              <span className="bar bar2" />
              <span className="bar bar3" />
            </span>
            <span className="whitespace-nowrap ml-2">Live Insight</span>
          </button>
          {openDropdown === "liveInsight" && (
            <motion.div
              ref={liveInsightDropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute left-0 top-full mt-2 w-full bg-background/30  border border-border rounded-lg shadow-xl z-50 max-h-180 overflow-y-auto"
            >
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
          <div ref={dropdownButtonRefs.todo} style={{ display: "inline-block" }}>
            <DropdownButton
              label={`Actions Goal: ${finishedCount}/${totalCount}`}
              isOpen={openDropdown === "todo"}
              onToggle={() => setOpenDropdown(openDropdown === "todo" ? null : "todo")}
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
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleTodo(todo.id)}
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

          <div ref={dropdownButtonRefs.analytics} style={{ display: "inline-block" }}>
            <DropdownButton
              label="Contents"
              isOpen={openDropdown === "analytics"}
              onToggle={() => setOpenDropdown(openDropdown === "analytics" ? null : "analytics")}
              ariaLabel="Analytics"
            >
              <div ref={dropdownRefs.analytics}>
                <Tabs defaultValue="transcript" className="w-full bg-background/20">
                  <TabsList>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
                  </TabsList>
                  <TabsContent value="transcript">
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
                    ) : (
                      <div className="space-y-1 font-mono text-xs">
                        {transcripts.map((line, idx) => (
                          <div key={idx + line}>{line}</div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="screenshots">
                    <div>
                      <ScreenshotList screenshots={screenshots} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </DropdownButton>
          </div>

          {/* Ask AI Dropdown */}
          <div ref={dropdownButtonRefs.ask} style={{ display: "inline-block" }}>
            {openDropdown === "ask" && (
              <motion.div
                ref={askDropdownRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-full left-0 mt-2 w-full bg-background/30  border border-border rounded-lg shadow-xl z-50"
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
                          {/* <span className="overflow-hidden whitespace-nowrap text-sm ml-1">AI Vision</span> */}
                        </AIInputButton>
                      </AIInputTools>
                      <AIInputSubmit disabled={!text} status={status} />
                    </AIInputToolbar>
                  </AIInput>
                </div>
                {/* AI Response */}
                {showResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="mt-4 p-2 bg-background/30  border border-border/10 rounded-lg relative"
                  >
                    <button
                      onClick={() => setShowResponse(false)}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/30 transition-colors"
                      aria-label="Close response"
                    >
                      <X size={16} />
                    </button>
                    <div className="pr-6">
                      <AIResponse>{responseContent}</AIResponse>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </Draggable>
      <style jsx>{`
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
