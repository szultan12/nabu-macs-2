# Nabu MACS 2.0 – HACS telepítési és frissítési útmutató

## Jelenlegi állapot

A felhasználó a dev.16 verziót HACS-on keresztül már telepítette. A jelenlegi
munkamenet kizárólag helyi forrásmódosítás és nyilvános GitHub API-lekérdezés;
Home Assistant-állapothoz nem kapcsolódtunk.

A HACS integráció és a Home Assistant Marketplace publikálási folyamata verziótól
függően változik. A HACS dokumentációja egy repositoryban egy integrációt ír elő;
a Home Assistant Marketplace útmutatója nyilvános GitHub repositoryt kér.
Ellenőrizd a cél Home Assistant-verzió aktuális útmutatóját is: [HACS
integráció-követelmények](https://www.hacs.dev/docs/publish/integration/) ·
[Home Assistant Marketplace repository-struktúra](https://contributors.home-assistant.io/marketplace/reference/repository-structure/).

A Home Assistant fejlesztői tájékoztatója szerint a 2026.11-es verziótól a
beépített Marketplace váltja fel a HACS integrációt. Emiatt az alábbi klasszikus
HACS menüútvonal csak az ezt megelőző verziókra tekinthető iránymutatónak; 2026.11+
esetén a Marketplace aktuális egyéni repository telepítését külön ellenőrizni kell.
[HACS fogalomtár és 2026.11 átállás](https://contributors.home-assistant.io/glossary/hacs/).

Publikáció előtt ellenőrizd a [HACS/HA kompatibilitási jelentést](HA_HACS_COMPATIBILITY.hu.md),
különösen a licenciazást, a GLB terjesztési jogát, a hassfestet és a valódi HA
betöltési tesztet.

### Licenc és erőforrások

A gyökér `LICENSE` a Nabu saját forráskódját MIT alatt adja ki (Copyright (c)
2026 szultan12). A MACS-ből származó részek CC BY-NC-SA 4.0 alatt maradnak; ezek
teljes licencszövege az integráció `LICENSE.upstream` fájljában van, amelyet a
kiadási csomagban is meg kell őrizni. A Three.js és meshopt licencét a vendored
fájlok mellett tartjuk meg. A Tripo GLB-modell és textúrák külön erőforrások,
nyilvános terjesztési jogukat a forráskód MIT-licence nem rendezi. Részletek:
[NOTICE](../NOTICE.md).

## Egyéni repository hozzáadása HACS-hoz

1. A GitHub tulajdonosa tegye nyilvánossá a repositoryt, miután a forrás, a
   képfájlok és a 3D-modell terjesztési jogát tisztázta.
2. A Home Assistantban nyisd meg a **HACS** oldalt.
3. Nyisd meg a jobb felső sarok menüjét, majd válaszd az **Egyéni tárolók** /
   **Custom repositories** lehetőséget.
4. Add meg ezt az URL-t:
   `https://github.com/szultan12/nabu-macs-2`
5. Kategóriának válaszd az **Integration / Integráció** típust, majd add hozzá.
6. Keresd meg a HACS integrációlistájában a **Nabu MACS** elemet, és válaszd a
   letöltést/telepítést.
7. Indítsd újra Home Assistantot, majd a **Beállítások → Eszközök és
   szolgáltatások → Integráció hozzáadása** résznél keresd meg a Nabu MACS-ot.
8. Hozz létre egy külön Nabu Lovelace-kártyát. Az eredeti MACS-kártyát és a
   meglévő dashboard `conditional` kártyáját ne cseréld le automatikusan.

Az integráció Storage Lovelace módban automatikusan regisztrálja a saját
`/nabu_macs/macs.js?v=2.0.0-dev.17` erőforrást. YAML Lovelace-erőforrások esetén
kézzel add hozzá modul típussal:

```yaml
url: /nabu_macs/macs.js?v=2.0.0-dev.17
type: module
```

Külön tesztnézethez használható kártyaváz:

```yaml
type: custom:nabu-macs-card
```

Az erőforrásútvonal és a config flow forrás alapján ellenőrzött, de valódi
Home Assistantban még nem tesztelt.

## HACS kiadások

A `hacs.json` `zip_release` beállítása miatt tagelt GitHub release-hez csatolni
kell pontosan `nabu_macs.zip` nevű assetet. A ZIP gyökerében közvetlenül a
`custom_components/nabu_macs/` fájljai találhatók. A HACS `filename` és a release
asset nevét egyeztesd. A GitHub API-val ellenőrizve: a `v2.0.0-dev.17` kiadás publikált, nem draft,
viszont **prerelease**. A `nabu_macs.zip` asset állapota `uploaded`, mérete
38 734 847 bájt. Ez a kiadás metaadatainak ellenőrzése, nem a távoli ZIP
tartalmának vagy a telepítésnek a validációja.

## Frissítés és visszaállítás

Frissítés előtt készíts Home Assistant mentést. HACS-on keresztül kizárólag a
Nabu MACS frissítéseit telepítsd; ne másold a repository teljes
`custom_components` mappáját. Frissítés után indítsd újra Home Assistantot és
frissítsd a böngésző cache-ét. Visszaállítás a mentett Nabu integrációs könyvtár
visszaállításával, majd Home Assistant újraindítással végezhető.

## Eltávolítás

1. Töröld a Nabu MACS integrációbejegyzést az Eszközök és szolgáltatások alatt.
2. A HACS integráció oldalán távolítsd el a Nabu MACS repositoryt.
3. Indítsd újra Home Assistantot.
4. Távolítsd el a saját Nabu kártyát és – ha YAML módban adtad hozzá – a saját
   Lovelace resource sort.

Az eredeti MACS, annak dashboard-kártyája és erőforrása nem része ennek az
útmutatónak; azokat ez a telepítés nem módosítja.


## Verzióválasztás helyreállítása (dev.17)

A `hide_default_branch: true` elrejti az alapértelmezett ágat a letölthető
verziók közül. A `zip_release: true` és `filename: nabu_macs.zip` megmarad.
A HACS dokumentációja szerint publikált GitHub Release esetén a tag a verzió;
önmagában egy tag létrehozása nem elég. A kapcsoló nem írja át a már telepített
verzió nyilvántartását, és nem teszi automatikusan láthatóvá az előzetes kiadást.

1. A repository frissített `hacs.json` fájljának feltöltése után frissítsd a
   Nabu repository adatait a HACS felületén (a verzió szerinti frissítés vagy
   újratöltés menüponttal), majd nyisd meg újra az oldalát.
2. Engedélyezd a Nabu előzetes kiadásait. HACS 2-ben a repositoryhoz tartozó
   prerelease kapcsoló entitása alapból letiltott lehet: engedélyezd az entitást,
   majd kapcsold be. Régebbi felületen ez a béta verziók megjelenítése lehet.
3. Az újraletöltés/verzióválasztás párbeszédben kifejezetten a
   `v2.0.0-dev.17` kiadást válaszd. Ne válaszd a `main` ágat vagy az `e13dcf3`
   commitot. Telepítés előtt a felkínált célverziót ellenőrizd.
4. Ha továbbra is csak a commit jelenik meg, ellenőrizd a kiadás láthatóságát,
   a prerelease kapcsolót és a HACS naplóban a GitHub API/korlátozási hibákat.
   Szükség esetén a HACS integráció felületi újratöltése, illetve egy felhasználó
   által kezdeményezett HA-újraindítás után ismét frissítsd a repository adatait.
5. Sikeres letöltés után indítsd újra a Home Assistantot, frissítsd a böngészőt,
   majd ellenőrizd a telepített verziót és a Nabu erőforrás URL-jében a dev.17-et.

A régi commit megjelenhet a *jelenleg telepített* verzió mezőben is; ez önmagában
nem jelenti, hogy a következő letöltés célja is az. A HACS forráskódjában külön
mező az installed_version/installed_commit, selected_tag és show_beta. Ezek
helyi értékei ebben a munkamenetben nem lettek kiolvasva. Ne módosíts HA-adatbázist
vagy `.storage` fájlt, és ne töröld az integrációt a verzióválasztás javításához.

## A repository tulajdonosának kiadási teendői

- Töltsd fel az új helyi commitot a publikációs ágról a GitHub `main` ágára:
  `git push origin hacs-publish-prep:main` (ezt a fejlesztési munkamenet nem futtatja).
- Ellenőrizd a HACS Action sikerét. A dev.17 Release és csatolmány már létezik;
  a tag áthelyezése, a kiadás törlése és a ZIP újrafeltöltése ehhez a
  HACS-metaadat-módosításhoz nem szükséges.
- A dev.17 maradjon előzetes kiadás. A kliensoldali béta kapcsolót a fenti
  lépésekkel engedélyezd; egy későbbi új kiadásnál annak tagjén is legyen már
  `hide_default_branch: true`.
- Ha a HACS az adott telepítésben régi metaadatot tart meg, előbb a felületi
  újratöltési lépésekkel ellenőrizd az eredményt. A távoli HACS futását és a
  kliens tényleges verzióválasztását csak a felhasználó tudja itt igazolni.

Források: [HACS manifest és verziók](https://www.hacs.dev/docs/publish/start/),
[prerelease kapcsolók](https://www.hacs.dev/docs/use/entities/switch/),
[dev.17 Release](https://github.com/szultan12/nabu-macs-2/releases/tag/v2.0.0-dev.17).
