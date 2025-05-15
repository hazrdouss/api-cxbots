import { success, fail } from '../../../utils/response';

interface QueryParams {
	quote: string;
	avatar: string;
	name: string;
	channel: string;
	message?: string;
	reply?: string;
}

function cloudinaryEncodeURIComponent(text: string): string {
	return encodeURIComponent(text).replace(/%2[CF5]/g, (match) => '%25' + match.slice(1));
}

function base64urlEncode(input: string): string {
	const base64 = btoa(input);
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function quote(req: Request, env: { DISCORD_TOKEN: string }): Promise<Response> {
	const DISCORD_TOKEN = `Bot ${env.DISCORD_TOKEN}`;

	const { searchParams } = new URL(req.url);
	const quote = searchParams.get('quote');
	const avatar = searchParams.get('avatar');
	const name = searchParams.get('name');
	const channel = searchParams.get('channel') || '';
	const message = searchParams.get('message') || `Check out this quote from @${name}`;
	const reply = searchParams.get('reply'); // <- new param

	if (!quote) return fail('Missing quote param', 400);
	if (!avatar) return fail('Missing avatar param', 400);
	if (!name) return fail('Missing name param', 400);
	if (!channel) return fail('Missing channel param', 400);

	const wordCount = quote.trim().replace(/\s+/gm, '').length;
	const maxLength = 300;
	const baseFontSize = 38;
	const fontSize = wordCount <= maxLength ? baseFontSize : baseFontSize * (maxLength / wordCount);

	const IMAGE_URL = `https://res.cloudinary.com/dxzo7bdht/image/upload/
b_black/
w_1024,h_512/
l_fetch:${base64urlEncode(avatar)}/h_512/e_gradient_fade:50,x_-0.5,y_0/e_grayscale/
fl_layer_apply,g_north_west,x_0,y_0/
l_text:Verdana_${fontSize}_center:${cloudinaryEncodeURIComponent(quote)},co_white,w_550,c_fit/
fl_layer_apply,g_center,x_175/
l_text:Verdana_25_center_italic:${cloudinaryEncodeURIComponent(`@${name}`)},co_gray/
fl_layer_apply,g_south_east,y_35,x_35/
empty`;

	const imageRes = await fetch(IMAGE_URL);
	if (!imageRes.ok) return new Response('Failed to fetch image', { status: 500 });

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
	formData.append('files[0]', imageBlob, 'image.png');

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
