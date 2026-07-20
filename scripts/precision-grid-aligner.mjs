const MODULE_ID = "precision-grid-aligner";
const ROOT_ID = `${MODULE_ID}-overlay`;
const PANEL_ID = `${MODULE_ID}-panel`;
const REFERENCE_SIZE = 100;
const MIN_GRID_SIZE = 20;

const state = {
  open: false,
  root: null,
  svg: null,
  panel: null,
  handles: [],
  activePointer: null,
  anchors: [null, null],
  kind: "square",
  measurement: 5,
  split: false,
  fineX: 0,
  fineY: 0,
};

Hooks.once("init", () => {
  game.keybindings.register(MODULE_ID, "toggleWizard", {
    name: "PGA.Keybinding.Name",
    hint: "PGA.Keybinding.Hint",
    editable: [{ key: "KeyG", modifiers: ["SHIFT"] }],
    restricted: true,
    onDown: () => {
      toggleWizard();
      return true;
    }
  });
});

Hooks.on("getSceneControlButtons", (controls) => {
  controls[MODULE_ID] = {
    name: MODULE_ID,
    title: "PGA.Launcher.Tooltip",
    icon: "fa-solid fa-border-all",
    order: 45,
    activeTool: `${MODULE_ID}-open`,
    visible: Boolean(game.user?.isGM),
    onChange: (_event, active) => {
      if (active && !state.open) openWizard();
    },
    tools: {
      [`${MODULE_ID}-open`]: {
        name: `${MODULE_ID}-open`,
        title: "PGA.Launcher.Tooltip",
        icon: "fa-solid fa-border-all",
        order: 0,
        button: true,
        visible: Boolean(game.user?.isGM),
        onChange: () => {
          if (!state.open) openWizard();
        }
      }
    }
  };
});

Hooks.on("canvasReady", () => {
  if (state.open) refreshOverlay();
});

Hooks.on("canvasTearDown", () => {
  closeWizard();
});

Hooks.on("canvasPan", () => {
  if (state.open) refreshOverlay();
});

window.addEventListener("resize", () => {
  if (state.open) refreshOverlay();
});

function t(key) {
  return game.i18n.localize(key);
}

function notify(level, key) {
  ui.notifications?.[level]?.(t(key));
}

function toggleWizard() {
  if (state.open) closeWizard();
  else openWizard();
}

function openWizard() {
  if (!game.user?.isGM) return notify("warn", "PGA.Notifications.GMOnly");
  if (!canvas?.ready || !canvas?.scene) return notify("warn", "PGA.Notifications.NoScene");

  closeWizard();
  initializeStateFromScene();
  createOverlay();
  createPanel();
  state.open = true;
  refreshOverlay();
}

function closeWizard() {
  state.open = false;
  state.activePointer = null;
  state.root?.remove();
  state.panel?.remove();
  state.root = null;
  state.svg = null;
  state.panel = null;
  state.handles = [];
}

function initializeStateFromScene() {
  const scene = canvas.scene;
  const grid = scene.grid;
  const savedKind = scene.getFlag(MODULE_ID, "gridKind");
  const savedMeasurement = Number(scene.getFlag(MODULE_ID, "majorMeasurement"));
  const savedSplit = Boolean(scene.getFlag(MODULE_ID, "splitIntoFive"));

  state.kind = savedKind || kindFromGrid(grid);
  state.measurement = Number.isFinite(savedMeasurement) && savedMeasurement > 0
    ? savedMeasurement
    : Math.max(Number(grid.distance) || 5, 1);
  state.split = savedSplit && canSplit(state.measurement, state.kind);
  state.fineX = 0;
  state.fineY = 0;

  const nativeSize = Math.max(Number(grid.size) || REFERENCE_SIZE, MIN_GRID_SIZE);
  const majorSize = state.split ? nativeSize * (state.measurement / 5) : nativeSize;
  const center = sceneCenter();
  const delta = referenceDelta(state.kind, majorSize);

  state.anchors[0] = {
    x: center.x - delta.x / 2,
    y: center.y - delta.y / 2
  };
  state.anchors[1] = {
    x: center.x + delta.x / 2,
    y: center.y + delta.y / 2
  };
}

function sceneCenter() {
  const dimensions = canvas.dimensions;
  return {
    x: dimensions.sceneX + dimensions.sceneWidth / 2,
    y: dimensions.sceneY + dimensions.sceneHeight / 2
  };
}

