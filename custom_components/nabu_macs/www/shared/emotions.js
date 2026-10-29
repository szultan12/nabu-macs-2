// Numeric pose channels shared by the 26 GLB avatar emotion mappings.
const columns = ['eyeL','eyeR','browL','browR','browY','curve','open','width','asym','tilt','energy','speed','gazeX','gazeY','blink','hue'];
const rows = {
 idle: ['Nyugodt',1,1,0,0,0,10,0,100,0,0,.12,.7,0,0,5,0],
 happy: ['Boldog',.8,.8,-8,8,-5,36,18,120,0,-2,.35,1.1,0,-2,4,-20],
 sad: ['Szomorú',.65,.65,-22,22,8,-25,0,95,0,4,.12,.6,0,12,7,18],
 angry: ['Ideges',.5,.5,22,-22,12,-14,3,100,0,-4,.45,1.8,0,0,3,145],
 furious: ['Dühöngő',.35,.4,32,-32,15,-22,22,120,0,0,.9,3.5,0,-3,2,155],
 grumpy: ['Morgós',.45,.55,12,-8,9,-18,2,85,-6,5,.2,.65,-10,8,6,30],
 sassy: ['Flegma',.65,1,-18,-5,-8,17,3,105,20,-10,.4,.9,14,-5,5,55],
 annoyed: ['Bosszús',.55,.6,8,-12,3,-8,0,100,-10,7,.3,1.4,0,-17,3,80],
 confused: ['Zavart',1,.65,-22,12,-2,-6,6,90,15,9,.35,1.2,-8,0,2.5,30],
 curious: ['Kíváncsi',1.1,.9,-14,2,-8,12,5,80,3,-8,.3,.85,12,-8,5,5],
 surprised: ['Meglepett',1.2,1.2,-8,8,-12,0,36,55,0,-3,.5,1.6,0,-6,6,10],
 shocked: ['Sokkolt',1.35,1.35,-12,12,-18,-5,48,65,0,5,.65,2.3,0,-10,8,135],
 scared: ['Ijedt',1.15,1.25,-24,24,-10,-20,24,75,0,-6,.7,2.8,-10,3,2,105],
 embarrassed: ['Zavarban',.65,.8,-5,15,4,8,2,70,12,12,.2,.8,-18,15,3,100],
 love: ['Szerelmes',.6,.6,-10,10,-4,30,6,95,0,-5,.25,.65,0,-2,6,110],
 excited: ['Izgatott',1.1,1.1,-15,15,-10,32,30,125,0,-3,.85,2.5,6,-5,2.5,-15],
 proud: ['Büszke',.8,.8,-8,8,-4,20,3,105,0,-7,.3,.8,0,-10,6,-25],
 suspicious: ['Gyanakvó',.4,.65,10,-18,5,-4,1,80,7,8,.2,.75,-22,0,7,45],
 sleepy: ['Álmos',.3,.35,-4,4,8,0,14,65,0,7,.1,.35,0,12,9,25],
 sleeping: ['Alvó',.03,.03,0,0,9,4,2,60,0,4,.05,.25,0,0,30,30],
 bored: ['Unatkozó',.5,.5,3,-3,7,-2,0,90,-8,3,.15,.5,-8,5,8,15],
 thinking: ['Gondolkodó',.85,.7,-12,6,-4,2,2,70,12,6,.25,1,14,-15,5,35],
 listening: ['Figyelő',1,1,-10,10,-7,8,2,70,0,-5,.2,1.1,0,0,6,0],
 laughing: ['Nevető',.3,.3,-14,14,-5,44,38,140,0,0,.8,2.2,0,-3,3,-20],
 troll: ['Trollkodó',.35,.95,15,-20,-2,30,12,130,24,-12,.65,1.7,18,0,2,80],
 worried: ['Aggódó',.9,.8,-26,22,-5,-22,7,85,-5,6,.25,1.3,-6,8,3.5,35],
};
export const EMOTIONS = Object.freeze(Object.fromEntries(Object.entries(rows).map(([id, [label, ...values]]) => [id, Object.freeze({ label, ...Object.fromEntries(columns.map((key,i) => [key,values[i]])) })])));
export const MOODS = Object.freeze(Object.keys(EMOTIONS));
export const CHANNELS = Object.freeze(columns);
export const normalizeMood = value => typeof value === 'string' && Object.hasOwn(EMOTIONS, value.trim().toLowerCase()) ? value.trim().toLowerCase() : 'idle';
export function bounded(value, fallback, min, max) {
    if (!['number','string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return fallback;
    const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min,n)) : fallback;
}
export function normalizeEmotionConfig(c = {}) {
    const mix = {};
    if (c.emotion_mix && typeof c.emotion_mix === 'object' && !Array.isArray(c.emotion_mix)) {
        for (const id of MOODS) { const w = bounded(c.emotion_mix[id],0,0,100); if(w) mix[id] = w; }
    }
    return { emotion_enabled: c.emotion_enabled !== false, emotion: normalizeMood(c.emotion),
        emotion_intensity: bounded(c.emotion_intensity,100,0,100), emotion_mix: mix,
        transition_ms: bounded(c.transition_ms,450,0,3000) };
}
