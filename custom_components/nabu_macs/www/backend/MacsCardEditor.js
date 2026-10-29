import { DEFAULTS } from "../shared/constants.js";
import { getComboboxItems } from "./editorOptions.js";
import { normalizeVisualConfig } from "../shared/visualConfig.js";

// Resolve this backend module against this file, not against an import helper
// in frontend/scripts (which may itself be held in an older module cache).
const personalityEditorUrl = new URL("./personalityEditor.js", import.meta.url);
const personalityEditorVersion = window.__NABU_MACS_VERSION__ || personalityEditorUrl.searchParams.get("v");
if (personalityEditorVersion) personalityEditorUrl.searchParams.set("v", personalityEditorVersion);
const { personalityEditorHtml, syncPersonalityEditor, wirePersonalityEditor } = await import(personalityEditorUrl.href);

const editorCssUrl = new URL("editor.css", import.meta.url);
const editorVersion = editorCssUrl.searchParams.get("v") || new URL(import.meta.url).searchParams.get("v");
if (editorVersion) editorCssUrl.searchParams.set("v", editorVersion);

const esc = value => String(value ?? "").replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
const options = (items, selected) => (items || []).map(item => `<option value="${esc(item.id)}" ${String(item.id) === String(selected) ? "selected" : ""}>${esc(item.name)}</option>`).join("");

/** Compact Nabu-only editor. Assist controls and the personality editor are intentionally retained. */
export class MacsCardEditor extends HTMLElement {
    setConfig(config) {
        this._config = { ...DEFAULTS, ...(config || {}) };
        if (this._rendered) this._sync();
        else if (this._renderPromise) void this._renderPromise.then(() => this._sync());
        else this._renderPromise = this._render().finally(() => { this._renderPromise = null; this._sync(); });
    }
    set hass(hass) { this._hass = hass; }

    disconnectedCallback() {
        if (this._speechTestTimer) clearTimeout(this._speechTestTimer);
        this._speechTestTimer = null;
        this._speechTestActive = false;
        if (this._onSpeechTestState) window.removeEventListener("nabu-macs:speech-test-state", this._onSpeechTestState);
        this._speechTestListenerActive = false;
    }

    async _render() {
        if (!this.shadowRoot) this.attachShadow({ mode: "open" });
        const { satelliteItems = [], pipelineItems = [], preferred = "" } = await getComboboxItems(this._hass);
        this.shadowRoot.innerHTML = `<link rel="stylesheet" href="${editorCssUrl}">
          <fieldset><legend>Nabu MACS</legend>
            <label class="assist-row"><ha-switch id="assist_satellite_enabled"></ha-switch><span>React to wake word</span></label>
            <label for="assist_satellite_entity">Assist műhold</label><select id="assist_satellite_entity"><option value="">Válassz…</option>${options(satelliteItems, this._config.assist_satellite_entity)}</select>
            <label class="assist-row"><ha-switch id="assist_pipeline_enabled"></ha-switch><span>Display dialogue</span></label>
            <label for="assist_pipeline_entity">Assist-folyamat</label><select id="assist_pipeline_entity"><option value="">Válassz…</option>${options(pipelineItems, this._config.assist_pipeline_entity || preferred)}</select>
            <label for="nabu-glow">Fényudvar</label><input id="nabu-glow" type="range" min="0" max="100">
            <label for="nabu-character-size">Karakter mérete</label><input id="nabu-character-size" type="range" min="60" max="120">
          </fieldset>${personalityEditorHtml}`;
        this._rendered = true;
        this._wire();
        this._sync();
        if (!this._config.assist_pipeline_entity && preferred) this._change({ assist_pipeline_entity: preferred });
    }

