# Forrásmegjelölés és licenc

## Nabu MACS saját forráskódja

A gyökér `LICENSE` a Nabu MACS saját, eredeti forráskódjára és dokumentációjára
vonatkozó MIT License. Copyright (c) 2026 szultan12. Ez a licenc nem terjed ki
a külön megjelölt harmadik féltől származó vagy MACS upstreamből származó
anyagokra, illetve a 3D modellre és textúráira.

## MACS eredetű források

A Nabu MACS 2.0 a Glyn Davidson által készített
[MACS integráció](https://github.com/glyndavidson/MACS) v1.0.9-es alapjából
származó anyagokat tartalmaz (upstream commit
`23727876e8764cbc9bd7bb9676771f6bf4ceeb93`). Az ilyen MACS-eredetű és abból
származó módosított anyagokra továbbra is a Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
feltételei vonatkoznak, a forrásmegjelölési és ShareAlike feltételekkel együtt.
A teljes licencszöveg a kiadható integrációs csomagban lévő
`custom_components/nabu_macs/LICENSE.upstream` fájlban, valamint a
[hivatalos licencoldalon](https://creativecommons.org/licenses/by-nc-sa/4.0/)
található. A Nabu MIT-licenc nem írja felül és nem terjeszti ki a MACS licencét.
Ez a projekt nem az eredeti MACS hivatalos kiadása.

## Harmadik féltől származó függőségek

A helyben csomagolt Three.js r180 saját MIT licencszövege a
`custom_components/nabu_macs/www/vendor/THREE-LICENSE.txt` fájlban található;
a forrás és verzió a `www/vendor/sources.json` fájlban szerepel. A meshopt
decoder saját licence és forrásmegjelölése az érintett vendored fájlban marad.
Ezeket a licenc- és szerzői jogi megjegyzéseket a Nabu licencváltása nem érinti.

## 3D-modell és textúrák

`www/models/nabu-original.glb` és `www/models/nabu-animated.glb` a felhasználó
által biztosított Tripo-modellből származik. A modell és textúrái nem részei
automatikusan sem a Nabu saját kódjára vonatkozó MIT-licencnek, sem a MACS
licencének. Nyilvános terjesztési engedélyük ebben a repositoryban nincs
igazolva; ezt a modelljogosulttal külön kell tisztázni. A forráskód licencelése
nem ruház át modellszerzői jogot.
