// src/utils/qrRenderer.js
//
// A from-scratch SVG QR code renderer. Replaces `qr-code-styling` entirely.
//
// Why: qr-code-styling only ships 6 body (dot) shapes, 3 eye-frame shapes
// and 2 eye-ball shapes. This renderer draws every module itself, so it can
// offer a much wider shape library (12 / 8 / 8) at full SVG quality, with a
// PNG export derived directly from that same SVG (no second canvas-drawing
// code path to keep in sync).
//
// Public API:
//   BODY_SHAPES, EYE_FRAME_SHAPES, EYE_BALL_SHAPES  -> option lists for UI pickers
//   buildMatrix(data, typeNumber, ecLevel)          -> { size, isDark(r,c) }
//   renderQrSvg(options)                            -> svg markup string
//   svgToPngDataUrl(svgMarkup, widthPx, heightPx)    -> Promise<string data-url>
//
import qrcodegen from "qrcode-generator";

// ---------------------------------------------------------------------------
// Option lists (drive both the picker UI and the shape switch statements
// below — the `val` is the only thing that has to match).
// ---------------------------------------------------------------------------

export const BODY_SHAPES = [
  { val: "square", label: "Square" },
  { val: "dots", label: "Dots" },
  { val: "rounded", label: "Rounded" },
  { val: "extra-rounded", label: "Extra Round" },
  { val: "classy", label: "Classy" },
  { val: "classy-rounded", label: "Classy Round" },
  { val: "diamond", label: "Diamond" },
  { val: "star", label: "Star" },
  { val: "hexagon", label: "Hexagon" },
  { val: "cross", label: "Cross" },
  { val: "triangle", label: "Triangle" },
  { val: "leaf", label: "Leaf" },
];

export const EYE_FRAME_SHAPES = [
  { val: "square", label: "Square" },
  { val: "rounded", label: "Rounded" },
  { val: "extra-rounded", label: "Extra Round" },
  { val: "circle", label: "Circle" },
  { val: "leaf", label: "Leaf" },
  { val: "leaf-inverse", label: "Leaf Alt" },
  { val: "diamond", label: "Diamond" },
  { val: "octagon", label: "Octagon" },
];

export const EYE_BALL_SHAPES = [
  { val: "square", label: "Square" },
  { val: "dot", label: "Circle" },
  { val: "rounded", label: "Rounded" },
  { val: "extra-rounded", label: "Extra Round" },
  { val: "diamond", label: "Diamond" },
  { val: "star", label: "Star" },
  { val: "leaf", label: "Leaf" },
  { val: "cross", label: "Cross" },
];

// ---------------------------------------------------------------------------
// QR matrix generation (thin wrapper around qrcode-generator)
// ---------------------------------------------------------------------------

export function buildMatrix(data, typeNumber = 0, ecLevel = "H") {
  const qr = qrcodegen(typeNumber, ecLevel);
  qr.addData(data || " ");
  qr.make();
  const size = qr.getModuleCount();
  return { size, isDark: (r, c) => qr.isDark(r, c) };
}

// True for the 7x7 finder-pattern block at each of the three corners —
// those modules are drawn by the eye frame/ball renderers instead, so the
// body-shape loop skips them.
function inFinderZone(r, c, n) {
  return (
    (r < 7 && c < 7) ||
    (r < 7 && c >= n - 7) ||
    (r >= n - 7 && c < 7)
  );
}

// ---------------------------------------------------------------------------
// Geometry helpers — every shape function below returns a raw SVG string
// (a <rect>, <circle>, <polygon>, or <path>).
// ---------------------------------------------------------------------------

const pt = (n) => Number(n.toFixed(2));

// Rounded rect where each corner can have its own radius (0 = sharp).
function roundedRectPath(x, y, w, h, rTL, rTR, rBR, rBL) {
  rTL = Math.min(rTL, w / 2, h / 2);
  rTR = Math.min(rTR, w / 2, h / 2);
  rBR = Math.min(rBR, w / 2, h / 2);
  rBL = Math.min(rBL, w / 2, h / 2);
  return [
    `M${pt(x + rTL)},${pt(y)}`,
    `H${pt(x + w - rTR)}`,
    rTR ? `A${pt(rTR)},${pt(rTR)} 0 0 1 ${pt(x + w)},${pt(y + rTR)}` : "",
    `V${pt(y + h - rBR)}`,
    rBR ? `A${pt(rBR)},${pt(rBR)} 0 0 1 ${pt(x + w - rBR)},${pt(y + h)}` : "",
    `H${pt(x + rBL)}`,
    rBL ? `A${pt(rBL)},${pt(rBL)} 0 0 1 ${pt(x)},${pt(y + h - rBL)}` : "",
    `V${pt(y + rTL)}`,
    rTL ? `A${pt(rTL)},${pt(rTL)} 0 0 1 ${pt(x + rTL)},${pt(y)}` : "",
    "Z",
  ].join("");
}

