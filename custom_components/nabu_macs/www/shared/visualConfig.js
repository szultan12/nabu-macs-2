const number = (value, fallback, min, max) => {
    if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};

// The 3D Nabu character is the sole avatar. Only its size and visible glow are configurable.
export const VISUAL_KEYS = Object.freeze(['glow', 'character_size']);
export function normalizeVisualConfig(config = {}) {
    config = config && typeof config === 'object' ? config : {};
    return { glow: number(config.glow, 70, 0, 100), character_size: number(config.character_size, 100, 60, 120) };
}
