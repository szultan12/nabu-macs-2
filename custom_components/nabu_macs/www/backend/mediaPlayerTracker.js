import { normalizeMotionConfig } from '../shared/motionConfig.js';
// Reads only a selected snapshot. No polling, HA subscription or service call.
export function mediaPlayerSnapshot(hass,config={}) {
    const c=normalizeMotionConfig(config), entity=hass?.states?.[c.speech_media_player];
    const state=typeof entity?.state==='string'?entity.state:'unavailable';
    return { playing:c.speech_enabled && state==='playing', media_state:state, media_entity:c.speech_media_player };
}
