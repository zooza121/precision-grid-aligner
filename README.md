# Precision Grid Aligner for Foundry VTT v13

Ein kleines Foundry-VTT-v13-Modul zur präzisen Ausrichtung von Battlemap-Grids.

## Funktionen

- Zwei verschiebbare grüne 3/4-Kreis-Marker für eine 3×3-Messung
- Quadratisches Grid
- Horizontal Hex (flache Ober-/Unterkante)
- Vertical Hex (Spitze oben/unten)
- Messdistanz je Feld in Fuß
- Optionale Unterteilung in 5-ft-Felder bei 10, 15, 20 ft usw.
- Sehr feine horizontale und vertikale Korrektur von −10 bis +10 px
- Separater Reset-Button für beide Regler
- Deutsches und englisches UI
- Tastenkürzel: **Umschalt+G**

## Installation

1. Den Ordner `precision-grid-aligner` nach `FoundryVTT/Data/modules/` kopieren.
2. Foundry VTT neu starten.
3. Das Modul unter **Module verwalten** aktivieren.
4. Eine Szene öffnen und als Spielleitung auf das Grid-Symbol klicken oder **Umschalt+G** drücken.

## Bedienung

1. Gridtyp auswählen.
2. Den ersten grünen Marker auf eine Grid-Ecke setzen.
3. Den zweiten Marker auf die entsprechende Ecke exakt drei Felder nach rechts/unten setzen.
4. Die Messdistanz eines sichtbaren Kartenfeldes in Fuß angeben.
5. Bei einem quadratischen 10-/15-/20-ft-Grid optional **In 5-ft-Felder unterteilen** aktivieren.
6. Mit den beiden Reglern die Vorschau fein verschieben. Jeder Regler hat in der Mitte den Wert 0 und einen eigenen Reset-Button.
7. **Übernehmen** anklicken.

## Verhalten und Grenzen

Das Modul aktualisiert die Grid-Konfiguration der Szene sowie den horizontalen und vertikalen Hintergrundversatz. Bereits vorhandene Tokens, Wände, Lichter, Zeichnungen und andere Placeables werden nicht zusammen mit dem Hintergrund verschoben. Die Ausrichtung sollte deshalb vorzugsweise vor dem Erstellen dieser Elemente erfolgen.

Foundry verwendet für quadratische Grids eine gemeinsame Pixelgröße für beide Achsen. Stark verzerrte oder perspektivische Karten lassen sich daher nicht vollständig über ein normales Foundry-Grid korrigieren.

## Technische Hinweise

- Zielversion: Foundry VTT v13
- Keine Abhängigkeiten
- Die Grid-Vorschau wird als DOM-/SVG-Overlay dargestellt.
- Die Szene wird erst beim Klick auf **Übernehmen** verändert.

## Inspiration

Das Bedienkonzept ist funktional vom „Super Mega Wizard“ aus AboveVTT inspiriert. Die Implementierung dieses Moduls wurde eigenständig für die Foundry-v13-API erstellt und kopiert keinen AboveVTT-Quellcode.

## Lizenz

MIT License, siehe `LICENSE`.
