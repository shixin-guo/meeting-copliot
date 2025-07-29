"use client";

import React from "react";
import { Camera, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { removeJsonTags } from "@/lib/utils";
import { AIResponse } from "./kibo-ui/ai/response";
import ReactMarkdown from "react-markdown";

interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: Date;
  ocrResult?: string;
}

interface ScreenshotListProps {
  screenshots: Screenshot[];
}

export function ScreenshotList({ screenshots }: ScreenshotListProps) {
  const [expandedIds, setExpandedIds] = React.useState<string[]>([]);
  const ocrRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [overflowIds, setOverflowIds] = React.useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = React.useState<Screenshot | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Record the time when the component is mounted
  const [pageLoadTime] = React.useState(() => new Date());

  // Format the time as duration since page load in HH:mm:ss
  const formatDurationSincePageLoad = (timestamp: Date) => {
    const now = pageLoadTime;
    let diff = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000); // seconds
    if (diff < 0) {
      diff = 0;
    }
    const hours = String(Math.floor(diff / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const seconds = String(diff % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // Filter screenshots based on search term
  const filteredScreenshots = screenshots.filter((screenshot) => {
    if (!searchTerm.trim()) {
      return true;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const ocrText = screenshot.ocrResult?.toLowerCase() || "";
    const title = formatDurationSincePageLoad(screenshot.timestamp).toLowerCase();
    
    return ocrText.includes(searchLower) || title.includes(searchLower);
  });

  // Highlight search terms in text using markdown bold
  const highlightSearchTerms = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) {
      return text;
    }
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(regex, "**$1**");
  };

  React.useEffect(() => {
    // Check if each OCR result exceeds the fixed height (60px)
    const newOverflowIds: string[] = [];
    screenshots.forEach((screenshot) => {
      const ref = ocrRefs.current[screenshot.id];
      if (ref) {
        const maxHeight = 90;
        if (ref.scrollHeight > maxHeight + 2) {
          newOverflowIds.push(screenshot.id);
        }
      }
    });
    console.log("screenshots", screenshots);
    setOverflowIds(newOverflowIds);
  }, [screenshots]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id],
    );
  };

  return (
    <>
      {/* Search Input */}
      <div className="p-3 border-b border-border/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search screenshots by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 bg-background/20 border-border/30 text-sm"
          />
        </div>
        {searchTerm && (
          <div className="text-sm text-muted-foreground mt-1">
            Found {filteredScreenshots.length} screenshot{filteredScreenshots.length !== 1 ? "s" : ""} with "{searchTerm}"
          </div>
        )}
      </div>

      {/* Screenshot List (no fixed position) */}
      <div className="rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-y-auto max-h-[400px]">
          {screenshots.length === 0 ? (
            <div className="p-8 text-center">
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
              <p>No screenshots yet</p>
              <p className="text-sm mt-2">
                Click the button in the bottom right to start taking screenshots
              </p>
            </div>
          ) : filteredScreenshots.length === 0 ? (
            <div className="p-8 text-center">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>No results found for "{searchTerm}"</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          ) : (
            <div className="">
              {filteredScreenshots.map((screenshot, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <div key={screenshot.id + index} className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-md font-bold text-gray-600 dark:text-gray-300 mb-2">
                      {formatDurationSincePageLoad(screenshot.timestamp)}
                    </div>
                  </div>
                  {/* Screenshot Preview */}
                  <div className="relative">
                    <img
                      src={screenshot.dataUrl}
                      alt={`Screenshot ${screenshot.id}`}
                      className="object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-t-md"
                      onClick={() => {
                        setSelectedScreenshot(screenshot);
                        setDialogOpen(true);
                      }}
                    />
                    {/* OCR Result under image */}
                    {screenshot.ocrResult && (
                      <div className="relative">
                        <div
                          ref={(el) => (ocrRefs.current[screenshot.id] = el)}
                          className={`whitespace-pre-wrap mt-1 text-sm text-gray-800 dark:text-gray-200 border rounded-b-md p-2 transition-all duration-200`}
                          style={{
                            maxHeight: expandedIds.includes(screenshot.id) ? "none" : "52px",
                            overflow: expandedIds.includes(screenshot.id) ? "visible" : "hidden",
                            position: "relative",
                            display: "block",
                            cursor: overflowIds.includes(screenshot.id) ? "pointer" : "default",
                          }}
                          onClick={
                            overflowIds.includes(screenshot.id)
                              ? () => toggleExpand(screenshot.id)
                              : undefined
                          }
                        >
                          <AIResponse>
                              {highlightSearchTerms(removeJsonTags(screenshot.ocrResult), searchTerm)}
                          </AIResponse>
                        </div>
                        {overflowIds.includes(screenshot.id) && (
                          <button
                            className="absolute right-2 bottom-[15px] text-xs text-blue-500 bg-white/80 dark:bg-gray-900/80 p-1 rounded shadow hover:bg-blue-100 dark:hover:bg-gray-800 z-10 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(screenshot.id);
                            }}
                            type="button"
                            aria-label={expandedIds.includes(screenshot.id) ? "Collapse" : "Expand"}
                          >
                            {expandedIds.includes(screenshot.id) ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Dialog for large image and OCR result */}
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
                <div className="w-full bg-gray-50 dark:bg-gray-900 border rounded p-3 mt-2 text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
                  <AIResponse>
                      {highlightSearchTerms(removeJsonTags(selectedScreenshot.ocrResult), searchTerm)}
                  </AIResponse>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
