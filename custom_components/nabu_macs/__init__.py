from __future__ import annotations

import json
import logging
from functools import partial
from pathlib import Path
from uuid import uuid4

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import entity_registry as er
from homeassistant.components.http import StaticPathConfig
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util

# import constants
from .const import (
    DOMAIN, MOODS, SERVICE_SET_MOOD, ATTR_MOOD,
    SERVICE_SET_ANIMATIONS_ENABLED, ATTR_ANIMATIONS_ENABLED,
    SERVICE_SEND_USER_MESSAGE, SERVICE_SEND_ASSISTANT_MESSAGE, ATTR_MESSAGE, EVENT_MESSAGE,
)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

# user dropdown/select and number entities
PLATFORMS: list[str] = ["select", "switch"]

RESOURCE_BASE_URL = "/nabu_macs/macs.js"
RESOURCE_TYPE = "module"
SERVICE_NAMES = (SERVICE_SET_MOOD, SERVICE_SET_ANIMATIONS_ENABLED, SERVICE_SEND_USER_MESSAGE, SERVICE_SEND_ASSISTANT_MESSAGE)
_LOGGER = logging.getLogger(__name__)


async def _integration_version(hass: HomeAssistant) -> str:
    """Read integration version from manifest.json (best-effort)."""
    try:
        manifest_path = Path(__file__).parent / "manifest.json"
        read_manifest = partial(manifest_path.read_text, encoding="utf-8")
        manifest_text = await hass.async_add_executor_job(read_manifest)
        manifest = json.loads(manifest_text)
        return str(manifest.get("version", "0"))
    except Exception:
        return "0"


