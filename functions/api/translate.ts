// Cloudflare Pages Function for document translation
export const onRequestPost: PagesFunction = async (context) => {
	const { request } = context

	try {
		// Get API key from request header
		const apiKey = request.headers.get('X-DeepL-API-Key')
		if (!apiKey) {
			return new Response(
				JSON.stringify({
					error: 'API key not provided',
					message: 'Please provide a DeepL API key',
				}),
				{ status: 401, headers: { 'Content-Type': 'application/json' } },
			)
		}

		// Determine API base URL based on key type
		const isFreeAccount = apiKey.endsWith(':fx')
		const baseUrl = isFreeAccount
			? 'https://api-free.deepl.com/v2'
			: 'https://api.deepl.com/v2'

		// Parse multipart form data
		const formData = await request.formData()
		const file = formData.get('file')
		const sourceLang = formData.get('sourceLang')
		const targetLang = formData.get('targetLang')

		// @ts-expect-error
		if (!file || !(file instanceof File)) {
			return new Response(JSON.stringify({ error: 'No file provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		if (!targetLang || typeof targetLang !== 'string') {
			return new Response(
				JSON.stringify({ error: 'Target language is required' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } },
			)
		}

		const sourceLangStr =
			sourceLang && typeof sourceLang === 'string' ? sourceLang : null

		// Step 1: Upload document to DeepL
		const uploadFormData = new FormData()
		uploadFormData.append('file', file)
		uploadFormData.append('target_lang', targetLang)
		if (sourceLangStr) {
			uploadFormData.append('source_lang', sourceLangStr)
		}

		const uploadResponse = await fetch(`${baseUrl}/document`, {
			method: 'POST',
			headers: {
				Authorization: `DeepL-Auth-Key ${apiKey}`,
			},
			body: uploadFormData,
		})

		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text()
			console.error('DeepL upload error:', errorText)
			return new Response(
				JSON.stringify({
					error: 'Failed to upload document to DeepL',
					message: errorText,
				}),
				{
					status: uploadResponse.status,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		const uploadData = (await uploadResponse.json()) as {
			document_id: string
			document_key: string
		}

		// Step 2: Poll for translation completion
		const maxAttempts = 60 // 60 attempts
		const pollInterval = 1000 // 1 second
		let attempts = 0
		let translationComplete = false

		while (attempts < maxAttempts && !translationComplete) {
			const statusFormData = new FormData()
			statusFormData.append('document_key', uploadData.document_key)

			const statusResponse = await fetch(
				`${baseUrl}/document/${uploadData.document_id}`,
				{
					method: 'POST',
					headers: {
						Authorization: `DeepL-Auth-Key ${apiKey}`,
					},
					body: statusFormData,
				},
			)

			if (!statusResponse.ok) {
				const errorText = await statusResponse.text()
				console.error('DeepL status check error:', errorText)
				return new Response(
					JSON.stringify({
						error: 'Failed to check translation status',
						message: errorText,
					}),
					{
						status: statusResponse.status,
						headers: { 'Content-Type': 'application/json' },
					},
				)
			}

			const statusData = (await statusResponse.json()) as {
				status: string
				seconds_remaining?: number
				billed_characters?: number
			}

			if (statusData.status === 'done') {
				translationComplete = true
				break
			}

			if (statusData.status === 'error') {
				return new Response(
					JSON.stringify({
						error: 'Translation failed',
						message: 'DeepL reported an error during translation',
					}),
					{ status: 500, headers: { 'Content-Type': 'application/json' } },
				)
			}

			// Wait before next poll
			await new Promise((resolve) => setTimeout(resolve, pollInterval))
			attempts++
		}

		if (!translationComplete) {
			return new Response(
				JSON.stringify({
					error: 'Translation timeout',
					message: 'Translation took too long to complete',
				}),
				{ status: 408, headers: { 'Content-Type': 'application/json' } },
			)
		}

		// Step 3: Download translated document
		const downloadFormData = new FormData()
		downloadFormData.append('document_key', uploadData.document_key)

		const downloadResponse = await fetch(
			`${baseUrl}/document/${uploadData.document_id}/result`,
			{
				method: 'POST',
				headers: {
					Authorization: `DeepL-Auth-Key ${apiKey}`,
				},
				body: downloadFormData,
			},
		)

		if (!downloadResponse.ok) {
			const errorText = await downloadResponse.text()
			console.error('DeepL download error:', errorText)
			return new Response(
				JSON.stringify({
					error: 'Failed to download translated document',
					message: errorText,
				}),
				{
					status: downloadResponse.status,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Get the translated file
		const translatedBlob = await downloadResponse.blob()

		// Generate output filename
		const originalName = file.name
		const lastDotIndex = originalName.lastIndexOf('.')
		const extension =
			lastDotIndex > 0 ? originalName.substring(lastDotIndex) : ''
		const baseName =
			lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName
		const outputFilename = `${baseName}_${targetLang}${extension}`

		// Return the translated file
		return new Response(translatedBlob, {
			status: 200,
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${outputFilename}"`,
			},
		})
	} catch (error: unknown) {
		console.error('Translation error:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error'

		return new Response(
			JSON.stringify({
				error: 'Translation failed',
				message: errorMessage,
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		)
	}
}