    _change(changes) {
        this._config = { ...this._config, ...changes };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: { ...this._config, type: "custom:nabu-macs-card" } }, bubbles: true, composed: true }));
    }

    _sync() {
        if (!this.shadowRoot) return;
        for (const key of ["assist_satellite_enabled", "assist_pipeline_enabled"]) {
            const el = this.shadowRoot.getElementById(key); if (el) el.checked = !!this._config[key];
        }
        for (const key of ["assist_satellite_entity", "assist_pipeline_entity"]) {
            const el = this.shadowRoot.getElementById(key); if (el) el.value = this._config[key] || "";
        }
        const visual = normalizeVisualConfig(this._config);
        const glow = this.shadowRoot.getElementById("nabu-glow"); if (glow) glow.value = visual.glow;
        const size = this.shadowRoot.getElementById("nabu-character-size"); if (size) size.value = visual.character_size;
        const speechTest = this.shadowRoot.getElementById("nabu-speech-test");
        if (speechTest) speechTest.disabled = this._config.speech_enabled === false || this._speechTestActive === true;
        syncPersonalityEditor(this.shadowRoot, this._config);
    }

    _wire() {
        wirePersonalityEditor(this.shadowRoot, () => this._config, next => this._change(next));
        this._onSpeechTestState ||= this._handleSpeechTestState.bind(this);
        if (!this._speechTestListenerActive) {
            window.addEventListener("nabu-macs:speech-test-state", this._onSpeechTestState);
            this._speechTestListenerActive = true;
        }
        this.shadowRoot.getElementById("nabu-speech-test")?.addEventListener("click", () => {
            if (this._config.speech_enabled === false || this._speechTestActive) return;
            const status = this.shadowRoot.getElementById("nabu-speech-test-status");
            if (status) status.textContent = "Beszédteszt indítása…";
            this._speechTestTimer = setTimeout(() => {
                this._speechTestTimer = null;
                if (this._speechTestActive) return;
                if (status) status.textContent = "Nem érkezett válasz az avatartól. Ellenőrizd, hogy a kártya be van töltve.";
                this._sync();
            }, 1800);
            window.dispatchEvent(new CustomEvent("nabu-macs:speech-test", { detail: { config: { ...this._config } } }));
        });
        for (const key of ["assist_satellite_enabled", "assist_pipeline_enabled"]) {
            this.shadowRoot.getElementById(key)?.addEventListener("change", e => this._change({ [key]: !!e.currentTarget.checked }));
            this.shadowRoot.getElementById(key)?.addEventListener("checked-changed", e => this._change({ [key]: !!e.detail?.value }));
        }
        for (const key of ["assist_satellite_entity", "assist_pipeline_entity"]) this.shadowRoot.getElementById(key)?.addEventListener("change", e => this._change({ [key]: e.currentTarget.value, [key.replace("_entity", "_custom")]: false }));
        this.shadowRoot.getElementById("nabu-glow")?.addEventListener("input", e => this._change(normalizeVisualConfig({ ...this._config, glow: e.currentTarget.value })));
        this.shadowRoot.getElementById("nabu-character-size")?.addEventListener("input", e => this._change(normalizeVisualConfig({ ...this._config, character_size: e.currentTarget.value })));
    }

    _handleSpeechTestState(event) {
        const requested = event?.detail?.config;
        if (!requested) return;
        for (const key of ["emotion", "speech_enabled", "speech_style", "speech_speed", "speech_media_player"]) {
            if (Object.hasOwn(requested, key) && JSON.stringify(requested[key]) !== JSON.stringify(this._config[key])) return;
        }
        if (this._speechTestTimer) clearTimeout(this._speechTestTimer);
        this._speechTestTimer = null;
        this._speechTestActive = event.detail.active === true;
        const status = this.shadowRoot?.getElementById("nabu-speech-test-status");
        if (status) status.textContent = this._speechTestActive ? "Beszédanimáció aktív · 8 másodperc" : "Beszédteszt befejezve.";
        this._sync();
        if (this._speechTestActive) {
            this._speechTestTimer = setTimeout(() => {
                this._speechTestTimer = null;
                this._speechTestActive = false;
                if (status) status.textContent = "Beszédteszt befejezve.";
                this._sync();
            }, 8500);
        }
    }
}
