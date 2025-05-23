import { success, fail } from '../../utils/response';

export async function getGiveawayWinners(req: Request, env: { CXUTIL_TOKEN: string }): Promise<Response> {
	try {
		const DISCORD_TOKEN = `Bot ${env.CXUTIL_TOKEN}`;

		const { searchParams } = new URL(req.url);
		const channelId = searchParams.get('channelId') || '';
		const messageId = searchParams.get('messageId') || '';
		const emoji = searchParams.get('emoji') || '🎉';
		const winners = Number(searchParams.get('winners')) || 0;

		if (!channelId) return fail('Missing channelId param', 400);
		if (!messageId) return fail('Missing messageId param', 400);
		if (isNaN(winners) || winners <= 0) return fail('Invalid winners param', 400);

		const ignoredUserId = '1320329481868673074';

		const users: string[] = [];
		let after: string | null = null;
		const limit = 100;

		while (true) {
			const url = new URL(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
			url.searchParams.set('limit', limit.toString());
			if (after) url.searchParams.set('after', after);

			const res = await fetch(url.toString(), {
				headers: { Authorization: DISCORD_TOKEN }
			});

			if (!res.ok) return fail(`Discord API error: ${res.status}`, res.status);

			const batch: { id: string }[] = await res.json();
			users.push(...batch.map(u => u.id));

			if (batch.length < limit) break;
			after = batch[batch.length - 1].id;
		}

		const filteredUsers = users.filter(id => id !== ignoredUserId);

		if (filteredUsers.length === 0) return success({ winners: "nobody" });

		for (let i = filteredUsers.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[filteredUsers[i], filteredUsers[j]] = [filteredUsers[j], filteredUsers[i]];
		}
		const selectedWinners = filteredUsers.slice(0, winners);

		// Format as mentions
		const mentionList = selectedWinners.map(id => `<@${id}>`).join(', ');

		return success({ winners: mentionList });
	} catch (error: any) {
		return fail(error.message || 'Unexpected error', 500);
	}
}
