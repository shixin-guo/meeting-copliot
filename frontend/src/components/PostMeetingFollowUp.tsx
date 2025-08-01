import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@/components/ui/kibo-ui/video-player";

import {
  Mail,
  Send,
  FileText,
  Download,
  Upload,
  Sparkles,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  CloudCheck,
  Brain,
  Plus,
  Trash2,
  PlusIcon,
  MicIcon,
  GlobeIcon,
  Camera,
  Archive,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AIInput,
  AIInputTextarea,
  AIInputSubmit,
  AIInputToolbar,
  AIInputTools,
  AIInputButton,
} from "@/components/ui/ai-input";
import { AIResponse } from "@/components/ui/kibo-ui/ai/response";
import { Toggle } from "@/components/ui/toggle";
import { InsightTopic } from "@/components/ui/insight-topic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AIMessage, AIMessageAvatar, AIMessageContent } from "@/components/ui/kibo-ui/ai/message";
import { Skeleton } from "@/components/ui/skeleton";

interface MeetingData {
  id: string;
  title: string;
  date: Date;
  participants: string[];
  summary?: string;
}

// Default meeting data for the demo scenario
const defaultMeetingData: MeetingData = {
  id: "demo-meeting-001",
  title: "AI Meeting Copilot Product Demo with Enterprise Client",
  date: new Date("2024-01-15T14:00:00"),
  participants: ["shixin.guo@company.com", "eric.yuan@zoom.com", "sarah.tech@client.com", "mike.cto@client.com"],
  summary: "Product demonstration meeting showcasing AI Meeting Copilot features to potential enterprise client. Discussion covered API integration, real-time AI capabilities, and competitive advantages."
};