function kindFromGrid(grid) {
  if (!grid || grid.isGridless) return "square";
  if (grid.isHexagonal) return grid.columns ? "hex-horizontal" : "hex-vertical";
  return "square";
}

function gridTypeForKind(kind) {
  const types = CONST.GRID_TYPES;
  if (kind === "hex-horizontal") return types.HEXODDQ ?? types.HEXEVENQ;
  if (kind === "hex-vertical") return types.HEXODDR ?? types.HEXEVENR;
  return types.SQUARE;
}

function createGrid(kind, size, distance = state.measurement) {
  const source = foundry.utils.deepClone(canvas.scene._source.grid ?? {});
  const type = gridTypeForKind(kind);
  const config = {
    ...source,
    type,
    size,
    distance,
    units: "ft"
  };

  try {
    if (kind === "square") return new foundry.grid.SquareGrid(config);
    return new foundry.grid.HexagonalGrid(config);
  } catch (error) {
    console.warn(`${MODULE_ID} | Could not create a temporary grid`, error);
    return null;
  }
}

function getCenter(grid, i, j) {
  try {
    return grid.getCenterPoint({ i, j });
  } catch (_error) {
    return null;
  }
}

function referenceDelta(kind, size) {
  const grid = createGrid(kind, size);
  if (grid) {
    const a = getCenter(grid, 0, 0);
    const b = getCenter(grid, 3, 3);
    if (a && b) {
      return {
        x: Math.abs(b.x - a.x),
        y: Math.abs(b.y - a.y)
      };
    }
  }

  if (kind === "hex-horizontal") {
    return { x: size * 2.25, y: size * 3 * Math.sqrt(3) / 2 };
  }
  if (kind === "hex-vertical") {
    return { x: size * 3 * Math.sqrt(3) / 2, y: size * 2.25 };
  }
  return { x: size * 3, y: size * 3 };
}

function calculateMajorGeometry(kind = state.kind, anchors = state.anchors) {
  const a = anchors[0];
  const b = anchors[1];
  if (!a || !b) return null;

  const measured = {
    x: Math.abs(b.x - a.x),
    y: Math.abs(b.y - a.y)
  };
  const reference = referenceDelta(kind, REFERENCE_SIZE);
  if (!reference.x || !reference.y) return null;

  const sizeX = REFERENCE_SIZE * measured.x / Math.abs(reference.x);
  const sizeY = REFERENCE_SIZE * measured.y / Math.abs(reference.y);
  const denominator = reference.x ** 2 + reference.y ** 2;
  if (!denominator) return null;

  // Foundry stores one native grid size. Use the least-squares mean as the
  // target regular grid size, while the preview itself remains freely
  // stretchable on both axes between the two anchors.
  const size = REFERENCE_SIZE
    * ((measured.x * Math.abs(reference.x)) + (measured.y * Math.abs(reference.y)))
    / denominator;

  return { measured, reference, sizeX, sizeY, size };
}

function calculateMajorSize(kind = state.kind, anchors = state.anchors) {
  return calculateMajorGeometry(kind, anchors)?.size ?? NaN;
}

function moveAnchorToPointer(index, pointerPoint) {
  if (!state.anchors[index]) return;
  state.anchors[index] = {
    x: pointerPoint.x - state.fineX,
    y: pointerPoint.y - state.fineY
  };
}

function changeGridKind(kind) {
  state.kind = kind;
}

function calculateNativeSize() {
  const major = calculateMajorSize();
  if (!Number.isFinite(major)) return NaN;
  const divisor = state.split ? state.measurement / 5 : 1;
  return major / divisor;
}

function canSplit(measurement, kind = state.kind) {
  const value = Number(measurement);
  return kind === "square"
    && Number.isFinite(value)
    && value > 5
    && Number.isInteger(value / 5);
}

function createOverlay() {
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "pga-overlay";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("pga-preview");
  svg.setAttribute("aria-hidden", "true");
  root.append(svg);

  const first = createHandle(0, "pga-handle-first");
  const second = createHandle(1, "pga-handle-second");
  root.append(first, second);

  document.body.append(root);
  state.root = root;
  state.svg = svg;
  state.handles = [first, second];
}

