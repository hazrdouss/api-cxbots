import { success, fail } from '../../utils/response';

export const PermissionFlags: Record<string, bigint> = {
	CREATE_INSTANT_INVITE: 1n << 0n,
	KICK_MEMBERS: 1n << 1n,
	BAN_MEMBERS: 1n << 2n,
	ADMINISTRATOR: 1n << 3n,
	MANAGE_CHANNELS: 1n << 4n,
	MANAGE_GUILD: 1n << 5n,
	ADD_REACTIONS: 1n << 6n,
	VIEW_AUDIT_LOG: 1n << 7n,
	PRIORITY_SPEAKER: 1n << 8n,
	STREAM: 1n << 9n,
	VIEW_CHANNEL: 1n << 10n,
	SEND_MESSAGES: 1n << 11n,
	SEND_TTS_MESSAGES: 1n << 12n,
	MANAGE_MESSAGES: 1n << 13n,
	EMBED_LINKS: 1n << 14n,
	ATTACH_FILES: 1n << 15n,
	READ_MESSAGE_HISTORY: 1n << 16n,
	MENTION_EVERYONE: 1n << 17n,
	USE_EXTERNAL_EMOJIS: 1n << 18n,
	VIEW_GUILD_INSIGHTS: 1n << 19n,
	CONNECT: 1n << 20n,
	SPEAK: 1n << 21n,
	MUTE_MEMBERS: 1n << 22n,
	DEAFEN_MEMBERS: 1n << 23n,
	MOVE_MEMBERS: 1n << 24n,
	USE_VAD: 1n << 25n,
	CHANGE_NICKNAME: 1n << 26n,
	MANAGE_NICKNAMES: 1n << 27n,
	MANAGE_ROLES: 1n << 28n,
	MANAGE_WEBHOOKS: 1n << 29n,
	MANAGE_GUILD_EXPRESSIONS: 1n << 30n,
	USE_APPLICATION_COMMANDS: 1n << 31n,
	REQUEST_TO_SPEAK: 1n << 32n,
	MANAGE_EVENTS: 1n << 33n,
	MANAGE_THREADS: 1n << 34n,
	CREATE_PUBLIC_THREADS: 1n << 35n,
	CREATE_PRIVATE_THREADS: 1n << 36n,
	USE_EXTERNAL_STICKERS: 1n << 37n,
	SEND_MESSAGES_IN_THREADS: 1n << 38n,
	USE_EMBEDDED_ACTIVITIES: 1n << 39n,
	MODERATE_MEMBERS: 1n << 40n,
	VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n,
	USE_SOUNDBOARD: 1n << 42n,
	CREATE_GUILD_EXPRESSIONS: 1n << 43n,
	CREATE_EVENTS: 1n << 44n,
	USE_EXTERNAL_SOUNDS: 1n << 45n,
	SEND_VOICE_MESSAGES: 1n << 46n,
	SEND_POLLS: 1n << 49n,
	USE_EXTERNAL_APPS: 1n << 50n,
};


function formatPermissionName(perm: string): string {
	return perm
		.split('_')
		.map(word => word.charAt(0) + word.slice(1).toLowerCase())
		.join(' ');
}

export async function checkpermissions(req: Request, env: { DISCORD_TOKEN: string }): Promise<Response> {
	let start_time = new Date().getTime();
	let end_time = 0;
	const DISCORD_TOKEN = `Bot ${env.DISCORD_TOKEN}`;
	const { searchParams } = new URL(req.url);
	const permissionsParam = searchParams.get('permissions');
	const user = searchParams.get('user');
	const server = searchParams.get('server');
	const ignore = searchParams.get('ignore')?.split(',') ?? [];
	const includes = searchParams.get('includes') === 'true';

	if (!permissionsParam) return fail('Missing permissions param', 400);
	if (!user || !server) return fail('Missing user or server param', 400);

	const requestedPerms = permissionsParam.split(',').map(p => p.trim().replace(/\s+/g, '_').toUpperCase());

	const getMemberRes = await fetch(`https://discord.com/api/v10/guilds/${server}/members/${user}`, {
		headers: { Authorization: DISCORD_TOKEN }
	});
	if (!getMemberRes.ok) return fail(await getMemberRes.text(), getMemberRes.status);
	const memberObj = await getMemberRes.json() as { roles: string[] };

	const getRolesRes = await fetch(`https://discord.com/api/v10/guilds/${server}/roles`, {
		headers: { Authorization: DISCORD_TOKEN }
	});
	if (!getRolesRes.ok) return fail(await getRolesRes.text(), getRolesRes.status);
	const rolesObj = await getRolesRes.json() as { id: string, permissions: string }[];

	const totalRoles = rolesObj.length;

	const relevantRoles = rolesObj.filter(role =>
		memberObj.roles.includes(role.id) && !ignore.includes(role.id)
	);

	const indexedRoles = relevantRoles.length;

	const foundPerms: string[] = [];

	for (const role of relevantRoles) {
		const rolePerms = BigInt(role.permissions);
		for (const perm of requestedPerms) {
			const rawFlag = PermissionFlags[perm];
			console.log(rawFlag, perm)
			if (rawFlag === undefined) continue;
			const flag = BigInt(rawFlag);
			if ((rolePerms & flag) === flag && !foundPerms.includes(perm)) {
				foundPerms.push(perm);
				if (includes) {
					end_time = new Date().getTime();
					return success({
						found: true,
						missingPerms: [],
						missingPermsFormatted: "",
						earlyExit: true,
						runtime: (end_time - start_time) / 1000,
						indexedRoles,
						totalRoles
					});
				}
			}
		}
	}

	const missingPerms = requestedPerms.filter(p => !foundPerms.includes(p));
	const missingPermsFormatted = missingPerms.map(formatPermissionName).join(', ');
	const found = missingPerms.length === 0;

	end_time = new Date().getTime();
	return success({
		found,
		missingPerms,
		missingPermsFormatted,
		earlyExit: false,
		runtime: (end_time - start_time) / 1000,
		indexedRoles,
		totalRoles
	});
}
