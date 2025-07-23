import type React from "react";
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DemoVideo from "@/components/DemoVideo";
import {
  Sparkles,
  Brain,
  FileText,
  Users,
  BarChart3,
  MessageSquare,
  Camera,
  Mail,
  CheckCircle,
  ArrowRight,
  Play,
  Zap,
  Shield,
  Globe,
  Star,
} from "lucide-react";

interface LandingPageProps {
  onStartMeeting?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartMeeting }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Meeting Copilot",
      description:
        "Your intelligent meeting companion that understands context, takes notes, and provides real-time insights.",
      image: "/images/meetingsdk-web-client-view.gif",
      details: [
        "Real-time AI assistance",
        "Context-aware suggestions",
        "Smart meeting preparation",
      ],
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Smart Screenshot Analysis",
      description:
        "Automatically capture and analyze screenshots with advanced OCR and content extraction.",
      image: "/images/meetingsdk-web-component-view.gif",
      details: ["Instant OCR processing", "Content extraction", "Visual meeting notes"],
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Real-time Transcription",
      description: "Advanced speech-to-text with AI-powered analysis and key point extraction.",
      image: "/images/meetingsdk-web-client-view.gif",
      details: ["Live transcription", "Key point detection", "Speaker identification"],
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Post-Meeting Follow-up",
      description: "Automated email generation, action items, and meeting summaries powered by AI.",
      image: "/images/meetingsdk-web-component-view.gif",
      details: ["Auto email drafts", "Action item tracking", "Meeting summaries"],
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Document Intelligence",
      description:
        "Upload and analyze meeting materials with AI-powered insights and recommendations.",
      image: "/images/meetingsdk-web-client-view.gif",
      details: ["Document analysis", "Content insights", "Smart recommendations"],
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Meeting Analytics",
      description: "Comprehensive meeting insights with sentiment analysis and engagement metrics.",
      image: "/images/meetingsdk-web-component-view.gif",
      details: ["Engagement metrics", "Sentiment analysis", "Performance insights"],
    },
  ];

  const stats = [
    { number: "99%", label: "Accuracy Rate" },
    { number: "50%", label: "Time Saved" },
    { number: "10k+", label: "Meetings Analyzed" },
    { number: "24/7", label: "AI Availability" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <motion.section
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-200 rounded-full opacity-20"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-thin text-gray-900 mb-6 leading-tight"
          >
            The Future of
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-light">
              AI Meetings
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 font-light leading-relaxed max-w-3xl mx-auto"
          >
            Transform your meetings with AI-powered insights, real-time analysis, and intelligent
            automation. Experience the next generation of collaborative intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={onStartMeeting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start AI Meeting
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg rounded-full border-2 hover:bg-gray-50 transition-all duration-300"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none">
                <DemoVideo
                  title="AI Meeting Assistant Demo"
                  thumbnail="/images/meetingsdk-web-client-view.gif"
                />
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-light text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Showcase */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-thin text-gray-900 mb-6">
              Intelligent Features
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto">
              Every feature designed to enhance your meeting experience with the power of artificial
              intelligence.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Feature List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                    currentFeature === index
                      ? "bg-white shadow-xl border-l-4 border-blue-600"
                      : "bg-white/50 hover:bg-white hover:shadow-lg"
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        currentFeature === index
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600 mb-3 font-light">{feature.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {feature.details.map((detail, i) => (
                          <span
                            key={i}
                            className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full"
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Demo */}
            <div className="relative">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-gray-900 px-6 py-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div className="flex-1 text-center">
                      <span className="text-gray-300 text-sm font-medium">
                        {features[currentFeature].title}
                      </span>
                    </div>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    <img
                      src={features[currentFeature].image}
                      alt={features[currentFeature].title}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Floating AI Badge */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">AI Powered</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-thin text-gray-900 mb-6">
              Built with Excellence
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto">
              Powered by cutting-edge AI models and modern web technologies for unparalleled
              performance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-12 h-12" />,
                title: "Advanced AI Models",
                description:
                  "Google Gemini 2.0 Flash for lightning-fast analysis and OpenRouter integration for diverse AI capabilities.",
                features: ["Real-time Processing", "Multi-modal Analysis", "Context Understanding"],
              },
              {
                icon: <Zap className="w-12 h-12" />,
                title: "Modern Architecture",
                description:
                  "Built with React, TypeScript, and Vite for optimal performance and developer experience.",
                features: ["Type Safety", "Hot Reloading", "Optimized Builds"],
              },
              {
                icon: <Shield className="w-12 h-12" />,
                title: "Enterprise Security",
                description:
                  "JWT authentication, secure API endpoints, and privacy-first design principles.",
                features: ["End-to-end Encryption", "Secure Authentication", "Privacy Compliant"],
              },
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <div className="text-blue-600 mb-6">{tech.icon}</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{tech.title}</h3>
                <p className="text-gray-600 mb-6 font-light leading-relaxed">{tech.description}</p>
                <div className="space-y-2">
                  {tech.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-thin text-white mb-6">
              Ready to Transform
              <br />
              Your Meetings?
            </h2>
            <p className="text-xl text-blue-100 mb-12 font-light max-w-2xl mx-auto">
              Join thousands of teams already using AI to make their meetings more productive,
              insightful, and actionable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={onStartMeeting}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg rounded-full transition-all duration-300"
              >
                <Users className="mr-2 h-5 w-5" />
                Book Demo
              </Button>
            </div>

            <div className="mt-16 flex items-center justify-center gap-8 text-blue-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-sm">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span className="text-sm">50+ Countries</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm">SOC 2 Compliant</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-light mb-4">AI Meeting Assistant</h3>
            <p className="text-gray-400 font-light">
              The future of intelligent collaboration is here.
            </p>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                © 2024 AI Meeting Assistant. Built with ❤️ and cutting-edge AI.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
