import type React from "react";
import { useState } from "react";
import { motion } from "motion/react";
import { Play, Pause, Volume2, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoVideoProps {
  title: string;
  thumbnail?: string;
  className?: string;
}

const DemoVideo: React.FC<DemoVideoProps> = ({ title, thumbnail, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  return (
    <motion.div
      className={`relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Video Container */}
      <div className="aspect-video relative">
        {/* Thumbnail/Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20">
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/60 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <Play className="w-10 h-10 ml-1" />
                </div>
                <p className="text-lg font-light">{title}</p>
              </div>
            </div>
          )}
        </div>

        {/* Play Button Overlay */}
        {!isPlaying && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={() => setIsPlaying(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm">
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            </div>
          </motion.div>
        )}

        {/* Video Controls */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            {/* Progress Bar */}
            <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: "0%" }}
                animate={{ width: isPlaying ? "100%" : "0%" }}
                transition={{ duration: 30, ease: "linear" }}
              />
            </div>

            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
              <Volume2 className="w-4 h-4" />
            </Button>

            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* AI Features Overlay */}
        {isPlaying && (
          <motion.div
            className="absolute top-4 right-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              🤖 AI Active
            </div>
          </motion.div>
        )}
      </div>

      {/* Title Bar */}
      <div className="bg-gray-900 px-4 py-3 flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
        <div className="w-3 h-3 bg-green-500 rounded-full" />
        <div className="flex-1 text-center">
          <span className="text-gray-300 text-sm font-medium">{title}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DemoVideo;