function createHandle(index, className) {
  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = `pga-handle ${className}`;
  handle.title = index === 0 ? t("PGA.Handle.First") : t("PGA.Handle.Second");
  handle.setAttribute("aria-label", handle.title);

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handle.setPointerCapture(event.pointerId);
    state.activePointer = { index, pointerId: event.pointerId };
    handle.classList.add("pga-dragging");
  });

  handle.addEventListener("pointermove", (event) => {
    if (!state.activePointer) return;
    if (state.activePointer.pointerId !== event.pointerId) return;
    if (state.activePointer.index !== index) return;
    const point = screenToWorld(event.clientX, event.clientY);
    if (!point) return;
    moveAnchorToPointer(index, point);
    refreshOverlay();
  });

  const endDrag = (event) => {
    if (!state.activePointer || state.activePointer.pointerId !== event.pointerId) return;
    state.activePointer = null;
    handle.classList.remove("pga-dragging");
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
  };

  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
  return handle;
}

function createPanel() {
  const panel = document.createElement("section");
  panel.id = PANEL_ID;
  panel.className = "pga-panel";
  panel.setAttribute("aria-label", t("PGA.Panel.Title"));
  panel.innerHTML = `
    <header class="pga-panel-header">
      <div>
        <h2><i class="fa-solid fa-border-all" aria-hidden="true"></i> ${t("PGA.Panel.Title")}</h2>
        <p>${t("PGA.Panel.Subtitle")}</p>
      </div>
      <button type="button" class="pga-icon-button" data-action="close" title="${t("PGA.Actions.Close")}">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </header>

    <div class="pga-panel-body">
      <fieldset class="pga-fieldset">
        <legend>${t("PGA.GridType.Label")}</legend>
        <label><input type="radio" name="pga-grid-kind" value="square"> ${t("PGA.GridType.Square")}</label>
        <label><input type="radio" name="pga-grid-kind" value="hex-horizontal"> ${t("PGA.GridType.HexHorizontal")}</label>
        <label><input type="radio" name="pga-grid-kind" value="hex-vertical"> ${t("PGA.GridType.HexVertical")}</label>
      </fieldset>

      <div class="pga-form-row">
        <label for="pga-measurement">${t("PGA.Measurement.Label")}</label>
        <div class="pga-number-with-unit">
          <input id="pga-measurement" type="number" min="0.1" step="0.1" value="${state.measurement}">
          <span>ft</span>
        </div>
      </div>

      <label class="pga-checkbox-row" data-role="split-row">
        <input id="pga-split" type="checkbox">
        <span>${t("PGA.Split.Label")}</span>
      </label>

      ${sliderMarkup("x", t("PGA.Fine.Horizontal"))}
      ${sliderMarkup("y", t("PGA.Fine.Vertical"))}

      <div class="pga-status" data-role="status"></div>
      <p class="pga-warning"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${t("PGA.Warning.Placeables")}</p>
    </div>

    <footer class="pga-panel-footer">
      <button type="button" data-action="cancel">${t("PGA.Actions.Cancel")}</button>
      <button type="button" class="pga-primary" data-action="apply">
        <i class="fa-solid fa-check" aria-hidden="true"></i> ${t("PGA.Actions.Apply")}
      </button>
    </footer>
  `;

  document.body.append(panel);
  state.panel = panel;

  panel.querySelectorAll('input[name="pga-grid-kind"]').forEach((input) => {
    input.checked = input.value === state.kind;
    input.addEventListener("change", () => {
      if (!input.checked) return;
      changeGridKind(input.value);
      if (!canSplit(state.measurement, state.kind)) state.split = false;
      updatePanelState();
      refreshOverlay();
    });
  });

  const measurement = panel.querySelector("#pga-measurement");
  measurement.addEventListener("input", () => {
    state.measurement = Math.max(Number(measurement.value) || 0, 0);
    if (!canSplit(state.measurement)) state.split = false;
    updatePanelState();
    refreshOverlay();
  });

  const split = panel.querySelector("#pga-split");
  split.checked = state.split;
  split.addEventListener("change", () => {
    state.split = split.checked && canSplit(state.measurement);
    updatePanelState();
    refreshOverlay();
  });

  bindSlider(panel, "x");
  bindSlider(panel, "y");

  panel.querySelector('[data-action="close"]').addEventListener("click", closeWizard);
  panel.querySelector('[data-action="cancel"]').addEventListener("click", closeWizard);
  panel.querySelector('[data-action="apply"]').addEventListener("click", applyAlignment);

  updatePanelState();
}

function sliderMarkup(axis, label) {
  return `
    <div class="pga-slider-group">
      <div class="pga-slider-label-row">
        <label for="pga-fine-${axis}">${label}</label>
        <output id="pga-fine-${axis}-value">0.0 px</output>
      </div>
      <div class="pga-slider-row">
        <input id="pga-fine-${axis}" type="range" min="-100" max="100" step="1" value="0">
        <button type="button" data-reset-axis="${axis}" title="${t("PGA.Actions.Reset")}">
          <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
          <span>${t("PGA.Actions.Reset")}</span>
        </button>
      </div>
    </div>
  `;
}

