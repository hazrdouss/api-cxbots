import { success, fail } from '../../utils/response';

const PermissionFlags: Record<string, number> = {
	CREATE_INSTANT_INVITE: 1 << 0,
	KICK_MEMBERS: 1 << 1,
	BAN_MEMBERS: 1 << 2,
	ADMINISTRATOR: 1 << 3,
	MANAGE_CHANNELS: 1 << 4,
	MANAGE_GUILD: 1 << 5,
	ADD_REACTIONS: 1 << 6,
	VIEW_AUDIT_LOG: 1 << 7,
	PRIORITY_SPEAKER: 1 << 8,
	STREAM: 1 << 9,
	VIEW_CHANNEL: 1 << 10,
	SEND_MESSAGES: 1 << 11,
	SEND_TTS_MESSAGES: 1 << 12,
	MANAGE_MESSAGES: 1 << 13,
	EMBED_LINKS: 1 << 14,
	ATTACH_FILES: 1 << 15,
	READ_MESSAGE_HISTORY: 1 << 16,
	MENTION_EVERYONE: 1 << 17,
	USE_EXTERNAL_EMOJIS: 1 << 18,
	VIEW_GUILD_INSIGHTS: 1 << 19,
	CONNECT: 1 << 20,
	SPEAK: 1 << 21,
	MUTE_MEMBERS: 1 << 22,
	DEAFEN_MEMBERS: 1 << 23,
	MOVE_MEMBERS: 1 << 24,
	USE_VAD: 1 << 25,
	CHANGE_NICKNAME: 1 << 26,
	MANAGE_NICKNAMES: 1 << 27,
	MANAGE_ROLES: 1 << 28,
	MANAGE_WEBHOOKS: 1 << 29,
	MANAGE_EMOJIS_AND_STICKERS: 1 << 30,
	USE_APPLICATION_COMMANDS: 1 << 31,
	REQUEST_TO_SPEAK: 1 << 32,
	MANAGE_EVENTS: 1 << 33,
	MANAGE_THREADS: 1 << 34,
	CREATE_PUBLIC_THREADS: 1 << 35,
	CREATE_PRIVATE_THREADS: 1 << 36,
	USE_EXTERNAL_STICKERS: 1 << 37,
	SEND_MESSAGES_IN_THREADS: 1 << 38,
	USE_EMBEDDED_ACTIVITIES: 1 << 39,
	MODERATE_MEMBERS: 1 << 40,
	VIEW_CREATOR_MONETIZATION_ANALYTICS: 1 << 41,
	USE_SOUNDBOARD: 1 << 42,
	CREATE_GUILD_EXPRESSIONS: 1 << 43,
	USE_EXTERNAL_SOUNDS: 1 << 44,
	SEND_VOICE_MESSAGES: 1 << 45,
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

	const requestedPerms = permissionsParam.split(',').map(p => p.trim().toUpperCase());

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
			const flag = BigInt(PermissionFlags[perm]);
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
