# Guangda Strategy Demo Server

## Current status
- Express app entry is ready
- GPT-5.4 AI service skeleton is ready
- Prompt builders are ready
- Demo data files are ready
- Core routes and services are scaffolded

## OpenClaw config alignment
- OpenClaw current model endpoint base URL: `https://zxcode.vip/v1`
- Demo model name aligned to: `gpt-5.4`
- Example file: `.env.openclaw.example`
- Note: the current OpenClaw config file exposes the model endpoint and model name, but does not include the usable API key value here, so `MODEL_API_KEY` still needs to be filled with your current key.

## Next steps
1. Run `npm install`
2. Copy `.env.openclaw.example` to `.env`
3. Fill `MODEL_API_KEY`
4. Start with `npm run dev`
5. Test `/health`
6. Test `/api/analyze-demand`
7. Test `/api/match-products`
