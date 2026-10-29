/**
 * MacsCard
 * --------
 * Main Home Assistant Lovelace card implementation for M.A.C.S.
 * Nabu MACS 2.0 animated 3D character.
 *
 * This file defines the custom Lovelace card element responsible for:
 * - Rendering the M.A.C.S. UI inside an iframe
 * - Passing Home Assistant state and Assist data to the 3D avatar iframe
 * - Bridging Assist pipeline data (conversation turns) from Home Assistant
 *   to the frontend character via postMessage
 *
 * All backend interaction (WebSocket calls, event subscriptions, auth usage)
 * occurs here, while the iframe is kept sandboxed and display-focused.
 *
 * This file represents the core integration layer between Home Assistant
 * and the M.A.C.S. frontend character.
 */

import { VERSION, DEFAULTS, MOOD_ENTITY_ID, ANIMATIONS_ENTITY_ID, MACS_MESSAGE_EVENT } from "../shared/constants.js";
import { normMood, safeUrl, getTargetOrigin, assistStateToMood, getValidUrl} from "./validators.js";
import { SatelliteTracker } from "./assistSatellite.js";
import { AssistPipelineTracker } from "./assistPipeline.js";
import { createDebugger } from "../shared/debugger.js";
import { MessagePoster } from "../shared/messagePoster.js";
import { normalizeVisualConfig } from "../shared/visualConfig.js";
import { normalizeEmotionConfig } from "../shared/emotions.js";
import { normalizeMotionConfig } from "../shared/motionConfig.js";
import { normalizeAvatarConfig } from "../shared/avatarConfig.js";
import { mediaPlayerSnapshot } from "./mediaPlayerTracker.js";
import { normalizePersonalityConfig } from "../shared/personalityConfig.js";
import { ReactionTracker } from "./reactionTracker.js";
import { normalizeMaxTurns } from "../shared/config.js";
import { resolveEntityId, validateEntityConfig } from "../shared/entityIds.js";


const debug = createDebugger(import.meta.url);


const cardCssUrl = getValidUrl("backend/cards.css");


export class MacsCard extends HTMLElement {
    // returns the minimum valid config Home Assistant needs to add the card to a dashboard before the user configures anything.
    static getStubConfig() { 
        return { 
            type: "custom:nabu-macs-card", 
            assist_pipeline_enabled: false, 
            assist_pipeline_custom: false
        }; 
    }

    // create the card editor
    static getConfigElement() {
        return document.createElement("nabu-macs-card-editor-v2");
    }