function bindSlider(panel, axis) {
  const input = panel.querySelector(`#pga-fine-${axis}`);
  const output = panel.querySelector(`#pga-fine-${axis}-value`);
  const reset = panel.querySelector(`[data-reset-axis="${axis}"]`);

  const update = () => {
    const value = Number(input.value) / 10;
    if (axis === "x") state.fineX = value;
    else state.fineY = value;
    output.value = `${value.toFixed(1)} px`;
    output.textContent = output.value;
    refreshOverlay();
  };

  input.addEventListener("input", update);
  reset.addEventListener("click", () => {
    input.value = "0";
    update();
  });
}

function updatePanelState() {
  if (!state.panel) return;
  const splitRow = state.panel.querySelector('[data-role="split-row"]');
  const splitInput = state.panel.querySelector("#pga-split");
  const available = canSplit(state.measurement);
  splitRow.classList.toggle("pga-hidden", !available);
  splitInput.disabled = !available;
  splitInput.checked = state.split && available;
  updateStatus();
}

function updateStatus() {
  const status = state.panel?.querySelector('[data-role="status"]');
  if (!status) return;

  const geometry = calculateMajorGeometry();
  const native = calculateNativeSize();
  if (!geometry || !Number.isFinite(native)) {
    status.textContent = t("PGA.Status.Invalid");
    status.classList.add("pga-status-error");
    return;
  }

  status.classList.toggle("pga-status-error", native < MIN_GRID_SIZE);
  const majorLabel = `${geometry.sizeX.toFixed(2)} × ${geometry.sizeY.toFixed(2)} px / ${state.measurement || 0} ft`;
  const nativeLabel = state.split
    ? `${native.toFixed(2)} px / 5 ft`
    : `${native.toFixed(2)} px / ${state.measurement || 0} ft`;
  status.innerHTML = `
    <span>${t("PGA.Status.Major")}: <strong>${majorLabel}</strong></span>
    <span>${t("PGA.Status.Native")}: <strong>${nativeLabel}</strong></span>
  `;
}

function effectiveAnchor(index) {
  const anchor = state.anchors[index];
  if (!anchor) return null;
  return {
    x: anchor.x + state.fineX,
    y: anchor.y + state.fineY
  };
}

function updateHandleOrientations() {
  const first = effectiveAnchor(0);
  const second = effectiveAnchor(1);
  if (!first || !second) return;

  setHandleOpening(state.handles[0], second.x - first.x, second.y - first.y);
  setHandleOpening(state.handles[1], first.x - second.x, first.y - second.y);
}

function setHandleOpening(handle, dx, dy) {
  if (!handle) return;
  handle.classList.remove("pga-cut-ne", "pga-cut-se", "pga-cut-sw", "pga-cut-nw");
  const horizontal = dx >= 0 ? "e" : "w";
  const vertical = dy >= 0 ? "s" : "n";
  handle.classList.add(`pga-cut-${vertical}${horizontal}`);
}

function refreshOverlay() {
  if (!state.open || !state.root || !canvas?.ready) return;
  state.handles.forEach((handle, index) => {
    const point = worldToScreen(effectiveAnchor(index));
    if (!point) return;
    handle.style.left = `${point.x}px`;
    handle.style.top = `${point.y}px`;
  });
  updateHandleOrientations();
  drawPreview();
  updateStatus();
}

function rendererRect() {
  const element = canvas?.app?.canvas ?? canvas?.app?.view;
  return element?.getBoundingClientRect?.() ?? { left: 0, top: 0 };
}

function worldToScreen(point) {
  if (!point || !canvas?.stage) return null;
  const global = canvas.stage.toGlobal(new PIXI.Point(point.x, point.y));
  const rect = rendererRect();
  return { x: rect.left + global.x, y: rect.top + global.y };
}

function screenToWorld(clientX, clientY) {
  if (!canvas?.stage) return null;
  const rect = rendererRect();
  const local = canvas.stage.toLocal(new PIXI.Point(clientX - rect.left, clientY - rect.top));
  return { x: local.x, y: local.y };
}

function clearSvg() {
  while (state.svg?.firstChild) state.svg.firstChild.remove();
}

