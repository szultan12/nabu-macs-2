# Voice Assist párbeszéd – dev.19

A Display Dialogue az assist_pipeline_enabled kapcsolót és az
assist_pipeline_entity pipeline-azonosítót használja. A subtitles_enabled csak
az átmeneti feliratot engedélyezi, nem indít Assist-adatlekérdezést.

A hiba: a tracker csak conversation.home_assistant state_changed eseményére
frissített. A Voice segédállomás listening/processing/responding/idle állapotai
nem indítottak lekérdezést. A subtitle küldése ráadásul egy új Personality
kimenetelhez kapcsolódott, és csak a választ küldte. Most a konfigurált satellite
és media player state_changed is frissít, a felirat külön követi a legfrissebb
valódi kérdés/válasz szövegét. Azonos runId frissül, nem duplikálódik.

Adatút: hitelesített hass.callWS → assist_pipeline/pipeline_debug/list →
assist_pipeline/pipeline_debug/get → stt-end/intent-start kérdés és intent-end
plain speech válasz (tts-start tts_input tartalék) → nabu_macs:turns →
assist-bridge HTML-escape-elt kérdés/válasz buborékok. Felirat: nabu_macs:subtitle
→ notificationFx textContent, subtitle_seconds időtartammal.

Nincs globális assist_pipeline_event vagy assist_listening feliratkozás.
Az assist_pipeline/run WS eseményfolyama az azt indító klienshez tartozik;
a már működő fizikai satellite futását nem indítjuk újra. A Core által biztosított
debug/list és debug/get végpontokat használjuk. Ezek diagnosztikai API-k,
adminjogot igényelnek, korlátozott memóriabeli előzményt adnak, és Core-verzióval
változhatnak. Üres, hiányzó vagy jogosultsághibás válaszból nem készül párbeszéd.
A normál állapotváltások és rövid, korlátozott újraolvasások frissítik a futást;
hiányzó állapotjelzés vagy napló esetén a szöveg nem garantált.

## Beállítás a felhasználó által

1. Kapcsold be a Display Dialogue-ot (assist_pipeline_enabled: true).
2. Az Assist-folyamat mezőben azt a pipeline-t válaszd, amelyet a Voice eszköz
   ténylegesen használ. Ez pipeline ID, nem assist_satellite entitásazonosító.
3. A segédállomás mezőben a saját Voice assist_satellite entitásodat válaszd;
   a beszéd médialejátszóját külön a speech_media_player mezőben állítsd be.
4. subtitles_enabled: true és subtitle_seconds: 8 az időzített felirathoz.
5. Adminjogú HA munkamenettel ellenőrizd a Chrome Network WebSocket kereteiben
   a debug/list és debug/get sikeres eredményét. A szöveget ne oszd meg nyilvánosan.

A kérdés/válasz csak akkor jelenhet meg, ha a választott pipeline debug/get
válasza tartalmazza. Ha több eszköz használja ugyanazt a pipeline-t, a legfrissebb
futás más eszközé is lehet: a list API nem biztosít satellite szerinti szűrést.
A cél eszközhöz külön pipeline használata javasolt. Ez nem valósidejű,
eszközhöz garantáltan kötött feliratozási API.

## Ellenőrzés és korlátok

74 JS teszt sikeres; statikus JS/import-ellenőrzés sikeres. Python 13 sikeres,
4 kihagyott (PyYAML hiányzik az izolált QA-másolatban). Az új
 tools/voice-dialogue-regression.mjs valódi böngészőmodullal, helyettesített HA
API-val ellenőrzi a satellite-frissítést, az idegen eszköz kizárását, a részleges
és kész szöveget, ismétlést, hibás/megszakított eseményt és dispose-t.
Éles Voice debug szöveget nem olvastunk: az éles működés további felhasználói
ellenőrzést igényel. Nem módosult eredeti MACS, Docker vagy éles HA; push nincs.
Új HACS release és új ZIP szükséges a frontend javítás telepítéséhez.

Források:
https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/assist_pipeline/websocket_api.py
https://developers.home-assistant.io/docs/voice/pipelines/
