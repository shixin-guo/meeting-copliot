import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import RealtimeTodoList from "./RealtimeTodoList";
import { Send, Mic, MicOff, Brain } from "lucide-react";

const TodoDemo: React.FC = () => {
  const [simulatedTranscript, setSimulatedTranscript] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  const sampleTranscripts = [
    "Let's make sure to follow up with the client about the project timeline.",
    "We need to prepare the presentation slides for next week's meeting.",
    "Don't forget to update the database with the new user requirements.",
    "Someone should schedule a code review session with the team.",
    "We must finalize the budget proposal by Friday.",
    "Remember to send the meeting notes to all participants.",
    "Let's create a test plan for the new feature we discussed.",
    "We should set up automated backups for the production server.",
  ];

  const simulateTranscripts = async () => {
    setIsSimulating(true);
    
    for (let i = 0; i < sampleTranscripts.length; i++) {
      const transcript = sampleTranscripts[i];
      
      // Actually send transcript to server
      try {
        const response = await fetch("http://localhost:3000/api/simulate-transcript", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: transcript,
            user: `User ${Math.floor(Math.random() * 5) + 1}`
          }),
        });

        if (response.ok) {
          console.log(`✅ Sent transcript: ${transcript}`);
        } else {
          console.error("Failed to send transcript:", response.statusText);
        }
        
        // Wait between transcripts to simulate real conversation
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (i === sampleTranscripts.length - 1) {
          setIsSimulating(false);
        }
      } catch (error) {
        console.error("Error sending transcript:", error);
        setIsSimulating(false);
      }
    }
  };

  const sendCustomTranscript = async () => {
    if (!simulatedTranscript.trim()) return;
    
    try {
      const response = await fetch("http://localhost:3000/api/simulate-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: simulatedTranscript,
          user: "Demo User"
        }),
      });

      if (response.ok) {
        console.log(`✅ Sent custom transcript: ${simulatedTranscript}`);
        setSimulatedTranscript("");
      } else {
        console.error("Failed to send custom transcript:", response.statusText);
      }
    } catch (error) {
      console.error("Error sending custom transcript:", error);
    }
  };

  const testTodoExtraction = async () => {
    const testInput = simulatedTranscript || "We need to schedule a follow-up meeting, prepare the quarterly report, and update the project documentation by next Friday.";
    
    try {
      const response = await fetch("http://localhost:3000/api/extract-todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: testInput
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Extracted todos:", data.todos);
      } else {
        console.error("Failed to extract todos:", response.statusText);
      }
    } catch (error) {
      console.error("Error testing todo extraction:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-blue-500" />
          Real-time AI Todo Demo
        </h1>
        <p className="text-muted-foreground">
          Experience how AI automatically extracts todos from meeting transcripts in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls and Simulation */}
        <div className="space-y-6">
          {/* Demo Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Transcript Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Transcript Input</label>
                <Textarea
                  value={simulatedTranscript}
                  onChange={(e) => setSimulatedTranscript(e.target.value)}
                  placeholder="Type a custom transcript here (e.g., 'We need to prepare the presentation and schedule a follow-up meeting')"
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button onClick={sendCustomTranscript} disabled={!simulatedTranscript.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Transcript
                  </Button>
                  <Button onClick={testTodoExtraction} variant="outline">
                    <Brain className="w-4 h-4 mr-2" />
                    Test AI Extraction
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Auto Simulation</label>
                  <Badge variant={isSimulating ? "default" : "secondary"}>
                    {isSimulating ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <Button 
                  onClick={simulateTranscripts} 
                  disabled={isSimulating}
                  className="w-full"
                >
                  {isSimulating ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Simulating Conversation...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Sample Conversation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sample Transcripts Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sample Transcripts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {sampleTranscripts.map((transcript, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded">
                    {transcript}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How it Works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Meeting transcripts are captured in real-time</li>
                <li>AI processes transcripts every 5 messages or 10 seconds</li>
                <li>OpenRouter extracts actionable todo items</li>
                <li>Todos appear instantly with highlighting</li>
                <li>Users can mark todos as complete</li>
                <li>All updates sync across connected clients</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Live Todo List */}
        <div className="space-y-6">
          <RealtimeTodoList />
        </div>
      </div>
    </div>
  );
};

export default TodoDemo;