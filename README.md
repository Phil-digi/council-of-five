# Council of Five

An AI-powered multi-persona discussion panel that provides comprehensive insights on any question through 5 complementary perspectives.

## 🎭 The Five Personas

| Persona | Role | Focus |
|---------|------|-------|
| 🎯 **Strategist** | Vision & Alignment | Long-term thinking, trade-offs, strategic decisions |
| 📊 **Analyst** | Logic & Verification | Assumptions, risks, data-driven insights |
| 💡 **Creative** | Innovation | Alternatives, analogies, novel approaches |
| 🔧 **Pragmatist** | Execution | Step-by-step plans, constraints, practicality |
| ⚖️ **Ethics** | Human Impact | Values, bias, psychological considerations |

## 🎮 Modes

- **Auto**: AI orchestrator decides the optimal number of personas (1-5)
- **Quick**: Single most relevant persona responds
- **Duel**: Two personas engage in a dialogue
- **Council**: All five personas participate

## 🚀 Setup

### 1. Install Dependencies

```bash
cd council-of-five
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

### 3. Start Development Servers

In two terminals:

```bash
# Terminal 1: Start the API server
npm run server

# Terminal 2: Start the frontend
npm run dev
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
council-of-five/
├── src/
│   ├── components/       # React UI components
│   ├── prompts/          # AI prompt definitions
│   │   ├── orchestrator.ts
│   │   └── personas.ts
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Utilities (JSON validation)
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── server/
│   └── index.ts          # Express API server
├── .env.example          # Environment template
└── package.json
```

## 🔧 Configuration

### Changing Models

Edit `OPENAI_MODEL` in `.env`:
```
OPENAI_MODEL=gpt-4o      # More capable
OPENAI_MODEL=gpt-4o-mini # Faster, cheaper
OPENAI_MODEL=gpt-4-turbo # Alternative
```

### Response Format

All API responses follow this JSON schema:

```json
{
  "mode_used": "auto|quick|duel|council",
  "selected_personas": ["Strategist", "Analyst"],
  "conversation": [
    {"persona": "Strategist", "message": "..."},
    {"persona": "Analyst", "message": "..."}
  ],
  "synthesis": {
    "summary": "...",
    "recommendations": ["..."],
    "risks": ["..."],
    "next_steps": ["..."]
  }
}
```

## 🎨 Features

- **Real-time discussion panel** with persona avatars and colors
- **Mode selector** (Auto/Quick/Duel/Council)
- **Show only synthesis** toggle
- **Copy JSON** button for raw response
- **Responsive design** with dark theme

## 📝 License

MIT
