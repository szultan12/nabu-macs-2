# HACS publikációs ellenőrzőlista

Ez az útmutató a `hacs-publish-prep` ágra és a `nabu-macs-2` GitHub repositoryra
vonatkozik. A GitHubra feltöltést még nem végeztük el.

## Publikációs ág

A HACS integrációs repository egyetlen integrációt tartalmazhat a
`custom_components/<domain>/` alatt. Ezért a publikációs ág a `hacs-publish-prep`
orphan ágon készül. A fejlesztői `master` ág `custom_components/macs` és
`custom_components/nabu_macs` könyvtárat is tartalmaz, valamint korábbi lokális
fejlesztési előzményeket; ezt az ágat és előzményeit ne pushold a publikus
repositoryba.

## Feltöltés előtt kötelező

- A gyökér `LICENSE` a Nabu saját kódjának MIT-licencét tartalmazza. A MACS
  upstreamből származó kódok CC BY-NC-SA 4.0 licencét és forrásmegjelölését
  őrizd meg; a Nabu licencváltása ezekre nem terjed ki. A teljes upstream
  licencnek a `custom_components/nabu_macs/LICENSE.upstream` fájlban is meg kell
  maradnia a HACS kiadási csomagban.
- Tisztázd a Tripo GLB modell és textúrái nyilvános repositoryban történő
  terjesztési jogát. A jelenlegi forrás nem tartalmaz erre külön licencet.
- A megadott GitHub repository még privát/üres állapotú. HACS-hoz nyilvános
  repository szükséges; a nyilvánossá tételt és feltöltést a felhasználó végzi.
- Ellenőrizd, hogy a cél Home Assistant 2026.11 vagy újabb-e: a beépített
  Marketplace váltja fel a HACS integrációt, így az alább írt klasszikus HACS
  menüpont nem feltétlenül lesz elérhető.
- A repo tulajdonosa ellenőrizze az Issues engedélyezését és a GitHub leírást.
- Push után ellenőrizd a HACS Action és a hassfest workflow-kat. Egyik sem futott
  helyben vagy távolról ezen az előkészítésen.
- Csak sikeres ellenőrzések után készíts `2.0.0-dev.16` vagy stabil, egyeztetett
  tagű GitHub Release-t, és add hozzá a `nabu_macs.zip` assetet.

## Kiadási csomag

`hacs.json` az integration csomagoknál támogatott `zip_release` módot és a
`nabu_macs.zip` assetnevet rögzíti. A lokális `dist/nabu_macs.zip` gyökerében
közvetlenül a `nabu_macs` integráció fájljai állnak. A release artifact nem Gitben
követett fájl: HACS letöltéskor a tagelt GitHub Release assetet keresi.

A HACS ágban szerepeljen:

- `custom_components/nabu_macs/` (Python, `www/`, GLB-modellek, Three.js, CSS,
  képek és saját brand ikon)
- `hacs.json`, `README.md`, `LICENSE`, `LICENSE.upstream`, `NOTICE.md`,
  `CHANGELOG.md`; a kiadási archívum integrációs gyökerében a saját `LICENSE`,
  `LICENSE.upstream`, `NOTICE.md` és a Three.js/meshopt licencmegjelölések
- HACS/HA telepítési és kompatibilitási dokumentáció
- HACS Action és hassfest workflow a későbbi CI-validációhoz

Ne kerüljön a publikációs ágra vagy release ZIP-be:

- `custom_components/macs/` – a régi MACS integráció
- `lab/`, `tests/`, `node_modules/`, `dist/` (a ZIP-et külön GitHub Release assetként
  csatold, ne committold)
- `.storage/`, `secrets.yaml`, `.env`, HA-adatbázis, logok vagy valódi HA-konfiguráció
- helyi fejlesztési dokumentumok, amelyek személyes Windows-felhasználói vagy
  teszt-Home-Assistant útvonalakat tartalmaznak; a publikációs ág csak a
  felülvizsgált dokumentumokat tartalmazza

## Feltöltés PowerShellből

Miután a fenti licenc- és nyilvánossági feltételek rendeződtek, a repositoryban
csak a kiadási ágat töltsd fel `main` néven. Ne használj `--all`, `--mirror` vagy
`--tags` opciókat:

```powershell
git status --short --branch
git branch --show-current
git remote -v
git remote add origin https://github.com/szultan12/nabu-macs-2.git
git push -u origin hacs-publish-prep:main
```

Ha `origin` már szerepel, a `git remote add` sort hagyd ki. A push után GitHubon
állítsd be a `main` alapértelmezett ágnak, ellenőrizd mindkét workflow sikerét,
majd – a licenc és a GLB jogainak tisztázása után – hozz létre egy teljes GitHub
Release-t `nabu_macs.zip` csatolmányával. Ne tegyél ki tokent URL-be vagy parancs
argumentumba; használd a GitHub Credential Manager bejelentkezését.

## HACS-on hozzáadás

Csak publikus repository esetén: HACS → Integrations → menü → Custom repositories;
URL `https://github.com/szultan12/nabu-macs-2`, kategória `Integration`, majd a
Nabu MACS kiválasztása és telepítése. Indítsd újra Home Assistantot, add hozzá az
integrációt a config flow-val, és külön Lovelace nézetben próbáld ki. A valódi HA
és a célverzió szerinti HACS/Marketplace ellenőrzése még hátra van.
