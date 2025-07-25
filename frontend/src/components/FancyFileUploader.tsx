import { useRef, useState } from "react";
import { Upload, Trash } from "lucide-react";

type UploadingFile = {
  file: File;
  progress: number;
  done: boolean;
  id: string;
};

export default function FancyFileUploader({
  onFilesUploaded,
}: {
  onFilesUploaded?: (files: File[]) => void;
}) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
    // Start fake upload
    newFiles.forEach((f) => fakeUpload(f.id));
    if (onFilesUploaded) {
      onFilesUploaded(Array.from(fileList));
    }
    // Clear the input value so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // Fake upload progress
  const fakeUpload = (id: string) => {
    let tick = 0;
    const maxTicks = 25; // 5s / 0.2s = 25
    const interval = setInterval(() => {
      tick += 1;
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            let newProgress = f.progress + Math.random() * 20;
            // If last tick or progress would go over 100, force to 100
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
    }, 200);
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[60px] bg-white">
      <div className="flex items-center space-x-2">
        <Upload size={20} className="text-blue-500" />
        <span className="text-gray-600 text-sm">Drag and drop files or</span>
        <button
          className="px-3 py-1 border rounded bg-white hover:bg-gray-50 text-sm ml-1"
          onClick={() => inputRef.current?.click()}
        >
          Choose Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {/* File List */}
      {files.length > 0 && (
        <div className="w-80 mt-4 space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center bg-gray-50 rounded-lg px-3 py-1 shadow-sm border"
            >
              <span className="flex-1 truncate text-sm">{f.file.name}</span>
              <div className="flex items-center w-32 mx-2">
                <div className="relative w-full h-2 bg-gray-200 rounded">
                  <div
                    className={`absolute left-0 top-0 h-2 rounded transition-all duration-200 ${
                      f.done ? "bg-green-400" : "bg-blue-400"
                    }`}
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
                <span className="ml-2 text-xs w-8 text-right">{Math.round(f.progress)}%</span>
              </div>
              <button
                className={`ml-2 ${f.done ? "text-green-400 hover:text-red-500" : "text-gray-400 hover:text-red-500"}`}
                onClick={() => removeFile(f.id)}
                aria-label="Remove"
              >
                <Trash size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
