# Nabu MACS 2.0

Animált 3D-avatar és Lovelace-kártya Home Assistanthez. A kártya 26 érzelemmel,
GLB-morph alapú arcmimikával, médialejátszóhoz kapcsolható beszédanimációval,
természetes szem- és fejmozgással, valamint személyiségreakciókkal működik.

**Verzió:** `2.0.0-dev.16`  
**Állapot:** fejlesztői kiadás. A HACS Action és hassfest még nem futott le, és
valódi Home Assistant telepítési/eltávolítási próba sincs igazolva. A minimális
támogatott Home Assistant verziót még nem határoztuk meg.

## HACS telepítése

Ehhez a GitHub repositorynak nyilvánosnak kell lennie. Miután a repository
tulajdonosa közzétette, Home Assistantban:

1. Nyisd meg a HACS → Integrations oldalt.
2. A menüben válaszd a **Custom repositories / Egyéni tárolók** elemet.
3. Add meg: `https://github.com/szultan12/nabu-macs-2`.
4. Kategóriának válaszd az **Integration** típust, majd add hozzá.
5. Keresd meg és telepítsd a Nabu MACS integrációt.
6. Indítsd újra Home Assistantot, majd add hozzá a Nabu MACS integrációt az
   Eszközök és szolgáltatások oldalon.
7. Adj hozzá külön `custom:nabu-macs-card` Lovelace-kártyát.

**Home Assistant 2026.11 vagy újabb:** a beépített Marketplace felváltja a HACS
integrációt; ellenőrizd az adott verzió Marketplace útmutatóját, mert a fenti
klasszikus HACS menüpont megváltozhat.

Az integráció Storage módban automatikusan regisztrálja a saját Lovelace
erőforrását. YAML-erőforrás esetén az URL
`/nabu_macs/macs.js?v=2.0.0-dev.16`, a típus `module`. Részletes lépések és
visszaállítás: [telepítési útmutató](docs/INSTALL.hu.md).

## Médialejátszó és adatvédelem

A médialejátszó entitását a kártyaszerkesztő **Személyiség, beszéd és mozgás**
szakaszában állítsd be. A publikus csomag nem tartalmaz fejlesztői Home Assistant
egyedi entitásazonosítót, és nem igényel tokent vagy külső szolgáltatást.

## Korlátok

- WebGL és kliensoldali GPU szükséges a 3D-avatarhoz.
- A Raspberry Pi 4 és más célhardverek teljesítménye nincs mérve.
- Valódi Home Assistant Core kompatibilitás, integráció betöltés/eltávolítás,
  HACS Action és hassfest még ellenőrzendő.
- A HACS ZIP-kiadás az adott verziójú GitHub Release-hez csatolt
  `nabu_macs.zip` fájlt használja.
- A forrás upstream licencfeltételei CC BY-NC-SA 4.0; ez nem OSI-jóváhagyott
  licenc. A HACS alapértelmezett katalógusába való felvételt ez megakadályozza.
- A Tripo GLB és textúrái nyilvános terjesztési jogát külön tisztázni kell.

Részletek: [HA/HACS kompatibilitási jelentés](docs/HA_HACS_COMPATIBILITY.hu.md),
[publikációs ellenőrzőlista](docs/HACS_PUBLISH_CHECKLIST.hu.md),
[licenc és forrásmegjelölés](NOTICE.md), [változásnapló](CHANGELOG.md).
