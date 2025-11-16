// Type definitions for Cloudflare Pages Functions
/// <reference types="@cloudflare/workers-types" />

type PagesFunction = (
	context: EventContext<unknown, string, unknown>,
) => Response | Promise<Response>
