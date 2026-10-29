from homeassistant.helpers.device_registry import DeviceInfo

DOMAIN = "nabu_macs"
MACS_DEVICE_ID = "nabu_macs"
MACS_DEVICE = DeviceInfo(
    identifiers={(DOMAIN, MACS_DEVICE_ID)},
    name="Nabu MACS",
    manufacturer="Nabu MACS",
    model="Nabu MACS 2.0",
)
MOODS = (
    "bored", "confused", "happy", "idle", "listening", "sad", "sleeping", "surprised", "thinking",
    "angry", "furious", "grumpy", "sassy", "annoyed", "curious", "shocked", "scared", "embarrassed",
    "love", "excited", "proud", "suspicious", "sleepy", "laughing", "troll", "worried",
)
SERVICE_SET_MOOD = "set_mood"
ATTR_MOOD = "mood"
SERVICE_SET_ANIMATIONS_ENABLED = "set_animations_enabled"
ATTR_ANIMATIONS_ENABLED = "animations_enabled"
SERVICE_SEND_USER_MESSAGE = "send_user_message"
SERVICE_SEND_ASSISTANT_MESSAGE = "send_assistant_message"
ATTR_MESSAGE = "message"
EVENT_MESSAGE = "nabu_macs_message"