function drawPreview() {
  if (!state.svg) return;
  clearSvg();

  const geometry = calculateMajorGeometry();
  if (!geometry || geometry.measured.x <= 0 || geometry.measured.y <= 0) return;

  const origin = effectiveAnchor(0);
  const endpoint = effectiveAnchor(1);
  if (!origin || !endpoint) return;

  const transform = {
    origin,
    scaleX: (endpoint.x - origin.x) / geometry.reference.x,
    scaleY: (endpoint.y - origin.y) / geometry.reference.y
  };
  const grid = createGrid(state.kind, REFERENCE_SIZE);
  const rendered = grid ? drawGridCells(grid, transform) : false;
  if (!rendered) drawFallbackPreview(origin, endpoint);
  drawConnector(origin, endpoint);
}

function normalizedShape(grid) {
  try {
    const shape = grid.getShape();
    if (!Array.isArray(shape) || shape.length < 3) return null;
    const centroid = shape.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
    centroid.x /= shape.length;
    centroid.y /= shape.length;
    return shape.map((point) => ({ x: point.x - centroid.x, y: point.y - centroid.y }));
  } catch (_error) {
    return null;
  }
}

function drawGridCells(grid, transform) {
  const shape = normalizedShape(grid);
  const baseCenter = getCenter(grid, 0, 0);
  if (!shape || !baseCenter) return false;

  const referenceVertex = shape.reduce((best, point) => {
    return (point.x + point.y) < (best.x + best.y) ? point : best;
  }, shape[0]);

  let count = 0;
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const center = getCenter(grid, i, j);
      if (!center) continue;
      const worldPoints = shape.map((point) => {
        const localX = (center.x - baseCenter.x) + (point.x - referenceVertex.x);
        const localY = (center.y - baseCenter.y) + (point.y - referenceVertex.y);
        return {
          x: transform.origin.x + localX * transform.scaleX,
          y: transform.origin.y + localY * transform.scaleY
        };
      });
      appendPolygon(worldPoints);
      count += 1;
    }
  }
  return count > 0;
}

function appendPolygon(worldPoints) {
  const screenPoints = worldPoints.map(worldToScreen).filter(Boolean);
  if (screenPoints.length < 3) return;
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", screenPoints.map((point) => `${point.x},${point.y}`).join(" "));
  polygon.setAttribute("class", "pga-grid-cell");
  state.svg.append(polygon);
}

function drawFallbackPreview(origin, endpoint) {
  for (let index = 0; index <= 3; index += 1) {
    const ratio = index / 3;
    const x = origin.x + (endpoint.x - origin.x) * ratio;
    const y = origin.y + (endpoint.y - origin.y) * ratio;
    appendLine(
      { x, y: origin.y },
      { x, y: endpoint.y },
      "pga-grid-line"
    );
    appendLine(
      { x: origin.x, y },
      { x: endpoint.x, y },
      "pga-grid-line"
    );
  }
}

function drawConnector(from, to) {
  appendLine(from, to, "pga-grid-connector");
}

function appendLine(worldA, worldB, className) {
  const a = worldToScreen(worldA);
  const b = worldToScreen(worldB);
  if (!a || !b) return;
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(a.x));
  line.setAttribute("y1", String(a.y));
  line.setAttribute("x2", String(b.x));
  line.setAttribute("y2", String(b.y));
  line.setAttribute("class", className);
  state.svg.append(line);
}

