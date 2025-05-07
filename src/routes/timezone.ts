import timezonesDataRaw from '../data/timezones.json';
import Fuse from 'fuse.js';
import { success, fail } from '../utils/response';

interface TimezoneEntry {
	city: string;
	city_ascii: string;
	lat: number;
	lng: number;
	pop: number;
	country: string;
	iso2: string;
	iso3: string;
	province: string;
	timezone: string;
}

const timezonesData = timezonesDataRaw as TimezoneEntry[];

const fuse = new Fuse(timezonesData, {
	keys: ['city', 'city_ascii', 'country', 'province'],
	threshold: 0.3,
});

function getTimeInfo(timezone: string) {
	const timeInTimezone = new Date().toLocaleString('en-US', { timeZone: timezone });
	const time = new Date(timeInTimezone);
	const timestamp = time.getTime() / 1000;
	const date = `${time.toLocaleString('default', { month: 'long', day: '2-digit' })}, ${time.toLocaleString('default', { hour: 'numeric', minute: '2-digit' })}`;
	return { timezone, unix_timestamp: timestamp, date };
}

export async function searchTimezone(req: Request): Promise<Response> {
	const location = new URL(req.url).searchParams.get('location');
	if (!location) return fail("Location query param required");

	const result = fuse.search(location);
	if (!result.length) return fail("Timezone not found", 404);

	return success(getTimeInfo(result[0].item.timezone));
}

export async function getTimezone(req: Request): Promise<Response> {
	const timezone = new URL(req.url).searchParams.get('timezone');
	if (!timezone) return fail("Timezone query param required");
	console.log(timezone)

	const match = timezonesData.find(entry =>
		entry.timezone === timezone
	);

	if (!match) return fail("Timezone not found", 404);

	return success(getTimeInfo(match.timezone));
}
