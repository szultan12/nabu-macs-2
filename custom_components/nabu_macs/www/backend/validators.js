import { DEFAULTS, VERSION, rootUrl } from "../shared/constants.js";

export function safeUrl(baseUrl) { return new URL(baseUrl || DEFAULTS.url, window.location.origin); }
export function getTargetOrigin(url) { try { return new URL(url).origin; } catch (_) { return window.location.origin; } }
export function getValidUrl(path, params = null) {
    const url=new URL(path,rootUrl), search=new URLSearchParams();
    if(VERSION&&VERSION!=="Unknown")search.set("v",VERSION);
    const extra=params instanceof URLSearchParams?params:typeof params==="string"?new URLSearchParams(params.replace(/^\?/,"")):params&&typeof params==="object"?new URLSearchParams(Object.entries(params).filter(([,v])=>v!==null&&v!==undefined).map(([k,v])=>[k,String(v)])):new URLSearchParams();
    extra.forEach((v,k)=>search.set(k,v)); if(search.size)url.search=search.toString(); return url.toString();
}
export function normMood(value) { return (typeof value==="string"?value:"idle").trim().toLowerCase()||"idle"; }
export function assistStateToMood(state) {
    const s=(state||"").toString().trim().toLowerCase();
    if(s==="listening")return "listening"; if(["thinking","processing","responding","speaking"].includes(s))return "thinking"; return "idle";
}
