# AI Meeting Copilot

An intelligent AI-powered meeting assistant that enhances your Zoom meetings with real-time transcription, screenshot analysis, document processing, and post-meeting follow-up capabilities.

![AI Meeting Copilot Interface](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=AI+Meeting+Copilot)

## Features

🤖 **AI-Powered Meeting Preparation**
- Intelligent meeting setup with AI assistant
- Document upload and processing with RAG pipeline
- Todo extraction and management
- Meeting context analysis

📝 **Real-Time Transcription**
- Live meeting transcription via WebSocket
- Automatic transcript processing and analysis
- Context-aware AI responses

📸 **Smart Screenshot Analysis**
- One-click screenshot capture during meetings
- OCR text extraction using OpenRouter/Gemini Vision
- Automatic content analysis and markdown formatting

📊 **Post-Meeting Intelligence**
- Comprehensive meeting summaries
- Action item extraction
- Follow-up task generation
- Meeting analytics and insights

🔧 **Advanced Integration**
- Zoom Meeting SDK integration
- OpenRouter LLM integration
- LangChain RAG pipeline
- Real-time media streaming (RTMS)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shixin-guo/meeting-copliot.git
   cd meeting-copliot
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd server
   npm install
   cd ..
   ```

## Configuration

### Frontend Environment Variables

Create a `.env` file in the root directory:

```env
VITE_ZOOM_MEETING_SDK_KEY=your_zoom_meeting_sdk_key
VITE_ZOOM_MEETING_SDK_SECRET=your_zoom_meeting_sdk_secret
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3000
ZOOM_SECRET_TOKEN=your_zoom_secret_token
ZM_CLIENT_ID=your_zoom_client_id
ZM_CLIENT_SECRET=your_zoom_client_secret
WEBHOOK_PATH=/webhook
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Required API Keys

| Service | Purpose | How to Get |
|---------|---------|------------|
| Zoom Meeting SDK | Meeting integration | [Zoom Marketplace](https://marketplace.zoom.us/) |
| OpenRouter | AI/LLM services | [OpenRouter](https://openrouter.ai/) |
| Zoom RTMS | Real-time media streaming | [Zoom Developer Portal](https://developers.zoom.us/) |

## Usage

### Development Mode

1. Start the backend server:
   ```bash
   cd server
   npm start
   ```

2. In a new terminal, start the frontend:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Using the AI Meeting Copilot

1. **Meeting Preparation**
   - Click "AI Copilot Meeting Prep" to open the preparation dialog
   - Upload relevant documents for context
   - Set meeting objectives and preferences
   - Paste your Zoom meeting link

2. **During the Meeting**
   - Take screenshots for later analysis
   - Monitor live transcription
   - Create and manage todos
   - Ask AI questions about meeting content

3. **Post-Meeting**
   - Review generated meeting summary
   - Export action items and follow-ups
   - Access OCR results from screenshots
   - Generate meeting reports

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Meeting SDK**: Zoom Meeting SDK for web
- **State Management**: React hooks
- **Real-time Communication**: WebSocket for live transcription

### Backend (Node.js + Express)
- **Server**: Express.js with WebSocket support
- **AI Integration**: OpenRouter for LLM services
- **Document Processing**: LangChain RAG pipeline
- **Media Processing**: Zoom RTMS for real-time streams
- **File Support**: PDF, DOCX, TXT, MD document loaders

### Key Components

```
├── src/
│   ├── App.tsx                 # Main application component
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── PostMeetingFollowUp.tsx
│   │   └── animate-ui/         # Animated UI elements
│   └── lib/
│       └── utils.ts            # Utility functions
├── server/
│   ├── index.js                # Main server & RTMS handler
│   ├── ragPipeline.js          # RAG logic & document processing
│   ├── chatWithOpenrouter.js   # LLM integration
│   └── loaders/                # Document loaders
└── public/                     # Static assets
```

## API Endpoints

The backend server provides several API endpoints:

### Meeting & Transcription
- `POST /webhook` - Zoom RTMS webhook handler
- `WebSocket /ws` - Real-time transcript streaming

### AI & Analysis
- `POST /api/ask-kb` - Query knowledge base with meeting context
- `POST /api/llm-direct` - Direct LLM chat interface
- `POST /api/extract-todos` - Extract todos from text using AI

### Media & Screenshots
- `GET /api/latest-image` - Get the most recent screenshot
- Static files served from `/recordings` directory

## Development

### Code Style
- **Linting**: Biome for code formatting and linting
- **Git Hooks**: Lefthook for pre-commit checks
- **TypeScript**: Strict type checking enabled

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linter
npm run format       # Format code
npm run preview      # Preview production build

# Backend
cd server
npm start            # Start backend server
```

## Deployment

### Production Build

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Configure environment variables for production

3. Deploy both frontend (`dist/`) and backend (`server/`) to your hosting platform

### Docker Deployment (Optional)

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000 5173
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Troubleshooting

### Common Issues

**Meeting SDK not loading**
- Verify your Zoom Meeting SDK credentials
- Check that environment variables are properly set
- Ensure you're using HTTPS in production

**Transcription not working**
- Check WebSocket connection to backend
- Verify Zoom RTMS configuration
- Ensure webhook URL is accessible

**AI features not responding**
- Verify OpenRouter API key is valid
- Check network connectivity
- Review server logs for errors

**Screenshot OCR failing**
- Ensure OpenRouter API has vision model access
- Check image format and size limits
- Verify API rate limits

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- [Zoom Meeting SDK](https://developers.zoom.us/docs/meeting-sdk/) for meeting integration
- [OpenRouter](https://openrouter.ai/) for AI/LLM services
- [LangChain](https://langchain.com/) for RAG pipeline
- [Radix UI](https://radix-ui.com/) for accessible UI components

## Support

For support and questions:
- Create an issue in this repository
- Check the [documentation](https://github.com/shixin-guo/meeting-copliot/wiki)
- Review existing issues and discussions

---

**Built with ❤️ for better meetings**