    // Load the Macs Card and Configs
    setConfig(config) {
        const previousConfig = this._config;
        // ensure we have a valid config object
        if (!config || typeof config !== "object"){
            throw new Error("nabu-macs-card: invalid config");
        }
        validateEntityConfig(config);

        // Merge defaults with user config and lock "core" fields to constants so the card behaves consistently.
        const safeConfig = { ...config };
        delete safeConfig.preview_image;
        this._config = {
            ...DEFAULTS,
            ...safeConfig,
            url: DEFAULTS.url,
            max_turns: normalizeMaxTurns(config.max_turns),
        }; //, mode };
        debug("CARD CONFIG: " + JSON.stringify(this._config));

        // Only run the first time setConfig is called
        if (!this._root) {
            // Shadow DOM wrapper + iframe shell
            // (Creating a Shadow Root so CSS styles don't mess with HA, and HA styles don't mess with Macs.)
            this._root = this.attachShadow({ mode: "open" });

            // Keep the same iframe/GLB instance for all configuration updates.
            this._root.innerHTML = `
                <link rel="stylesheet" href="${cardCssUrl}">
                <ha-card><div class="wrap"><iframe title="Nabu MACS 3D avatar"></iframe></div></ha-card>
            `;
            this._iframe = this._root.querySelector("iframe");
            this._messagePoster = new MessagePoster({
                sender: "backend",
                recipient: "iframe",
                getRecipientWindow: () => this._iframe?.contentWindow,
                getTargetOrigin: () => {
                    const base = safeUrl(this._config?.url);
                    return getTargetOrigin(base.toString());
                },
                allowNullOrigin: true,
            });

            // keep load/render state
            this._loadedOnce = false;
            this._lastMood = undefined;
            this._lastSrc = undefined;
            this._isPreview = false;
            this._iframeReady = false;
            this._iframeLoaded = false;
            this._iframeBootstrapped = false;
            this._initSent = false;
            this._pendingState = null;
            this._lastAssistSatelliteState = null;
            this._lastTurnsSignature = null;
            this._lastAnimationsEnabled = null;
            this._lastConfigSignature = null;
            this._lastBridgeConfigSignature = null;
            this._syntheticTurns = [];
            this._unsubMessageEvents = null;
            this._messageSubToken = 0;

            // Keep home assistant state
            this._hass = null;

            // Track assist satellite state transitions for wake-word logic.
            this._assistSatelliteOutcome = new SatelliteTracker({});

            // Track pipeline turns (assistant chat history) and forward to iframe.
            this._pipelineTracker = new AssistPipelineTracker({
                onTurns: () => {
                    if (!this._iframe) return;
                    this._sendTurnsToIframe();
                }
            });
            if (this._pipelineTracker) this._pipelineTracker.setConfig(this._config);



            // Listen for messages from HA to the iframe
            this._onMessage = this._onMessage.bind(this);
            window.addEventListener("message", this._onMessage);
            this._messageListenerActive = true;
            this._onSpeechTestRequest = this._onSpeechTestRequest.bind(this);
            window.addEventListener("nabu-macs:speech-test", this._onSpeechTestRequest);
            this._speechTestListenerActive = true;
        }
        else {
            this._pipelineTracker?.setConfig(this._config);
            this._syntheticTurns = (this._syntheticTurns || []).slice(0, this._getMaxMessages());
            // Reapply config to existing handlers when HA updates config for this card.
            this._lastConfigSignature = null;
            this._lastBridgeConfigSignature = null;
            const emotionChanged = Object.hasOwn(safeConfig, "emotion") && safeConfig.emotion !== previousConfig?.emotion;
            const emotionRemoved = Object.hasOwn(previousConfig || {}, "emotion") && !Object.hasOwn(safeConfig, "emotion");
            if (emotionChanged || emotionRemoved) {
                const mood = emotionChanged
                    ? normalizeEmotionConfig(this._config).emotion
                    : normMood(this._hass?.states?.[resolveEntityId(this._config, MOOD_ENTITY_ID)]?.state ?? "idle");
                this._pendingState = { ...(this._pendingState || {}), mood };
                if (this._iframeBootstrapped && mood !== this._lastMood) {
                    this._lastMood = mood;
                    this._sendMoodToIframe(mood);
                }
            }
            if (this._iframeBootstrapped) {
                this._updateReactionTracker();
                this._sendConfigToIframe();
                this._lastMediaSignature=null;
                this._sendMediaToIframe();
                this._sendTurnsToIframe();
            }
        }
    }

    // make sure we remove event listeners when unloaded
    disconnectedCallback() {
        this._reactionTracker?.dispose();
        this._postToIframe({type:'nabu_macs:media',recipient:'frontend',playing:false});
        this._messageDisconnected = true;
        debug("got disconnected");
        try { window.removeEventListener("message", this._onMessage); } catch (_) {}
        this._messageListenerActive = false;
        try { window.removeEventListener("nabu-macs:speech-test", this._onSpeechTestRequest); } catch (_) {}
        this._speechTestListenerActive = false;

        // Dispose long-lived helpers to avoid leaks if HA removes/recreates the card.
       try { this._pipelineTracker?.dispose?.(); } catch (_) {}
       this._pipelineTracker  = null;

        // remove the assist satellite class
        try { this._assistSatelliteOutcome?.dispose?.(); } catch (_) {}
        this._assistSatelliteOutcome = null;


        this._stopMessageSubscription();
    }

