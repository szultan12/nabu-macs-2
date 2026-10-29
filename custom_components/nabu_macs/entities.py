from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.components.switch import SwitchEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN, MACS_DEVICE, MOODS


class MacsMoodSelect(SelectEntity, RestoreEntity):
    _attr_has_entity_name = True
    _attr_name = "Mood"
    _attr_translation_key = "mood"
    _attr_unique_id = "nabu_macs_mood"
    _attr_suggested_object_id = "nabu_macs_mood"
    _attr_icon = "mdi:emoticon"
    _attr_options = MOODS
    _attr_current_option = "idle"

    async def async_select_option(self, option: str) -> None:
        if option in MOODS:
            self._attr_current_option = option
            self.async_write_ha_state()

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last_state = await self.async_get_last_state()
        if last_state and last_state.state in MOODS:
            self._attr_current_option = last_state.state

    @property
    def device_info(self) -> DeviceInfo:
        return MACS_DEVICE


class MacsAnimationsEnabledSwitch(SwitchEntity, RestoreEntity):
    _attr_has_entity_name = True
    _attr_name = "Animations Enabled"
    _attr_translation_key = "animations_enabled"
    _attr_unique_id = "nabu_macs_animations_enabled"
    _attr_suggested_object_id = "nabu_macs_animations_enabled"
    _attr_icon = "mdi:animation-play"
    _attr_is_on = True

    async def async_turn_on(self, **kwargs) -> None:
        self._attr_is_on = True
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs) -> None:
        self._attr_is_on = False
        self.async_write_ha_state()

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last_state = await self.async_get_last_state()
        if last_state:
            self._attr_is_on = last_state.state == "on"

    @property
    def device_info(self) -> DeviceInfo:
        return MACS_DEVICE
