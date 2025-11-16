# DeepL File Translator

A simple web wrapper for DeepL API that enables translation of file formats not supported in DeepL's free web version.

## The Problem

DeepL's free web version only supports `.doc(x)`, `.pdf`, and `.pptx` files. However, the DeepL API Free tier supports many more formats: `.txt`, `.html`, `.xlsx`, `.xliff`, `.srt`.

## The Solution

A lightweight web application that lets you translate these additional file formats using DeepL API.

## Features

- 📄 **Formats DeepL web doesn't support**: TXT, HTML, XLSX, XLIFF, SRT
- 🔑 **Bring Your Own Key (BYOK)** — Use your own DeepL API key, stored locally in your browser
- 📊 **Usage Statistics** — Track your API character usage with real-time progress visualization
- 🔒 **Privacy-first** — Files are processed and immediately discarded
- ⚡ **Fast & simple** — No registration, no database, no bloat
- ☁️ **Serverless deployment** — Runs on Cloudflare Pages with edge functions
- 💾 **Client-side API key storage** — Your API key never leaves your browser

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite (Rolldown)
- Tailwind CSS 4 + DaisyUI

**Backend:**
- Cloudflare Pages Functions
- DeepL API (REST)
- TypeScript

## Quick Start

```bash
# Clone repository
git clone https://github.com/sairus2k/deepl-wrapper.git
cd deepl-wrapper

# Install dependencies
pnpm install

# Development (runs both Vite + Wrangler with HMR)
pnpm dev
# App will be available at http://localhost:5173
# API functions run on http://localhost:8788
```

When you first open the app, you'll be prompted to enter your DeepL API key. Get your free API key at https://www.deepl.com/pro-api

Your API key is stored in your browser's localStorage and is sent directly to DeepL's API with each request.

## How API Keys Work

This application uses a **Bring Your Own Key (BYOK)** approach:

- When you first visit the app, you'll be prompted to enter your DeepL API key
- Your API key is stored in your browser's localStorage
- The key is sent directly to DeepL's API with each translation request via the `X-DeepL-API-Key` header
- Your API key never leaves your browser or gets stored on any server
- You can change or clear your API key at any time using the UI buttons

## Deployment

### Deploy to Cloudflare Pages

1. Login to Cloudflare:
   ```bash
   pnpm wrangler login
   ```

2. Deploy:
   ```bash
   pnpm deploy
   ```

That's it! No environment variables or secrets required. Users will enter their own API keys when they use the app.

### Alternative: Git Integration

Connect your repository in Cloudflare Dashboard:
- **Build command**: `pnpm build`
- **Build output directory**: `dist`

## How It Works

1. Enter your DeepL API key (stored locally in your browser)
2. Upload your file (TXT, HTML, XLSX, XLIFF, or SRT)
3. Select source and target languages
4. Click translate
5. Download the translated file

Files are processed via DeepL API and immediately discarded — nothing is stored.

The app displays real-time API usage statistics with a visual progress bar that auto-updates after each translation.

## License

MIT
