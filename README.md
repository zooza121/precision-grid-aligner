# Precision Grid Aligner for Foundry VTT v13

Precision Grid Aligner is a lightweight Foundry VTT v13 module for accurately aligning a scene grid with an existing battlemap.

It provides two draggable green three-quarter-circle markers that define the diagonal corners of an exact 3×3 grid area. The transparent quarter of each marker points inward toward the measured grid.

## Features

- Two independently draggable green three-quarter-circle markers
- Exact 3×3 grid measurement between the two markers
- Square grids
- Horizontal hex grids with flat top and bottom edges
- Vertical hex grids with pointed top and bottom edges
- Configurable measurement distance per grid space in feet
- Optional subdivision into 5-foot squares for distances such as 10, 15, or 20 feet
- Independent width and height calculation for distorted map grids
- Fine horizontal and vertical adjustment from −10 to +10 pixels
- Precision sliders move the complete alignment overlay, including:
  - both green markers
  - the 3×3 preview grid
  - the connecting measurement guide
- Separate reset button for each precision slider
- English and German interface
- Dedicated tool in Foundry’s left-side scene controls
- Keyboard shortcut: **Shift+G**
- Scene changes are only applied after clicking **Apply**

## Installation

### Installation through Foundry VTT

1. Open the Foundry VTT setup screen.
2. Select **Add-on Modules**.
3. Click **Install Module**.
4. Paste the module manifest URL into the **Manifest URL** field:

```text
https://github.com/YOUR-GITHUB-NAME/precision-grid-aligner/releases/latest/download/module.json
```

5. Click **Install**.
6. Enable the module under **Manage Modules** inside your world.

### Manual installation

1. Download the latest release archive.
2. Extract the `precision-grid-aligner` folder into:

```text
FoundryVTT/Data/modules/
```

3. Restart Foundry VTT.
4. Enable the module under **Manage Modules**.

## Usage

1. Open a scene as a Game Master.
2. Select Precision Grid Aligner from the left-side scene controls or press **Shift+G**.
3. Select the required grid type:
   - Square
   - Horizontal Hex
   - Vertical Hex
4. Drag the first green marker onto one corner of a visible map grid space.
5. Drag the second marker onto the corresponding diagonal corner exactly three grid spaces away.
6. Enter the measurement distance of one visible map space in feet.
7. For square grids measuring 10, 15, 20 feet, or another multiple of 5, optionally enable **Split into 5-ft Squares**.
8. Use the horizontal and vertical precision sliders to move the entire measurement overlay in small increments.
9. Use the reset button beside either slider to return that axis to `0`.
10. Click **Apply** to update the scene.

The preview always displays exactly three rows and three columns between the two markers. No additional preview cells are drawn outside the measured area.

## Scene Adjustments

When the alignment is applied, the module:

- sets the scene padding to `0`
- calculates an appropriate Foundry grid size
- configures the selected square or hex grid type
- adjusts the scene background scale independently on the horizontal and vertical axes
- applies the calculated background offset
- normalizes the scene dimensions to complete grid spaces

This allows map grids with slightly different horizontal and vertical spacing to be mapped onto a regular Foundry grid.

The two green markers and the 3×3 preview are temporary alignment tools. The scene is not modified until **Apply** is selected.

## Limitations

Existing scene objects are not automatically rescaled or repositioned, including:

- tokens
- walls
- lights
- sounds
- drawings
- tiles
- templates
- other placeable objects

For best results, align the map before creating walls, tokens, lights, and other scene content.

The module can correct uniform horizontal and vertical distortion. It cannot fully correct perspective distortion or maps whose grid spacing changes across different parts of the image.

## Technical Information

- Target platform: Foundry Virtual Tabletop v13
- No module dependencies
- Grid preview implemented as a DOM and SVG canvas overlay
- Supports square, horizontal hex, and vertical hex scenes
- Scene data is only updated after explicit confirmation
- Game Master permissions are required to modify the scene

## Inspiration

The interaction concept is inspired by the Super Mega Wizard from AboveVTT.

This module was implemented independently for the Foundry VTT v13 API and does not copy AboveVTT source code.

## License

Released under the MIT License. See `LICENSE` for details.

---

# Precision Grid Aligner für Foundry VTT v13

Precision Grid Aligner ist ein kleines Foundry-VTT-v13-Modul zur präzisen Ausrichtung des Szenenrasters an einem bereits vorhandenen Battlemap-Grid.

Dafür stehen zwei verschiebbare grüne Dreiviertelkreis-Marker zur Verfügung. Sie markieren die diagonalen Ecken eines exakt 3×3 Felder großen Messbereichs. Das transparente Viertel jedes Markers zeigt dabei nach innen in Richtung des gemessenen Rasters.

## Funktionen

- Zwei unabhängig verschiebbare grüne Dreiviertelkreis-Marker
- Exakte 3×3-Messung zwischen den beiden Markern
- Quadratische Grids
- Horizontale Hex-Grids mit flacher Ober- und Unterkante
- Vertikale Hex-Grids mit Spitze oben und unten
- Einstellbare Messdistanz je Feld in Fuß
- Optionale Unterteilung in 5-ft-Felder bei Entfernungen wie 10, 15 oder 20 Fuß
- Unabhängige Berechnung von Rasterbreite und Rasterhöhe bei verzerrten Karten
- Sehr feine horizontale und vertikale Korrektur von −10 bis +10 Pixeln
- Die Präzisionsregler verschieben die gesamte Messhilfe:
  - beide grünen Marker
  - das 3×3-Vorschauraster
  - die Verbindungslinie
