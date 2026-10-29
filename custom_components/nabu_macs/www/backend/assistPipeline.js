/** Assist debug history with lifecycle-scoped subscriptions and serialized reads. */
import { CONVERSATION_ENTITY_ID } from '../shared/constants.js';
import { normalizeMaxTurns } from '../shared/config.js';
import { createDebugger } from '../shared/debugger.js';
const debug = createDebugger(import.meta.url);

function unsubscribe(fn) {
    if (typeof fn !== 'function') return;
    try { Promise.resolve(fn()).catch(() => {}); } catch (_) {}
}

export class AssistPipelineTracker {
    constructor({ onTurns } = {}) {
        this._onTurns = typeof onTurns === 'function' ? onTurns : null;
        this._hass = null;
        this._enabled = false;
        this._pipelineId = '';
        this._maxTurns = 2;
        this._turns = [];
        this._disposed = false;
        this._generation = 0;
        this._subToken = 0;
        this._unsubStateChanged = null;
        this._fetchDebounce = null;
        this._retryTimer = null;
        this._fetching = null;
        this._fetchAgain = false;
    }

    _invalidateReads() {
        this._generation++;
        clearTimeout(this._fetchDebounce);
        clearTimeout(this._retryTimer);
        this._fetchDebounce = this._retryTimer = null;
        this._fetching = null;
        this._fetchAgain = false;
    }

    _stopSubscription() {
        this._subToken++;
        unsubscribe(this._unsubStateChanged);
        this._unsubStateChanged = null;
    }

    setHass(hass) {
        if (this._disposed) return;
        const connectionChanged = this._hass?.connection !== hass?.connection;
        if (connectionChanged) {
            this._stopSubscription();
            this._invalidateReads();
        }
        this._hass = hass || null;
        this.ensureSubscriptions();
        if (connectionChanged) this.triggerFetchNewest();
    }

    setConfig(config) {
        if (this._disposed) return;
        const enabled = !!config?.assist_pipeline_enabled;
        const pid = enabled ? String(config?.assist_pipeline_entity || '').trim() : '';
        const changed = enabled !== this._enabled || pid !== this._pipelineId;
        const maxTurns = normalizeMaxTurns(config?.max_turns);
        const limitChanged = maxTurns !== this._maxTurns;
        if (changed) {
            this._stopSubscription();
            this._invalidateReads();
        }
        this._enabled = enabled;
        this._pipelineId = pid;
        this._maxTurns = maxTurns;
        if (changed) this.clearTurns();
        else if (limitChanged) {
            this._turns = this._turns.slice(0, maxTurns);
            this._notify();
        }
        this.ensureSubscriptions();
        if (changed) this.triggerFetchNewest();
    }

    getTurns() { return this._turns.slice(); }
    pipelineEnabled() { return !this._disposed && this._enabled && !!this._pipelineId; }
    _notify() { if (this._onTurns) this._onTurns(this.getTurns()); }
    clearTurns() { this._turns = []; this._notify(); }

    dispose() {
        this._disposed = true;
        this._stopSubscription();
        this._invalidateReads();
        this._hass = null;
        this._enabled = false;
        this._pipelineId = '';
        this.clearTurns();
    }

    upsertTurn(turn) {
        const index = this._turns.findIndex(t => t.runId === turn.runId);
        if (index >= 0) this._turns[index] = { ...this._turns[index], ...turn };
        else this._turns.unshift(turn);
        this._turns = this._turns.slice(0, this._maxTurns);
    }

    extract(events) {

        // Pull just the pieces we render from pipeline debug events
        let heard = "", reply = "", error = "", ts = "";
        for (const ev of (events || [])) {
            if (!ts && ev.timestamp) ts = ev.timestamp;

            if (!heard && ev.type === "intent-start") heard = ev.data?.intent_input || "";
            if (ev.type === "stt-end") heard = ev.data?.stt_output?.text || heard;

            if (ev.type === "intent-end") reply = ev.data?.intent_output?.response?.speech?.plain?.speech || reply;

            if (ev.type === "error") error = `${ev.data?.code || "error"}: ${ev.data?.message || ""}`.trim();
        }
        return { heard, reply, error, ts };
    }


