import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  Send, 
  FileText, 
  Download, 
  Upload, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Sync,
  Database,
  Brain,
  Plus,
  Trash2,
  Edit3
} from "lucide-react";

interface MeetingData {
  id: string;
  title: string;
  date: Date;
  participants: string[];
  transcripts: string[];
  screenshots: Array<{
    id: string;
    dataUrl: string;
    timestamp: Date;
    ocrResult?: string;
  }>;
  summary?: string;
}

interface FollowUpAction {
  id: string;
  type: 'email' | 'task' | 'document' | 'meeting';
  title: string;
  description: string;
  assignee: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface PostMeetingFollowUpProps {
  meetingData: MeetingData;
  onClose?: () => void;
}

const PostMeetingFollowUp: React.FC<PostMeetingFollowUpProps> = ({ 
  meetingData, 
  onClose 
}) => {
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  
  const [followUpActions, setFollowUpActions] = useState<FollowUpAction[]>([]);
  const [newAction, setNewAction] = useState<Partial<FollowUpAction>>({});
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, 'success' | 'error' | 'pending'>>({});
  
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState(meetingData.summary || "");

  const [expandedSections, setExpandedSections] = useState({
    transcripts: false,
    screenshots: false,
    summary: true
  });

  useEffect(() => {
    setEmailSubject(`Follow-up: ${meetingData.title}`);
    setEmailRecipients(meetingData.participants);
  }, [meetingData]);

  const generateEmailContent = async () => {
    setIsGeneratingEmail(true);
    try {
      const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (!API_KEY) {
        throw new Error("OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in your environment variables.");
      }

      const MODEL = "google/gemini-2.0-flash-001";

      // Enhanced prompt with more specific instructions
      const prompt = `Based on the following meeting information, generate a professional follow-up email in a clear, business-appropriate format:

**Meeting Details:**
- Title: ${meetingData.title}
- Date: ${meetingData.date.toLocaleDateString()}
- Participants: ${meetingData.participants.join(", ")}

**Meeting Transcripts:**
${meetingData.transcripts.length > 0 ? meetingData.transcripts.join("\n\n") : "No transcripts available"}

**Meeting Summary:**
${meetingSummary || "No summary available yet"}

**Email Requirements:**
Please generate a professional follow-up email that includes:
1. A warm greeting and thank you for attendance
2. Brief recap of key discussion points from the transcripts
3. Clear action items and next steps identified during the meeting
4. Any important decisions made
5. Mention of attachments or documents if referenced in transcripts
6. Professional closing with next meeting information if applicable

Format the email with proper subject line suggestion, greeting, body paragraphs, and professional closing. Make it concise but comprehensive, and ensure it captures the essence of what was discussed based on the transcripts provided.`;

      console.log("Generating email with OpenRouter API...");

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.href,
          "X-Title": "Meeting Follow-up Email Generator"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "You are a professional business communication assistant. Generate clear, concise, and professional follow-up emails based on meeting information and transcripts provided."
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API Error:", response.status, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Unexpected API response structure:", data);
        throw new Error("Invalid response structure from OpenRouter API");
      }

      const generatedContent = data.choices[0].message.content || "";
      
      if (!generatedContent.trim()) {
        throw new Error("Generated content is empty");
      }

      console.log("Successfully generated email content");
      setEmailContent(generatedContent);
      
    } catch (error) {
      console.error("Error generating email:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setEmailContent(`Failed to generate email content: ${errorMessage}\n\nPlease write manually or check your API configuration.`);
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
${meetingData.transcripts.join("\n")}

OCR Results from Screenshots:
${meetingData.screenshots.map(s => s.ocrResult).filter(Boolean).join("\n")}

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
      setSyncStatus(prev => ({ ...prev, email: 'pending' }));
      
      // Simulate email sending - replace with actual email service integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would integrate with your email service (SendGrid, etc.)
      console.log("Sending email:", {
        to: emailRecipients,
        subject: emailSubject,
        content: emailContent
      });
      
      setSyncStatus(prev => ({ ...prev, email: 'success' }));
    } catch (error) {
      console.error("Error sending email:", error);
      setSyncStatus(prev => ({ ...prev, email: 'error' }));
    }
  };

