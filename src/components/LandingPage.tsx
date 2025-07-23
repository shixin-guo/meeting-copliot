import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SlidingNumber } from "@/components/animate-ui/text/sliding-number";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Mic, 
  Camera, 
  Brain, 
  FileText, 
  Users,
  ArrowRight,
  Play,
  Zap,
  MessageSquare
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const features = [
    {
      id: "ai-prep",
      icon: Sparkles,
      title: "AI Meeting Preparation",
      description: "Upload documents and customize your AI agent before meetings. Get intelligent insights and automated todo generation.",
      stats: { value: 95, label: "Accuracy Rate" },
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "transcription", 
      icon: Mic,
      title: "Real-time Transcription",
      description: "Live meeting transcription with speaker identification and timestamp tracking via WebSocket connection.",
      stats: { value: 99, label: "Uptime" },
      color: "from-green-500 to-teal-600"
    },
    {
      id: "screenshot",
      icon: Camera, 
      title: "Smart Screenshot Analysis",
      description: "One-click screenshot capture with OCR text extraction and AI-powered content analysis using Vision models.",
      stats: { value: 87, label: "OCR Accuracy" },
      color: "from-orange-500 to-red-600"
    },
    {
      id: "followup",
      icon: Brain,
      title: "Post-Meeting Intelligence", 
      description: "AI-generated meeting summaries, follow-up emails, and action item tracking with smart recommendations.",
      stats: { value: 92, label: "User Satisfaction" },
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "rag",
      icon: FileText,
      title: "RAG Pipeline Integration",
      description: "Advanced document processing with LangChain RAG pipeline for intelligent knowledge base queries.",
      stats: { value: 89, label: "Relevance Score" },
      color: "from-indigo-500 to-blue-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mr-4"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Meeting Copilot
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transform your meetings with intelligent AI assistance. From preparation to follow-up, 
            experience the future of collaborative productivity.
          </p>

          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                <SlidingNumber number={500} />+
              </div>
              <p className="text-sm text-muted-foreground">Meetings Enhanced</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                <SlidingNumber number={95} />%
              </div>
              <p className="text-sm text-muted-foreground">User Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                <SlidingNumber number={24} />/7
              </div>
              <p className="text-sm text-muted-foreground">AI Availability</p>
            </div>
          </div>

          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            <Play className="mr-2 h-5 w-5" />
            Start AI-Powered Meeting
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onHoverStart={() => setHoveredFeature(feature.id)}
              onHoverEnd={() => setHoveredFeature(null)}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color}`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        <SlidingNumber number={hoveredFeature === feature.id ? feature.stats.value : 0} />%
                      </div>
                      <p className="text-xs text-muted-foreground">{feature.stats.label}</p>
                    </div>
                    <motion.div
                      animate={{ x: hoveredFeature === feature.id ? 5 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Technology Stack */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center"
        >
          <h3 className="text-2xl font-semibold mb-6">Powered by Advanced AI</h3>
          <div className="flex items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>OpenRouter LLM</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>LangChain RAG</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Zoom SDK</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
