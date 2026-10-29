import { EMOTIONS, CHANNELS, normalizeMood, normalizeEmotionConfig } from '../../shared/emotions.js';
export function mixEmotion(mood, config = {}) {
    const c = normalizeEmotionConfig(config);
    const entries = Object.entries(c.emotion_mix);
    if (!entries.length) entries.push([normalizeMood(mood),1]);
    const sum = entries.reduce((n,[,w]) => n+w,0);
    const intensity = c.emotion_intensity/100;
    return Object.fromEntries(CHANNELS.map(key => {
        const target = entries.reduce((n,[id,w]) => n + EMOTIONS[id][key]*w/sum,0);
        return [key, EMOTIONS.idle[key] + (target-EMOTIONS.idle[key])*intensity];
    }));
}
export function interpolatePose(from,to,progress) {
    const t = Math.max(0,Math.min(1,progress));
    const ease = t*t*(3-2*t);
    return Object.fromEntries(CHANNELS.map(key => [key, from[key]+(to[key]-from[key])*ease]));
}
export function expressionAt(pose, seconds) {
    const p = { ...pose }, phase = seconds*pose.speed*2, wave = Math.sin(phase), energy = pose.energy;
    p.eyeL = Math.max(.025,pose.eyeL + wave*energy*.07);
    p.eyeR = Math.max(.025,pose.eyeR + Math.sin(phase+.8)*energy*.06);
    p.browY += Math.sin(phase+.4)*energy*4;
    p.curve += Math.sin(phase+.9)*energy*5;
    p.open = Math.max(0,pose.open + wave*energy*4);
    p.tilt += wave*energy*3;
    p.gazeX += Math.sin(phase*.6)*energy*7;
    p.gazeY += Math.cos(phase*.7)*energy*4;
    return p;
}
export function mouthPath(p) {
    const x = 300-p.width/2, right = 300+p.width/2, y=385;
    return `M ${x} ${y-p.asym/2} Q 300 ${y+p.curve-p.open/2} ${right} ${y+p.asym/2} Q 300 ${y+p.curve+p.open} ${x} ${y-p.asym/2} Z`;
}
