export async function proxyImage(req: Request): Promise<Response> {
	const url = new URL(req.url).searchParams.get("url");
	if (!url) return new Response("No URL provided", { status: 400 });

	const image = await fetch(url);
	if (!image.ok) return new Response("Failed to fetch original image", { status: 502 });

	return new Response(image.body, {
		headers: {
			"Content-Type": image.headers.get("Content-Type") || "image/png",
			"Cache-Control": "public, max-age=3600"
		}
	});
}
