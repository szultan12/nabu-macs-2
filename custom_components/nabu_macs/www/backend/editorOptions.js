/** Loads only the Assist entities used by Nabu MACS. */
export async function getComboboxItems(hass) {
    const satelliteItems = Object.keys(hass?.states || {}).filter(id => id.startsWith("assist_satellite."))
        .map(id => ({ id, name: hass.states[id]?.attributes?.friendly_name || id }));
    let pipelineItems = [], preferred = "";
    try {
        const response = await hass?.callWS?.({ type: "assist_pipeline/pipeline/list" });
        preferred = String(response?.preferred_pipeline || "");
        pipelineItems = (response?.pipelines || []).filter(p => p?.id).map(p => ({ id: String(p.id), name: String(p.name || p.id) }));
    } catch (_) { /* A typed entity field remains usable without pipeline-list permission. */ }
    return { satelliteItems, pipelineItems, preferred };
}