    _stopMessageSubscription() {
        this._messageSubToken = (this._messageSubToken || 0) + 1;
        try {
            const u = this._unsubMessageEvents;
            if (typeof u === "function") {
                const result = u();
                if (result && typeof result.catch === "function") {
                    result.catch(() => {});
                }
            }
        } catch (_) {}
        this._unsubMessageEvents = null;

    }

    connectedCallback() {
        this._messageDisconnected = false;
        this._updateReactionTracker();
        this._ensureMessageSubscription();
        this._updatePreviewState();
        // If HA disconnected and reconnected the same instance, rebuild trackers
        if (this._config && !this._pipelineTracker) {
            debug("Recreating AssistPipelineTracker (reconnect)");
            this._pipelineTracker = new AssistPipelineTracker({
            onTurns: () => {
                if (!this._iframe) return;
                this._sendTurnsToIframe();
            }
            });
            this._pipelineTracker.setConfig(this._config);
            if (this._hass) this._pipelineTracker.setHass(this._hass);
        }

        if (this._config && !this._assistSatelliteOutcome) {
            debug("Recreating SatelliteTracker (reconnect)");
            this._assistSatelliteOutcome = new SatelliteTracker({});
        }


        if (this._onMessage && !this._messageListenerActive) {
            window.addEventListener("message", this._onMessage);
            this._messageListenerActive = true;
        }
        if (this._onSpeechTestRequest && !this._speechTestListenerActive) {
            window.addEventListener("nabu-macs:speech-test", this._onSpeechTestRequest);
            this._speechTestListenerActive = true;
        }
    }





    /* ---------- Send data to iFrame ---------- */

    _postToIframe(payload) {
        if (!this._messagePoster) return;
        // Always target the iframe origin to avoid cross-origin leaks.
        if (this._config?.emotion_debug === true && ['nabu_macs:init','nabu_macs:config','nabu_macs:mood'].includes(payload.type)) {
            const c = payload.config || payload;
            console.info('[Nabu emotion] card', {
                selected: normalizeEmotionConfig(this._config).emotion,
                source: Object.hasOwn(this._config, 'emotion') ? 'lovelace' : 'select',
                selectMood: normMood(this._hass?.states?.[resolveEntityId(this._config, MOOD_ENTITY_ID)]?.state ?? 'idle'),
                sent: c.emotion || payload.mood, type: payload.type,
                legacyMixPresent: Object.keys(normalizeEmotionConfig(this._config).emotion_mix).length > 0
            });
        }
        this._messagePoster.post(payload);
    }

    _buildConfigPayload() {
        this._updatePreviewState();
        const enabled = !!this._config.assist_pipeline_enabled;
        const assistSatelliteEnabled = !!this._config.assist_satellite_enabled;
        const assist_pipeline_entity = enabled ? (this._config.assist_pipeline_entity || "").toString().trim() : "";
        const maxTurns = this._config.max_turns ?? DEFAULTS.max_turns;
        return {
            ...normalizeVisualConfig(this._config),
            ...normalizeEmotionConfig(this._config),
            // A saved legacy mix must not mask an explicit Lovelace selection.
            ...(Object.hasOwn(this._config, 'emotion') ? {emotion_mix: {}} : {}),
            emotion_debug: this._config.emotion_debug === true,
            // Send one resolved mood through both the config and mood channels.
            // An explicit Lovelace emotion is the manual source; HA's select is
            // used when no emotion was saved in the card config.
            emotion: normalizeEmotionConfig({ emotion: this._pendingState?.mood ?? this._config.emotion }).emotion,
            ...normalizeMotionConfig(this._config),
            ...normalizeAvatarConfig(this._config),
            ...normalizePersonalityConfig(this._config),
            assist_satellite_enabled: assistSatelliteEnabled,
            assist_pipeline_entity,
            max_turns: maxTurns
        };
    }

