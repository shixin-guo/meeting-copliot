import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayfulTodolist } from "@/components/animate-ui/ui-elements/playful-todolist";
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  RefreshCw, 
  Zap, 
  Clock,
  Brain,
  Wifi,
  WifiOff
} from "lucide-react";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  timestamp?: number;
}

interface RealtimeMessage {
  type: string;
  todos?: Todo[];
  newTodos?: Todo[];
  updatedTodo?: Todo;
  content?: string;
  user?: string;
  timestamp?: number;
}

const RealtimeTodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [recentTranscripts, setRecentTranscripts] = useState<string[]>([]);
  const [newTodoIds, setNewTodoIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    
    ws.onopen = () => {
      console.log("✅ Connected to real-time todo updates");
      setIsConnected(true);
      setSocket(ws);
      
      // Load existing todos on connect
      fetchCurrentTodos();
    };

    ws.onmessage = (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        
        if (message.type === "todos_update") {
          if (message.todos) {
            setTodos(message.todos);
            
            // Highlight new todos temporarily
            if (message.newTodos && message.newTodos.length > 0) {
              setIsProcessing(false);
              const newIds = new Set(message.newTodos.map(t => t.id));
              setNewTodoIds(newIds);
              
              // Remove highlight after 3 seconds
              setTimeout(() => {
                setNewTodoIds(new Set());
              }, 3000);
            }
          }
        } else if (message.type === "transcript") {
          // Show recent transcripts for context
          setRecentTranscripts(prev => {
            const updated = [
              `[${message.user}]: ${message.content}`,
              ...prev.slice(0, 4) // Keep last 5 transcripts
            ];
            return updated;
          });
          
          // Show processing indicator when new transcripts arrive
          setIsProcessing(true);
          setTimeout(() => setIsProcessing(false), 2000);
        }
      } catch (err) {
        console.warn("Invalid WebSocket message:", event.data);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.warn("WebSocket connection closed");
      setIsConnected(false);
      setSocket(null);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    return ws;
  }, []);

  // Fetch current todos from server
  const fetchCurrentTodos = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/current-todos");
      const data = await response.json();
      setTodos(data.todos || []);
    } catch (error) {
      console.error("Error fetching current todos:", error);
    }
  };

  // Update todo completion status
  const updateTodoStatus = async (todoId: string, completed: boolean) => {
    try {
      const response = await fetch("http://localhost:3000/api/update-todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ todoId, completed }),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      // The server will broadcast the update via WebSocket
    } catch (error) {
      console.error("Error updating todo:", error);
      
      // Optimistic update in case of network issues
      setTodos(prev => 
        prev.map(todo => 
          todo.id === todoId ? { ...todo, completed } : todo
        )
      );
    }
  };

  // Clear all todos
  const clearAllTodos = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/clear-todos", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to clear todos");
      }

      // The server will broadcast the update via WebSocket
    } catch (error) {
      console.error("Error clearing todos:", error);
    }
  };

  // Toggle todo completion
  const handleToggleTodo = (index: number) => {
    const todo = todos[index];
    if (todo) {
      updateTodoStatus(todo.id, !todo.completed);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket]);

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              Real-time AI Todo List
              {isProcessing && (
                <div className="flex items-center gap-1 text-sm text-orange-500">
                  <Zap className="w-4 h-4 animate-pulse" />
                  Processing...
                </div>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              
              {totalCount > 0 && (
                <Badge variant="outline">
                  {completedCount}/{totalCount} completed
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Todos are automatically extracted from meeting transcripts using AI
          </p>
        </CardHeader>
      </Card>

      {/* Recent Transcripts */}
      {recentTranscripts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Transcripts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-20">
              <div className="space-y-1">
                {recentTranscripts.map((transcript, index) => (
                  <div 
                    key={index} 
                    className={`text-xs p-2 rounded ${
                      index === 0 ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' : 'bg-muted'
                    }`}
                  >
                    {transcript}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Todo List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Todo Items</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCurrentTodos}
                disabled={!isConnected}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              {totalCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllTodos}
                  disabled={!isConnected}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {todos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No todos yet</p>
              <p className="text-sm">
                Start your meeting and todos will appear here automatically as you discuss action items!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((todo, index) => (
                <div
                  key={todo.id}
                  className={`p-3 rounded-lg border transition-all duration-500 ${
                    newTodoIds.has(todo.id)
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 shadow-sm'
                      : 'bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTodo(index)}
                      className="flex-shrink-0 transition-colors hover:text-blue-500"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    
                    <span
                      className={`flex-1 transition-all ${
                        todo.completed
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {todo.content}
                    </span>
                    
                    {newTodoIds.has(todo.id) && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                    
                    {todo.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(todo.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Listening for meeting updates' : 'Connection lost - retrying...'}
            </div>
            
            {isProcessing && (
              <div className="flex items-center gap-2 text-orange-500">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                AI processing transcripts...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeTodoList;