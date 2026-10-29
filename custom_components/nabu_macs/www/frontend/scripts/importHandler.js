/**
 * Import Handler
 * -------
 * Single function which appends version to javascript imports
 */


export function importWithVersion(relativePath, baseUrl = import.meta.url) {
	var url = new URL(relativePath, baseUrl);

	// window.__NABU_MACS_VERSION__ is set in the header script of macs.html
	const version = (typeof window !== "undefined" && window.__NABU_MACS_VERSION__) || new URL(baseUrl).searchParams.get("v");
	if (version) {
		url.searchParams.set("v", version);
	}

	return import(url.toString());
}