    _buildBridgeConfigPayload() {
        const enabled = !!this._config.assist_pipeline_enabled;
        const assist_pipeline_entity = enabled ? (this._config.assist_pipeline_entity || "").toString().trim() : "";
        const maxTurns = this._config.max_turns ?? DEFAULTS.max_turns;
        return {
            assist_pipeline_entity,
            max_turns: maxTurns,
        };
    }

    _buildTurnsPayload() {
        const turns = this._pipelineTracker?.getTurns?.() || [];
        const synthetic = this._syntheticTurns || [];
        const combined = [...synthetic, ...turns].sort((a, b) => {
            const ta = Date.parse(a?.ts || "") || 0;
            const tb = Date.parse(b?.ts || "") || 0;
            return tb - ta;
        });
        const maxMessages = this._getMaxMessages();
        return maxMessages ? combined.slice(0, maxMessages) : combined;
    }

    _sendInitToIframe(state) {
        const snapshot = state || this._pendingState;
        if (!snapshot) return;
        const config = this._buildConfigPayload();
        const bridgeConfig = this._buildBridgeConfigPayload();
        const turns = this._buildTurnsPayload();
        const moodPayload = {
            type: "nabu_macs:init",
            recipient: "frontend",
            config,
            media: mediaPlayerSnapshot(this._hass,this._config),
            mood: snapshot.mood ?? null,
            animations_enabled: typeof snapshot.animationsEnabled === "boolean" ? snapshot.animationsEnabled : null,
        };
        const bridgePayload = {
            type: "nabu_macs:init",
            recipient: "assist-bridge",
            config: bridgeConfig,
            turns
        };

        this._postToIframe(moodPayload);
        this._postToIframe(bridgePayload);
        this._initSent = true;

        this._lastConfigSignature = JSON.stringify({ type: "nabu_macs:config", recipient: "frontend", ...config });
        this._lastBridgeConfigSignature = JSON.stringify({ type: "nabu_macs:config", recipient: "assist-bridge", ...bridgeConfig });
        this._lastTurnsSignature = JSON.stringify(turns);

        this._lastMood = snapshot.mood;
        this._lastAnimationsEnabled = typeof snapshot.animationsEnabled === "boolean"
            ? snapshot.animationsEnabled
            : this._lastAnimationsEnabled;
    }

    _flushPendingState() {
        const snapshot = this._pendingState;
        if (!snapshot) return;
        const mood = snapshot.mood;
        if (mood && mood !== this._lastMood) {
            this._lastMood = mood;
            this._sendMoodToIframe(mood);
        }
        this._sendAnimationsEnabledToIframe(snapshot.animationsEnabled);
        this._sendConfigToIframe();
        this._sendTurnsToIframe();
    }

    _handleIframeReady() {
        if (this._iframeBootstrapped) return;
        if (!this._iframeReady || !this._iframeLoaded) return;
        if (!this._initSent) {
            this._sendInitToIframe(this._pendingState);
        }
        this._pipelineTracker?.triggerFetchNewest?.();
    }

    _revealIframe() {
        if (this._iframe) {
            this._iframe.hidden = false;
        }
    }




    _sendConfigToIframe(force = false) {
        const moodPayload = {
            type: "nabu_macs:config",
            recipient: "frontend",
            ...this._buildConfigPayload(),
        };
        const moodSignature = JSON.stringify(moodPayload);
        if (force || moodSignature !== this._lastConfigSignature) {
            this._lastConfigSignature = moodSignature;
            this._postToIframe(moodPayload);
        }

        const bridgePayload = {
            type: "nabu_macs:config",
            recipient: "assist-bridge",
            ...this._buildBridgeConfigPayload(),
        };
        const bridgeSignature = JSON.stringify(bridgePayload);
        if (force || bridgeSignature !== this._lastBridgeConfigSignature) {
            this._lastBridgeConfigSignature = bridgeSignature;
            this._postToIframe(bridgePayload);
        }
    }

