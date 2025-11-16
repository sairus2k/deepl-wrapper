// Cloudflare Pages Function for health check
export const onRequestGet: PagesFunction = async () => {
	return new Response(
		JSON.stringify({
			status: 'ok',
			message: 'DeepL Wrapper API is running',
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		},
	)
}
