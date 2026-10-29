# dev.17 – érzelem-adatút diagnosztika

A helyben reprodukált hiba: elmentett Lovelace `emotion: happy` mellett az
`emotion_mix: {idle: 100}` semleges pózt eredményezett. A keverő szándékosan
elsőbbséget ad a keveréknek, de a korábban eltávolított UI-mező értéke YAML-ban
megmaradhatott. A kártya most explicit emotion esetén üres keveréket továbbít;
a mentett YAML és az önálló keverőmotor nem változik.

Ez egy igazolt helyi hiba; az éles rendszer konkrét okát adatgyűjtés nélkül
nem tekintjük bizonyítottnak. A `mood=idle` iframe URL csak kezdeti állapot;
a későbbi postMessage üzenetek döntik el a megjelenített érzelmet.

## Bekapcsolás és kikapcsolás

A frissített kiadás felhasználó általi telepítése után a kártya YAML-jába:

```yaml
emotion_debug: true
```

A Console `[Nabu emotion] card` sora a kiválasztott, selectből olvasott és
elküldött hangulatot, a forrást és a régi keverék jelenlétét mutatja.
Az `iframe` sor a fogadott kanonikus érzelmet és vezérlőkapcsolókat mutatja.
A `rendered` sor másodpercenként legfeljebb egyszer írja ki az Emotion Controller
állapotát és minden morph mesh 19 tényleges `morphTargetInfluences` értékét.
Az iframe Console-környezetében `window.nabuEmotionSnapshot()` is lekérdezhető,
akkor is, ha a renderelés szünetel. `null` target hiányzó morphot jelent.

A kikapcsoláshoz töröld a kapcsolót, vagy állítsd false-ra. A segédfüggvény is
eltűnik. Nem keletkezik új időzítő vagy feliratkozás. Assist-szöveg, teljes
konfiguráció, entitásazonosító, token és HA-állapotobjektum nem kerül naplózásra.

## Mentett konfigurációk és prioritások

- Explicit `emotion` elsőbbséget élvez a HA select állapotával szemben, még
  `emotion: idle` esetén is. A select követéséhez távolítsd el az emotion kulcsot.
- `emotion_enabled: false`, nulla intenzitás vagy szüneteltetett animáció
  diagnosztikailag külön eset; ezek értékét nem írjuk át automatikusan.
- A Personality Engine átmeneti reakcióit a `reactionMood` jelzi. Az automatikus
  reakciók elkülönítéséhez ideiglenesen `personality_enabled: false` használható.
- A 19 meshérték tényleges visszaolvasás, nem csupán a kívánt póz számítása.

## Ellenőrzés

A publikációs komponens izolált QA-másolatán: 74/74 JS-teszt; statikus JS/import
és 6 Python-fájl szintaxisellenőrzése sikeres. Python: 13 sikeres, 4 kihagyott
(PyYAML hiányzik az izolált QA-másolatból). A ZIP-duplikációs teszt kezdeti hibája
javítva: a `tools/build_release.py` már meglévő csomagfájlt nem ad hozzá újra.

Playwright/WebGL: mentett happy + idle-keverék mellett tényleges smile morph
> 0.7; 19 target visszaolvasása sikeres. A regisztrált Lovelace editor → kártya
→ iframe útvonalon surprised, happy, angry, laughing és sleeping mind eltérő
képet és morph értékeket adott. A meglévő beszédteszt és médialejátszó-váltások
ugyanebben a böngészős regressziós tesztben futottak.

Újrafuttatás (helyi Playwright és Edge szükséges): `node tools/preview-server.mjs`,
majd másik terminálból `node tools/emotion-regression.mjs`. A teszt kizárólag
127.0.0.1:8130 címet enged; szükség esetén PLAYWRIGHT_MODULE adja meg a telepített
Playwright modul helyét. A képek a docs/screenshots könyvtárba kerülnek.

Éles HA, Docker HA, 8124 port és GitHub push nem volt érintett. A fejlesztői
master nem változott. A kiadási verzió dev.17; a szolgáltatott erőforrások
verziózása a manifestből származik.
