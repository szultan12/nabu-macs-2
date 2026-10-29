import { bounded } from './emotions.js';
// Avoid publishing a device identifier from one developer's Home Assistant.
// Users select their own player in the card editor.
export const DEFAULT_MEDIA_PLAYER='';
export function normalizeMotionConfig(c={}) {
    return { speech_enabled:c.speech_enabled!==false,
        speech_media_player: typeof c.speech_media_player==='string' && /^media_player\.[a-z0-9_]+$/.test(c.speech_media_player) ? c.speech_media_player : DEFAULT_MEDIA_PLAYER,
        speech_style:['auto','normal','excited','grumpy'].includes(c.speech_style)?c.speech_style:'auto',
        speech_speed:bounded(c.speech_speed,1,.4,2), natural_motion_enabled:c.natural_motion_enabled!==false,
        blink_enabled:c.blink_enabled!==false, gaze_enabled:c.gaze_enabled!==false, head_enabled:c.head_enabled!==false,
        blink_interval:bounded(c.blink_interval,5,2,15), gaze_intensity:bounded(c.gaze_intensity,1,0,2),
        head_intensity:bounded(c.head_intensity,1,0,2), animation_speed:bounded(c.animation_speed,1,.25,2),
        animation_fps:[30,60].includes(Number(c.animation_fps))?Number(c.animation_fps):30,
        idle_enabled:c.idle_enabled===true, idle_bored_seconds:bounded(c.idle_bored_seconds,60,5,3600),
        idle_sleepy_seconds:bounded(c.idle_sleepy_seconds,120,10,7200), idle_sleep_seconds:bounded(c.idle_sleep_seconds,180,15,10800),
        diagnostics_enabled:c.diagnostics_enabled===true,
        reduced_motion:c.reduced_motion===true, quality:['low','balanced','high'].includes(c.quality)?c.quality:'balanced' };
}
