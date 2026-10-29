/** Nabu MACS Lovelace custom card entry point. */
const macsVersion = new URL(import.meta.url).searchParams.get("v");
const moduleSuffix = macsVersion ? `?v=${encodeURIComponent(macsVersion)}` : "";
if (macsVersion) {
    window.__NABU_MACS_VERSION__ = macsVersion;
}

// Establish our own version before dependent modules resolve their defaults.
const { MacsCard } = await import(`./backend/MacsCard.js${moduleSuffix}`);
const { MacsCardEditor } = await import(`./backend/MacsCardEditor.js${moduleSuffix}`);

if (!customElements.get("nabu-macs-card")) customElements.define("nabu-macs-card", MacsCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === "nabu-macs-card")) window.customCards.push({
    type: "nabu-macs-card",
    name: "Nabu MACS",
    description: "Nabu MACS – önálló animált karakter",
    preview: true
});

if (!customElements.get("nabu-macs-card-editor-v2")) customElements.define("nabu-macs-card-editor-v2", MacsCardEditor);
