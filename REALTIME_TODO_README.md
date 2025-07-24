# Real-time AI Todo List Feature

This feature automatically extracts and displays todo items from meeting transcripts in real-time using OpenRouter AI.

## 🚀 How It Works

1. **Transcript Capture**: Meeting transcripts are captured in real-time via WebSocket
2. **AI Processing**: Every 5 transcript messages or 10 seconds, the system sends accumulated transcripts to OpenRouter
3. **Todo Extraction**: OpenRouter's AI models extract actionable todo items from the conversation
4. **Real-time Updates**: New todos are instantly displayed across all connected clients via WebSocket
5. **Interactive Management**: Users can mark todos as complete, and updates sync in real-time

## 🛠️ Components

### Server Side (`server/index.js`)
- **Transcript Buffer**: Collects incoming transcripts
- **AI Processing**: Sends batched transcripts to OpenRouter for todo extraction
- **WebSocket Broadcasting**: Sends real-time updates to all connected clients
- **Todo Management**: Handles todo completion status updates

### Frontend (`src/components/RealtimeTodoList.tsx`)
- **Real-time Display**: Shows live todo list with animations
- **Status Management**: Handle todo completion with server sync
- **Connection Status**: Shows WebSocket connection status
- **Recent Transcripts**: Displays context of recent conversation

### Demo Component (`src/components/TodoDemo.tsx`)
- **Simulation Tools**: Test the feature with sample transcripts
- **Custom Input**: Send custom transcripts to test AI extraction
- **Live Preview**: See the feature in action without a real meeting

## 🎯 Key Features

### Real-time Processing
- Processes transcripts every 5 messages or 10 seconds
- Avoids duplicate todos using content similarity matching
- Highlights new todos with visual indicators

### AI-Powered Extraction
- Uses OpenRouter's structured JSON output for reliable extraction
- Supports multiple AI models (currently using GPT-4O-mini)
- Contextual understanding of meeting conversations

### User Experience
- Clean, animated interface with modern UI components
- Real-time connection status indicators
- Automatic reconnection on connection loss
- Optimistic updates with server sync

## 📋 API Endpoints

### GET `/api/current-todos`
Returns current todo list

### POST `/api/update-todo`
```json
{
  "todoId": "todo_123",
  "completed": true
}
```

### POST `/api/clear-todos`
Clears all todos

### POST `/api/simulate-transcript` (Demo)
```json
{
  "content": "We need to prepare the presentation slides",
  "user": "John Doe"
}
```

### POST `/api/extract-todos`
```json
{
  "input": "Meeting transcript text to extract todos from"
}
```

## 🎮 Usage

### In the Main App
1. Start a meeting or connect to the WebSocket
2. The real-time todo list appears in the left sidebar
3. Todos automatically appear as the conversation mentions action items
4. Click todos to mark them complete

### Using the Demo
1. Click "Todo Demo" button in the top-right corner
2. Use "Start Sample Conversation" to run automated demo
3. Or type custom transcripts and click "Send Transcript"
4. Watch todos appear in real-time on the right side

## 🔧 Configuration

### Environment Variables
```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Server Configuration
- `TODO_UPDATE_INTERVAL`: How often to check for new todos (default: 10 seconds)
- `TRANSCRIPT_BUFFER_SIZE`: How many transcripts to collect before processing (default: 5)

### Model Configuration
The system uses OpenAI GPT-4O-mini via OpenRouter for structured JSON extraction. You can modify the model in `server/chatWithOpenaiJson.js`.

## 🎨 UI Components

The feature uses shadcn/ui components for consistent styling:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`, `Badge`, `ScrollArea`
- `Textarea` for input fields
- Lucide React icons for visual elements

## 🔄 WebSocket Events

### Client → Server
- Connection establishment
- Todo status updates via HTTP API

### Server → Client
```json
{
  "type": "todos_update",
  "todos": [...],
  "newTodos": [...],
  "updatedTodo": { ... }
}
```

```json
{
  "type": "transcript",
  "content": "transcript text",
  "user": "speaker name",
  "timestamp": 1234567890
}
```

## 🚦 Status Indicators

- **Connected**: Green indicator, actively listening
- **Disconnected**: Red indicator, attempting reconnection
- **Processing**: Orange indicator, AI is analyzing transcripts
- **New Todo**: Green highlight on newly extracted todos

## 📱 Responsive Design

The component is fully responsive and works on:
- Desktop: Full sidebar layout
- Tablet: Stacked layout
- Mobile: Compact view with collapsible sections

## 🧪 Testing

### Manual Testing
1. Use the demo page to send sample transcripts
2. Verify todos are extracted correctly
3. Test completion status updates
4. Check WebSocket reconnection

### Sample Test Transcripts
- "We need to prepare the presentation slides for next week"
- "Someone should follow up with the client about the contract"
- "Don't forget to update the database with new user data"
- "Let's schedule a code review session for Friday"

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Check server is running on correct port (3000)
- Verify no firewall blocking WebSocket connections
- Look for connection status in browser console

### AI Extraction Not Working
- Verify OPENROUTER_API_KEY is set correctly
- Check server logs for API errors
- Test the `/api/extract-todos` endpoint directly

### Todos Not Appearing
- Check transcript buffer size (may need more messages)
- Verify WebSocket messages are being received
- Look for JavaScript errors in browser console

## 🔮 Future Enhancements

- **Priority Detection**: AI could identify todo priority levels
- **Due Date Extraction**: Parse dates mentioned in conversations
- **Assignment Detection**: Identify who todos are assigned to
- **Integration**: Sync with project management tools (Jira, Asana, etc.)
- **Voice Commands**: Add voice control for todo management
- **Smart Notifications**: Alert users about new todos via browser notifications