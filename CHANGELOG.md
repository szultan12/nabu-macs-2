# Változásnapló

## HACS metaadat-javítás (dev.17 után)

- Alapértelmezett ág elrejtése: hide_default_branch true; ZIP-release mód változatlan.
- A dev.17 prerelease és ZIP-csatolmány API-ellenőrzése; magyar verzióválasztási
  és helyreállítási útmutató, HA-adatok módosítása nélkül.


## 2.0.0-dev.17

- Mentett emotion_mix nem maszkolja az explicit Lovelace érzelmet.
- Kikapcsolható, adatminimalizált card/iframe/controller/GLB Console-diagnosztika.
- Valódi morph-visszaolvasás és offline böngészős regressziós teszt.
- Kiadási ZIP készítése duplikált licencek nélkül.


## 2.0.0-dev.16 – 2026-10-29

- A Nabu saját forráskódjának MIT-licence és szerzői jogi sora; a MACS upstream
  CC BY-NC-SA, a vendored függőségek és a Tripo-modell eltérő jogállása külön
  dokumentálva és megőrizve.
- A manifestben a vizuális automatizálási entitásokhoz illő hivatalos
  `integration_type: helper` megadva.
- Hassfest translation/manifest preflight javítások: rendezett manifestkulcsok,
  üres config flow-hoz illesztett `strings.json`, teljes angol és magyar fordítás.
- HACS-publikációs metaadatok és külön, csak Nabu integrációt tartalmazó
  publikációs ág előkészítése.
- A publikus alapkonfiguráció nem tartalmaz fejlesztőspecifikus Home Assistant
  médialejátszó-entitásazonosítót; a felhasználó saját entitást állít be.
- Magyar HACS telepítési és publikációs útmutató, licenc- és adatvédelmi audit,
  brand ikon és csomagellenőrzés.

## 2.0.0-dev.15 – 2026-10-29

- Lovelace editor beszédteszt gomb: 8 másodperces próba a meglévő speechFx
  vezérlővel; GLB jaw morph és médialejátszó-állapot Playwright/WebGL tesztelve.
- HACS metaadatok, magyar telepítési útmutató, root licencfájl, brand ikon,
  publikációs dokumentáció és érzékeny HA fájlokat kizáró gitignore szabályok.
- HACS-ra szánt külön orphan ág előkészítve; a fejlesztői ágban levő régi MACS
  integráció nem kerül bele. HACS GitHub Action/hassfest és valódi HA ellenőrzés
  futtatásához még publikus repository és a felhasználó által végzett feltöltés kell.

## 2.0.0-dev.10 – 2026-10-29

- Választható, konfigurációban tárolt 30/60 FPS; az alapérték 30.
- Az SVG, beszéd, pislogás, szem/fej, érzelemátmenet és reakció egy közös,
  eltelt időre ütemezett RAF-ciklust használ; a GLB külön FPS-szűrése megszűnt.
- Offline előnézet és magyar Personality Editor FPS-vezérlőkkel; unit-testek
  ellenőrzik az értékek, export/import, célütemezés és felszabadítás kezelését.
- HA/HACS kompatibilitási audit és kiadási függőségek dokumentálva.
- A hassfest, HACS-telepítés, Docker/valódi HA és Pi 4 tesztelés nem történt meg.

## 2.0.0-dev.9 – 2026-10-29

- Az offline előnézetből kikerült az időjárás, hőmérséklet, töltöttség, keverés, valamint a szem- és fejszín vezérlője; az érzelemkeverő és HA-funkciók megmaradtak.
- A desktop vezérlőpanel két oszlopba rendeződött; Playwright ellenőrzi a 390/768/1280 px nézeteket, a 26 érzelmet, a színezést, az időjárás- és akkumulátoreseményeket.
- A 3. fázis eredeti feladatlistája kész; Docker CLI hiányában az izolált konténerfuttatás függőben.
- Blenderben létrehozott és ellenőrzött külön animált GLB: 19 Shape Key, nyak–fej csont és mintaanimáció.
- Anatómiai régiókra kalibrált ajakrés, erősebb középső alsóajak-mozgás, íves szemhéjzárás, aszimmetrikus szemöldök és szájzug.
- 26 érzelem 3D-leképezése, intenzitás/keverés, beszéd, pislogás, fejmozgás és álló póznál renderelési szünet.
- Az eredeti modell változatlan; a származtatott háló kb. 234 ezer háromszög.
- 55 JS + 16 Python teszt; 26 Blender-póz, 6 valódi animációképkocka, 26 böngészős póz és funkcionális animációtesztek.
- Docker-validáció megkísérelve, Docker Desktop hiánya miatt blokkolva. Éles HA-t nem érintettünk.

