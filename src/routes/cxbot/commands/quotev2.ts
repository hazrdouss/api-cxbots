import { ImageResponse, loadGoogleFont } from 'workers-og';
import { success, fail } from '../../../utils/response';

export async function quotev2(req: Request, env: { DISCORD_TOKEN: string }): Promise<Response> {
	const DISCORD_TOKEN = `Bot ${env.DISCORD_TOKEN}`;
	const { searchParams } = new URL(req.url);

	const quote = searchParams.get('quote');
	const avatar = searchParams.get('avatar');
	const author = searchParams.get('author') || searchParams.get('name');
	const channel = searchParams.get('channel') || '';
	const message = searchParams.get('message') || '';
	const reply = searchParams.get('reply');

	if (!quote) return fail('Missing quote param', 400);
	if (!avatar) return fail('Missing avatar param', 400);
	if (!author) return fail('Missing author param', 400);
	if (!channel) return fail('Missing channel param', 400);

	const wordCount = quote.trim().replace(/\s+/gm, '').length;
	const maxLength = 300;
	const baseFontSize = 38;
	const fontSize = wordCount <= maxLength ? baseFontSize : baseFontSize * (maxLength / wordCount);

	const notoSans = await loadGoogleFont({
		family: 'Noto Sans',
		weight: 400,
	});
	const notoEmoji = await loadGoogleFont({
		family: 'Noto Emoji',
		weight: 700,
	});

	const html = `
    <div style="position: relative; width: 1024px; height: 512px; display: flex; background: black; font-family: 'Noto Sans', 'Emoji', 'monospace';">
      <img src="${avatar}" width="512" height="512" style="object-fit: cover; filter: grayscale(100%);" />
      <div style="
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 45%);
        display: flex;
      "></div>
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: 30px;
        width: 550px;
      ">
        <p style="
          display: flex;
          gap: 5ch;
          font-size: ${fontSize}px;
          color: white;
          text-align: center;
        ">${quote.replace(/<a?:.+:\d+>/g, '')}</p>
        <span style="
          color: #555555;
          font-size: 22px;
          font-style: italic;
        ">@${author}</span>
      </div>
    </div>
  `;

	const imageResponse = new ImageResponse(html, {
		width: 1024,
		height: 512,
		fonts: [
			{
				name: 'Noto Sans',
				data: notoSans,
				weight: 400,
				style: 'normal',
			},
			{
				name: 'Emoji',
				data: notoEmoji,
				weight: 700,
				style: 'normal',
			},
		],
	});

	const imageBuffer = await imageResponse.arrayBuffer();
	const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

	const payload: any = {
		content: message,
	};
	if (reply) {
		payload.message_reference = {
			message_id: reply,
			fail_if_not_exists: false,
		};
	}

	const formData = new FormData();
	formData.append('payload_json', JSON.stringify(payload));
	formData.append('files[0]', imageBlob, 'quote.png');

	const discordRes = await fetch(`https://discord.com/api/v10/channels/${channel}/messages`, {
		method: 'POST',
		headers: {
			Authorization: DISCORD_TOKEN,
		},
		body: formData,
	});

	if (!discordRes.ok) {
		const err = await discordRes.text();
		return fail(`Discord error: ${err}`, discordRes.status);
	}

	return success('Image sent to Discord!');
}
