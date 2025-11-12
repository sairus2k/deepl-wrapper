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

## Tech Stack

**Frontend:**
- Vite
- React
- TypeScript

**Backend:**
- Hono framework
- DeepL official SDK
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
cp .env.example .env
# Edit .env and add your DEEPL_API_KEY

# Start development server
pnpm dev
```

## How It Works

1. Configure your DeepL API key in environment variables
2. Upload your file (TXT, HTML, or SRT)
3. Select source and target languages
4. Click translate
5. Download the translated file

## License

MIT
