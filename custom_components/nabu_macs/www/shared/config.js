// Shared by the card, pipeline and iframe. Invalid values retain the legacy default.
export function normalizeMaxTurns(value) {
    if ((typeof value !== 'number' && typeof value !== 'string') || value === '') return 2;
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return 2;
    return Math.min(50, Math.max(1, Math.floor(number)));
}
