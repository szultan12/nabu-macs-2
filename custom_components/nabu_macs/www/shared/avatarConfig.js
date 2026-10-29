import { bounded } from './emotions.js';
export function normalizeAvatarConfig(c={}) {
    return { light_intensity:bounded(c.light_intensity,1,.2,3) };
}
