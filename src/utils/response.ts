export function success<T>(data: T, status = 200): Response {
	return Response.json({ status: 200, ...data }, { status });
}

export function fail(message: string, status = 400): Response {
	return Response.json({ status: status, message}, { status });
}
