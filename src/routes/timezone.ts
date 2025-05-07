import timezonesDataRaw from '../data/timezones.json';
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

	const result = timezonesData.find(entry =>
		entry.city.toLowerCase().includes(location.toLowerCase()) ||
		entry.city_ascii.toLowerCase().includes(location.toLowerCase()) ||
		entry.country.toLowerCase().includes(location.toLowerCase()) ||
		entry.province.toLowerCase().includes(location.toLowerCase())
	);
	if (!result) return fail("Timezone not found", 404);

	return success({searchQuery: location, city: result.city, country: result.country, ...getTimeInfo(result.timezone)});
}

export async function getTimezone(req: Request): Promise<Response> {
	const timezone = new URL(req.url).searchParams.get('timezone');
	if (!timezone) return fail("Timezone query param required");
	console.log(timezone)

	const match = timezonesData.find(entry =>
		entry.timezone === timezone
	);

	if (!match) return fail("Timezone not found", 404);

	return success({city: match.city, country: match.country, ...getTimeInfo(match.timezone)});
}
