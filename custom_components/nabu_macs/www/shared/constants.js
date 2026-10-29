const resolveVersion = () => {
    const existing = (window.__NABU_MACS_VERSION__ || "").toString().trim();
    if (existing) return existing;
    try { for (const script of document.scripts || []) { const src=script?.getAttribute?.("src"); if(!src) continue; const url=new URL(src,window.location.origin); if(url.pathname.endsWith("/nabu_macs/macs.js")){ const v=url.searchParams.get("v"); if(v)return v; } } } catch (_) {}
    return "Unknown";
};
export const VERSION = resolveVersion();
const selfUrl = new URL(import.meta.url);
export const rootUrl = new URL("../", selfUrl);
export const htmlUrl = new URL("macs.html", rootUrl); htmlUrl.search = selfUrl.search;
export const DEFAULTS = {
    url: htmlUrl.toString(), assist_pipeline_enabled:false, assist_pipeline_entity:"", assist_pipeline_custom:false,
    assist_satellite_enabled:false, assist_satellite_entity:"", assist_satellite_custom:false, max_turns:2,
    assist_outcome_duration_ms:1000,
};
export const MACS_MESSAGE_EVENT="nabu_macs_message";
export const MOOD_ENTITY_ID="select.nabu_macs_mood";
export const ANIMATIONS_ENTITY_ID="switch.nabu_macs_animations_enabled";
export const CONVERSATION_ENTITY_ID="conversation.home_assistant";
export const CARD_EDITOR_INFO="";
export const CARD_EDITOR_ABOUT=`<div class="group"><p>Nabu MACS 2.0 – animált 3D karakter.</p><p>Az eredeti MACS szerzője Glyn Davidson. A Nabu MACS módosításai az eredeti integrációtól elkülönülnek.</p><p><a href="https://github.com/glyndavidson/MACS" target="_blank" rel="noopener noreferrer">Eredeti projekt</a> · CC BY-NC-SA 4.0</p></div>`;
