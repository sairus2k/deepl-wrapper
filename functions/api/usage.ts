// Cloudflare Pages Function for fetching API usage information
export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { env } = context

	try {
		const apiKey = env.DEEPL_API_KEY
		if (!apiKey) {
			return new Response(
				JSON.stringify({ error: 'DEEPL_API_KEY not configured' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } },
			)
		}

		// Determine API base URL based on key type
		const isFreeAccount = apiKey.endsWith(':fx')
		const baseUrl = isFreeAccount
			? 'https://api-free.deepl.com/v2'
			: 'https://api.deepl.com/v2'

		const response = await fetch(`${baseUrl}/usage`, {
			headers: {
				Authorization: `DeepL-Auth-Key ${apiKey}`,
			},
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error('DeepL usage error:', errorText)
			return new Response(
				JSON.stringify({
					error: 'Failed to fetch usage information',
					message: errorText,
				}),
				{ status: response.status, headers: { 'Content-Type': 'application/json' } },
			)
		}

		const usageData = (await response.json()) as {
			character_count?: number
			character_limit?: number
			document_count?: number
			document_limit?: number
		}

		return new Response(
			JSON.stringify({
				characterCount: usageData.character_count || 0,
				characterLimit: usageData.character_limit || 0,
				documentCount: usageData.document_count || 0,
				documentLimit: usageData.document_limit || 0,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error: unknown) {
		console.error('Error fetching usage:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'

		return new Response(
			JSON.stringify({
				error: 'Failed to fetch usage information',
				message: errorMessage,
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		)
	}
}