    _sendMoodToIframe(mood, options = {}) {
        const payload = { type: "nabu_macs:mood", recipient: "frontend", mood };
        // reset_sleep tells the iframe to reset its idle/sleep timers.
        if (options.resetSleep) payload.reset_sleep = true;
        this._postToIframe(payload);
    }
    _sendAnimationsEnabledToIframe(enabled) {
        const next = !!enabled;
        if (this._lastAnimationsEnabled === next) return;
        this._lastAnimationsEnabled = next;
        this._postToIframe({ type: "nabu_macs:animations_enabled", recipient: "frontend", enabled: next });
    }

    _sendTurnsToIframe() {
        // Turns are kept newest-first in the card, but sent as-is
        const payloadTurns = this._buildTurnsPayload();
        // Avoid spamming iframe with identical payloads.
        const signature = JSON.stringify(payloadTurns);
        if (signature === this._lastTurnsSignature) return;
        this._lastTurnsSignature = signature;
        this._postToIframe({ type: "nabu_macs:turns", recipient: "all", turns: payloadTurns });
        const turn=this._pipelineTracker?.getTurns?.().find(t=>t.reply||t.error);
        const outcome=turn ? `${turn.runId}:${turn.error?'failure':'success'}` : '';
        const previous=this._lastPipelineOutcome;
        this._lastPipelineOutcome=outcome;
        if(outcome && outcome!==previous && previous!==undefined && this._iframeBootstrapped){
            this._postToIframe({type:'nabu_macs:reaction',recipient:'frontend',trigger:turn.error?'assist_failure':'assist_success'});
            if(turn.reply)this._postToIframe({type:'nabu_macs:subtitle',recipient:'frontend',text:turn.reply});
        }
    }

    _onMessage(e) {
        if (!this._messagePoster || !this._messagePoster.isValidEvent(e)) return;

        if (!e.data || typeof e.data !== "object") return;
        const recipient = (e.data.recipient || "").toString().trim().toLowerCase();
        if (recipient && recipient !== "backend" && recipient !== "all") return;

        if (e.data.type === "nabu_macs:ready") {
            debug("iframe ready");
            this._iframeReady = true;
            // Treat ready as a fresh iframe session (e.g. after dashboard nav)
            this._iframeLoaded = true;
            this._iframeBootstrapped = false;
            this._initSent = false;
            this._handleIframeReady();
            return;
        }

        if (e.data.type === "nabu_macs:init_ack") {
            debug("init: ack received");
            this._iframeBootstrapped = true;
            this._revealIframe();
            this._flushPendingState();
            return;
        }

        if (e.data.type === "nabu_macs:speech_test_state") {
            window.dispatchEvent(new CustomEvent("nabu-macs:speech-test-state", { detail: { active: e.data.active === true, config: this._config } }));
            return;
        }


        // Iframe requests initial config and current turns
        if (e.data.type === "nabu_macs:request_config") {
            if (!this._iframeBootstrapped) {
                if (!this._initSent) {
                    this._sendInitToIframe(this._pendingState);
                }
            } else {
                this._sendConfigToIframe(true);
                this._sendTurnsToIframe();
            }
        }
    }

    _onSpeechTestRequest(event) {
        if (!this._iframeBootstrapped || this._messageDisconnected || this._config?.speech_enabled === false) return;
        const requested = event?.detail?.config;
        if (!requested || typeof requested !== "object") return;
        for (const key of ["emotion", "speech_enabled", "speech_style", "speech_speed", "speech_media_player"]) {
            if (Object.hasOwn(requested, key) && JSON.stringify(requested[key]) !== JSON.stringify(this._config[key])) return;
        }
        this._postToIframe({ type: "nabu_macs:speech_test", recipient: "frontend" });
    }

    _updatePreviewState() {
        // Detect when we're rendered inside the HA card editor preview.
        this._isPreview = !!this.closest(".element-preview");
    }

    _getMaxMessages() {
        return normalizeMaxTurns(this._config?.max_turns) * 2;
    }