async function applyAlignment() {
  const measurement = Number(state.measurement);
  const geometry = calculateMajorGeometry();
  const nativeSizeFloat = calculateNativeSize();
  if (!Number.isFinite(measurement) || measurement <= 0) {
    return notify("error", "PGA.Notifications.InvalidMeasurement");
  }
  if (!geometry || geometry.measured.x <= 0 || geometry.measured.y <= 0) {
    return notify("error", "PGA.Notifications.InvalidGridSize");
  }
  if (!Number.isFinite(nativeSizeFloat) || nativeSizeFloat < MIN_GRID_SIZE) {
    return notify("error", "PGA.Notifications.InvalidGridSize");
  }

  const nativeSize = Math.round(nativeSizeFloat);
  const finalDistance = state.split ? 5 : measurement;
  const subdivision = state.split ? state.measurement / 5 : 1;
  const finalMajorSize = nativeSize * subdivision;
  const type = gridTypeForKind(state.kind);
  const finalGrid = createGrid(state.kind, nativeSize, finalDistance);
  if (!finalGrid) return notify("error", "PGA.Notifications.GridConstructionFailed");

  const scene = canvas.scene;
  const previewOrigin = effectiveAnchor(0);
  const previewEndpoint = effectiveAnchor(1);
  if (!previewOrigin || !previewEndpoint) {
    return notify("error", "PGA.Notifications.InvalidGridSize");
  }

  const selectedDelta = {
    x: previewEndpoint.x - previewOrigin.x,
    y: previewEndpoint.y - previewOrigin.y
  };
  if (Math.abs(selectedDelta.x) < 1 || Math.abs(selectedDelta.y) < 1) {
    return notify("error", "PGA.Notifications.InvalidGridSize");
  }

  const firstImagePoint = captureBackgroundCoordinate(previewOrigin);
  const secondImagePoint = captureBackgroundCoordinate(previewEndpoint);
  if (!firstImagePoint || !secondImagePoint) {
    return notify("error", "PGA.Notifications.InvalidGridSize");
  }

  const currentWidth = Number(scene.width ?? scene._source.width);
  const currentHeight = Number(scene.height ?? scene._source.height);
  if (!(currentWidth > 0) || !(currentHeight > 0)) {
    return notify("error", "PGA.Notifications.InvalidGridSize");
  }

  const targetMagnitude = referenceDelta(state.kind, finalMajorSize);
  const targetDelta = {
    x: Math.sign(selectedDelta.x || 1) * Math.abs(targetMagnitude.x),
    y: Math.sign(selectedDelta.y || 1) * Math.abs(targetMagnitude.y)
  };

  // Estimate the required rendered background size from the current displayed
  // texture. The scene itself is then rounded to dimensions which contain only
  // complete grid cells. Any remaining difference is represented by the
  // background texture scale instead of by canvas padding or partial cells.
  const currentBackgroundSpan = getBackgroundWorldSpan() ?? {
    width: currentWidth,
    height: currentHeight
  };
  const desiredBackgroundWidth = Math.max(
    1,
    currentBackgroundSpan.width * Math.abs(targetDelta.x / selectedDelta.x)
  );
  const desiredBackgroundHeight = Math.max(
    1,
    currentBackgroundSpan.height * Math.abs(targetDelta.y / selectedDelta.y)
  );
  const wholeScene = wholeGridSceneDimensions(
    finalGrid,
    desiredBackgroundWidth,
    desiredBackgroundHeight
  );

  const update = {
    width: wholeScene.width,
    height: wholeScene.height,
    padding: 0,
    "grid.type": type,
    "grid.size": nativeSize,
    "grid.distance": finalDistance,
    "grid.units": "ft",
    "background.fit": "fill",
    "background.scaleX": desiredBackgroundWidth / wholeScene.width,
    "background.scaleY": desiredBackgroundHeight / wholeScene.height,
    "background.offsetX": 0,
    "background.offsetY": 0,
    [`flags.${MODULE_ID}.gridKind`]: state.kind,
    [`flags.${MODULE_ID}.majorMeasurement`]: measurement,
    [`flags.${MODULE_ID}.splitIntoFive`]: Boolean(state.split)
  };

  closeWizard();
  try {
    await scene.update(update);
    await calibrateBackgroundToAnchors(
      scene,
      firstImagePoint,
      secondImagePoint,
      targetDelta
    );
    notify("info", "PGA.Notifications.Applied");
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to update scene`, error);
    notify("error", "PGA.Notifications.UpdateFailed");
  }
}

/**
 * Store a point as normalized coordinates within the rendered background mesh.
 * This survives changes to scene dimensions, background scale, and offsets.
 */
function captureBackgroundCoordinate(point) {
  const mesh = canvas?.primary?.background;
  if (mesh?.toLocal && mesh?.getLocalBounds && canvas?.stage) {
    try {
      const local = mesh.toLocal(new PIXI.Point(point.x, point.y), canvas.stage);
      const bounds = mesh.getLocalBounds();
      if (bounds.width > 0 && bounds.height > 0) {
        return {
          mode: "mesh",
          u: (local.x - bounds.x) / bounds.width,
          v: (local.y - bounds.y) / bounds.height
        };
      }
    } catch (_error) {
      // Fall back to the Scene rectangle representation below.
    }
  }

  const scene = canvas.scene;
  const dimensions = scene.dimensions ?? canvas.dimensions;
  const background = scene._source.background ?? {};
  const width = Number(scene.width ?? scene._source.width);
  const height = Number(scene.height ?? scene._source.height);
  const sceneX = Number(dimensions.sceneX ?? dimensions.x ?? 0);
  const sceneY = Number(dimensions.sceneY ?? dimensions.y ?? 0);
  const offsetX = Number(background.offsetX || 0);
  const offsetY = Number(background.offsetY || 0);
  if (!(width > 0) || !(height > 0)) return null;
  return {
    mode: "scene",
    u: (point.x - sceneX - offsetX) / width,
    v: (point.y - sceneY - offsetY) / height
  };
}

function backgroundCoordinateToWorld(coordinate) {
  const mesh = canvas?.primary?.background;
  if (coordinate?.mode === "mesh" && mesh?.toGlobal && mesh?.getLocalBounds && canvas?.stage) {
    try {
      const bounds = mesh.getLocalBounds();
      const local = new PIXI.Point(
        bounds.x + coordinate.u * bounds.width,
        bounds.y + coordinate.v * bounds.height
      );
      const global = mesh.toGlobal(local);
      const world = canvas.stage.toLocal(global);
      if (Number.isFinite(world.x) && Number.isFinite(world.y)) {
        return { x: world.x, y: world.y };
      }
    } catch (_error) {
      // Fall back to the Scene rectangle representation below.
    }
  }

  const scene = canvas.scene;
  const dimensions = scene.dimensions ?? canvas.dimensions;
  const background = scene._source.background ?? {};
  const width = Number(scene.width ?? scene._source.width);
  const height = Number(scene.height ?? scene._source.height);
  const sceneX = Number(dimensions.sceneX ?? dimensions.x ?? 0);
  const sceneY = Number(dimensions.sceneY ?? dimensions.y ?? 0);
  return {
    x: sceneX + Number(background.offsetX || 0) + coordinate.u * width,
    y: sceneY + Number(background.offsetY || 0) + coordinate.v * height
  };
}

function getBackgroundWorldSpan() {
  const mesh = canvas?.primary?.background;
  if (!mesh?.toGlobal || !mesh?.getLocalBounds || !canvas?.stage) return null;
  try {
    const bounds = mesh.getLocalBounds();
    if (!(bounds.width > 0) || !(bounds.height > 0)) return null;
    const topLeft = canvas.stage.toLocal(mesh.toGlobal(new PIXI.Point(bounds.x, bounds.y)));
    const topRight = canvas.stage.toLocal(mesh.toGlobal(new PIXI.Point(bounds.x + bounds.width, bounds.y)));
    const bottomLeft = canvas.stage.toLocal(mesh.toGlobal(new PIXI.Point(bounds.x, bounds.y + bounds.height)));
    const width = Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y);
    const height = Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y);
    if (!(width > 0) || !(height > 0)) return null;
    return { width, height };
  } catch (_error) {
    return null;
  }
}

/**
 * Find Scene dimensions which are stable with zero padding and consist only of
 * complete cells for the selected grid implementation.
 */
function wholeGridSceneDimensions(grid, desiredWidth, desiredHeight) {
  const size = Math.max(Number(grid.size) || MIN_GRID_SIZE, MIN_GRID_SIZE);
  if (grid.isSquare) {
    return {
      width: Math.max(size, Math.round(desiredWidth / size) * size),
      height: Math.max(size, Math.round(desiredHeight / size) * size)
    };
  }

  let width = Math.max(1, Math.round(desiredWidth));
  let height = Math.max(1, Math.round(desiredHeight));
  for (let iteration = 0; iteration < 8; iteration += 1) {
    let dimensions;
    try {
      dimensions = grid.calculateDimensions(width, height, 0);
    } catch (_error) {
      break;
    }
    const nextWidth = Math.max(1, Math.round(Number(dimensions.width) || width));
    const nextHeight = Math.max(1, Math.round(Number(dimensions.height) || height));
    if (nextWidth === width && nextHeight === height) break;
    width = nextWidth;
    height = nextHeight;
  }
  return { width, height };
}

/**
 * Foundry may rebuild the active Canvas asynchronously after a Scene update.
 * Wait until the background mesh for this Scene is available before measuring.
 */
async function waitForSceneBackground(scene, frames = 30) {
  let readyFrames = 0;
  for (let frame = 0; frame < frames; frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const ready = Boolean(
      canvas?.ready
      && canvas.scene?.id === scene.id
      && canvas.primary?.background
    );
    readyFrames = ready ? readyFrames + 1 : 0;
    // Require two consecutive rendered frames so a Scene update cannot be
    // measured against the previous background mesh.
    if (readyFrames >= 2) return true;
  }
  return false;
}

/**
 * Calibrate against the background mesh which Foundry actually rendered. This
 * avoids assumptions about texture anchors and makes both selected image points
 * land on the requested 3x3 grid anchors after Scene rounding.
 */
async function calibrateBackgroundToAnchors(
  scene,
  firstImagePoint,
  secondImagePoint,
  targetDelta
) {
  for (let iteration = 0; iteration < 6; iteration += 1) {
    await waitForSceneBackground(scene);
    const first = backgroundCoordinateToWorld(firstImagePoint);
    const second = backgroundCoordinateToWorld(secondImagePoint);
    if (!first || !second) return;

    const actualDelta = {
      x: second.x - first.x,
      y: second.y - first.y
    };
    if (Math.abs(actualDelta.x) < 0.001 || Math.abs(actualDelta.y) < 0.001) return;

    const background = scene._source.background ?? {};
    const scaleX = Number(background.scaleX ?? 1);
    const scaleY = Number(background.scaleY ?? 1);
    const scaleCorrectionX = targetDelta.x / actualDelta.x;
    const scaleCorrectionY = targetDelta.y / actualDelta.y;
    const needsScale = Math.abs(scaleCorrectionX - 1) > 0.00001
      || Math.abs(scaleCorrectionY - 1) > 0.00001;

    if (needsScale) {
      await scene.update({
        "background.scaleX": scaleX * scaleCorrectionX,
        "background.scaleY": scaleY * scaleCorrectionY
      });
      continue;
    }

    const target = snapToGridVertex(scene.grid, first);
    if (!target) return;
    const correction = {
      x: target.x - first.x,
      y: target.y - first.y
    };
    if (Math.abs(correction.x) < 0.001 && Math.abs(correction.y) < 0.001) return;

    await scene.update({
      "background.offsetX": Number(background.offsetX || 0) + correction.x,
      "background.offsetY": Number(background.offsetY || 0) + correction.y
    });
  }
}

function snapToGridVertex(grid, point) {
  try {
    const snapped = grid.getSnappedPoint(point, {
      mode: CONST.GRID_SNAPPING_MODES.VERTEX,
      resolution: 1
    });
    if (snapped && Number.isFinite(snapped.x) && Number.isFinite(snapped.y)) {
      return { x: snapped.x, y: snapped.y };
    }
  } catch (_error) {
    // Fall through to the geometry-based implementation for compatibility.
  }

  return nearestGridVertex(grid, point, { x: 0, y: 0 });
}

function candidateDimensions(grid, width, height, padding) {
  try {
    const dimensions = grid.calculateDimensions(width, height, padding);
    return {
      x: Number(dimensions.x ?? dimensions.sceneX ?? canvas.dimensions.sceneX),
      y: Number(dimensions.y ?? dimensions.sceneY ?? canvas.dimensions.sceneY)
    };
  } catch (_error) {
    return { x: canvas.dimensions.sceneX, y: canvas.dimensions.sceneY };
  }
}

function nearestGridVertex(grid, worldPoint, origin) {
  const local = { x: worldPoint.x - origin.x, y: worldPoint.y - origin.y };
  const shape = normalizedShape(grid);
  if (!shape) return nearestGridCenter(grid, worldPoint, origin);

  let offset;
  try {
    offset = grid.getOffset(local);
  } catch (_error) {
    return nearestGridCenter(grid, worldPoint, origin);
  }

  const baseI = Number(offset.i ?? offset.row ?? 0);
  const baseJ = Number(offset.j ?? offset.column ?? 0);
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = baseI - 2; i <= baseI + 2; i += 1) {
    for (let j = baseJ - 2; j <= baseJ + 2; j += 1) {
      const center = getCenter(grid, i, j);
      if (!center) continue;
      for (const vertex of shape) {
        const candidate = {
          x: origin.x + center.x + vertex.x,
          y: origin.y + center.y + vertex.y
        };
        const distance = (candidate.x - worldPoint.x) ** 2 + (candidate.y - worldPoint.y) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = candidate;
        }
      }
    }
  }

  return best ?? nearestGridCenter(grid, worldPoint, origin);
}

function nearestGridCenter(grid, worldPoint, origin) {
  const local = { x: worldPoint.x - origin.x, y: worldPoint.y - origin.y };
  try {
    const offset = grid.getOffset(local);
    const center = grid.getCenterPoint(offset);
    return { x: origin.x + center.x, y: origin.y + center.y };
  } catch (_error) {
    const size = Number(grid.size) || REFERENCE_SIZE;
    return {
      x: origin.x + Math.round(local.x / size) * size,
      y: origin.y + Math.round(local.y / size) * size
    };
  }
}