    triggerFetchNewest() {
        if (!this._hass || !this.pipelineEnabled() || this._fetchDebounce !== null) return;
        this._fetchDebounce = setTimeout(() => {
            this._fetchDebounce = null;
            this.fetchNewest().catch(() => {});
        }, 160);
    }

    async fetchNewest() {
        if (!this._hass || !this.pipelineEnabled()) return;
        if (this._fetching !== null) { this._fetchAgain = true; return; }
        const generation = this._generation;
        const hass = this._hass;
        const pid = this._pipelineId;
        const valid = () => this.pipelineEnabled() && generation === this._generation;
        this._fetching = generation;
        clearTimeout(this._retryTimer);
        this._retryTimer = null;
        try {
            const listed = await hass.callWS({ type: 'assist_pipeline/pipeline_debug/list', pipeline_id: pid });
            if (!valid()) return;
            const runs = listed?.pipeline_runs;
            const newest = Array.isArray(runs) ? runs[runs.length - 1] : null;
            if (!newest?.pipeline_run_id) return;
            const runId = newest.pipeline_run_id;
            // Serialize snapshots: an older slow reply cannot overwrite a newer one.
            const read = async (attempt) => {
                if (!valid()) return;
                try {
                    const got = await hass.callWS({ type: 'assist_pipeline/pipeline_debug/get', pipeline_id: pid, pipeline_run_id: runId });
                    if (!valid()) return;
                    if (Array.isArray(got?.events)) {
                        const parsed = { ...this.extract(got.events), runId };
                        if (!parsed.ts) parsed.ts = newest.timestamp || '';
                        if (parsed.heard || parsed.reply || parsed.error) {
                            this.upsertTurn(parsed);
                            this._notify();
                        }
                    }
                } catch (_) {
                    if (valid()) debug('warn', 'Assist debug run read failed; a later attempt may retry.');
                    // A failed read must not mark a run as permanently seen.
                }
                if (!valid()) return;
                if (attempt < 2) {
                    this._retryTimer = setTimeout(() => {
                        this._retryTimer = null;
                        read(attempt + 1).catch(() => this._finishFetch(generation));
                    }, [250, 700][attempt]);
                } else this._finishFetch(generation);
            };
            await read(0);
        } catch (_) {
            if (valid()) debug('warn', 'Assist debug list unavailable; check connection and permissions.');
            this._finishFetch(generation);
        } finally {
            if (valid() && this._retryTimer === null) this._finishFetch(generation);
        }
    }

    _finishFetch(generation) {
        if (generation !== this._generation) return;
        this._fetching = null;
        if (this._fetchAgain) {
            this._fetchAgain = false;
            this.triggerFetchNewest();
        }
    }

    ensureSubscriptions() {
        if (!this._hass?.connection || !this.pipelineEnabled() || this._unsubStateChanged) return;
        const token = ++this._subToken;
        const connection = this._hass.connection;
        this._unsubStateChanged = 'pending';
        Promise.resolve().then(() => {
            if (token !== this._subToken || !this.pipelineEnabled()) return null;
            return connection.subscribeEvents(ev => {
                if (token !== this._subToken || !this.pipelineEnabled()) return;
                if (ev?.data?.entity_id === CONVERSATION_ENTITY_ID) this.triggerFetchNewest();
            }, 'state_changed');
        }).then(unsub => {
            if (typeof unsub !== 'function') return;
            if (token !== this._subToken || !this.pipelineEnabled()) unsubscribe(unsub);
            else this._unsubStateChanged = unsub;
        }).catch(() => {
            if (token === this._subToken) this._unsubStateChanged = null;
        });
    }
}
