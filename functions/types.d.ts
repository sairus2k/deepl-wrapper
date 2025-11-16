// Type definitions for Cloudflare Pages Functions
/// <reference types="@cloudflare/workers-types" />

interface Env {
	DEEPL_API_KEY: string
}

type PagesFunction<Env = unknown> = (
	context: EventContext<Env, string, unknown>,
) => Response | Promise<Response>