## 2.0.0-dev.8 – 2026-10-29

- Saját, változatlan GLB alapértelmezett avatarként, helyi Three.js r180 és meshopt decoder.
- Szemből beállított kamera, stúdióvilágítás, kamera/light vezérlők, SVG/WebGL fallback.
- Közös animációóra, korlátozott 3D-renderelés, grafikai erőforrások felszabadítása.
- Blender-dekódolás és kalibrációs munkapéldány; 13 csatornás arcrig-interfész.
- A modell rig nélküli: a 26 érzelem 3D arcmimikája fejlesztés alatt.
- 55 JS + 13 Python teszt, külön SVG és GLB böngészőteszt.

## 2.0.0-dev.7 – 2026-10-28/29

- Saját localhost Docker-labor, demó entitások és események, indító/leállító script.
- Dokumentum-elrejtéskor szüneteltetés és kilépéskori takarítás.
- 100 renderelő-életciklus teszt; YAML-izoláció és determinisztikus HACS ZIP.
- A konténer futtatása Docker hiányában nem történt meg.

## 2.0.0-dev.6 – 2026-10-28

- Magyar személyiségpanel; verziózott JSON import/export és profilkezelés.
- Offline szín-, minőség-, teljesképernyő-vezérlők és renderdiagnosztika.
- 51 JavaScript-teszt; profil round-trip és diagnosztika böngészőben ellenőrizve.

## 2.0.0-dev.5 – 2026-10-28

- Opt-in reakciók, prioritás, cooldown, lejárat és kézi hangulat védelme.
- Szűrt, felszabadítható HA eseményfeliratkozások; Assist-reakciók, felirat és érintés.
- Bővített offline szimulátor; 49 JS teszt és külön értesítési böngészőteszt.

## 2.0.0-dev.4 – 2026-10-28

- Playing állapotból beszédanimáció, három stílus és leállási helyreállítás.
- Rétegzett pislogás, tekintet, fejmozgás, tétlenség és ébredés.
- Szimulált médialejátszó az offline demóban; 45 JS teszt, három beszédstílus böngészős tesztje.

## 2.0.0-dev.3 – 2026-10-28

- 26 numerikusan animált érzelem, folyamatos intenzitás és súlyozott keverés.
- Megszakítható átmenet, opcionális színváltás, közös arcvezérlés minden témán.
- Kibővített HA select/szolgáltatás és offline érzelmi tesztpanel.
- 40 JS + 7 Python teszt; 78 téma/hangulat páros valódi böngészőben ellenőrizve.

## 2.0.0-dev.2 – 2026-10-28

- Saját rétegezett SVG-fej, Classic MACS / Nabu EVE / Nabu Dark témák.
- Validált, külön kártyánként állítható színek, fényudvar, méret és pozíció.
- Magyar megjelenési panel a meglévő Lovelace-editorban.
- Témaváltáskor akkumulátorszínek újraszámolása; régi hangulat- és effektazonosítók megőrzése.
- 17 eredeti grafikai fájl pótlása ellenőrzött MACS v1.0.9 forrásból.
- Offline karakterlabor, 36 JS + 7 Python teszt, valódi böngészős ellenőrzések.
- Élő HA és éles dashboard nem módosult. 25+ érzelem és beszédanimáció későbbi fázis.

## 2.0.0-dev.1 – 2026-10-28

- Önálló nabu_macs komponens az eredeti MACS mellett.
- Saját custom elementek, resource, entity/device unique_id, szolgáltatások,
  események és JavaScript-globálisok.
- Korábbi stabilitási javítások és max_turns támogatás megtartva.
- Entity migration és Assist-exposure opcióátírás eltávolítva a Nabu kódból.
- Singleton config flow, rendezett reload/unload/remove életciklus.
- Átnevezett entitásokhoz explicit olvasási konfiguráció.
- Szenzorhibák külön diagnosztikában; HTML-mentes és korlátozott méretű napló.
- Kioszk csak saját kártyán, HA-globális CSS-injektálás nélkül.
- 30 JS és 7 Python offline teszt, statikus ellenőrzések és dokumentált korlátok.

Fejlesztői verzió: nem élő HA-ban igazolt vagy HACS-on kiadott csomag.
