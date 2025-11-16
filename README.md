# DeepL File Translator

A simple web wrapper for DeepL API that enables translation of file formats not supported in DeepL's free web version.

## The Problem

DeepL's free web version only supports `.doc(x)`, `.pdf`, and `.pptx` files. However, the DeepL API Free tier supports many more formats: `.txt`, `.html`, `.xlsx`, `.xliff`, `.srt`.

## The Solution

A lightweight web application that lets you translate these additional file formats using DeepL API.

## Features

- 📄 **Formats DeepL web doesn't support**: TXT, HTML, XLSX, XLIFF, SRT
- 🔑 **Use your own DeepL API key** — No middleman, direct API access
- 🔒 **Privacy-first** — Files are processed and immediately discarded
- ⚡ **Fast & simple** — No registration, no database, no bloat
- ☁️ **Serverless deployment** — Runs on Cloudflare Pages with edge functions

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

Get your free DeepL API key at https://www.deepl.com/pro-api

```bash
# Clone repository
git clone https://github.com/sairus2k/deepl-wrapper.git
cd deepl-wrapper

# Install dependencies
pnpm install

# Configure your DeepL API key
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your DEEPL_API_KEY

# Development (runs both Vite + Wrangler with HMR)
pnpm dev
# App will be available at http://localhost:5173
# API functions run on http://localhost:8788
```

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

3. Add your `DEEPL_API_KEY` in Cloudflare Dashboard:
   - Go to your Pages project → Settings → Environment Variables
   - Add `DEEPL_API_KEY` for both Production and Preview environments

### Alternative: Git Integration

Connect your repository in Cloudflare Dashboard:
- **Build command**: `pnpm install && pnpm build`
- **Build output directory**: `dist`
- **Environment variable**: `DEEPL_API_KEY`

## How It Works

1. Upload your file (TXT, HTML, XLSX, XLIFF, or SRT)
2. Select source and target languages
3. Click translate
4. Download the translated file

Files are processed via DeepL API and immediately discarded — nothing is stored.

## License

MIT
