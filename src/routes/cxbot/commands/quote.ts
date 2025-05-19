import { success, fail } from '../../../utils/response';

export async function quote(req: Request, env: { DISCORD_TOKEN: string }): Promise<Response> {
	const DISCORD_TOKEN = `Bot ${env.DISCORD_TOKEN}`;

	const { searchParams } = new URL(req.url);
	const quote = searchParams.get('quote');
	const avatar = searchParams.get('avatar');
	const name = searchParams.get('name');
	const channel = searchParams.get('channel') || '';
	const message = searchParams.get('message') || '';
	const reply = searchParams.get('reply');

	if (!quote) return fail('Missing quote param', 400);
	if (!avatar) return fail('Missing avatar param', 400);
	if (!name) return fail('Missing name param', 400);
	if (!channel) return fail('Missing channel param', 400);

	const imageURL = `https://deno-cxk.deno.dev/generateQuote?avatar=${encodeURIComponent(avatar)}&quote=${encodeURIComponent(quote)}&author=${encodeURIComponent(name)}`;

	const imageRes = await fetch(imageURL);
	if (!imageRes.ok) return new Response('Failed to fetch generated image', { status: 500 });

	const imageBlob = await imageRes.blob();

	const payload: any = {
		content: message
	};

	if (reply) {
		payload.message_reference = {
			message_id: reply,
			fail_if_not_exists: false
		};
	}

	const formData = new FormData();
	formData.append('payload_json', JSON.stringify(payload));
	formData.append('files[0]', imageBlob, 'quote.png');

	// 📤 Send to Discord
	const discordRes = await fetch(`https://discord.com/api/v10/channels/${channel}/messages`, {
		method: 'POST',
		headers: {
			Authorization: DISCORD_TOKEN
		},
		body: formData
	});

	if (!discordRes.ok) {
		const err = await discordRes.text();
		return new Response(`Discord error: ${err}`, { status: discordRes.status });
	}

	return new Response('Image sent to Discord!', { status: 200 });
}
