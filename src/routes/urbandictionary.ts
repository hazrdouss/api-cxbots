import { HTMLDivElement, parseHTML } from 'linkedom';
import { success, fail } from "../utils/response";

interface DefinitionEntry {
	word: string;
	definition?: string;
	example?: string;
	author?: string;
	date?: string;
}

async function parseDefinitionData(el: HTMLDivElement): Promise<DefinitionEntry> {
	const getText = (selector: string) => el.querySelector(selector)?.textContent.trim();
	const dateMatch = el.querySelector('.contributor')?.textContent.trim().match(/\w+ \d+, \d+/g);
	return {
		word: getText('.word'),
		definition: getText('.meaning'),
		example: getText('.example'),
		author: getText('.contributor a'),
		date: dateMatch?.[0]
	};
}

export async function define(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const term = url.searchParams.get('term');
	const pages = parseInt(url.searchParams.get('pages') || '1', 10);
	const limit = url.searchParams.has('limit')
		? parseInt(url.searchParams.get('limit')!, 10)
		: Infinity;

	if (!term) return fail("'term' query param is required", 400);
	if (limit <= 0) return fail("'limit' must be greater than 0", 400);

	try {
		// Grab the first page to determine how many pages exist
		const firstRes = await fetch(`https://www.urbandictionary.com/define.php?term=${encodeURIComponent(term)}`);
		const { document: firstDoc } = parseHTML(await firstRes.text());

		const maxPages = Math.max(1, firstDoc.querySelectorAll('[aria-label="Pagination"] li').length - 2);
		const pageLimit = Math.min(pages, maxPages);

		const entries: DefinitionEntry[] = [];

		for (let i = 0; i < pageLimit; i++) {
			const res = await fetch(`https://www.urbandictionary.com/define.php?term=${encodeURIComponent(term)}&page=${i + 1}`);
			const { document } = parseHTML(await res.text());

			const defs = await Promise.all(
				Array.from(document.querySelectorAll('.definition')).map(el =>
					parseDefinitionData(el as HTMLDivElement)
				)
			);

			entries.push(...defs.filter(d => d.definition));

			if (entries.length >= limit) {
				entries.length = limit; // cut off extras
				break;
			}
		}

		if (!entries.length) return fail(`No definitions found for "${term}"`, 404);

		return success({ term, definitions: entries });
	} catch (err) {
		return fail('Error scraping definitions', 500);
	}
}

export async function random(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const limit = url.searchParams.has('limit')
		? parseInt(url.searchParams.get('limit')!, 10)
		: Infinity;

	if (limit <= 0) return fail("'limit' must be greater than 0", 400);

	try {
		const entries: DefinitionEntry[] = [];

		const res = await fetch(`https://www.urbandictionary.com/random.php`);
		const { document } = parseHTML(await res.text());

		const rawDefs = await Promise.all(
			Array.from(document.querySelectorAll(".definition")).map(definition =>
				parseDefinitionData(definition as HTMLDivElement)
			)
		);

		entries.push(...rawDefs.filter(d => d.definition));

		return success({ definitions: entries.slice(0, limit) });
	} catch (err) {
		return fail('Error scraping random definitions', 500);
	}
}