- Separater Reset-Button für jeden Präzisionsregler
- Deutsche und englische Benutzeroberfläche
- Eigener Eintrag in der linken Foundry-Werkzeugleiste
- Tastenkürzel: **Umschalt+G**
- Die Szene wird erst nach einem Klick auf **Übernehmen** verändert

## Installation

### Installation über Foundry VTT

1. Den Setup-Bildschirm von Foundry VTT öffnen.
2. **Add-on Modules** auswählen.
3. Auf **Install Module** klicken.
4. Die Manifest-URL in das Feld **Manifest URL** einfügen:

```text
https://github.com/DEIN-GITHUB-NAME/precision-grid-aligner/releases/latest/download/module.json
```

5. Auf **Install** klicken.
6. Das Modul innerhalb der Welt unter **Module verwalten** aktivieren.

### Manuelle Installation

1. Das aktuelle Release-Archiv herunterladen.
2. Den Ordner `precision-grid-aligner` nach folgendem Verzeichnis entpacken:

```text
FoundryVTT/Data/modules/
```

3. Foundry VTT neu starten.
4. Das Modul unter **Module verwalten** aktivieren.

## Bedienung

1. Als Spielleitung eine Szene öffnen.
2. Precision Grid Aligner in der linken Werkzeugleiste auswählen oder **Umschalt+G** drücken.
3. Den gewünschten Gridtyp auswählen:
   - Square
   - Horizontal Hex
   - Vertical Hex
4. Den ersten grünen Marker auf eine Ecke eines sichtbaren Kartenfeldes setzen.
5. Den zweiten Marker auf die entsprechende diagonale Ecke exakt drei Felder entfernt setzen.
6. Die Messdistanz eines sichtbaren Kartenfeldes in Fuß angeben.
7. Bei einem quadratischen Grid mit 10, 15, 20 Fuß oder einem anderen Vielfachen von 5 optional **In 5-ft-Felder unterteilen** aktivieren.
8. Mit den horizontalen und vertikalen Präzisionsreglern die gesamte Messhilfe in kleinen Schritten verschieben.
9. Mit dem Reset-Button neben einem Regler die jeweilige Achse wieder auf `0` setzen.
10. Auf **Übernehmen** klicken, um die Szene zu aktualisieren.

Die Vorschau zeigt zwischen den beiden Markern immer exakt drei Reihen und drei Spalten. Außerhalb des Messbereichs werden keine zusätzlichen Vorschauzellen dargestellt.

## Änderungen an der Szene

Beim Übernehmen der Ausrichtung führt das Modul folgende Änderungen durch:

- Das Szenen-Padding wird auf `0` gesetzt.
- Eine passende Foundry-Gridgröße wird berechnet.
- Der ausgewählte Square- oder Hex-Gridtyp wird konfiguriert.
- Das Hintergrundbild wird horizontal und vertikal getrennt skaliert.
- Der berechnete Hintergrundversatz wird angewendet.
- Szenenbreite und Szenenhöhe werden auf vollständige Gridfelder normalisiert.

Dadurch können Kartenraster, deren sichtbare Felder horizontal und vertikal leicht unterschiedliche Größen besitzen, auf ein regelmäßiges Foundry-Grid abgebildet werden.

Die beiden grünen Marker und das 3×3-Raster dienen nur als temporäre Messhilfe. Vor dem Klick auf **Übernehmen** wird die Szene nicht verändert.

## Einschränkungen

Bereits vorhandene Szenenelemente werden nicht automatisch skaliert oder neu positioniert. Dazu gehören unter anderem:

- Tokens
- Wände
- Lichter
- Sounds
- Zeichnungen
- Tiles
- Schablonen
- andere platzierbare Objekte

Die Karte sollte deshalb möglichst ausgerichtet werden, bevor Wände, Tokens, Lichter und weitere Szeneninhalte erstellt werden.

Das Modul kann eine gleichmäßige horizontale und vertikale Verzerrung korrigieren. Perspektivische Verzerrungen oder Karten, deren Rasterabstände sich innerhalb des Bildes verändern, können nicht vollständig ausgeglichen werden.

## Technische Hinweise

- Zielplattform: Foundry Virtual Tabletop v13
- Keine Modulabhängigkeiten
- Grid-Vorschau als DOM- und SVG-Overlay auf dem Canvas
- Unterstützung für Square, Horizontal Hex und Vertical Hex
- Szenendaten werden erst nach ausdrücklicher Bestätigung aktualisiert
- Zum Ändern der Szene werden Spielleitungsrechte benötigt

## Inspiration

Das Bedienkonzept ist vom Super Mega Wizard aus AboveVTT inspiriert.

Die Implementierung wurde eigenständig für die Foundry-VTT-v13-API entwickelt und kopiert keinen AboveVTT-Quellcode.

## Lizenz

Veröffentlicht unter der MIT License. Weitere Informationen befinden sich in `LICENSE`.
