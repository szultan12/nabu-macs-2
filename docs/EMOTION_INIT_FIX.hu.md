# dev.18 – inicializálási érzelemhiba

## Ok és érintett kód

MacsCard.js, hass setter: a korábbi kifejezés
`overrideMood ? overrideMood : ((assistEnabled && assistMood) ? assistMood : baseMood)`
az igaz értékű `idle` sztringet is Assist-felülbírálásnak vette. Ez a már helyesen
kiszámolt explicit Lovelace baseMood helyére lépett. A hibás mood bekerült a
`_pendingState` objektumba. `_buildConfigPayload()` ezt részesítette előnyben
(`_pendingState?.mood ?? _config.emotion`), `_sendInitToIframe()` pedig külön
`snapshot.mood` értéket küldött. Így a napló selected=shocked, sent=idle értékei
ugyanabban az üzenetben előállhattak. A dev.17 keverékjavítása ezt nem fedte le.

## Javítás

Az új `_resolveMood(candidate)` minden explicit emotion kulcs esetén az aktuális
Lovelace-konfiguráció normalizált értékét használja. Init, config, mood és pending
flush ugyanazt a szabályt követi. Az init mood a config.emotion értékéből származik,
és a lastMood is ezt rögzíti. Egy késleltetett snapshot nem tudja felülírni a
jelenlegi kézi választást. A régi keverék kizárása megmaradt.

Explicit emotion hiányában az aktív Assist-hangulat továbbra is használható,
de az idle Assist visszaengedi a HA-selectet. A Personality Engine külön rétege,
a beszéd, fényudvar, GLB és CSS nem módosult.

## Regresszió

A tools/emotion-regression.mjs mentett shocked konfigurációból létrehozza a
regisztrált Lovelace-kártyát: select=idle, Assist=idle, régi mix={idle:100}.
Ellenőrzi az első frontend init mood és config.emotion shocked értékeit, a
controller shocked állapotát, a GLB jawOpen > 0.2 tényleges visszaolvasását és
mind a 19 morphtarget jelenlétét. Két eltérő sorrendben újraküld stale idle
snapshotot használó init/config/mood üzeneteket; mindegyik a kézi shocked
értéket továbbítja. Ezután öt élő editor-váltás különböző renderképet és
morphértékeket ad. A beszédteszt és a médialejátszó playing/paused regresszió
megmarad. Végül az explicit emotion eltávolítása után a HA-select happy
állapota controller=happy és tényleges smile > 0.7 eredményt ad.

A teszt az izolált QA-másolat localhost:8130 előnézetét használja. A végleges
komponenssel 74/74 JavaScript-teszt és a statikus import/szintaxisellenőrzés
sikeres. Python: 13 sikeres, 4 kihagyott (PyYAML hiányzik a QA-másolatban);
a 6 integrációs Python-fájl szintaxisa megfelelő. HA runtime teszt nem történt.

Kiadás: manifest 2.0.0-dev.18. A régi helyi nabu_macs.zip nem lett felülírva;
az új release-hez új ZIP szükséges, a tools/build_release.py használatával.
A változás csak a hacs-publish-prep ágon készül; master, Docker, éles HA és
GitHub push nem érintett.
