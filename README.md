# Precision Grid Aligner for Foundry VTT v13

Ein kleines Foundry-VTT-v13-Modul zur präzisen Ausrichtung von Battlemap-Grids.

## Funktionen

- Zwei unabhängig verschiebbare grüne 3/4-Kreis-Marker als diagonale Anker der 3×3-Messung
- Quadratisches Grid
- Horizontal Hex (flache Ober-/Unterkante)
- Vertical Hex (Spitze oben/unten)
- Messdistanz je Feld in Fuß
- Optionale Unterteilung in 5-ft-Felder bei 10, 15, 20 ft usw.
- Frei verzerrbare 3×3-Vorschau in Breite und Höhe
- Sehr feine horizontale und vertikale Korrektur von −10 bis +10 px
- Separater Reset-Button für beide Regler
- Deutsches und englisches UI
- Eigener Eintrag in der linken Foundry-Werkzeugleiste
- Tastenkürzel: **Umschalt+G**

## Installation

1. Den Ordner `precision-grid-aligner` nach `FoundryVTT/Data/modules/` kopieren.
2. Foundry VTT neu starten.
3. Das Modul unter **Module verwalten** aktivieren.
4. Eine Szene öffnen und als Spielleitung den Precision-Grid-Aligner in der linken Werkzeugleiste auswählen oder **Umschalt+G** drücken.

## Bedienung

1. Gridtyp auswählen.
2. Den ersten grünen Marker auf eine Grid-Ecke setzen.
3. Den zweiten Marker auf die entsprechende diagonale Ecke exakt drei Felder entfernt setzen. Beide Marker dürfen unabhängig verschoben werden; das Vorschaugrid spannt sich immer exakt zwischen ihnen auf.
4. Die Messdistanz eines sichtbaren Kartenfeldes in Fuß angeben.
5. Bei einem quadratischen 10-/15-/20-ft-Grid optional **In 5-ft-Felder unterteilen** aktivieren.
6. Mit den beiden Reglern die gesamte Messhilfe inklusive Raster und beider Kreise fein verschieben. Jeder Regler hat in der Mitte den Wert 0 und einen eigenen Reset-Button.
7. **Übernehmen** anklicken.

## Verhalten und Grenzen

Das Modul setzt das Szenen-Padding auf 0 und normalisiert Szenenbreite und Szenenhöhe auf vollständige Gridzellen. Das Hintergrundbild wird innerhalb dieser Fläche über getrennte X-/Y-Skalierung und Offset angepasst. Die zwei gemessenen Bildpunkte werden dadurch auf ein reguläres Foundry-Grid abgebildet, auch wenn die sichtbaren Kartenfelder vorher in X und Y unterschiedlich groß waren. An den Canvas-Rändern entstehen keine zusätzlichen Padding-Streifen oder angebrochenen Gridzellen.

Bereits vorhandene Tokens, Wände, Lichter, Zeichnungen und andere Placeables werden nicht mitskaliert. Die Ausrichtung sollte deshalb vorzugsweise vor dem Erstellen dieser Elemente erfolgen. Perspektivische oder innerhalb des Bildes ungleichmäßig verzerrte Karten können weiterhin nicht vollständig korrigiert werden.

## Technische Hinweise

- Zielversion: Foundry VTT v13
- Keine Abhängigkeiten
- Die Grid-Vorschau wird als DOM-/SVG-Overlay dargestellt.
- Die Szene wird erst beim Klick auf **Übernehmen** verändert.

## Inspiration

Das Bedienkonzept ist funktional vom „Super Mega Wizard“ aus AboveVTT inspiriert. Die Implementierung dieses Moduls wurde eigenständig für die Foundry-v13-API erstellt und kopiert keinen AboveVTT-Quellcode.

## Lizenz

MIT License, siehe `LICENSE`.
