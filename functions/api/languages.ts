// Cloudflare Pages Function for fetching supported languages
export const onRequestGet: PagesFunction = async (context) => {
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

		// Fetch source languages
		const sourceResponse = await fetch(`${baseUrl}/languages?type=source`, {
			headers: {
				Authorization: `DeepL-Auth-Key ${apiKey}`,
			},
		})

		if (!sourceResponse.ok) {
			const errorText = await sourceResponse.text()
			console.error('DeepL source languages error:', errorText)
			return new Response(
				JSON.stringify({
					error: 'Failed to fetch source languages',
					message: errorText,
				}),
				{
					status: sourceResponse.status,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Fetch target languages
		const targetResponse = await fetch(`${baseUrl}/languages?type=target`, {
			headers: {
				Authorization: `DeepL-Auth-Key ${apiKey}`,
			},
		})

		if (!targetResponse.ok) {
			const errorText = await targetResponse.text()
			console.error('DeepL target languages error:', errorText)
			return new Response(
				JSON.stringify({
					error: 'Failed to fetch target languages',
					message: errorText,
				}),
				{
					status: targetResponse.status,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		const sourceLanguages = (await sourceResponse.json()) as Array<{
			language: string
			name: string
		}>
		const targetLanguages = (await targetResponse.json()) as Array<{
			language: string
			name: string
		}>

		return new Response(
			JSON.stringify({
				source: sourceLanguages.map((lang) => ({
					code: lang.language,
					name: lang.name,
				})),
				target: targetLanguages.map((lang) => ({
					code: lang.language,
					name: lang.name,
				})),
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error: unknown) {
		console.error('Error fetching languages:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error'

		return new Response(
			JSON.stringify({
				error: 'Failed to fetch supported languages',
				message: errorMessage,
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		)
	}
}
