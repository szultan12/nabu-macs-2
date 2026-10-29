# Forrásmegjelölés és licenc

## MACS eredetű források

A Nabu MACS 2.0 a Glyn Davidson által készített [MACS integráció](https://github.com/glyndavidson/MACS)
forrásaiból származó módosításokat tartalmaz. A felhasznált alapverzió a MACS
v1.0.9, upstream commit `23727876e8764cbc9bd7bb9676771f6bf4ceeb93`.

Az upstream licenc **Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International (CC BY-NC-SA 4.0)**. A gyökér `LICENSE` és az integrációs csomagban
levő `LICENSE.upstream` tartalmazza a licencszöveget. A MACS eredetű és az abból
származó Nabu-forrásokat a licenc feltételeivel összhangban kell terjeszteni.
Ez a projekt nem az eredeti MACS hivatalos kiadása.

## Harmadik féltől származó függőségek

A helyben csomagolt Three.js r180 és meshopt decoder licencét és eredetét az
integráció `www/vendor/THREE-LICENSE.txt` és `www/vendor/sources.json` fájljai
rögzítik. Futásidőben CDN-t nem igényel.

## 3D-modell

`www/models/nabu-original.glb` és `www/models/nabu-animated.glb` a felhasználó
által biztosított Tripo-modellből származik. Nem része automatikusan a MACS
CC BY-NC-SA licencének. A modell és textúrái nyilvános terjesztési engedélye
nincs ebben a repositoryban dokumentálva; publikus feltöltés előtt ezt külön
igazolni kell. A Nabu forráslicenc nem ruház át modellszerzői jogot.
