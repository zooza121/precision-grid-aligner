# Changelog

## 1.0.0 — 2026-07-20

- Initial release for Foundry VTT v13
- Two draggable 3×3 alignment anchors
- Square, horizontal hex, and vertical hex modes
- Measurement in feet and optional 5-ft subdivision
- Fine horizontal/vertical adjustment with individual reset buttons
- German and English localization

## 1.0.1

- Dreiviertelkreis-Öffnungen zeigen jetzt dynamisch nach innen zum jeweils anderen Anker.
- Die Vorschau zeichnet exakt 3×3 Zellen ohne zusätzliche Zellen außerhalb der Anker.
- Der Startknopf ist als eigener Scene-Control-Eintrag in die linke Foundry-Werkzeugleiste integriert.
- Horizontale und vertikale Präzisionsregler verschieben jetzt Raster, Verbindungslinie und beide Anker gemeinsam.

## 1.0.2

- Beide Anker bleiben jetzt fest mit den gegenüberliegenden Ecken der 3×3-Vorschau verbunden.
- Beim Ziehen eines Ankers werden Rastergröße und Rasterursprung gemeinsam neu berechnet; der Rasterrand kann nicht mehr relativ unter dem Kreis wegrutschen.
- Beim Anwenden wird die durch die neue Gridgröße verursachte Verschiebung des gepolsterten Szenenursprungs kompensiert. Dadurch entspricht die gespeicherte Rasterposition der Vorschau.

## 1.0.3

- Beide Anker sind wieder unabhängig in X und Y verschiebbar.
- Die 3×3-Vorschau wird in Breite und Höhe frei zwischen den beiden Kreisen verzerrt.
- Beide Kreise bleiben jederzeit die exakten diagonalen Ankerpunkte des Vorschaugrids.
- Beim Übernehmen werden Szenenbreite und Szenenhöhe getrennt angepasst, damit die zwei markierten Bildpunkte auf einem regulären Foundry-Grid exakt drei Felder auseinanderliegen.
- Der erste Anker wird auf einen Grid-Schnittpunkt gelegt; der zweite landet durch dieselbe Transformation auf dem korrespondierenden 3×3-Schnittpunkt.

## 1.0.4

- Die endgültige Rasterposition wird nach dem ersten Szenen-Update anhand der tatsächlich von Foundry berechneten Szenenabmessungen erneut geprüft.
- Der erste Bildanker wird in einem zweiten Korrekturdurchlauf über Foundrys natives Vertex-Snapping exakt auf einen real gerenderten Grid-Schnittpunkt gesetzt.
- Rundungs- und Padding-Abweichungen zwischen Vorschau und gespeicherter Szene werden dadurch aus dem Hintergrundoffset entfernt.

## 1.0.5

- Das Szenen-Padding wird beim Anwenden auf 0 gesetzt, damit Foundry keinen zusätzlichen Canvas-Rand erzeugt.
- Szenenbreite und -höhe werden auf Abmessungen mit ausschließlich vollständigen Gridzellen normalisiert.
- Die Grid-Ausrichtung verändert nun die Hintergrundtextur über `scaleX`, `scaleY` und Offset, statt die Position über einen gepolsterten Szenenursprung zu kompensieren.
- Beide Bildanker werden nach dem Rendern direkt am tatsächlichen Background-Mesh nachgemessen und iterativ auf die gewählten 3×3-Gridpunkte kalibriert.
- Das Hintergrund-Fit wird auf `fill` gesetzt, damit getrennte horizontale und vertikale Korrekturen nicht durch eine automatische Seitenverhältnisanpassung verschoben werden.