interface FollowUpAction {
  id: string;
  type: "email" | "task" | "document" | "meeting";
  title: string;
  description: string;
  assignee: string;
  dueDate: Date;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

interface PostMeetingFollowUpProps {
  meetingData: MeetingData;
  onClose?: () => void;
}

const PostMeetingFollowUp: React.FC<PostMeetingFollowUpProps> = ({ meetingData = defaultMeetingData }) => {
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");

  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");

  const [newAction, setNewAction] = useState<Partial<FollowUpAction>>({});

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, "success" | "error" | "pending">>({});

  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState(meetingData.summary || `# AI Meeting Copilot Product Demo - Meeting Summary

## Meeting Overview
**Date:** January 15, 2024  
**Duration:** 45 minutes  
**Participants:** Shixin Guo (Sales Rep), Eric Yuan (Zoom), Sarah Tech (Client Tech Lead), Mike CTO (Client CTO)

## Key Discussion Points

### 1. Product Demonstration
- **AI-Powered Meeting Preparation**: Showcased intelligent document processing with RAG pipeline
- **Real-Time AI Assistant**: Demonstrated live transcription, sentiment analysis, and Q&A capabilities
- **Smart Screenshot Analysis**: Highlighted OCR functionality for technical diagrams and documentation

### 2. Technical Integration Discussion
- **API Rate Limits**: Eric inquired about current API limitations and scaling capabilities
- **Security & Compliance**: Sarah raised concerns about data privacy and enterprise security requirements
- **Custom AI Model Training**: Mike asked about organization-specific model customization options

### 3. Competitive Analysis
- **Market Positioning**: Discussed how AI Meeting Copilot differentiates from existing solutions
- **Feature Comparison**: Compared real-time AI capabilities vs. post-meeting processing
- **Enterprise Readiness**: Addressed scalability and integration with existing business tools

## Decisions Made
- **Pilot Program**: Client agreed to 30-day pilot program with 50 users
- **Technical Review**: Scheduled follow-up technical deep-dive session for next week
- **Customization Scope**: Defined requirements for organization-specific AI model training

## Action Items
1. **Shixin**: Prepare pilot program documentation and user onboarding materials
2. **Eric**: Review API rate limit requirements and provide scaling roadmap
3. **Sarah**: Conduct security assessment and compliance review
4. **Mike**: Define custom AI model training requirements and timeline

## Next Steps
- **Week 1**: Complete pilot program setup and user provisioning
- **Week 2**: Conduct technical review session with engineering teams
- **Week 3**: Begin custom AI model training process
- **Week 4**: Pilot program launch and user training

## Important Notes
- Client showed strong interest in real-time AI capabilities during meetings
- Security and compliance requirements will be critical for enterprise deployment
- Custom AI model training feature was a key differentiator for the client
- API integration capabilities need to be thoroughly documented for technical teams`);

  const [conversation, setConversation] = useState<Array<{ role: "user" | "ai"; content: string }>>(
    [],
  );
  const [input, setInput] = useState("");
  const [aiStatus, setAiStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");

  const [isCapturing, setIsCapturing] = useState(false);
  const captureScreenshot = () => {
    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 1200); // mock screenshot
  };

  // Transcript search state
  const [transcriptSearchTerm, setTranscriptSearchTerm] = useState("");

  // Screenshot search state
  const [screenshotSearchTerm, setScreenshotSearchTerm] = useState("");

  // // Mock transcript data
  // const mockTranscripts = [
  //   {
  //     id: 1,
  //     title: "Segment 1 - Opening (00:00 - 02:30)",
  //     content:
  //       "John Smith: Good morning everyone, welcome to our quarterly product review meeting. I'm John Smith, Product Manager, and I'll be leading today's discussion. Let me start by introducing our team members who are joining us today.",
  //   },
  //   {
  //     id: 2,
  //     title: "Segment 2 - Team Introductions (02:30 - 05:15)",
  //     content:
  //       "Sarah Johnson: Hi everyone, I'm Sarah Johnson, Senior Developer. I've been working on the new authentication system and I'm excited to share our progress with you all. Mike Chen: Hello, Mike Chen here, UX Designer. I've been focusing on improving the user interface based on our recent user feedback sessions.",
  //   },
  //   {
  //     id: 3,
  //     title: "Segment 3 - Q1 Review (05:15 - 12:45)",
  //     content:
  //       "John Smith: Let's dive into our Q1 achievements. We successfully launched the new dashboard feature with a 95% user satisfaction rate. Sarah, could you walk us through the technical implementation? Sarah Johnson: Absolutely. We implemented a microservices architecture that improved our response time by 40%. The new caching layer has been particularly effective in handling peak traffic.",
  //   },
  //   {
  //     id: 4,
  //     title: "Segment 4 - Q2 Planning (12:45 - 18:20)",
  //     content:
  //       "John Smith: For Q2, we're planning to launch the mobile app beta. Mike, what are the key design considerations we need to address? Mike Chen: We need to focus on responsive design and ensure the mobile experience is as smooth as desktop. I've identified three main areas: navigation optimization, touch interactions, and offline functionality.",
  //   },
  //   {
  //     id: 5,
  //     title: "Segment 5 - Action Items (18:20 - 22:00)",
  //     content:
  //       "John Smith: Let's summarize our action items. Sarah will complete the API documentation by next Friday. Mike will deliver the mobile wireframes by Wednesday. I'll schedule the stakeholder review for next week.",
  //   },
  // ];

  // Mock screenshot data for the demo scenario
  const mockScreenshots = [
    {
      id: 1,
      title: "Screenshot 1 - AI Meeting Copilot Dashboard (14:05)",
      ocrText:
        "AI Meeting Copilot Dashboard - Real-time transcription, Sentiment analysis: 85% positive, Active participants: 4, AI insights: 12 generated",
      gradient: "from-blue-500 to-purple-600",
      label: "AI Dashboard",
    },
    {
      id: 2,
      title: "Screenshot 2 - Technical Architecture Diagram (14:15)",
      ocrText:
        "System Architecture - RAG Pipeline, OpenAI Integration, Real-time Processing, API Rate Limits: 1000 req/hour, Custom AI Models: Supported",
      gradient: "from-green-500 to-teal-600",
      label: "Technical Diagram",
    },
    {
      id: 3,
      title: "Screenshot 3 - Security & Compliance Overview (14:25)",
      ocrText:
        "Security Features - SOC 2 Type II, GDPR Compliant, End-to-end encryption, Enterprise SSO, Data residency options",
      gradient: "from-orange-500 to-red-600",
      label: "Security Overview",
    },
    {
      id: 4,
      title: "Screenshot 4 - Pilot Program Timeline (14:35)",
      ocrText:
        "30-Day Pilot Program - Week 1: Setup & Provisioning, Week 2: Technical Review, Week 3: Custom AI Training, Week 4: Launch & Training",
      gradient: "from-purple-500 to-pink-600",
      label: "Pilot Timeline",
    },
  ];
  // Remove mockTranscripts and mockScreenshots, add state for API data
  const [transcripts, setTranscripts] = useState<
    Array<{ id: string; title: string; content: string }>
  >([]);
  const [screenshots, setScreenshots] = useState<
    Array<{
      id: string | number;
      title: string;
      ocrText: string;
      gradient: string;
      label: string;
      dataUrl?: string;
      timestamp?: number;
    }>
  >([]);

  // Mock comments data for the demo scenario
  const mockComments: {
    from: "user" | "assistant";
    content: string;
    avatar: string;
    name: string;
  }[] = [
    {
      from: "user",
      content:
        "Excellent demo! The real-time AI capabilities really impressed the client. The pilot program agreement is a huge win.",
      avatar: "https://github.com/shadcn.png",
      name: "Shixin Guo",
    },
    {
      from: "assistant",
      content:
        "Absolutely! The client's interest in the custom AI model training feature was particularly strong. This could be a key differentiator for enterprise deals.",
      avatar: "https://github.com/openai.png",
      name: "AI Assistant",
    },
    {
      from: "user",
      content:
        "Eric's questions about API rate limits were spot on. We need to prepare detailed documentation for the technical review next week.",
      avatar: "https://github.com/leerob.png",
      name: "Eric Yuan",
    },
    {
      from: "assistant",
      content:
        "I've noted the API documentation requirement. I can help prepare a comprehensive technical overview including rate limits, scaling capabilities, and integration examples.",
      avatar: "https://github.com/openai.png",
      name: "AI Assistant",
    },
    {
      from: "user",
      content:
        "Sarah's security concerns are valid. We should prioritize the compliance review and prepare our SOC 2 documentation.",
      avatar: "https://github.com/evilrabbit.png",
      name: "Sarah Tech",
    },
    {
      from: "assistant",
      content:
        "Security and compliance will be critical for enterprise deployment. I recommend scheduling a dedicated security review session with our compliance team.",
      avatar: "https://github.com/openai.png",
      name: "AI Assistant",
    },
    {
      from: "user",
      content:
        "The 30-day pilot program with 50 users is a great starting point. Let's make sure the onboarding process is smooth.",
      avatar: "https://github.com/shadcn.png",
      name: "Mike CTO",
    },
    {
      from: "assistant",
      content:
        "Perfect! I've created a pilot program checklist. Would you like me to send the onboarding materials and user provisioning timeline?",
      avatar: "https://github.com/openai.png",
      name: "AI Assistant",
    },
  ];

  // Function to highlight search terms in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) {
      return text;
    }

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index + part} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  // Fetch transcripts and screenshots from API on mount
  useEffect(() => {
    // Fetch transcripts
    fetch("http://localhost:3789/api/transcripts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.transcripts)) {
          setTranscripts(
            data.transcripts.map(
              (
                t: { timestamp: string | number; speaker: string; content: string },
                idx: number,
              ) => ({
                id: t.timestamp ? String(t.timestamp) : String(idx),
                title:
                  t.speaker && t.timestamp
                    ? `${t.speaker} - ${new Date(t.timestamp).toLocaleTimeString()}`
                    : `Transcript Segment ${idx + 1}`,
                content: t.content || "",
              }),
            ),
          );
        }
      })
      .catch(() => {
        // fallback to mockTranscripts if API fails
        // setTranscripts(mockTranscripts);
      });

    // Fetch screenshots
    fetch("http://localhost:3789/api/screenshots")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.screenshots)) {
          setScreenshots(
            data.screenshots.map(
              (s: { name: string; timestamp: string | number; base64: string }, idx: number) => {
                const mock = mockScreenshots[idx] || {};
                return {
                  id: s.name || String(idx),
                  title: s.timestamp
                    ? `${new Date(s.timestamp).toLocaleTimeString()}`
                    : mock.title || `Screenshot ${idx + 1}`,
                  ocrText: mock.ocrText || "No OCR text available.",
                  gradient: mock.gradient || "from-blue-500 to-purple-600",
                  label: mock.label || "Screenshot",
                  dataUrl: s.base64 ? s.base64 : undefined,
                  timestamp: s.timestamp,
                };
              },
            ),
          );
        }
      })
      .catch(() => {
        // fallback to mockScreenshots if API fails
        setScreenshots(mockScreenshots);
      });
  }, []);

  // Filter transcripts based on search term
  const filteredTranscripts = transcripts.filter(
    (transcript) =>
      transcript.content.toLowerCase().includes(transcriptSearchTerm.toLowerCase()) ||
      transcript.title.toLowerCase().includes(transcriptSearchTerm.toLowerCase()),
  );

  // Filter screenshots based on search term
  const filteredScreenshots = screenshots.filter(
    (screenshot) =>
      screenshot.ocrText.toLowerCase().includes(screenshotSearchTerm.toLowerCase()) ||
      screenshot.title.toLowerCase().includes(screenshotSearchTerm.toLowerCase()),
  );

  useEffect(() => {
    setEmailSubject(`Follow-up: ${meetingData.title}`);
    setEmailRecipients(meetingData.participants);
  }, [meetingData]);

  const generateEmailContent = async () => {
    setIsGeneratingEmail(true);
    try {
      const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
      const MODEL = "google/gemini-2.0-flash-001";

      // Use mockTranscripts and mockScreenshots for the prompt
      const transcriptText = transcripts.map((t) => t.content).join("\n");

      const prompt = `Based on the following meeting information, generate a professional follow-up email:

Meeting: ${meetingData.title}
Date: ${meetingData.date.toLocaleDateString()}
Participants: ${meetingData.participants.join(", ")}

Transcripts:\n${transcriptText}

Summary:\n${meetingSummary}

Please generate a professional follow-up email that includes:
1. Thank you for attendance
2. Key discussion points
3. Action items and next steps
4. Any attachments or documents mentioned
5. Next meeting date if applicable

Make it concise but comprehensive.`;

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
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate email content");
      }

      const data = await response.json();
      const generatedContent = data.choices?.[0]?.message?.content || "";
      setEmailContent(generatedContent);
    } catch (error) {
      console.error("Error generating email:", error);
      setEmailContent("Failed to generate email content. Please write manually.");
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const generateMeetingSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
      const MODEL = "google/gemini-2.0-flash-001";

      const prompt = `Please create a comprehensive meeting summary based on the following information:

Meeting: ${meetingData.title}
Date: ${meetingData.date.toLocaleDateString()}
Participants: ${meetingData.participants.join(", ")}

Transcripts:
${transcripts.join("\n")}

Please provide:
1. Meeting Overview
2. Key Discussion Points
3. Decisions Made
4. Action Items
5. Next Steps
6. Important Notes

Format as markdown with clear sections.`;

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
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      const generatedSummary = data.choices?.[0]?.message?.content || "";
      setMeetingSummary(generatedSummary);
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const sendEmail = async () => {
    try {
      setSyncStatus((prev) => ({ ...prev, email: "pending" }));

      // Simulate email sending - replace with actual email service integration
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would integrate with your email service (SendGrid, etc.)
      console.log("Sending email:", {
        to: emailRecipients,
        subject: emailSubject,
        content: emailContent,
      });

      setSyncStatus((prev) => ({ ...prev, email: "success" }));
    } catch (error) {
      console.error("Error sending email:", error);
      setSyncStatus((prev) => ({ ...prev, email: "error" }));
    }
  };

  const syncToSalesforce = async () => {
    try {
      setSyncStatus((prev) => ({ ...prev, salesforce: "pending" }));
      setIsSyncing(true);

      // Simulate Salesforce sync - replace with actual Salesforce API integration
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const salesforceData = {
        meetingTitle: meetingData.title,
        meetingDate: meetingData.date,
        participants: meetingData.participants,
        summary: meetingSummary,
      };

      console.log("Syncing to Salesforce:", salesforceData);

      setSyncStatus((prev) => ({ ...prev, salesforce: "success" }));
    } catch (error) {
      console.error("Error syncing to Salesforce:", error);
      setSyncStatus((prev) => ({ ...prev, salesforce: "error" }));
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToDocuments = async () => {
    try {
      setSyncStatus((prev) => ({ ...prev, documents: "pending" }));

      // Simulate document sync - replace with actual document service integration
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const documentData = {
        title: `${meetingData.title} - Meeting Notes`,
        content: meetingSummary,
      };

      console.log("Syncing to Documents:", documentData);

      setSyncStatus((prev) => ({ ...prev, documents: "success" }));
    } catch (error) {
      console.error("Error syncing to documents:", error);
      setSyncStatus((prev) => ({ ...prev, documents: "error" }));
    }
  };

  const addRecipient = () => {
    if (recipientInput.trim() && !emailRecipients.includes(recipientInput.trim())) {
      setEmailRecipients([...emailRecipients, recipientInput.trim()]);
      setRecipientInput("");
    }
  };

  const removeRecipient = (email: string) => {
    setEmailRecipients(emailRecipients.filter((r) => r !== email));
  };

  const addCcRecipient = () => {
    if (ccInput.trim() && !ccRecipients.includes(ccInput.trim())) {
      setCcRecipients([...ccRecipients, ccInput.trim()]);
      setCcInput("");
    }
  };
  const removeCcRecipient = (email: string) => {
    setCcRecipients(ccRecipients.filter((r) => r !== email));
  };

  const addFollowUpAction = () => {
    if (newAction.title && newAction.description) {
      setNewAction({});
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      return;
    }
    setConversation((prev) => [...prev, { role: "user", content: input }]);
    setAiStatus("submitted");
    // mock AI response
    setTimeout(() => {
      setConversation((prev) => [
        ...prev,
        { role: "ai", content: `AI: This is a mock response to: "${input}"` },
      ]);
      setAiStatus("ready");
    }, 1200);
    setInput("");
  };

  const handleClearInput = () => setInput("");

  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isNextStepsLoading, setIsNextStepsLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isTitleLoading, setIsTitleLoading] = useState(true);

  useEffect(() => {
    // summary: 5-6s
    const summaryDelay = 5000 + Math.random() * 1000;
    // next steps: 5.5-7s
    const nextStepsDelay = 5500 + Math.random() * 1500;
    // video: 7-9s
    const videoDelay = 7000 + Math.random() * 2000;
    const summaryTimer = setTimeout(() => setIsSummaryLoading(false), summaryDelay);
    const nextStepsTimer = setTimeout(() => setIsNextStepsLoading(false), nextStepsDelay);
    const videoTimer = setTimeout(() => setIsVideoLoading(false), videoDelay);
    // title: 1s (simulate loading)
    const titleTimer = setTimeout(() => setIsTitleLoading(false), 1000);
    return () => {
      clearTimeout(summaryTimer);
      clearTimeout(nextStepsTimer);
      clearTimeout(videoTimer);
      clearTimeout(titleTimer);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 z-60">
      {/* Header with title and action buttons */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {isTitleLoading ? <Skeleton className="h-10 w-64 mb-2" /> : meetingData.title}
          </h1>
          <div className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            <div className=" flex -space-x-2 ">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="Shixin Guo" />
                <AvatarFallback>SG</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://github.com/leerob.png" alt="Eric Yuan" />
                <AvatarFallback>EY</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://github.com/evilrabbit.png" alt="Sarah Tech" />
                <AvatarFallback>ST</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="Mike CTO" />
                <AvatarFallback>MC</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-muted-foreground ml-2">
              {meetingData.date.toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex flex-wrap gap-2">
          {/* AI Chat Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Ask About This Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>AI Assistant</DialogTitle>
              </DialogHeader>
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex-1 overflow-y-auto space-y-2 p-4 border rounded-lg">
                  {conversation.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Ask me anything about this meeting!</p>
                      <p className="text-sm">
                        I can help you with summaries, action items, and more.
                      </p>
                    </div>
                  ) : (
                    conversation.map((msg) => (
                      <div
                        key={msg.content}
                        className={msg.role === "user" ? "text-right" : "text-left"}
                      >
                        <AIResponse>{msg.content}</AIResponse>
                      </div>
                    ))
                  )}
                </div>
                <AIInput onSubmit={handleAskAI} className="mt-2">
                  <AIInputTextarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about this meeting..."
                    minHeight={48}
                    maxHeight={120}
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
                      <AIInputButton onClick={captureScreenshot}>
                        {isCapturing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-300" />
                        ) : (
                          <Camera size={20} className="shrink-0" />
                        )}
                      </AIInputButton>
                      <AIInputButton onClick={handleClearInput}>Clear</AIInputButton>
                    </AIInputTools>
                    <AIInputSubmit status={aiStatus} />
                  </AIInputToolbar>
                </AIInput>
              </div>
            </DialogContent>
          </Dialog>

          {/* AI Email Composer Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full">
              <DialogHeader>
                <DialogTitle>Compose Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email-subject" className="mb-2 block">
                    Subject
                  </Label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="recipient-input" className="mb-2 block">
                    To
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipient-input"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      placeholder="Add recipient email"
                      onKeyPress={(e) => e.key === "Enter" && addRecipient()}
                    />
                    <Button onClick={addRecipient} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {emailRecipients.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <button onClick={() => removeRecipient(email)}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="cc-input" className="mb-2 block">
                    CC
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="cc-input"
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      placeholder="Add CC email"
                      onKeyPress={(e) => e.key === "Enter" && addCcRecipient()}
                    />
                    <Button onClick={addCcRecipient} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ccRecipients.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <button onClick={() => removeCcRecipient(email)}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <Label htmlFor="email-content" className="mb-2 block">
                    Email Content
                  </Label>
                  <Textarea
                    id="email-content"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="AI generated or manually edited email content..."
                    className="min-h-[300px] pr-36"
                  />
                  <Button
                    onClick={generateEmailContent}
                    disabled={isGeneratingEmail}
                    variant="ghost"
                    className="absolute bottom-2 left-2 z-10"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                    {isGeneratingEmail ? "Generating..." : "AI Generate"}
                  </Button>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button onClick={sendEmail} className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Email
                    {getStatusIcon(syncStatus.email)}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Task Assignment Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Tasks
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full">
              <DialogHeader>
                <DialogTitle>Create Task / Assign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="action-type" className="mb-2 block">
                    Type
                  </Label>
                  <Select
                    value={newAction.type}
                    onValueChange={(value) =>
                      setNewAction((prev) => ({
                        ...prev,
                        type: value as "email" | "task" | "document" | "meeting",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="action-title" className="mb-2 block">
                    Title
                  </Label>
                  <Input
                    id="action-title"
                    value={newAction.title || ""}
                    onChange={(e) => setNewAction((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <Label htmlFor="action-assignee" className="mb-2 block">
                    Assignee
                  </Label>
                  <Input
                    id="action-assignee"
                    value={newAction.assignee || ""}
                    onChange={(e) =>
                      setNewAction((prev) => ({ ...prev, assignee: e.target.value }))
                    }
                    placeholder="Assignee email"
                  />
                </div>
                <div>
                  <Label htmlFor="action-priority" className="mb-2 block">
                    Priority
                  </Label>
                  <Select
                    value={newAction.priority}
                    onValueChange={(value) =>
                      setNewAction((prev) => ({
                        ...prev,
                        priority: value as "low" | "medium" | "high",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="action-description" className="mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="action-description"
                    value={newAction.description || ""}
                    onChange={(e) =>
                      setNewAction((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Task description"
                    className="h-20"
                  />
                </div>
                <div>
                  <Label htmlFor="action-due" className="mb-2 block">
                    Due Date
                  </Label>
                  <Input
                    id="action-due"
                    type="date"
                    value={newAction.dueDate?.toISOString().split("T")[0] || ""}
                    onChange={(e) =>
                      setNewAction((prev) => ({ ...prev, dueDate: new Date(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <Button onClick={addFollowUpAction} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <CloudCheck className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="">
              <DropdownMenuItem onClick={syncToSalesforce} disabled={isSyncing}>
                <CloudCheck className="mr-2 w-4 h-4" />
                Export to Salesforce
                {getStatusIcon(syncStatus.salesforce)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={syncToDocuments}>
                <Upload className="mr-2 w-4 h-4" />
                Export to Google Drive
                {getStatusIcon(syncStatus.documents)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export/Download Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="">
              <DropdownMenuItem
                onClick={() => {
                  /* Export PDF logic */
                }}
              >
                <FileText className="mr-2 w-4 h-4" />
                Summary
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  /* Export PDF logic */
                }}
              >
                <FileText className="mr-2 w-4 h-4 text-blue-500" />
                Transcript
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  /* Export TXT logic */
                }}
              >
                <FileText className="mr-2 w-4 h-4 text-yellow-500" />
                Notes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  /* Export ZIP logic */
                }}
              >
                <Archive className="mr-2 w-4 h-4" />
                Screenshots
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  /* Export All logic */
                }}
              >
                <Archive className="mr-2 w-4 h-4" />
                All Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content with video player and tabs */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Video Player and Summary - Left Side */}
        <div className="w-2/3 space-y-6">
          {/* Video Player */}
          {isVideoLoading ? (
            <div className="animate-pulse h-[442px] bg-muted/50 rounded flex items-center justify-center text-lg text-muted-foreground">
              Analyzing video...
            </div>
          ) : (
            <VideoPlayer className="overflow-hidden rounded-lg border">
              <VideoPlayerContent
                crossOrigin=""
                muted
                preload="auto"
                slot="media"
                src="http://localhost:3789/recordings/videos/output.mp4"
              />
              <VideoPlayerControlBar>
                <VideoPlayerPlayButton />
                <VideoPlayerSeekBackwardButton />
                <VideoPlayerSeekForwardButton />
                <VideoPlayerTimeRange />
                <VideoPlayerTimeDisplay showDuration />
                <VideoPlayerMuteButton />
                <VideoPlayerVolumeRange />
              </VideoPlayerControlBar>
            </VideoPlayer>
          )}

          {/* Summary Section */}
          <Card className="py-4 gap-2">
            <CardHeader className="flex flex-row items-center justify-between px-4">
              <CardTitle className="flex items-center gap-2 text-md font-normal">
                Meeting Summary
              </CardTitle>
              <Button
                onClick={generateMeetingSummary}
                disabled={isGeneratingSummary || isSummaryLoading}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                {isGeneratingSummary ? "Generating..." : "Regenerate"}
              </Button>
            </CardHeader>
            <CardContent className="px-4">
              {isSummaryLoading ? (
                <div className="animate-pulse h-[278px] bg-muted/50 rounded flex items-center justify-center text-lg text-muted-foreground">
                  Analyzing meeting summary...
                </div>
              ) : (
                <Textarea
                  value={meetingSummary}
                  onChange={(e) => setMeetingSummary(e.target.value)}
                  placeholder="Summary will be generated here..."
                  className="min-h-[200px] font-mono text-sm"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vertical Divider */}
        <div className="hidden lg:block w-px bg-gray-300 dark:bg-gray-700" />

        {/* Content Tabs - Right Side */}
        <div className="w-1/3 h-[740px] flex flex-col">
          <Tabs defaultValue="ai" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ai">AI Analysis</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            {/* AI Analysis Tab */}
            <TabsContent value="ai" className="space-y-4 flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="p-3 border rounded-lg">
                  {/* Topic label and tags */}
                  <div className="mb-4">
                    <div className="text-base font-bold mb-2 text-muted-foreground text-left">
                      Topics:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isNextStepsLoading ? (
                        <div className="animate-pulse h-[100px] w-full bg-muted/50 rounded">
                          Generating next steps...
                        </div>
                      ) : (
                        [
                          "Product Demo",
                          "API Integration",
                          "Security & Compliance",
                          "Custom AI Models",
                          "Pilot Program",
                          "Technical Review",
                          "Enterprise Features",
                          "Competitive Analysis",
                          "Sales Process",
                        ].map((topic) => (
                          <Badge key={topic} variant="outline">
                            {topic}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  {/* Next Steps suggestions - improved layout */}
                  <div className="mb-3">
                    <div className="text-base font-bold mb-2 text-muted-foreground text-left">
                      Next Steps
                    </div>
                    {isNextStepsLoading ? (
                      <div className="animate-pulse h-[200px] bg-muted/50 rounded flex items-center justify-center text-base text-muted-foreground">
                        Generating next steps...
                      </div>
                    ) : (
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        <li>Prepare pilot program documentation and user onboarding materials.</li>
                        <li>Schedule technical review session with engineering teams for next week.</li>
                        <li>Conduct security assessment and compliance review with Sarah.</li>
                        <li>Define custom AI model training requirements and timeline with Mike.</li>
                      </ul>
                    )}
                  </div>
                  <div className="text-base font-bold mb-2 text-muted-foreground text-left">
                    Competitor Mentioned
                  </div>
                  <InsightTopic />
                </div>
              </div>
            </TabsContent>

            {/* Transcript Tab */}
            <TabsContent value="transcript" className="space-y-4 flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="mb-2">
                  <Input
                    placeholder="Search transcript..."
                    value={transcriptSearchTerm}
                    onChange={(e) => setTranscriptSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  {transcriptSearchTerm && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Found {filteredTranscripts.length} segment
                      {filteredTranscripts.length !== 1 ? "s" : ""} with "{transcriptSearchTerm}"
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  {filteredTranscripts.length > 0 ? (
                    filteredTranscripts.map((transcript) => (
                      <div key={transcript.id} className="p-1 rounded-lg mb-0">
                        <div className="text-sm text-muted-foreground mb-2">
                          {highlightText(transcript.title, transcriptSearchTerm)}
                        </div>
                        <p className="text-sm leading-relaxed">
                          {highlightText(transcript.content, transcriptSearchTerm)}
                        </p>
                      </div>
                    ))
                  ) : transcriptSearchTerm ? (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No results found for "{transcriptSearchTerm}"</p>
                      <p className="text-sm">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transcript available</p>
                      <p className="text-sm">Transcript will appear here when available</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Screenshots / OCR Tab */}
            <TabsContent value="screenshots" className="space-y-4 flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="mb-2">
                  <Input
                    placeholder="Search screenshots..."
                    value={screenshotSearchTerm}
                    onChange={(e) => setScreenshotSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  {screenshotSearchTerm && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Found {filteredScreenshots.length} screenshot
                      {filteredScreenshots.length !== 1 ? "s" : ""} with "{screenshotSearchTerm}"
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  {filteredScreenshots.length > 0 ? (
                    filteredScreenshots.map((screenshot) => (
                      <div key={screenshot.id} className="p-2 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground mb-2">
                          {highlightText(screenshot.title, screenshotSearchTerm)}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 mb-3">
                          {screenshot.dataUrl ? (
                            <img
                              src={`${screenshot.dataUrl}`}
                              alt={screenshot.title}
                              className="rounded max-h-48 w-auto"
                            />
                          ) : (
                            <div
                              className={`w-full h-48 bg-gradient-to-r ${screenshot.gradient} rounded flex items-center justify-center text-white font-semibold`}
                            >
                              {screenshot.label}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <strong>OCR Text:</strong>{" "}
                          {highlightText(screenshot.ocrText, screenshotSearchTerm)}
                        </div>
                      </div>
                    ))
                  ) : screenshotSearchTerm ? (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No results found for "{screenshotSearchTerm}"</p>
                      <p className="text-sm">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No screenshots available</p>
                      <p className="text-sm">Screenshots will appear here when available</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4 flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4">
                  {mockComments.map((comment) => (
                    <AIMessage key={comment.content} from={comment.from}>
                      <AIMessageContent>{comment.content}</AIMessageContent>
                      <AIMessageAvatar name={comment.name} src={comment.avatar} />
                    </AIMessage>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PostMeetingFollowUp;
