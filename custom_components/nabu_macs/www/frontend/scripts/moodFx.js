/**
 * Mood FX
 * -------
 * Applies mood classes and runs idle->bored->sleep sequence logic.
 */

import { importWithVersion } from "./importHandler.js";

const { createDebugger } = await importWithVersion("../../shared/debugger.js");
const debug = createDebugger(import.meta.url);


const { MOODS } = await importWithVersion('../../shared/emotions.js');
const MOOD_IDLE_TO_BORED_MS = 30000;
const MOOD_BORED_TO_SLEEP_MS = 30000;

const getMoodParam = () => {
	return new URLSearchParams(globalThis.location?.search || "").get("mood") || "idle";
};

export function createMoodFx({ isCardPreview, onMoodChange } = {}) {
	let notifyMoodChange = typeof onMoodChange === "function" ? onMoodChange : () => {};

	let baseMood = "idle";
	let idleSequenceEnabled = false;
	let paused = false;
	let moodIdleTimer = null;
	let moodBoredTimer = null;

	const setMood = (value) => {
		const v=(value??'').toString().trim().toLowerCase();
		notifyMoodChange(MOODS.includes(v)?v:'idle');
	};

	const clearMoodTimers = () => {
		if (moodIdleTimer) {
			clearTimeout(moodIdleTimer);
			moodIdleTimer = null;
		}
		if (moodBoredTimer) {
			clearTimeout(moodBoredTimer);
			moodBoredTimer = null;
		}
	};

	const scheduleMoodIdleSequence = () => {
		clearMoodTimers();
		if (isCardPreview || !idleSequenceEnabled || paused) return;
		moodIdleTimer = setTimeout(() => {
			if (baseMood !== "idle") return;
			setMood("bored");
			moodBoredTimer = setTimeout(() => {
				if (baseMood !== "idle") return;
				setMood("sleeping");
			}, MOOD_BORED_TO_SLEEP_MS);
		}, MOOD_IDLE_TO_BORED_MS);
	};

	const setIdleSequenceEnabled = (enabled) => {
		const next = !!enabled;
		if (idleSequenceEnabled === next) return;
		idleSequenceEnabled = next;
		if (!idleSequenceEnabled) {
			clearMoodTimers();
			if (baseMood === "idle") {
				setMood("idle");
			}
			return;
		}
		if (baseMood === "idle") {
			scheduleMoodIdleSequence();
		}
	};

	const setBaseMood = (nextMood) => {
		const value = (nextMood ?? "idle").toString().trim().toLowerCase();
		baseMood = MOODS.includes(value) ? value : "idle";
		if (baseMood !== "idle") {
			clearMoodTimers();
			setMood(baseMood);
			return;
		}
		setMood("idle");
		if (idleSequenceEnabled) {
			scheduleMoodIdleSequence();
		}
	};

	const setBaseMoodFromQuery = () => {
		setBaseMood(getMoodParam());
	};

	const resetMoodSequence = () => {
		clearMoodTimers();
		if (baseMood === "idle") {
			setMood("idle");
			if (idleSequenceEnabled) {
				scheduleMoodIdleSequence();
			}
		}
	};

	return {
		setPaused: value => { paused = !!value; clearMoodTimers(); if (!paused && baseMood === 'idle') scheduleMoodIdleSequence(); },
		dispose: () => { paused = true; clearMoodTimers(); notifyMoodChange = () => {}; },
		setBaseMood,
		setBaseMoodFromQuery,
		setIdleSequenceEnabled,
		resetMoodSequence,
		setOnMoodChange: (handler) => {
			notifyMoodChange = typeof handler === "function" ? handler : () => {};
		}
	};
}

debug("Mood Effects Ready");