    _ensureMessageSubscription() {
        const connection = this._hass?.connection;
        if (!connection || this._messageDisconnected) return;
        if (connection !== this._messageConnection) {
            this._stopMessageSubscription();
            this._messageConnection = connection;
        }
        if (this._unsubMessageEvents) return;
        const token = ++this._messageSubToken;
        this._unsubMessageEvents = "pending";

        Promise.resolve().then(() => {
            if (this._messageDisconnected || token !== this._messageSubToken) return null;
            return connection.subscribeEvents((ev) => {
            if (this._messageDisconnected || token !== this._messageSubToken) return;
            try {
                const data = ev?.data || {};
                if (typeof data.text !== "string" || data.text.length > 10000) return;
                const role = data.role === undefined ? "assistant" : data.role;
                if (role !== "user" && role !== "assistant") return;
                const text = data.text.trim();
                if (!text) return;
                const ts = (data.ts || new Date().toISOString()).toString();
                const runId = (data.id || `synthetic_${Date.now()}_${Math.random().toString(16).slice(2)}`).toString();
                const turn = { runId, ts };
                if (role === "user") {
                    turn.heard = text;
                } else {
                    turn.reply = text;
                }

                const existing = this._syntheticTurns?.findIndex?.((entry) => entry.runId === runId) ?? -1;
                if (existing >= 0) {
                    this._syntheticTurns.splice(existing, 1);
                }
                if (!this._syntheticTurns) this._syntheticTurns = [];
                this._syntheticTurns.unshift(turn);
                const maxMessages = this._getMaxMessages();
                if (maxMessages && this._syntheticTurns.length > maxMessages) {
                    this._syntheticTurns.length = maxMessages;
                }
                this._sendTurnsToIframe();
            } catch (_) {}
        }, MACS_MESSAGE_EVENT);
        }).then((unsub) => {
            if (typeof unsub !== "function") return;
            if (this._messageDisconnected || token !== this._messageSubToken) {
                try {
                    const result = unsub();
                    if (result && typeof result.catch === "function") {
                        result.catch(() => {});
                    }
                } catch (_) {}
                return;
            }
            this._unsubMessageEvents = unsub;
        }).catch(() => {
            if (token === this._messageSubToken) this._unsubMessageEvents = null;
        });
    }


    _updateReactionTracker() {
        if(this._messageDisconnected || !this._hass || !this._config)return;
        if(!this._reactionTracker)this._reactionTracker=new ReactionTracker(event=>{
            if(this._iframeBootstrapped&&!this._messageDisconnected)this._postToIframe({type:'nabu_macs:reaction',recipient:'frontend',...event});
        });
        this._reactionTracker.update(this._hass,this._config);
    }

    _sendMediaToIframe() {
        if (!this._iframeBootstrapped || this._messageDisconnected) return;
        const snapshot=mediaPlayerSnapshot(this._hass,this._config), signature=JSON.stringify(snapshot);
        if (signature===this._lastMediaSignature) return;
        this._lastMediaSignature=signature;
        this._postToIframe({type:'nabu_macs:media',recipient:'frontend',...snapshot});
    }

    /* ---------- hass hook ---------- */