async def _ensure_lovelace_resource(hass: HomeAssistant) -> None:
    """
    Auto-register/update the Lovelace resource for macs.js in storage mode.

    In YAML mode, HA doesn't expose a writable resources collection, so we just no-op.
    """
    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None) if lovelace else None
    if not resources:
        return

    version = await _integration_version(hass)
    desired_url = f"{RESOURCE_BASE_URL}?v={version}"

    existing = None
    for item in resources.async_items():
        url = str(item.get("url", ""))
        if url.split("?", 1)[0] == RESOURCE_BASE_URL:
            existing = item
            break

    if existing:
        if existing.get("url") != desired_url or existing.get("res_type") != RESOURCE_TYPE:
            await resources.async_update_item(existing["id"], {"res_type": RESOURCE_TYPE, "url": desired_url})
    else:
        await resources.async_create_item({"res_type": RESOURCE_TYPE, "url": desired_url})


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    # Serve frontend files from custom_components/nabu_macs/www at /nabu_macs/...
    hass.data.setdefault(DOMAIN, {})
    if not hass.data[DOMAIN].get("static_path_registered"):
        www_path = Path(__file__).parent / "www"
        manifest_path = Path(__file__).parent / "manifest.json"
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig("/nabu_macs", str(www_path), cache_headers=False),
                StaticPathConfig("/nabu_macs-manifest.json", str(manifest_path), cache_headers=False),
            ]
        )
        hass.data[DOMAIN]["static_path_registered"] = True

    loaded = hass.data[DOMAIN].setdefault("loaded_entries", set())
    if loaded and entry.entry_id not in loaded:
        raise ValueError("Nabu MACS supports one integration entry; multiple cards are supported")

    # Create entities first
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    async def handle_set_mood(call: ServiceCall) -> None:
        mood = str(call.data.get(ATTR_MOOD, "")).strip().lower()
        if mood not in MOODS:
            raise vol.Invalid(f"Invalid mood '{mood}'. Must be one of: {', '.join(MOODS)}")

        registry = er.async_get(hass)
        entity_id = None
        for ent in registry.entities.values():
            if ent.platform == DOMAIN and ent.config_entry_id == entry.entry_id and ent.unique_id == "nabu_macs_mood":
                entity_id = ent.entity_id
                break

        if not entity_id:
            raise vol.Invalid("Macs mood entity not found (select not created)")

        await hass.services.async_call("select", "select_option", {"entity_id": entity_id, "option": mood}, blocking=True)








    async def _set_switch_entity(call: ServiceCall, attr_name: str, unique_id: str, label: str) -> None:
        raw = call.data.get(attr_name, None)

        if isinstance(raw, bool):
            is_on = raw
        elif isinstance(raw, (int, float)):
            is_on = bool(raw)
        elif isinstance(raw, str):
            v = raw.strip().lower()
            if v in ("1", "true", "on", "yes", "y"):
                is_on = True
            elif v in ("0", "false", "off", "no", "n"):
                is_on = False
            else:
                raise vol.Invalid(f"Invalid {label} '{raw}'. Must be true/false.")
        else:
            raise vol.Invalid(f"Invalid {label} '{raw}'. Must be true/false.")

        registry = er.async_get(hass)
        entity_id = None
        for ent in registry.entities.values():
            if ent.platform == DOMAIN and ent.config_entry_id == entry.entry_id and ent.unique_id == unique_id:
                entity_id = ent.entity_id
                break

        if not entity_id:
            raise vol.Invalid(f"Macs {label} entity not found (switch not created)")

        await hass.services.async_call(
            "switch",
            "turn_on" if is_on else "turn_off",
            {"entity_id": entity_id},
            blocking=True,
        )

    async def handle_set_animations_enabled(call: ServiceCall) -> None:
        await _set_switch_entity(
            call,
            ATTR_ANIMATIONS_ENABLED,
            "nabu_macs_animations_enabled",
            "animations enabled"
        )















    async def _handle_send_message(call: ServiceCall, role: str) -> None:
        raw = call.data.get(ATTR_MESSAGE, None)
        text = (raw or "").__str__().strip()
        if not text:
            raise vol.Invalid("Message cannot be empty.")

        payload = {
            "id": uuid4().hex,
            "role": role,
            "text": text,
            "ts": dt_util.utcnow().isoformat(),
        }
        hass.bus.async_fire(EVENT_MESSAGE, payload)

    async def handle_send_user_message(call: ServiceCall) -> None:
        await _handle_send_message(call, "user")

    async def handle_send_assistant_message(call: ServiceCall) -> None:
        await _handle_send_message(call, "assistant")


    if not hass.services.has_service(DOMAIN, SERVICE_SET_MOOD):
        hass.services.async_register(
            DOMAIN,
            SERVICE_SET_MOOD,
            handle_set_mood,
            schema=vol.Schema({vol.Required(ATTR_MOOD): vol.In(MOODS)}),
        )






    if not hass.services.has_service(DOMAIN, SERVICE_SET_ANIMATIONS_ENABLED):
        hass.services.async_register(
            DOMAIN,
            SERVICE_SET_ANIMATIONS_ENABLED,
            handle_set_animations_enabled,
            schema=vol.Schema({vol.Required(ATTR_ANIMATIONS_ENABLED): cv.boolean}),
        )















    if not hass.services.has_service(DOMAIN, SERVICE_SEND_USER_MESSAGE):
        hass.services.async_register(
            DOMAIN,
            SERVICE_SEND_USER_MESSAGE,
            handle_send_user_message,
            schema=vol.Schema({vol.Required(ATTR_MESSAGE): cv.string}),
        )

    if not hass.services.has_service(DOMAIN, SERVICE_SEND_ASSISTANT_MESSAGE):
        hass.services.async_register(
            DOMAIN,
            SERVICE_SEND_ASSISTANT_MESSAGE,
            handle_send_assistant_message,
            schema=vol.Schema({vol.Required(ATTR_MESSAGE): cv.string}),
        )

    # Auto-add/update Lovelace resource (storage mode)
    try:
        await _ensure_lovelace_resource(hass)
    except Exception:
        _LOGGER.exception("Could not register Nabu Lovelace resource; add %s manually", RESOURCE_BASE_URL)
    loaded.add(entry.entry_id)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if not unload_ok:
        return False
    data = hass.data.get(DOMAIN, {})
    loaded = data.get("loaded_entries", set())
    loaded.discard(entry.entry_id)
    if not loaded:
        for service in SERVICE_NAMES:
            hass.services.async_remove(DOMAIN, service)
    # Static routes survive until HA restarts; do not register them twice on reload.
    return True


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Delete only the exact Nabu resource URL on integration removal, never on reload."""
    if hass.data.get(DOMAIN, {}).get("loaded_entries"):
        return
    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None) if lovelace else None
    if resources is None:
        return
    for item in list(resources.async_items()):
        if str(item.get("url", "")).split("?", 1)[0] == RESOURCE_BASE_URL:
            await resources.async_delete_item(item["id"])
