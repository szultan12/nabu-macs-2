// Explicit read-only mappings for user-renamed Entity Registry IDs.
const entityId = /^(select|switch)\.[a-z0-9_]+$/;
export function validateEntityConfig(config) {
    if (config.entity !== undefined && (typeof config.entity !== 'string' || !/^select\.[a-z0-9_]+$/.test(config.entity))) {
        throw new Error('Nabu MACS: entity must be a select entity ID');
    }
    const overrides = config.entity_overrides;
    if (overrides === undefined) return;
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('Nabu MACS: invalid entity_overrides');
    for (const [key, value] of Object.entries(overrides)) {
        if (!entityId.test(key) || !key.split('.')[1].startsWith('nabu_macs_') || typeof value !== 'string' || !entityId.test(value) || key.split('.')[0] !== value.split('.')[0]) {
            throw new Error('Nabu MACS: invalid entity override');
        }
    }
}

export function resolveEntityId(config, fallback) {
    if (fallback === 'select.nabu_macs_mood' && config?.entity) return config.entity;
    return config?.entity_overrides?.[fallback] || fallback;
}
