import 'dotenv/config'
import { serve } from '@hono/node-server'
import * as deepl from 'deepl-node'
import { readFile, unlink, writeFile } from 'fs/promises'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { tmpdir } from 'os'
import { join } from 'path'

const app = new Hono()

// Enable CORS for frontend
app.use('/*', cors())

// Initialize DeepL translator
const getTranslator = () => {
	const authKey = process.env.DEEPL_API_KEY
	if (!authKey) {
		throw new Error('DEEPL_API_KEY environment variable is required')
	}
	return new deepl.Translator(authKey)
}

// Health check endpoint
app.get('/health', (c) => {
	return c.json({ status: 'ok', message: 'DeepL Wrapper API is running' })
})

// Get supported languages
app.get('/languages', async (c) => {
	try {
		const translator = getTranslator()
		const sourceLanguages = await translator.getSourceLanguages()
		const targetLanguages = await translator.getTargetLanguages()

		return c.json({
			source: sourceLanguages.map((lang) => ({
				code: lang.code,
				name: lang.name,
			})),
			target: targetLanguages.map((lang) => ({
				code: lang.code,
				name: lang.name,
			})),
		})
	} catch (error) {
		console.error('Error fetching languages:', error)
		return c.json({ error: 'Failed to fetch supported languages' }, 500)
	}
})

// Translate document endpoint
app.post('/translate', async (c) => {
	let inputPath = ''
	let outputPath = ''

	try {
		const translator = getTranslator()
		const formData = await c.req.formData()

		const file = formData.get('file') as File
		const sourceLang = (formData.get('sourceLang') as string) || null
		const targetLang = formData.get('targetLang') as string

		if (!file) {
			return c.json({ error: 'No file provided' }, 400)
		}

		if (!targetLang) {
			return c.json({ error: 'Target language is required' }, 400)
		}

		// Get file extension from original filename
		const originalName = file.name
		const lastDotIndex = originalName.lastIndexOf('.')
		const extension =
			lastDotIndex > 0 ? originalName.substring(lastDotIndex) : ''

		// Create temp paths with proper extension
		const timestamp = Date.now()
		const random = Math.random().toString(36).substring(7)
		inputPath = join(tmpdir(), `input-${timestamp}-${random}${extension}`)
		outputPath = join(tmpdir(), `output-${timestamp}-${random}${extension}`)

		// Save uploaded file to temp location
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)
		await writeFile(inputPath, buffer)

		// Translate the document using the high-level API
		await translator.translateDocument(
			inputPath,
			outputPath,
			sourceLang as deepl.SourceLanguageCode | null,
			targetLang as deepl.TargetLanguageCode,
		)

		// Read the translated file
		const translatedData = await readFile(outputPath)

		// Determine the output filename
		const baseName =
			lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName
		const outputFilename = `${baseName}_${targetLang}${extension}`

		// Clean up temp files
		await unlink(inputPath).catch(() => {})
		await unlink(outputPath).catch(() => {})

		// Return the translated file
		return new Response(translatedData, {
			status: 200,
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${outputFilename}"`,
			},
		})
	} catch (error: any) {
		console.error('Translation error:', error)

		// Clean up temp files on error
		await unlink(inputPath).catch(() => {})
		await unlink(outputPath).catch(() => {})

		return c.json(
			{
				error: 'Translation failed',
				message: error.message || 'Unknown error',
			},
			500,
		)
	}
})

// Get usage information
app.get('/usage', async (c) => {
	try {
		const translator = getTranslator()
		const usage = await translator.getUsage()

		return c.json({
			characterCount: usage.character?.count || 0,
			characterLimit: usage.character?.limit || 0,
			documentCount: usage.document?.count || 0,
			documentLimit: usage.document?.limit || 0,
		})
	} catch (error) {
		console.error('Error fetching usage:', error)
		return c.json({ error: 'Failed to fetch usage information' }, 500)
	}
})

const port = Number(process.env.PORT) || 3001

console.log(`Starting DeepL API server on port ${port}...`)

serve({
	fetch: app.fetch,
	port,
})

console.log(`✓ Server is running at http://localhost:${port}`)
