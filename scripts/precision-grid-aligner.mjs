const MODULE_ID = "precision-grid-aligner";
const ROOT_ID = `${MODULE_ID}-overlay`;
const PANEL_ID = `${MODULE_ID}-panel`;
const LAUNCHER_ID = `${MODULE_ID}-launcher`;
const REFERENCE_SIZE = 100;
const MIN_GRID_SIZE = 20;

const state = {
  open: false,
  root: null,
  svg: null,
  panel: null,
  launcher: null,
  handles: [],
  activePointer: null,
  anchors: [null, null],
  kind: "square",
  measurement: 5,
  split: false,
  fineX: 0,
  fineY: 0,
  hookIds: []
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

Hooks.once("ready", () => {
  createLauncher();
  refreshLauncherVisibility();
});

Hooks.on("canvasReady", () => {
  createLauncher();
  refreshLauncherVisibility();
  if (state.open) refreshOverlay();
});

Hooks.on("canvasTearDown", () => {
  closeWizard();
  refreshLauncherVisibility();
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

function createLauncher() {
  if (document.getElementById(LAUNCHER_ID)) {
    state.launcher = document.getElementById(LAUNCHER_ID);
    return;
  }

  const button = document.createElement("button");
  button.id = LAUNCHER_ID;
  button.type = "button";
  button.className = "pga-launcher";
  button.title = t("PGA.Launcher.Tooltip");
  button.setAttribute("aria-label", t("PGA.Launcher.Tooltip"));
  button.innerHTML = '<i class="fa-solid fa-border-all" aria-hidden="true"></i>';
  button.addEventListener("click", toggleWizard);
  document.body.append(button);
  state.launcher = button;
}

function refreshLauncherVisibility() {
  if (!state.launcher) return;
  const visible = Boolean(game.user?.isGM && canvas?.ready && canvas?.scene);
  state.launcher.classList.toggle("pga-hidden", !visible);
  state.launcher.classList.toggle("pga-active", state.open);
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
  refreshLauncherVisibility();
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
  refreshLauncherVisibility();
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

function calculateMajorSize() {
  const a = state.anchors[0];
  const b = state.anchors[1];
  const measured = {
    x: Math.abs(b.x - a.x),
    y: Math.abs(b.y - a.y)
  };
  const reference = referenceDelta(state.kind, REFERENCE_SIZE);
  const denominator = reference.x ** 2 + reference.y ** 2;
  if (!denominator) return NaN;
  const scale = (measured.x * reference.x + measured.y * reference.y) / denominator;
  return REFERENCE_SIZE * scale;
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
    state.anchors[index] = point;
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
      state.kind = input.value;
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

  const major = calculateMajorSize();
  const native = calculateNativeSize();
  if (!Number.isFinite(major) || !Number.isFinite(native)) {
    status.textContent = t("PGA.Status.Invalid");
    status.classList.add("pga-status-error");
    return;
  }

  status.classList.toggle("pga-status-error", native < MIN_GRID_SIZE);
  const majorLabel = `${major.toFixed(2)} px / ${state.measurement || 0} ft`;
  const nativeLabel = state.split
    ? `${native.toFixed(2)} px / 5 ft`
    : `${native.toFixed(2)} px / ${state.measurement || 0} ft`;
  status.innerHTML = `
    <span>${t("PGA.Status.Major")}: <strong>${majorLabel}</strong></span>
    <span>${t("PGA.Status.Native")}: <strong>${nativeLabel}</strong></span>
  `;
}

function refreshOverlay() {
  if (!state.open || !state.root || !canvas?.ready) return;
  state.handles.forEach((handle, index) => {
    const point = worldToScreen(state.anchors[index]);
    if (!point) return;
    handle.style.left = `${point.x}px`;
    handle.style.top = `${point.y}px`;
  });
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

  const majorSize = calculateMajorSize();
  if (!Number.isFinite(majorSize) || majorSize <= 0) return;

  const origin = {
    x: state.anchors[0].x + state.fineX,
    y: state.anchors[0].y + state.fineY
  };
  const grid = createGrid(state.kind, majorSize);
  const rendered = grid ? drawGridCells(grid, origin) : false;
  if (!rendered) drawFallbackPreview(origin, majorSize);
  drawConnector(origin, state.anchors[1]);
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

function drawGridCells(grid, origin) {
  const shape = normalizedShape(grid);
  const baseCenter = getCenter(grid, 0, 0);
  if (!shape || !baseCenter) return false;

  const referenceVertex = shape.reduce((best, point) => {
    return (point.x + point.y) < (best.x + best.y) ? point : best;
  }, shape[0]);

  let count = 0;
  for (let i = -1; i <= 3; i += 1) {
    for (let j = -1; j <= 3; j += 1) {
      const center = getCenter(grid, i, j);
      if (!center) continue;
      const worldPoints = shape.map((point) => ({
        x: origin.x + (center.x - baseCenter.x) + (point.x - referenceVertex.x),
        y: origin.y + (center.y - baseCenter.y) + (point.y - referenceVertex.y)
      }));
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

function drawFallbackPreview(origin, size) {
  const end = { x: origin.x + size * 3, y: origin.y + size * 3 };
  for (let index = 0; index <= 3; index += 1) {
    appendLine(
      { x: origin.x + size * index, y: origin.y },
      { x: origin.x + size * index, y: end.y },
      "pga-grid-line"
    );
    appendLine(
      { x: origin.x, y: origin.y + size * index },
      { x: end.x, y: origin.y + size * index },
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
  const nativeSizeFloat = calculateNativeSize();
  if (!Number.isFinite(measurement) || measurement <= 0) {
    return notify("error", "PGA.Notifications.InvalidMeasurement");
  }
  if (!Number.isFinite(nativeSizeFloat) || nativeSizeFloat < MIN_GRID_SIZE) {
    return notify("error", "PGA.Notifications.InvalidGridSize");
  }

  const nativeSize = Math.round(nativeSizeFloat);
  const finalDistance = state.split ? 5 : measurement;
  const type = gridTypeForKind(state.kind);
  const finalGrid = createGrid(state.kind, nativeSize, finalDistance);
  if (!finalGrid) return notify("error", "PGA.Notifications.GridConstructionFailed");

  const scene = canvas.scene;
  const dimensions = candidateDimensions(finalGrid, scene);
  const previewOrigin = {
    x: state.anchors[0].x + state.fineX,
    y: state.anchors[0].y + state.fineY
  };
  const target = nearestGridVertex(finalGrid, previewOrigin, dimensions);
  const shift = {
    x: target.x - previewOrigin.x,
    y: target.y - previewOrigin.y
  };

  const background = scene._source.background ?? {};
  const update = {
    "grid.type": type,
    "grid.size": nativeSize,
    "grid.distance": finalDistance,
    "grid.units": "ft",
    "background.offsetX": Number(background.offsetX || 0) + shift.x,
    "background.offsetY": Number(background.offsetY || 0) + shift.y,
    [`flags.${MODULE_ID}.gridKind`]: state.kind,
    [`flags.${MODULE_ID}.majorMeasurement`]: measurement,
    [`flags.${MODULE_ID}.splitIntoFive`]: Boolean(state.split)
  };

  closeWizard();
  try {
    await scene.update(update);
    notify("info", "PGA.Notifications.Applied");
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to update scene`, error);
    notify("error", "PGA.Notifications.UpdateFailed");
  }
}

function candidateDimensions(grid, scene) {
  try {
    const dimensions = grid.calculateDimensions(scene.width, scene.height, scene.padding);
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