function polygonPoints(points) {
  return points.map((p) => `${pt(p[0])},${pt(p[1])}`).join(" ");
}

function regularPolygon(cx, cy, r, sides, rotationDeg = -90) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = ((rotationDeg + (360 / sides) * i) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function starPoints(cx, cy, outerR, innerR, spikes = 5, rotationDeg = -90) {
  const pts = [];
  const step = Math.PI / spikes;
  let a = (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    a += step;
  }
  return pts;
}

// Chamfered (octagon-like) rect: cuts every corner of a square by `cut` px.
function chamferRectPoints(x, y, w, h, cut) {
  cut = Math.min(cut, w / 2, h / 2);
  return [
    [x + cut, y],
    [x + w - cut, y],
    [x + w, y + cut],
    [x + w, y + h - cut],
    [x + w - cut, y + h],
    [x + cut, y + h],
    [x, y + h - cut],
    [x, y + cut],
  ];
}

// Plus / cross shape centered in a w x h box; `arm` is the bar thickness as
// a fraction (0-1) of the box size.
function crossPath(x, y, w, h, arm = 0.4) {
  const aw = w * arm;
  const ah = h * arm;
  const midX = x + w / 2;
  const midY = y + h / 2;
  const pts = [
    [midX - aw / 2, y],
    [midX + aw / 2, y],
    [midX + aw / 2, midY - ah / 2],
    [x + w, midY - ah / 2],
    [x + w, midY + ah / 2],
    [midX + aw / 2, midY + ah / 2],
    [midX + aw / 2, y + h],
    [midX - aw / 2, y + h],
    [midX - aw / 2, midY + ah / 2],
    [x, midY + ah / 2],
    [x, midY - ah / 2],
    [midX - aw / 2, midY - ah / 2],
  ];
  return `M${polygonPoints(pts).replace(/ /g, " L")}Z`.replace("ML", "M");
}

// ---------------------------------------------------------------------------
// Body (data-module) shape rendering
// ---------------------------------------------------------------------------

// Shapes that "connect" to dark neighbors (their corner radii depend on
// which of the 4 orthogonal neighbors are also dark) vs. shapes drawn as a
// uniform isolated glyph in every dark cell.
const CONNECTED_BODY_SHAPES = new Set([
  "square",
  "rounded",
  "extra-rounded",
  "classy",
  "classy-rounded",
]);

function connectedBodyModule(shape, x, y, s, nb) {
  // nb = { top, right, bottom, left } booleans (dark neighbor present)
  const full = s * 0.5;
  let rTL, rTR, rBR, rBL;

  if (shape === "square") {
    rTL = rTR = rBR = rBL = 0;
  } else {
    const radius = shape === "extra-rounded" ? full : s * 0.32;
    const cornerRound = (a, b) => (!nb[a] && !nb[b] ? radius : 0);
    rTL = cornerRound("top", "left");
    rTR = cornerRound("top", "right");
    rBR = cornerRound("bottom", "right");
    rBL = cornerRound("bottom", "left");

    if (shape === "classy") {
      // Only the diagonal tl/br corners ever round — gives the
      // characteristic cascading "classy" look.
      rTR = 0;
      rBL = 0;
    } else if (shape === "classy-rounded") {
      // All corners can round, but the tr/bl corners round at half radius
      // so the diagonal flow still reads more strongly than tl/br.
      rTR = rTR ? radius * 0.5 : 0;
      rBL = rBL ? radius * 0.5 : 0;
    }
  }
  return `<path d="${roundedRectPath(x, y, s, s, rTL, rTR, rBR, rBL)}"/>`;
}

function isolatedBodyGlyph(shape, x, y, s) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  switch (shape) {
    case "dots": {
      const r = (s / 2) * 0.85;
      return `<circle cx="${pt(cx)}" cy="${pt(cy)}" r="${pt(r)}"/>`;
    }
    case "diamond": {
      const r = (s / 2) * 0.92;
      return `<polygon points="${polygonPoints([
        [cx, cy - r],
        [cx + r, cy],
        [cx, cy + r],
        [cx - r, cy],
      ])}"/>`;
    }
    case "star": {
      const pts = starPoints(cx, cy, s * 0.52, s * 0.22, 5);
      return `<polygon points="${polygonPoints(pts)}"/>`;
    }
    case "hexagon": {
      const pts = regularPolygon(cx, cy, (s / 2) * 0.92, 6, -90);
      return `<polygon points="${polygonPoints(pts)}"/>`;
    }
    case "cross": {
      return `<path d="${crossPath(x, y, s, s, 0.42)}"/>`;
    }
    case "triangle": {
      const r = (s / 2) * 0.95;
      return `<polygon points="${polygonPoints(regularPolygon(cx, cy, r, 3, -90))}"/>`;
    }
    case "leaf": {
      const r = s * 0.55;
      return `<path d="${roundedRectPath(x, y, s, s, r, 0, r, 0)}"/>`;
    }
    default:
      return `<rect x="${pt(x)}" y="${pt(y)}" width="${pt(s)}" height="${pt(s)}"/>`;
  }
}

