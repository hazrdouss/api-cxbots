import router from "./router";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return router.fetch(request, env, ctx)
	},
} satisfies ExportedHandler<Env>;
