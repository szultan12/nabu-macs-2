# Forrásmegjelölés és licenc

## Nabu MACS saját forráskódja

A kiadási csomagban található `LICENSE` a Nabu MACS saját, eredeti
forráskódjára és dokumentációjára vonatkozó MIT License. Copyright (c) 2026
szultan12. Nem terjed ki külön megjelölt harmadik féltől származó vagy MACS
upstreamből származó anyagokra, illetve a 3D modellre és textúráira.

## MACS eredetű források

A Nabu MACS 2.0 a Glyn Davidson által készített
[MACS integráció](https://github.com/glyndavidson/MACS) v1.0.9-es alapjából
származó anyagokat tartalmaz (upstream commit
`23727876e8764cbc9bd7bb9676771f6bf4ceeb93`). Az ilyen MACS-eredetű és abból
származó módosított anyagokra továbbra is a Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
feltételei vonatkoznak. A teljes licencszöveg a csomag `LICENSE.upstream`
fájljában és a [hivatalos licencoldalon](https://creativecommons.org/licenses/by-nc-sa/4.0/)
található. A Nabu MIT-licenc nem írja felül a MACS upstream licencét. Ez a
projekt nem az eredeti MACS hivatalos kiadása.

## Harmadik féltől származó függőségek

A Three.js r180 saját MIT licencszövege a
`www/vendor/THREE-LICENSE.txt` fájlban található, verzióját és eredetét a
`www/vendor/sources.json` rögzíti. A meshopt decoder saját licence és
forrásmegjelölése az érintett vendored fájlban marad.

## 3D-modell és textúrák

`www/models/nabu-original.glb` és `www/models/nabu-animated.glb` a felhasználó
által biztosított Tripo-modellből származik. A modell és textúrái nem részei
automatikusan sem a Nabu saját MIT-, sem a MACS CC-licencének. Nyilvános
terjesztési engedélyük nincs itt igazolva; ezt a modelljogosulttal külön kell
tisztázni. A forráskód licencelése nem ruház át modellszerzői jogot.