function renderBody(matrix, shape, cell, margin) {
  const { size, isDark } = matrix;
  let out = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isDark(r, c) || inFinderZone(r, c, size)) continue;
      const x = margin + c * cell;
      const y = margin + r * cell;
      if (CONNECTED_BODY_SHAPES.has(shape)) {
        const nb = {
          top: r > 0 && isDark(r - 1, c),
          bottom: r < size - 1 && isDark(r + 1, c),
          left: c > 0 && isDark(r, c - 1),
          right: c < size - 1 && isDark(r, c + 1),
        };
        out += connectedBodyModule(shape, x, y, cell, nb);
      } else {
        out += isolatedBodyGlyph(shape, x, y, cell);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Eye frame (outer 7x7 ring) + eye ball (inner 3x3) rendering
// ---------------------------------------------------------------------------

function eyeFrameShapePath(shape, x, y, size) {
  switch (shape) {
    case "square":
      return `<rect x="${pt(x)}" y="${pt(y)}" width="${pt(size)}" height="${pt(size)}"/>`;
    case "rounded":
      return `<path d="${roundedRectPath(x, y, size, size, size * 0.18, size * 0.18, size * 0.18, size * 0.18)}"/>`;
    case "extra-rounded":
      return `<path d="${roundedRectPath(x, y, size, size, size * 0.35, size * 0.35, size * 0.35, size * 0.35)}"/>`;
    case "circle":
      return `<circle cx="${pt(x + size / 2)}" cy="${pt(y + size / 2)}" r="${pt(size / 2)}"/>`;
    case "leaf":
      return `<path d="${roundedRectPath(x, y, size, size, size * 0.42, 0, size * 0.42, 0)}"/>`;
    case "leaf-inverse":
      return `<path d="${roundedRectPath(x, y, size, size, 0, size * 0.42, 0, size * 0.42)}"/>`;
    case "diamond":
      return `<polygon points="${polygonPoints([
        [x + size / 2, y],
        [x + size, y + size / 2],
        [x + size / 2, y + size],
        [x, y + size / 2],
      ])}"/>`;
    case "octagon":
      return `<polygon points="${polygonPoints(chamferRectPoints(x, y, size, size, size * 0.28))}"/>`;
    default:
      return `<rect x="${pt(x)}" y="${pt(y)}" width="${pt(size)}" height="${pt(size)}"/>`;
  }
}

function eyeBallShapePath(shape, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  switch (shape) {
    case "square":
      return `<rect x="${pt(x)}" y="${pt(y)}" width="${pt(size)}" height="${pt(size)}"/>`;
    case "dot":
      return `<circle cx="${pt(cx)}" cy="${pt(cy)}" r="${pt(size / 2)}"/>`;
    case "rounded":
      return `<path d="${roundedRectPath(x, y, size, size, size * 0.28, size * 0.28, size * 0.28, size * 0.28)}"/>`;
    case "extra-rounded":
      return `<path d="${roundedRectPath(x, y, size, size, size * 0.45, size * 0.45, size * 0.45, size * 0.45)}"/>`;
    case "diamond":
      return `<polygon points="${polygonPoints([
        [cx, y],
        [x + size, cy],
        [cx, y + size],
        [x, cy],
      ])}"/>`;
    case "star":
      return `<polygon points="${polygonPoints(starPoints(cx, cy, size * 0.54, size * 0.23, 5))}"/>`;
    case "leaf":
      return `<path d="${roundedRectPath(x, y, size, size, size * 0.5, 0, size * 0.5, 0)}"/>`;
    case "cross":
      return `<path d="${crossPath(x, y, size, size, 0.45)}"/>`;
    default:
      return `<rect x="${pt(x)}" y="${pt(y)}" width="${pt(size)}" height="${pt(size)}"/>`;
  }
}

// Draws all 3 finder patterns: frame ring (fill = frameColor, with the
// inner 5x5 punched out to bg color) + the solid 3x3 ball on top.
function renderEyes({ n, cell, margin, frameShape, frameColor, ballShape, ballColor, bgColor }) {
  const anchors = [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ];
  let out = "";
  for (const [r0, c0] of anchors) {
    const fx = margin + c0 * cell;
    const fy = margin + r0 * cell;
    const frameSize = cell * 7;
    const holeSize = cell * 5;
    const ballSize = cell * 3;

    out += `<g fill="${frameColor}">${eyeFrameShapePath(frameShape, fx, fy, frameSize)}</g>`;
    out += `<g fill="${bgColor}">${eyeFrameShapePath(
      frameShape === "circle" ? "circle" : frameShape,
      fx + cell,
      fy + cell,
      holeSize
    )}</g>`;
    out += `<g fill="${ballColor}">${eyeBallShapePath(ballShape, fx + cell * 2, fy + cell * 2, ballSize)}</g>`;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Logo overlay — clears a square of modules under the image and draws it
// centered, with a small solid-color pad so it stays readable against
// whatever's directly behind it.
// ---------------------------------------------------------------------------

function logoOverlaySvg({ size, margin, image, imageSize = 0.32, imageMargin = 10, bgColor }) {
  if (!image) return "";
  const box = size * imageSize;
  const x = (size - box) / 2;
  const y = (size - box) / 2;
  const pad = Math.max(0, imageMargin);
  return [
    `<rect x="${pt(x - pad)}" y="${pt(y - pad)}" width="${pt(box + pad * 2)}" height="${pt(box + pad * 2)}" rx="${pt(
      (box + pad * 2) * 0.12
    )}" fill="${bgColor}"/>`,
    `<image href="${image}" x="${pt(x)}" y="${pt(y)}" width="${pt(box)}" height="${pt(box)}" preserveAspectRatio="xMidYMid slice"/>`,
  ].join("");
}

// Which data modules fall under the logo box, so the body-shape loop can
// skip drawing them (keeps the code scannable and avoids visual clutter
// under the image).
function logoClearZone({ size, imageSize }) {
  if (!imageSize) return null;
  const n = size;
  const boxModules = Math.ceil(n * imageSize) + 2; // + small buffer
  const start = Math.floor((n - boxModules) / 2);
  const end = start + boxModules;
  return { start, end };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function renderQrSvg({
  data,
  size = 800,
  margin = 20,
  typeNumber = 0,
  ecLevel = "H",
  dotType = "square",
  dotColor = "#000000",
  bgColor = "#ffffff",
  cornerSquareType = "square",
  cornerColor = "#000000",
  cornerDotType = "square",
  cornerDotColor = "#000000",
  image = null,
  imageSize = 0.32,
  imageMargin = 10,
}) {
  const matrix = buildMatrix(data, typeNumber, ecLevel);
  const n = matrix.size;
  const cell = (size - margin * 2) / n;
  const clear = image ? logoClearZone({ size: n, imageSize }) : null;

  const isDark = clear
    ? (r, c) =>
        matrix.isDark(r, c) &&
        !(r >= clear.start && r < clear.end && c >= clear.start && c < clear.end)
    : matrix.isDark;

  const body = renderBody({ size: n, isDark }, dotType, cell, margin);
  const eyes = renderEyes({
    n,
    cell,
    margin,
    frameShape: cornerSquareType,
    frameColor: cornerColor,
    ballShape: cornerDotType,
    ballColor: cornerDotColor,
    bgColor,
  });
  const logo = image ? logoOverlaySvg({ size, margin, image, imageSize, imageMargin, bgColor }) : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" fill="${bgColor}"/>`,
    `<g fill="${dotColor}">${body}</g>`,
    eyes,
    logo,
    `</svg>`,
  ].join("");
}

// ---------------------------------------------------------------------------
// PNG export — rasterizes the SVG string through an offscreen <img>/<canvas>.
// ---------------------------------------------------------------------------

export function svgToPngDataUrl(svgMarkup, width, height) {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
