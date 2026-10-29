# Nabu MACS 2.0 – HACS telepítési és frissítési útmutató

## Jelenlegi állapot

A HACS csak nyilvános GitHub repositoryt tud hozzáadni. A repository publikálása
nem része ennek az előkészítésnek. HACS telepítés, Docker teszt és éles Home
Assistant telepítés nem történt.

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
`/nabu_macs/macs.js?v=2.0.0-dev.16` erőforrást. YAML Lovelace-erőforrások esetén
kézzel add hozzá modul típussal:

```yaml
url: /nabu_macs/macs.js?v=2.0.0-dev.16
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
asset nevét egyeztesd. Az aktuális `2.0.0-dev.16` helyi archívum tesztelési
artifact, nem publikált release.

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
