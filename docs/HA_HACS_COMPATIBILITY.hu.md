# Home Assistant és HACS kompatibilitási jelentés

**Ellenőrzés:** 2026-10-29 · **Komponens:** `nabu_macs` · **Éles rendszer:** nem érintett.

Jelölések: `PASS` ténylegesen ellenőrizve; `FAIL` ismert eltérés; `NOT TESTED`
nem futtatható vagy nincs bizonyíték. Forrásellenőrzés és HA-stub teszt önmagában
nem bizonyít élő Home Assistant-kompatibilitást.

| Ellenőrzés | Állapot | Módszer / eredmény |
|---|---|---|
| Elkülönített domain és útvonalak | PASS | `nabu_macs`, `/nabu_macs/`, saját `custom:nabu-macs-card`; izolációs tesztek |
| Eredeti `custom_components/macs` változatlansága | PASS | SHA-256-alapú megőrzési ellenőrzések a tesztkészletben; a fázisban nem módosult |
| Manifest JSON, szükséges HA mezők és verzió | PASS / korlátozott | JSON és statikus tesztek; `2.0.0-dev.16`, `config_flow`, `iot_class`, `integration_type: helper`, domain/name megvan |
| Manifest HACS mezők | PASS, statikus | A Nabu saját dokumentáció/issue URL-t és `@szultan12` codeowner-t kapott; valódi URL-ek csak publikálás után elérhetők |
| Brand ikon | PASS, helyi | Saját, 256×256 PNG a `custom_components/nabu_macs/brand/icon.png` útvonalon; Home Assistant brands külső nyilvántartása nincs ellenőrizve |
| Minimális Home Assistant verzió | NOT TESTED | Sem a manifest, sem a HACS metadata nem rögzíti; nincs régebbi verzióval végzett próba |
| Config flow és singleton | PASS, stub | Python API-helyettesítős tesztek; HA Core flow futtatás nem történt |
| Setup / unload / remove és saját Lovelace resource | PASS, stub | Egységtesztek ellenőrzik a reloadot, bejegyzéseltávolítást, hibás unloadot és MACS resource megőrzését |
| Szolgáltatások életciklusa | FAIL / felülvizsgálandó | Szolgáltatások `async_setup_entry` alatt regisztrálódnak; a [HA szolgáltatás útmutató](https://developers.home-assistant.io/docs/dev_101_services/) `async_setup`-ot ír elő |
| Valódi Home Assistant Core betöltés | NOT TESTED | Docker CLI/Desktop nem érhető el, HASS tesztfüggőségek és futó Core nincs |
| `hassfest` | NOT TESTED | Nincs futtatott validáció |
| Frontend erőforrás regisztráció | PASS, statikus/stub | `async_register_static_paths`, saját version query URL, reload- és eltávolítási egységtesztek |
| Valódi HA frontendben custom card/editor | NOT TESTED | Offline böngésző teszt elérhető; valódi HA frontend nincs |
| 3D GLB és lokális Three.js függőségek | PASS, offline böngésző | A kiadási fájllistában a helyi GLB és Three.js modulok megmaradnak; rig/preview tesztek |
| WebGL fallback és erőforrások | PASS, offline böngésző | Korábbi 3D lifecycle tesztek SVG fallbacket, canvasszámot és dispose-t ellenőrzik |
| Assist/media player | PASS, offline/stub | Kiválasztott entitás `playing`/paused/idle/hiányzó állapotai és lejátszás leállítása tesztelve; publikus default nincs |
| Fejlesztői Home Assistant entity ID adatvédelme | PASS, statikus | A publikus default üres; saját médiaentitást kell szerkesztőben beállítani; az egyedi ID nem kerül a csomagba |
| FPS 30/60, SVG/GLB közös ciklus | PASS, offline | Normalizálás, export/import, célütemező és kártyaciklus tesztelve; éles hardver FPS nem garantált |
| Hidden Lovelace card pause | NOT TESTED | Document visibility, pause/dispose útvonal statikusan látható; HA conditional kártyás runtime próba nincs |
| HACS kiadási ZIP | PASS, helyi | `dist/nabu_macs.zip` a Nabu integráció fájljait tartalmazza közvetlenül a ZIP gyökerében; nincs benne MACS, labor vagy tesztkód |
| HACS repository struktúra – fejlesztői ág | FAIL | Fejlesztői ág `custom_components/` alatt a régi `macs` és a `nabu_macs` mappa is szerepel; ezt az ágat nem szabad publikálni |
| HACS repository struktúra – `hacs-publish-prep` | PASS, statikus | Orphan publikációs ágban pontosan egy integration: `custom_components/nabu_macs`; a régi MACS és előzményei nincsenek az ág fájlfájában/előzményeiben |
| `hacs.json` és HACS manifest | PASS, statikus | `name`, ZIP release/asset neve, `hide_default_branch=false`; manifest dokumentáció, issue tracker, codeowner és verzió ellenőrizve |
| HACS Action / `hassfest` | NOT TESTED | Nincs helyben `hacs`/HACS-validátor, Docker CLI vagy GitHub Actions futtatás. Futtatandó a publikáció után; statikus ellenőrzés nem HACS-validáció |
| HACS custom repository hozzáadás | NOT TESTED | A megadott GitHub repository üres és privát. HACS csak nyilvános GitHub repositoryt támogat |
| Gyökér licenc felismerése | PASS, statikus | `LICENSE` teljes MIT-szöveg és Copyright (c) 2026 szultan12; a MACS-eredetű források licencét a csomagban megőrzött `LICENSE.upstream` külön kezeli; HACS Action megerősítése még szükséges |
| MACS-forrás licencmegőrzése | PASS, fájlszinten jelölve | A CC BY-NC-SA 4.0 licenc teljes szövege megmarad; a Nabu MIT-licenc nem vonatkozik a MACS upstreamből származó részekre |
| Izolált Docker labor | NOT TESTED | Docker CLI/Desktop nincs; Compose YAML csak korábbi statikus vizsgálattal lett lefedve |
| Raspberry Pi 4 CPU/GPU/memória | NOT TESTED | Pi hardveren mérés nem történt; 30/60 FPS célérték, nem teljesítményígéret |
| GitHub Release / publikus kiadás | NOT TESTED | Helyi ZIP előkészítve, távoli GitHub kiadás és publikálás nem történt |
| 3D GLB nyilvános terjesztési jog | NOT TESTED | Felhasználó által adott Tripo GLB; a dokumentáció nem igazolja önálló nyilvános terjesztési engedélyét |

## Verzió és API-megjegyzések

A `manifest.json` verziója `2.0.0-dev.16`; a Home Assistant minimuma nincs
deklarálva. A Home Assistant dokumentációja a `hass.http.async_register_static_paths`
API-t jelöli a statikus fájlok kiszolgálására, ezt használja az integráció
([dokumentáció](https://developers.home-assistant.io/blog/2021/01/29/custom-integration-changes/)).
A szolgáltatásregisztráció jelenlegi helye eltér a jelenlegi fejlesztői ajánlástól.
Ezt hassfest és támogatott Core verzióban kell lezárni, mielőtt kompatibilisnek
nyilvánítanánk.

## A kiadás előtti kötelező munkák

1. Ne tedd nyilvánossá a forrás-/3D-modell terjesztési engedély ellenőrzése előtt.
2. A HACS `hacs-publish-prep` orphan ágat használd a feltöltéshez; ne pushold a
   teljes fejlesztői `master` ágat, mert az tartalmazza az eredeti MACS integrációt.
3. Kérdezd le a GitHub Action eredményét a HACS validációhoz és hassfesthez; valódi
   HACS/HACS Marketplace telepítés, frissítés, eltávolítás és README-link csak
   nyilvános repository után ellenőrizhető.
4. Rögzítsd és teszteld a minimális HA verziót; javítsd vagy igazold a
   szolgáltatások `async_setup`-beli regisztrációját,
   majd futtasd a valódi izolált HA telepítés, reload, eltávolítás és frontend
   ellenőrzést.
5. Push után ellenőrizd, hogy a HACS Action a gyökér MIT licencet elfogadja-e;
   a gyökér licencfelismerése önmagában nem bizonyítja a teljes integráció
   kiadhatóságát, és a CC-licencelt fájlok terjesztési feltételeit is be kell
   tartani.
6. Docker laborral és Raspberry Pi 4 kioszkkal végezz runtime és teljesítmény QA-t.
   Csak ezután készíts publikus HACS Release-t és külön éles telepítési tervet.
   E munkamenet nem kapcsolódott éles HA-hoz.
