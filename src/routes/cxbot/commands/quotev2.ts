import { ImageResponse, loadGoogleFont } from 'workers-og';

export async function quotev2(req: Request): Promise<Response> {
	const { searchParams } = new URL(req.url);
	const quote = searchParams.get('quote') || 'No quote provided';
	const author = searchParams.get('author') || 'Unknown';
	const avatar = searchParams.get('avatar') || '';

	const notoSans = await loadGoogleFont({
		family: 'Noto Sans',
		weight: 400
	});
	const notoEmoji = await loadGoogleFont({
		family: 'Noto Emoji',
		weight: 700
	});

	const baseCharCount = 150;
	const maxFontSize = 42;
	const minFontSize = 22;
	const charCount = quote.length;
	let fontSize = maxFontSize;
	if (charCount > baseCharCount) {
		fontSize = Math.max(
			minFontSize,
			(baseCharCount / charCount) * maxFontSize
		);
	}

	const html = `
	   <div style="position: relative; width: 1024px; height: 512px; display: flex; background: black; font-family: 'Noto Sans', 'Emoji', 'monospace';"">
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
		   		font-size: 18px;
		   		font-style: italic;
		   	">@${author}</span>
		   </div>
	   </div>
	`;

	return new ImageResponse(html, {
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
}
