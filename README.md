# DeepL File Translator

I built this little tool because I sometimes need to translate Excel files using DeepL, but their free web interface only accepts Word, PDF, and PowerPoint documents.

It turns out the DeepL Free API actually supports this format (and more), so I whipped up this wrapper to bridge that gap.

## What it does

It's a lightweight web app that lets you use your own DeepL API key to translate files that the official web version rejects.

- **Supported Formats**: TXT, HTML, XLSX, XLIFF, SRT
- **Privacy**: Your API key stays in your browser's local storage. Files are sent to DeepL for translation and immediately discarded—nothing is saved on any server.
- **Usage Tracking**: It shows you exactly how many characters you've used so you can keep an eye on your API limits.

> **Heads up:** DeepL treats every document upload as a minimum of 50,000 characters, even if the file is smaller. Since the free tier gives you 500,000 characters per month, this means you can translate a maximum of 10 documents per month.

## How to use it

1. Grab a free API key from [DeepL's developer portal](https://www.deepl.com/pro-api).
2. Paste it into the app when prompted.
3. Upload your file, pick your languages, and hit translate.

That's it.

## Running it locally

If you want to tweak the code or run it on your own machine, it's a standard React + Vite setup.

```bash
# Clone it
git clone https://github.com/sairus2k/deepl-wrapper.git
cd deepl-wrapper

# Install stuff
pnpm install

# Run it
pnpm dev
```

The frontend will pop up at `http://localhost:5173`.

## Tech details

For the curious, it's built with:
- **React 19** & **TypeScript**
- **Vite** (using Rolldown)
- **Tailwind CSS 4** + **DaisyUI** for styling
- **Cloudflare Pages** for hosting and edge functions

## Deployment

It's designed to run on Cloudflare Pages. Since there's no backend database or env vars, deployment is dead simple.

```bash
pnpm wrangler login
pnpm deploy
```

Or just connect your GitHub repo to Cloudflare Pages and set the build command to `pnpm build` and output directory to `dist`.

## License

MIT. Feel free to fork it or use it whatever you like.
