"use client";
import {
  AIInput,
  AIInputButton,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@/components/ui/ai-input";
import {
  GlobeIcon,
  MicIcon,
  FileTextIcon,
  Loader2Icon,
  Sparkles,
  FileUp,
  FileText,
  ListChecks,
} from "lucide-react";
import React, { type FormEventHandler, useRef, useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface UploadingFile {
  file: File;
  progress: number;
  done: boolean;
  id: string;
}

const MeetingAIInput = ({
  onContentChange,
  onFilesChange,
  onTodosChange,
}: {
  onContentChange?: (text: string) => void;
  onFilesChange?: (files: File[]) => void;
  onTodosChange?: (todos: string[]) => void;
}) => {
  const [text, setText] = useState<string>("");
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  // No loading state for search button anymore

  // Handle file selection
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) {
      return;
    }
    const newFiles = Array.from(fileList).map((file) => ({
      file,
      progress: 0,
      done: false,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => fakeUpload(f.id));
    if (onFilesChange) {
      onFilesChange(Array.from(fileList));
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // Fake upload progress
  const fakeUpload = (id: string) => {
    let tick = 0;
    const maxTicks = 15;
    const interval = setInterval(() => {
      tick += 1;
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            let newProgress = f.progress + Math.random() * 25;
            if (tick >= maxTicks || newProgress >= 100) {
              newProgress = 100;
              clearInterval(interval);
            }
            return {
              ...f,
              progress: Math.min(newProgress, 100),
              done: newProgress >= 100,
            };
          }
          return f;
        }),
      );
    }, 150);
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Dropdown actions
  const handleImportContract = () => {
    setText((prev) => `${prev + (prev ? "\n" : "")}[Imported Contract Placeholder]`);
    if (onContentChange) {
      onContentChange(`${text + (text ? "\n" : "")}[Imported Contract Placeholder]`);
    }
  };
  const handleInsertPrevNextSteps = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setText(
      (prev) =>
        `${prev + (prev ? "\n" : "")}Previous Meeting Next Steps: 1. Review realtime in-meeting notes 2. Share Price Target 3. Schedule sync with CEO next week`,
    );
    if (onContentChange) {
      onContentChange(
        `${text + (text ? "\n" : "")}Previous Meeting Next Steps: 1. Review timeline 2. Share requirements 3. Schedule sync`,
      );
    }
  };
  const handleUploadFilesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  // Handle textarea change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (onContentChange) {
      onContentChange(e.target.value);
    }
  };

  // Search button handler (no loading)
  const handleSearchClick = () => {
    // Implement search logic here if needed
  };

  // Update handleSubmit to request both answer and todos as JSON
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setAiLoading(true);
    try {
      // Call both APIs in parallel
      const [summaryRes, todosRes] = await Promise.all([
        fetch("http://localhost:3789/api/llm-direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        }),
        fetch("http://localhost:3789/api/extract-todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: text }),
        }),
      ]);
      if (!summaryRes.ok) {
        throw new Error("Failed to get summary");
      }
      if (!todosRes.ok) {
        throw new Error("Failed to get todos");
      }
      const summaryData = await summaryRes.json();
      const todosData = await todosRes.json();
      // summaryData.response is the markdown summary
      // todosData.todos is the array of todos
      setText(summaryData.response || "");
      if (onTodosChange) {
        onTodosChange(Array.isArray(todosData.todos) ? todosData.todos : []);
      }
      if (onContentChange) {
        onContentChange(summaryData.response || "");
      }
    } catch (err) {
      setText("AI optimization failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // Optionally, render todos below the textarea

  return (
    <AIInput onSubmit={handleSubmit}>
      <AIInputTextarea
        onChange={handleTextChange}
        value={text}
        placeholder={`Describe what you want your AI agent to help with during this meeting.\nFor example:\nInvitee: Eric Yuan\nTodolist:\n  1. Upgrade client version\n  2. Schedule a new meeting with CEO\nMemo: (add your notes here)`}
        minHeight={186}
      />
      {/* File upload and attachment status below textarea */}
      <div className="flex items-center gap-2 px-3 py-1 min-h-[24px]">
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-0.5 mr-1"
          >
            <FileTextIcon size={14} className="text-blue-500" />
            <span className="truncate max-w-[80px]">{f.file.name}</span>
            {!f.done ? <Loader2Icon size={14} className="animate-spin text-gray-400" /> : null}
            <button
              className="ml-1 text-gray-400 hover:text-red-500"
              onClick={() => removeFile(f.id)}
              type="button"
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <AIInputToolbar>
        <AIInputTools>
          {/* Always-visible menu actions for AI functions */}
          <Tooltip>
            <TooltipTrigger>
              <AIInputButton
                aria-label="Import Contract"
                onClick={handleImportContract}
                type="button"
              >
                <FileText size={16} className="text-blue-500" />
              </AIInputButton>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              Import CRM Contract
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <AIInputButton
                aria-label="Upload Files from Local"
                onClick={handleUploadFilesClick}
                type="button"
              >
                <FileUp size={16} className="text-green-500" />
              </AIInputButton>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              Upload Files
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <AIInputButton
                aria-label="Insert Previous Meeting Next Steps"
                onClick={handleInsertPrevNextSteps}
                type="button"
              >
                <ListChecks size={16} className="text-yellow-500" />
              </AIInputButton>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              InsertPrevious Meeting Next Steps
            </TooltipContent>
          </Tooltip>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {/* Other toolbar buttons (optional) */}
          <AIInputButton>
            <MicIcon size={16} />
          </AIInputButton>
          <Tooltip>
            <TooltipTrigger>
              <AIInputButton aria-label="Search" onClick={handleSearchClick} type="button">
                <GlobeIcon size={16} />
                <span>Search</span>
              </AIInputButton>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              Web search
            </TooltipContent>
          </Tooltip>
        </AIInputTools>
        {/* AI sparkles button as main submit */}
        <AIInputButton
          aria-label="AI Compose"
          disabled={aiLoading || !text}
          type="submit"
          className="ml-auto flex items-center bg-blue-600 text-white hover:bg-blue-700"
        >
          <Sparkles size={16} className={aiLoading ? "animate-spin" : ""} />
          <span className="ml-1">AI</span>
        </AIInputButton>
      </AIInputToolbar>
    </AIInput>
  );
};

export default MeetingAIInput;
