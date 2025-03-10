/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { startSync } from './api'

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return new Response('vec task plugin')
	},

	async scheduled(event, env, ctx) {
		console.log('scheduled')
    ctx.waitUntil(
			startSync({
				...env
			})
		);
  }
} satisfies ExportedHandler<Env>