    set hass(hass) {
        if (!this._config || !this._iframe) return;

        this._hass = hass;
        this._updateReactionTracker();
        this._updatePreviewState();
        this._ensureMessageSubscription();

        // Always keep hass fresh (safe + cheap)
        this._pipelineTracker?.setHass?.(hass);
               
        // Only re-apply config if the pipeline settings changed since last time we applied it
        const enabled = !!this._config?.assist_pipeline_enabled;
        const pid = this._config?.assist_pipeline_entity || "";
        if (!this._lastPipelineCfg || this._lastPipelineCfg.enabled !== enabled || this._lastPipelineCfg.pid !== pid) {
            this._lastPipelineCfg = { enabled, pid};
            this._pipelineTracker?.setConfig?.(this._config);
        }

        

        //this._ensureSubscriptions();

        // Read current HA state into local values.
        const moodState = hass.states[resolveEntityId(this._config, MOOD_ENTITY_ID)] || null;
        //const mood = normMood(moodState?.state);
        const baseMood = Object.hasOwn(this._config, "emotion")
            ? normalizeEmotionConfig(this._config).emotion
            : normMood(moodState?.state ?? "idle");
        // Optional: auto mood from selected satellite state
        let assistMood = null;
        let satState = ""; 
        let wakewordTriggered = false;
        const prevSatState = this._lastAssistSatelliteState;

        if (this._config?.assist_satellite_enabled) {
            const satId = (this._config.assist_satellite_entity || "").toString().trim();
            if (satId) {
                const satStateObj = hass.states[satId] || null;
                satState = (satStateObj?.state || "").toString().trim().toLowerCase(); 
                assistMood = assistStateToMood(satState);
                const tracker = this._assistSatelliteOutcome;
                debug(tracker);
                if (this._config?.assist_satellite_enabled && satState && tracker) tracker.update(satState);
            }
            // Detect idle -> listening transition to treat as a wake-word event.
            wakewordTriggered = prevSatState === "idle" && satState === "listening";
            this._lastAssistSatelliteState = satState || null;
            if(this._iframeBootstrapped && satState!==prevSatState && ['listening','processing','responding'].includes(satState)) {
                this._postToIframe({type:'nabu_macs:reaction',recipient:'frontend',trigger:`assist_${satState}`});
            }
        } else {
            this._lastAssistSatelliteState = null;
        }

        const animationsState = hass.states[resolveEntityId(this._config, ANIMATIONS_ENTITY_ID)] || null;
        const animationsEnabled = animationsState ? animationsState.state === "on" : true;

        // Sensor handler normalizes raw HA entities into a single payload.

        // const now = Date.now();
        const overrideMood = this._assistSatelliteOutcome?.getOverrideMood?.();
        const assistEnabled = !!this._config?.assist_satellite_enabled;
        const assistActive = assistEnabled && assistMood && assistMood !== "idle";
        let mood = overrideMood ? overrideMood : ((assistEnabled && assistMood) ? assistMood : baseMood);

        const base = safeUrl(this._config.url);
        if (this._isPreview) {
            base.searchParams.set("edit", "1");
        } else {
            base.searchParams.delete("edit");
        }
        if (VERSION) {
            base.searchParams.set("v", VERSION);
        } else {
            base.searchParams.delete("v");
        }
        this._pendingState = { mood, animationsEnabled };
        if (!this._initSent && this._iframeReady && this._iframeLoaded) {
            this._sendInitToIframe(this._pendingState);
        }

        if (!this._loadedOnce) {
            // First load: set iframe src and send initial state
            base.searchParams.set("mood", mood);

            const src = base.toString();
            this._iframe.onload = () => {
                this._iframeLoaded = true;
                this._handleIframeReady();
            };

            if (src !== this._lastSrc) {
                this._iframeReady = false;
                this._iframeLoaded = false;
                this._iframeBootstrapped = false;
                this._initSent = false;
                this._iframe.src = src;
                this._lastSrc = src;
            }

            this._loadedOnce = true;
            this._lastMood = undefined;
        }
        else {
            if (!this._iframeBootstrapped) {
                return;
            }
            // Subsequent updates: only send what changed
            if (wakewordTriggered) {
                this._lastMood = mood;
                // Wake-word resets the iframe's idle/sleep timers.
                this._sendMoodToIframe(mood, { resetSleep: true });
            } else if (mood !== this._lastMood) {
                this._lastMood = mood;
                this._sendMoodToIframe(mood);
            }
            this._sendAnimationsEnabledToIframe(animationsEnabled);

            // keep config/turns fresh
            this._sendConfigToIframe();
            this._sendMediaToIframe();
            this._sendTurnsToIframe();
        }
    }

    getCardSize() {
        return 6;
    }
}