  const syncToSalesforce = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, salesforce: 'pending' }));
      setIsSyncing(true);
      
      // Simulate Salesforce sync - replace with actual Salesforce API integration
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const salesforceData = {
        meetingTitle: meetingData.title,
        meetingDate: meetingData.date,
        participants: meetingData.participants,
        summary: meetingSummary,
        transcripts: meetingData.transcripts,
        followUpActions: followUpActions,
        attachments: meetingData.screenshots.map(s => ({
          name: `Screenshot_${s.timestamp.toISOString()}`,
          content: s.ocrResult
        }))
      };
      
      console.log("Syncing to Salesforce:", salesforceData);
      
      setSyncStatus(prev => ({ ...prev, salesforce: 'success' }));
    } catch (error) {
      console.error("Error syncing to Salesforce:", error);
      setSyncStatus(prev => ({ ...prev, salesforce: 'error' }));
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToDocuments = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, documents: 'pending' }));
      
      // Simulate document sync - replace with actual document service integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const documentData = {
        title: `${meetingData.title} - Meeting Notes`,
        content: meetingSummary,
        transcripts: meetingData.transcripts,
        screenshots: meetingData.screenshots
      };
      
      console.log("Syncing to Documents:", documentData);
      
      setSyncStatus(prev => ({ ...prev, documents: 'success' }));
    } catch (error) {
      console.error("Error syncing to documents:", error);
      setSyncStatus(prev => ({ ...prev, documents: 'error' }));
    }
  };

  const addRecipient = () => {
    if (recipientInput.trim() && !emailRecipients.includes(recipientInput.trim())) {
      setEmailRecipients([...emailRecipients, recipientInput.trim()]);
      setRecipientInput("");
    }
  };

  const removeRecipient = (email: string) => {
    setEmailRecipients(emailRecipients.filter(r => r !== email));
  };

  const addFollowUpAction = () => {
    if (newAction.title && newAction.description) {
      const action: FollowUpAction = {
        id: Date.now().toString(),
        type: newAction.type || 'task',
        title: newAction.title,
        description: newAction.description,
        assignee: newAction.assignee || '',
        dueDate: newAction.dueDate || new Date(),
        status: 'pending',
        priority: newAction.priority || 'medium'
      };
      setFollowUpActions([...followUpActions, action]);
      setNewAction({});
    }
  };

  const updateActionStatus = (id: string, status: FollowUpAction['status']) => {
    setFollowUpActions(actions => 
      actions.map(action => 
        action.id === id ? { ...action, status } : action
      )
    );
  };

  const deleteAction = (id: string) => {
    setFollowUpActions(actions => actions.filter(action => action.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Post-Meeting Follow-Up</h1>
          <p className="text-muted-foreground mt-2">
            {meetingData.title} • {meetingData.date.toLocaleDateString()}
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI-Generated Meeting Summary
                </CardTitle>
                <Button 
                  onClick={generateMeetingSummary}
                  disabled={isGeneratingSummary}
                  variant="outline"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingSummary ? "Generating..." : "Regenerate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={meetingSummary}
                onChange={(e) => setMeetingSummary(e.target.value)}
                placeholder="Meeting summary will be generated here..."
                className="min-h-[300px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <Collapsible
                  open={expandedSections.transcripts}
                  onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, transcripts: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Transcripts ({meetingData.transcripts.length})
                      </CardTitle>
                      {expandedSections.transcripts ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-4">
                    <ScrollArea className="h-[200px] w-full border rounded p-2">
                      {meetingData.transcripts.map((transcript, index) => (
                        <div key={index} className="text-sm mb-2 p-2 bg-muted rounded">
                          {transcript}
                        </div>
                      ))}
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Collapsible
                  open={expandedSections.screenshots}
                  onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, screenshots: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Screenshots & OCR ({meetingData.screenshots.length})
                      </CardTitle>
                      {expandedSections.screenshots ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-4">
                    <ScrollArea className="h-[200px] w-full">
                      {meetingData.screenshots.map((screenshot) => (
                        <div key={screenshot.id} className="mb-4 p-2 border rounded">
                          <div className="text-xs text-muted-foreground mb-2">
                            {screenshot.timestamp.toLocaleString()}
                          </div>
                          <img 
                            src={screenshot.dataUrl} 
                            alt="Screenshot" 
                            className="w-full h-20 object-cover rounded mb-2"
                          />
                          {screenshot.ocrResult && (
                            <div className="text-sm bg-muted p-2 rounded">
                              {screenshot.ocrResult}
                            </div>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                AI Email Composer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="recipient-input">Recipients</Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipient-input"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      placeholder="Add recipient email"
                      onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                    />
                    <Button onClick={addRecipient} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {emailRecipients.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button onClick={() => removeRecipient(email)}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={generateEmailContent}
                  disabled={isGeneratingEmail}
                  variant="outline"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingEmail ? "Generating..." : "Generate AI Content"}
                </Button>
              </div>

              <div>
                <Label htmlFor="email-content">Email Content</Label>
                <Textarea
                  id="email-content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Email content will be generated here..."
                  className="min-h-[300px]"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={sendEmail} className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Email
                  {getStatusIcon(syncStatus.email)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Follow-Up Actions & Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded">
                <div>
                  <Label htmlFor="action-type">Type</Label>
                  <Select 
                    value={newAction.type} 
                    onValueChange={(value) => setNewAction(prev => ({ ...prev, type: value as any }))}
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
                  <Label htmlFor="action-title">Title</Label>
                  <Input
                    id="action-title"
                    value={newAction.title || ''}
                    onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Action title"
                  />
                </div>
                <div>
                  <Label htmlFor="action-assignee">Assignee</Label>
                  <Input
                    id="action-assignee"
                    value={newAction.assignee || ''}
                    onChange={(e) => setNewAction(prev => ({ ...prev, assignee: e.target.value }))}
                    placeholder="Assignee email"
                  />
                </div>
                <div>
                  <Label htmlFor="action-priority">Priority</Label>
                  <Select 
                    value={newAction.priority} 
                    onValueChange={(value) => setNewAction(prev => ({ ...prev, priority: value as any }))}
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
                <div className="md:col-span-2">
                  <Label htmlFor="action-description">Description</Label>
                  <Textarea
                    id="action-description"
                    value={newAction.description || ''}
                    onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Action description"
                    className="h-20"
                  />
                </div>
                <div>
                  <Label htmlFor="action-due">Due Date</Label>
                  <Input
                    id="action-due"
                    type="date"
                    value={newAction.dueDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setNewAction(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addFollowUpAction} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {followUpActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getPriorityColor(action.priority) as any}>
                          {action.priority}
                        </Badge>
                        <Badge variant="outline">{action.type}</Badge>
                        <span className="font-medium">{action.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{action.description}</p>
                      <div className="text-xs text-muted-foreground">
                        Assignee: {action.assignee} • Due: {action.dueDate.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={action.status} 
                        onValueChange={(value) => updateActionStatus(action.id, value as any)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => deleteAction(action.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sync className="w-5 h-5" />
                Sync to External Systems
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="w-5 h-5" />
                      Salesforce
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sync meeting data, participants, and follow-up actions to Salesforce CRM.
                    </p>
                    <Button 
                      onClick={syncToSalesforce} 
                      disabled={isSyncing}
                      className="w-full flex items-center gap-2"
                    >
                      <Sync className="w-4 h-4" />
                      {isSyncing ? "Syncing..." : "Sync to Salesforce"}
                      {getStatusIcon(syncStatus.salesforce)}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export meeting summary, transcripts, and OCR results to document storage.
                    </p>
                    <Button 
                      onClick={syncToDocuments} 
                      className="w-full flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Sync to Documents
                      {getStatusIcon(syncStatus.documents)}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5" />
                      Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create follow-up meetings and calendar events for action items.
                    </p>
                    <Button 
                      className="w-full flex items-center gap-2"
                      variant="outline"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule Follow-ups
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Email Service</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(syncStatus.email)}
                        <span className="text-sm">{syncStatus.email || 'Not synced'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Salesforce</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(syncStatus.salesforce)}
                        <span className="text-sm">{syncStatus.salesforce || 'Not synced'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Documents</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(syncStatus.documents)}
                        <span className="text-sm">{syncStatus.documents || 'Not synced'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Export & OCR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Export Options</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Download Meeting Summary (PDF)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Download Transcripts (TXT)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Download Screenshots & OCR (ZIP)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Download Complete Package (ZIP)
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Create Action Items Document
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      Generate Meeting Minutes
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Create Participant Summary
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">OCR Results Summary</h3>
                <div className="border rounded p-4 bg-muted/50">
                  <ScrollArea className="h-[200px]">
                    {meetingData.screenshots.map((screenshot, index) => (
                      <div key={screenshot.id} className="mb-4 last:mb-0">
                        <div className="text-sm font-medium mb-1">
                          Screenshot {index + 1} - {screenshot.timestamp.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                          {screenshot.ocrResult || "No OCR data available"}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PostMeetingFollowUp;