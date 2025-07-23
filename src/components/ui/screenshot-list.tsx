"use client";

import React from "react";
import { Camera, ChevronDown, ChevronUp } from "lucide-react";
import { removeJsonTags } from "@/lib/utils";
import { AIResponse } from "./kibo-ui/ai/response";

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

  // Record the time when the component is mounted
  const [pageLoadTime] = React.useState(() => new Date());

  // Format the time as duration since page load in HH:mm:ss
  const formatDurationSincePageLoad = (timestamp: Date) => {
    const now = pageLoadTime;
    let diff = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000); // seconds
    if (diff < 0) diff = 0;
    const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const seconds = String(diff % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  React.useEffect(() => {
    // 检查每个 OCR 结果是否超出固定高度（60px）
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
    setOverflowIds(newOverflowIds);
  }, [screenshots]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id]
    );
  };


  return (
    <>
      {/* Screenshot List (no fixed position) */}
      <div className=" rounded-lg shadow-lg  overflow-hidden">
        <div className="overflow-y-auto max-h-[400px]">
          {screenshots.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
              <p>No screenshots yet</p>
              <p className="text-sm mt-2">
                Click the button in the bottom right to start taking screenshots
              </p>
            </div>
          ) : (
            <div className="">
              {screenshots.map((screenshot) => (
                <div
                  key={screenshot.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-md font-bold text-gray-600 dark:text-gray-300">
                      {formatDurationSincePageLoad(screenshot.timestamp)}
                    </div>
                  </div>
                  {/* Screenshot Preview */}
                  <div className="relative">
                    <img
                      src={screenshot.dataUrl}
                      alt={`Screenshot ${screenshot.id}`}
                      className="object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-t-md"
                    />
                    {/* OCR Result under image */}
                    {screenshot.ocrResult && (
                      <div className="relative">
                        <div
                          ref={el => (ocrRefs.current[screenshot.id] = el)}
                          className={`whitespace-pre-wrap mt-1 text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 rounded-b-md p-3 transition-all duration-200`}
                          style={{
                            maxHeight: expandedIds.includes(screenshot.id) ? 'none' : '52px',
                            overflow: expandedIds.includes(screenshot.id) ? 'visible' : 'hidden',
                            position: 'relative',
                            display: 'block',
                            cursor: overflowIds.includes(screenshot.id) ? 'pointer' : 'default',
                          }}
                          onClick={overflowIds.includes(screenshot.id) ? () => toggleExpand(screenshot.id) : undefined}
                        >
                          <AIResponse>{removeJsonTags(screenshot.ocrResult)}</AIResponse>
                        </div>
                        {overflowIds.includes(screenshot.id) && (
                          <button
                            className="absolute right-2 bottom-[15px] text-xs text-blue-500 bg-white/80 dark:bg-gray-900/80 p-1 rounded shadow hover:bg-blue-100 dark:hover:bg-gray-800 z-10 flex items-center justify-center"
                            onClick={e => { e.stopPropagation(); toggleExpand(screenshot.id); }}
                            type="button"
                            aria-label={expandedIds.includes(screenshot.id) ? 'Collapse' : 'Expand'}
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
    </>
  );
}
