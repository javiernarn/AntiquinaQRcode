import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import qrcodegen from "qrcode-generator";
import { useNavigate } from "react-router-dom";
import { renderQrSvg, svgToPngDataUrl, BODY_SHAPES, EYE_FRAME_SHAPES as EYE_FRAME_SHAPE_DEFS, EYE_BALL_SHAPES as EYE_BALL_SHAPE_DEFS } from "../utils/qrRenderer";
import {
  LogOut, Download, Save, Trash2, ChevronDown,
  Link2, Type, Wifi, Mail, Phone, MessageSquare, MessageCircle,
  User, Calendar, MapPin, Eye, EyeOff,
  Palette, Bookmark, Copy, RotateCcw, AlertTriangle, ShieldCheck,
  Sparkles, RefreshCw, Eraser, ScanLine, ImageOff, QrCode,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getUserStorage, setUserStorage } from "../utils/storage";
import Footer from "../components/Footer";
import ToastStack from "../components/ToastStack";
import { useToasts } from "../hooks/useToasts";
import logo from "../assets/images/logo.png";

// Falls back to initials (e.g. "Juan Dela Cruz" -> "JD") when the signed-in
// user has no profile photo, mirroring the avatar chip in the header.
const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

// "Body" shape = the shape of each individual data module. Backed by our
// own SVG renderer (src/utils/qrRenderer.js), so every one of these is
// real and live-previewed with the exact same shape logic used below.
const DOT_STYLES = BODY_SHAPES;

// "Eye Frame" = the outer ring of the three big position markers.
const EYE_FRAME_SHAPES = EYE_FRAME_SHAPE_DEFS;

// "Eye Ball" = the solid inner square of each position marker.
const EYE_BALL_SHAPES = EYE_BALL_SHAPE_DEFS;

// Small, generically-drawn (not brand-trademarked) glyphs a user can drop
// into the center of their QR as a logo with one tap — the same "pick an
// icon instead of uploading a file" convenience popular QR tools offer,
// built from scratch here as flat-color rounded tiles.
//
// Each entry is either:
//   { path, ... }  -> a stroked line-art glyph (viewBox "0 0 32 32", unless
//                      `viewBox`/`transform` override it — used for the
//                      Lucide-style icons which are drawn on a 24x24 grid)
//   { inner, ... }  -> raw SVG markup dropped in as-is (used for the
//                      lettermark / pictogram "platform" icons below)
// `bg` is "rounded" (default) or "circle".
const QUICK_LOGO_ICONS = [
  { id: "website", label: "Website", color: "#2563eb",
    path: "M16 6a10 10 0 100 20 10 10 0 000-20zm0 0c-2.8 3-2.8 17 0 20m0-20c2.8 3 2.8 17 0 20M6.6 12h18.8M6.6 20h18.8" },
  { id: "wifi", label: "Wi-Fi", color: "#0891b2",
    path: "M8 14.5a12 12 0 0116 0M11.3 18a7.4 7.4 0 019.4 0M14.6 21.4a2.8 2.8 0 012.8 0" },
  // Same handset silhouette as the lucide-react <Phone> icon used elsewhere
  // in this file, drawn on its native 24x24 grid and centered in the 32x32
  // tile with a 4px margin on every side — the previous hand-drawn path was
  // off-balance within the tile, which is why the glyph looked "pushed up".
  { id: "phone", label: "Phone", color: "#16a34a", viewBox: "0 0 24 24", transform: "translate(4,4)",
    path: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" },
  { id: "email", label: "Email", color: "#dc2626",
    path: "M7 10h18v13H7zM7 10l9 7 9-7" },
  { id: "calendar", label: "Calendar", color: "#7c3aed",
    path: "M8 8h16v16H8zM8 8V5h16v3M12 4v4M20 4v4M8 14h16" },
  { id: "pin", label: "Location", color: "#e11d48",
    path: "M16 26s7-7.4 7-13a7 7 0 10-14 0c0 5.6 7 13 7 13zm0-10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" },
  { id: "chat", label: "Chat", color: "#059669",
    path: "M6 8h20v12H14l-5 4v-4H6z" },
  { id: "share", label: "Share", color: "#ea580c",
    path: "M22 8a3 3 0 100-6 3 3 0 000 6zM10 16a3 3 0 100-6 3 3 0 000 6zM22 30a3 3 0 100-6 3 3 0 000 6zM12.7 14.5l6.6-3.4M12.7 17.5l6.6 3.4" },
  { id: "pay", label: "Payment", color: "#0d9488",
    path: "M16 6a10 10 0 100 20 10 10 0 000-20zm0 4.5v11m3-8.6c0-1.3-1.3-2.4-3-2.4s-3 1-3 2.4c0 3 6 1.6 6 4.6 0 1.4-1.3 2.5-3 2.5s-3-1-3-2.4" },
  { id: "star", label: "Rating", color: "#ca8a04",
    path: "M16 5l3.5 7.2 7.9 1.1-5.7 5.6 1.3 7.9L16 22.9l-7 3.9 1.3-7.9-5.7-5.6 7.9-1.1z" },

  // --- Social / platform pictograms -----------------------------------
  // Generic, self-drawn glyphs that read as "the Facebook icon", "the
  // YouTube icon" etc. at a small size (a lettermark or simple pictogram),
  // not traced reproductions of any brand's actual logo artwork.
  { id: "facebook-box", label: "Facebook", color: "#1877F2", bg: "rounded",
    inner: `<text x="16" y="22.5" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700" fill="#fff" text-anchor="middle">f</text>` },
  { id: "facebook-circle", label: "Facebook", color: "#1877F2", bg: "circle",
    inner: `<text x="16" y="22.5" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700" fill="#fff" text-anchor="middle">f</text>` },
  { id: "twitter", label: "Twitter / X", color: "#0f1419", bg: "rounded",
    inner: `<text x="16" y="22" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">X</text>` },
  { id: "instagram", label: "Instagram", color: "#C13584", bg: "rounded",
    inner: `<rect x="8" y="8" width="16" height="16" rx="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="21.5" cy="10.5" r="1.3" fill="#fff"/>` },
  { id: "youtube", label: "YouTube", color: "#FF0000", bg: "rounded",
    inner: `<rect x="6" y="10.5" width="20" height="11" rx="3.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M13.5 13.2v5.6l6-2.8z" fill="#fff"/>` },
  { id: "google-plus", label: "Google+", color: "#DB4437", bg: "rounded",
    inner: `<text x="15" y="22" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">G+</text>` },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", bg: "rounded",
    inner: `<text x="16" y="21.5" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">in</text>` },
  { id: "xing", label: "Xing", color: "#026466", bg: "rounded",
    inner: `<text x="16" y="21.5" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">X</text>` },
  { id: "pinterest", label: "Pinterest", color: "#E60023", bg: "circle",
    inner: `<text x="16" y="22" font-family="Georgia, serif" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">P</text>` },
  { id: "vimeo", label: "Vimeo", color: "#1AB7EA", bg: "rounded",
    inner: `<text x="16" y="21" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">V</text>` },
  { id: "soundcloud", label: "SoundCloud", color: "#FF5500", bg: "rounded",
    inner: `<path d="M8 21v-6M11 21v-9M14 21v-11M17 21v-9M20 21v-6M23 21v-4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>` },
  { id: "vk", label: "VK", color: "#4C75A3", bg: "rounded",
    inner: `<text x="16" y="21" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">VK</text>` },
  { id: "whatsapp", label: "WhatsApp", color: "#25D366", bg: "circle",
    inner: `<path d="M11 20l1.1-3.4a6.5 6.5 0 111.9 1.9z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>` },
  { id: "app-store", label: "App Store", color: "#0D96F6", bg: "rounded",
    inner: `<path d="M16 9l6.5 11.3H9.5z" fill="#fff"/>` },
  { id: "google-play", label: "Google Play", color: "#34A853", bg: "rounded",
    inner: `<path d="M11 7l14 9-14 9z" fill="#fff"/>` },
  { id: "gmail-social", label: "Gmail", color: "#EA4335", bg: "rounded",
    inner: `<rect x="6" y="9" width="20" height="14" rx="2" fill="#fff"/><path d="M6 10l10 8 10-8" fill="none" stroke="#EA4335" stroke-width="2"/>` },
  { id: "calendar-social", label: "Calendar", color: "#F4B400", bg: "rounded",
    inner: `<rect x="7" y="8" width="18" height="17" rx="2" fill="none" stroke="#fff" stroke-width="2"/><path d="M7 13h18M11 5v6M21 5v6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` },
  { id: "document", label: "Document", color: "#8a90a0", bg: "rounded",
    inner: `<path d="M10 6h9l5 5v15H10z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M19 6v5h5" fill="none" stroke="#fff" stroke-width="2"/>` },
  { id: "wifi-social", label: "Wi-Fi", color: "#00BCD4", bg: "circle",
    inner: `<path d="M8 14.5a12 12 0 0116 0M11.3 18a7.4 7.4 0 019.4 0M14.6 21.4a2.8 2.8 0 012.8 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` },
  { id: "bitcoin", label: "Bitcoin", color: "#F7931A", bg: "circle",
    inner: `<text x="16" y="22" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">₿</text>` },
];

// Turns one of the glyphs above into a flat-color tile (rounded square or
// circle background) and encodes it as an inline SVG data URL — no network
// round-trip, no file. Supports both the original stroked-path glyphs and
// the newer lettermark/pictogram platform icons (via `inner`).
function quickIconToDataUrl(icon) {
  const bg = icon.bg === "circle"
    ? `<circle cx="16" cy="16" r="16" fill="${icon.color}"/>`
    : `<rect width="32" height="32" rx="8" fill="${icon.color}"/>`;
  const glyph = icon.inner
    ? icon.inner
    : `<path d="${icon.path}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="${icon.transform || ""}"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 32 32">` +
    bg + glyph +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// All the QR code "formats" the builder can generate. Each one maps to a
// small form (rendered below) and a raw-data encoder (buildQrData).
const QR_TYPES = [
  { id: "url", label: "URL", icon: Link2 },
  { id: "text", label: "Text", icon: Type },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Call", icon: Phone },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "vcard", label: "Contact", icon: User },
  { id: "event", label: "Event", icon: Calendar },
  { id: "geo", label: "Location", icon: MapPin },
];

const DEFAULT_FIELDS = {
  url: { url: "https://example.com" },
  text: { text: "Hello world!" },
  wifi: { ssid: "", password: "", enc: "WPA", hidden: false },
  email: { to: "", subject: "", body: "" },
  phone: { phone: "" },
  sms: { phone: "", message: "" },
  whatsapp: { phone: "", message: "" },
  vcard: { firstName: "", lastName: "", phone: "", email: "", org: "", url: "" },
  event: { title: "", location: "", start: "", end: "", description: "" },
  geo: { lat: "", lng: "" },
};

const DEFAULT_STATE = {
  qrType: "url",
  fields: DEFAULT_FIELDS,
  title: "Example Title",
  subtitle: "Example Subtitle",
  dotType: "dots",
  cornerSquareType: "extra-rounded",
  cornerDotType: "dot",
  dotColor: "#0e214a",
  bgColor: "#ffffff",
  cornerColor: "#0e214a",
  cornerDotColor: "#0e214a",
  cardBg: "#ffffff",
  logo: null,
  logoRaw: null,
  removeLogoBg: false,
};

// Escapes characters that are special inside WIFI:/VCARD-style payloads.
const esc = (str = "") => String(str).replace(/([\\;,:])/g, "\\$1");

// Converts a <input type="datetime-local"> value into the compact
// YYYYMMDDTHHMMSS form used by VEVENT.
const toIcsDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
};

// Turns the selected QR type + its form fields into the raw string that
// gets encoded into the QR code, following each format's standard spec.
function buildQrData(type, f = {}) {
  switch (type) {
    case "url":
      return (f.url || "").trim() || "https://example.com";
    case "text":
      return f.text || "";
    case "wifi":
      return `WIFI:T:${f.enc || "WPA"};S:${esc(f.ssid)};P:${esc(f.password)};H:${f.hidden ? "true" : "false"};;`;
    case "email": {
      const q = [];
      if (f.subject) q.push(`subject=${encodeURIComponent(f.subject)}`);
      if (f.body) q.push(`body=${encodeURIComponent(f.body)}`);
      return `mailto:${f.to || ""}${q.length ? `?${q.join("&")}` : ""}`;
    }
    case "phone":
      return `tel:${(f.phone || "").trim()}`;
    case "sms":
      return `SMSTO:${(f.phone || "").trim()}:${f.message || ""}`;
    case "whatsapp": {
      const digits = (f.phone || "").replace(/[^\d]/g, "");
      return `https://wa.me/${digits}${f.message ? `?text=${encodeURIComponent(f.message)}` : ""}`;
    }
    case "vcard":
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${esc(f.lastName)};${esc(f.firstName)}`,
        `FN:${esc(`${f.firstName || ""} ${f.lastName || ""}`.trim())}`,
        f.org && `ORG:${esc(f.org)}`,
        f.phone && `TEL;TYPE=CELL:${f.phone}`,
        f.email && `EMAIL:${f.email}`,
        f.url && `URL:${f.url}`,
        "END:VCARD",
      ].filter(Boolean).join("\n");
    case "event":
      return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${esc(f.title)}`,
        f.location && `LOCATION:${esc(f.location)}`,
        f.start && `DTSTART:${toIcsDate(f.start)}`,
        f.end && `DTEND:${toIcsDate(f.end)}`,
        f.description && `DESCRIPTION:${esc(f.description)}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].filter(Boolean).join("\n");
    case "geo":
      return `geo:${f.lat || "0"},${f.lng || "0"}`;
    default:
      return "";
  }
}

// Relative luminance + contrast ratio between two hex colors, used to warn
// when the dot/background pairing is too low-contrast for reliable scanning.
// (Same math as WCAG contrast — a good proxy for "will a phone camera read this".)
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function relativeLuminance({ r, g, b }) {
  const chan = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}
function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [light, dark] = lA > lB ? [lA, lB] : [lB, lA];
  return (light + 0.05) / (dark + 0.05);
}

// Removes a background from an uploaded logo, entirely in the browser (no
// upload to a third-party service). Flood-fills inward from every edge
// pixel: a pixel joins the "background" region if it's close enough to the
// *neighbor that reached it* — not to one fixed sampled color — so it
// follows soft gradients/vignettes all the way across the image, while
// still stopping hard at the actual logo artwork (that color jump is much
// bigger than a gradient's step-to-step drift). A solid-color background
// is just a gradient with zero drift, so this also covers the old case.
function removeSolidBackground(dataUrl, { tolerance = 30 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const { width, height } = canvas;
      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, width, height);
      } catch (err) {
        reject(err);
        return;
      }
      const d = imageData.data;
      const n = width * height;
      const idx = (x, y) => y * width + x;
      const colorAt = (i) => {
        const p = i * 4;
        return [d[p], d[p + 1], d[p + 2]];
      };

      // 1) Border-seeded flood fill.
      const bg = new Uint8Array(n); // 1 = background, to be made transparent
      const visited = new Uint8Array(n);
      const stack = [];
      for (let x = 0; x < width; x++) stack.push(idx(x, 0), idx(x, height - 1));
      for (let y = 0; y < height; y++) stack.push(idx(0, y), idx(width - 1, y));

      while (stack.length) {
        const i = stack.pop();
        if (visited[i]) continue;
        visited[i] = 1;
        bg[i] = 1;
        const x = i % width;
        const y = (i / width) | 0;
        const [r, g, b] = colorAt(i);
        const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = idx(nx, ny);
          if (visited[ni]) continue;
          const [nr, ng, nb] = colorAt(ni);
          const dist = Math.sqrt((r - nr) ** 2 + (g - ng) ** 2 + (b - nb) ** 2);
          if (dist < tolerance) stack.push(ni);
        }
      }

      // 2) Zero the alpha of every background pixel.
      for (let i = 0; i < n; i++) {
        if (bg[i]) d[i * 4 + 3] = 0;
      }

      // 3) Feather the cutout edge one pixel so it doesn't look jagged:
      // any pixel still opaque but touching a cleared pixel gets half alpha.
      const alphaBefore = new Uint8ClampedArray(n);
      for (let i = 0; i < n; i++) alphaBefore[i] = d[i * 4 + 3];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = idx(x, y);
          if (alphaBefore[i] === 0) continue;
          const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
          const touchesCleared = neighbors.some(([nx, ny]) => {
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) return false;
            return alphaBefore[idx(nx, ny)] === 0;
          });
          if (touchesCleared) d[i * 4 + 3] = Math.round(alphaBefore[i] * 0.5);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Couldn't load image"));
    img.src = dataUrl;
  });
}

// Short payloads (like a bare URL) naturally produce a low-version QR code
// with very few, very large modules — at the "dots" dot-style that reads as
// big blobby circles crowded on top of each other instead of the airy,
// well-spaced dot grid we want. Forcing a minimum type/version (module
// count) keeps the dots small and clearly separated regardless of how
// short the encoded data is, while still growing automatically for longer
// data that needs more room.
const MIN_QR_TYPE_NUMBER = 6; // 6 -> 41x41 modules, matches the reference dot spacing/density

function computeTypeNumber(data, ecLevel = "H", floor = MIN_QR_TYPE_NUMBER) {
  try {
    const probe = qrcodegen(0, ecLevel);
    probe.addData(data || " ");
    probe.make();
    const modules = probe.getModuleCount();
    const required = Math.round((modules - 17) / 4);
    return Math.max(floor, required);
  } catch {
    return floor;
  }
}


export default function BuilderPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const renderRef = useRef(null);
  const qrRef = useRef(null);
  const scanLineRef = useRef(null);

  const [state, setState] = useState(() => ({
    ...DEFAULT_STATE,
    fields: JSON.parse(JSON.stringify(DEFAULT_FIELDS)),
  }));
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState("");
  const [showPresets, setShowPresets] = useState(true);
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [panelTab, setPanelTab] = useState("design"); // "design" | "presets"
  const { toasts, push: pushToast } = useToasts();
  const topbarRef = useRef(null);
  const [topbarH, setTopbarH] = useState(72);

  // The QR code is never shown until the user explicitly asks for it.
  // phase: "idle" (nothing generated yet) -> "scanning" (brief loading
  // moment) -> "ready" (QR visible). Any edit made after "ready" doesn't
  // silently swap the visible code out from under the user — it just marks
  // the current preview as stale until they regenerate.
  const [phase, setPhase] = useState("idle");
  const [generatedSignature, setGeneratedSignature] = useState(null);
  const [scanMsgIdx, setScanMsgIdx] = useState(0);
  const scanTimeoutRef = useRef(null);
  const SCAN_MESSAGES = [
    "Reading your details…",
    "Applying design & colors…",
    "Placing the logo…",
    "Finalizing QR code…",
  ];

  useEffect(() => {
    document.title = "QR Code Builder";
  }, []);

  // Gives the fixed/sticky top bar a subtle shadow once the page scrolls,
  // so it visually separates itself from the content underneath it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The header is truly fixed (not just sticky) so it can never be scrolled
  // out of view or shifted by any ancestor. Since fixed elements leave the
  // document flow, measure its real height and push the page content down
  // by that amount, keeping the offset correct across screen sizes / notches.
  useEffect(() => {
    const el = topbarRef.current;
    if (!el) return;
    const update = () => setTopbarH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Load this user's saved presets on mount / when user changes.
  useEffect(() => {
    const saved = getUserStorage(user, "presets") || [];
    setPresets(saved);
  }, [user]);

  // The raw string encoded into the QR code, derived from the selected
  // format (URL, Wi-Fi, vCard, etc.) and that format's field values.
  const qrData = useMemo(
    () => buildQrData(state.qrType, state.fields[state.qrType] || {}),
    [state.qrType, state.fields]
  );

  // Contrast between the dot color and background — the single biggest
  // factor in whether a phone camera can actually read the printed code.
  const contrast = useMemo(
    () => contrastRatio(state.dotColor, state.bgColor),
    [state.dotColor, state.bgColor]
  );

  // A fingerprint of everything that affects the rendered code/card. Used
  // to detect "you changed something since the last time you generated".
  const currentSignature = useMemo(() => JSON.stringify(state), [state]);
  const isStale = phase === "ready" && generatedSignature !== null && generatedSignature !== currentSignature;

  // Cycle the little status line while the "scanning" loader is showing.
  useEffect(() => {
    if (phase !== "scanning") return;
    setScanMsgIdx(0);
    const id = setInterval(() => setScanMsgIdx((i) => (i + 1) % SCAN_MESSAGES.length), 700);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => clearTimeout(scanTimeoutRef.current), []);

  // Kicks off (or replays) the "Generate" moment: freeze the current
  // signature, show the scanning loader for a beat, then reveal the code.
  const generateQr = useCallback(() => {
    const sigAtClick = currentSignature;
    setPhase("scanning");
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      setGeneratedSignature(sigAtClick);
      setPhase("ready");
      playScan();
    }, 3000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSignature]);

  // Builds the current SVG markup from state + qrData. qrRef.current holds
  // the latest string so downloadPng/downloadSvg don't have to re-render.
  const buildSvg = useCallback(() => {
    const svg = renderQrSvg({
      data: qrData || " ",
      size: 800,
      margin: 20,
      typeNumber: computeTypeNumber(qrData),
      ecLevel: "H",
      dotType: state.dotType,
      dotColor: state.dotColor,
      bgColor: state.bgColor,
      cornerSquareType: state.cornerSquareType,
      cornerColor: state.cornerColor,
      cornerDotType: state.cornerDotType,
      cornerDotColor: state.cornerDotColor,
      image: state.logo || null,
      imageSize: 0.32,
      imageMargin: 10,
    });
    qrRef.current = svg;
    return svg;
  }, [state, qrData]);

  const playScan = useCallback(() => {
    const el = scanLineRef.current;
    if (!el) return;
    el.classList.remove("playing");
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add("playing");
  }, []);

  // Keep the on-screen preview in sync with state — re-render the SVG and
  // drop it straight into the preview container.
  useEffect(() => {
    const svg = buildSvg();
    if (renderRef.current) renderRef.current.innerHTML = svg;
    playScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, qrData, playScan]);

  const set = (key) => (e) => setState((s) => ({ ...s, [key]: e.target.value }));

  // Updates a single field within the currently-selected (or explicitly
  // named) QR type's field bag, e.g. setField("wifi", "ssid").
  const setField = (type, key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setState((s) => ({
      ...s,
      fields: { ...s.fields, [type]: { ...s.fields[type], [key]: value } },
    }));
  };

  const setQrType = (id) => setState((s) => ({ ...s, qrType: id }));

  const [bgRemoving, setBgRemoving] = useState(false);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target.result;
      setState((s) => ({ ...s, logoRaw: raw, logo: raw }));
      if (state.removeLogoBg) {
        setBgRemoving(true);
        try {
          const cut = await removeSolidBackground(raw);
          setState((s) => ({ ...s, logo: cut }));
          pushToast("Logo added — background removed", "success");
        } catch {
          pushToast("Logo added (couldn't remove background)", "warning");
        } finally {
          setBgRemoving(false);
        }
      } else {
        pushToast("Logo added to QR code", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggling this checkbox re-processes the already-uploaded logo, or
  // reverts to the original if the user turns it back off.
  const toggleRemoveBg = async (e) => {
    const checked = e.target.checked;
    setState((s) => ({ ...s, removeLogoBg: checked }));
    if (!state.logoRaw) return;
    if (checked) {
      setBgRemoving(true);
      try {
        const cut = await removeSolidBackground(state.logoRaw);
        setState((s) => ({ ...s, logo: cut }));
        pushToast("Background removed from logo", "success");
      } catch {
        pushToast("Couldn't process that image", "warning");
      } finally {
        setBgRemoving(false);
      }
    } else {
      setState((s) => ({ ...s, logo: state.logoRaw }));
    }
  };

  const applyQuickIcon = (icon) => {
    const dataUrl = quickIconToDataUrl(icon);
    setState((s) => ({ ...s, logo: dataUrl, logoRaw: dataUrl, removeLogoBg: false }));
    pushToast(`"${icon.label}" icon added to QR code`, "success");
  };

  const removeLogo = () => {
    setState((s) => ({ ...s, logo: null, logoRaw: null, removeLogoBg: false }));
    pushToast("Logo removed", "default");
  };

  const downloadPng = async () => {
    if (phase !== "ready") return;
    const pngDataUrl = await svgToPngDataUrl(qrRef.current, 800, 800);
    const img = new Image();
    img.onload = () => {
      const pad = 140;
      const textH = 260;
      const w = img.width + pad * 2;
      const h = img.height + pad * 2 + textH;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");

      const radius = 84;
      ctx.fillStyle = state.cardBg;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.arcTo(w, 0, w, h, radius);
      ctx.arcTo(w, h, 0, h, radius);
      ctx.arcTo(0, h, 0, 0, radius);
      ctx.arcTo(0, 0, w, 0, radius);
      ctx.closePath();
      ctx.fill();

      ctx.drawImage(img, pad, pad);

      ctx.textAlign = "center";
      ctx.fillStyle = "#141821";
      ctx.font = '700 70px "Space Grotesk", sans-serif';
      ctx.fillText(state.title, w / 2, img.height + pad + 99);
      ctx.fillStyle = "#8a90a0";
      ctx.font = '500 40px "JetBrains Mono", monospace';
      ctx.fillText(state.subtitle, w / 2, img.height + pad + 169);

      canvas.toBlob((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = (state.title || "qr-code").replace(/\s+/g, "-").toLowerCase() + ".png";
        a.click();
        pushToast("PNG downloaded", "success");
      });
    };
    img.src = pngDataUrl;
  };

  const downloadSvg = () => {
    if (phase !== "ready" || !qrRef.current) return;
    const blob = new Blob([qrRef.current], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (state.title || "qr-code").replace(/\s+/g, "-").toLowerCase() + ".svg";
    a.click();
    pushToast("SVG downloaded", "success");
  };

  const copyQrData = async () => {
    try {
      await navigator.clipboard.writeText(qrData || "");
      pushToast("Encoded data copied to clipboard", "success");
    } catch {
      pushToast("Couldn't access the clipboard", "warning");
    }
  };

  const resetToDefaults = () => {
    setState({ ...DEFAULT_STATE, fields: JSON.parse(JSON.stringify(DEFAULT_FIELDS)) });
    setPhase("idle");
    setGeneratedSignature(null);
    pushToast("Reset to defaults", "default");
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) {
      pushToast("Give the preset a name first", "warning");
      return;
    }
    const isUpdate = presets.some((p) => p.name === name);
    const next = [...presets.filter((p) => p.name !== name), { name, state }];
    setPresets(next);
    setUserStorage(user, "presets", next);
    setPresetName("");
    pushToast(isUpdate ? `Updated preset "${name}"` : `Saved preset "${name}"`, "success");
  };

  const loadPreset = (p) => {
    setState((s) => ({
      ...DEFAULT_STATE,
      ...p.state,
      qrType: p.state.qrType || "url",
      fields: { ...DEFAULT_FIELDS, ...(p.state.fields || {}) },
    }));
    setPhase("idle");
    setGeneratedSignature(null);
    pushToast(`Loaded preset "${p.name}"`, "default");
  };

  const deletePreset = (name) => {
    const next = presets.filter((p) => p.name !== name);
    setPresets(next);
    setUserStorage(user, "presets", next);
    pushToast(`Deleted preset "${name}"`, "default");
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Fields for the currently selected QR type.
  const f = state.fields[state.qrType] || {};

  // Renders the small form for whichever QR format is currently selected.
  const renderTypeFields = () => {
    switch (state.qrType) {
      case "url":
        return (
          <div className="field">
            <label><span className="idx">01</span>Website URL</label>
            <input type="text" value={f.url || ""} onChange={setField("url", "url")} placeholder="https://example.com" />
          </div>
        );
      case "text":
        return (
          <div className="field">
            <label><span className="idx">01</span>Plain text</label>
            <textarea rows={4} value={f.text || ""} onChange={setField("text", "text")} placeholder="Type any text…" />
          </div>
        );
      case "wifi":
        return (
          <>
            <div className="field">
              <label><span className="idx">01</span>Network name (SSID)</label>
              <input type="text" value={f.ssid || ""} onChange={setField("wifi", "ssid")} placeholder="MyWiFiNetwork" />
            </div>
            <div className="field">
              <label><span className="idx">02</span>Password</label>
              <div className="input-with-btn">
                <input
                  type={showWifiPass ? "text" : "password"}
                  value={f.password || ""}
                  onChange={setField("wifi", "password")}
                  placeholder="••••••••"
                />
                <button type="button" className="icon-btn" onClick={() => setShowWifiPass((v) => !v)} title={showWifiPass ? "Hide" : "Show"}>
                  {showWifiPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="field row2">
              <div>
                <label>Security</label>
                <select value={f.enc || "WPA"} onChange={setField("wifi", "enc")}>
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None (open)</option>
                </select>
              </div>
              <label className="checkbox-field">
                <input type="checkbox" checked={!!f.hidden} onChange={setField("wifi", "hidden")} />
                <span>Hidden network</span>
              </label>
            </div>
          </>
        );
      case "email":
        return (
          <>
            <div className="field">
              <label><span className="idx">01</span>Recipient email</label>
              <input type="text" value={f.to || ""} onChange={setField("email", "to")} placeholder="name@example.com" />
            </div>
            <div className="field">
              <label><span className="idx">02</span>Subject</label>
              <input type="text" value={f.subject || ""} onChange={setField("email", "subject")} placeholder="Subject line" />
            </div>
            <div className="field">
              <label><span className="idx">03</span>Message</label>
              <textarea rows={3} value={f.body || ""} onChange={setField("email", "body")} placeholder="Message body" />
            </div>
          </>
        );
      case "phone":
        return (
          <div className="field">
            <label><span className="idx">01</span>Phone number</label>
            <input type="text" value={f.phone || ""} onChange={setField("phone", "phone")} placeholder="+1 555 123 4567" />
          </div>
        );
      case "sms":
        return (
          <>
            <div className="field">
              <label><span className="idx">01</span>Phone number</label>
              <input type="text" value={f.phone || ""} onChange={setField("sms", "phone")} placeholder="+1 555 123 4567" />
            </div>
            <div className="field">
              <label><span className="idx">02</span>Message</label>
              <textarea rows={3} value={f.message || ""} onChange={setField("sms", "message")} placeholder="Pre-filled text message" />
            </div>
          </>
        );
      case "whatsapp":
        return (
          <>
            <div className="field">
              <label><span className="idx">01</span>WhatsApp number</label>
              <input type="text" value={f.phone || ""} onChange={setField("whatsapp", "phone")} placeholder="15551234567 (with country code)" />
            </div>
            <div className="field">
              <label><span className="idx">02</span>Pre-filled message</label>
              <textarea rows={3} value={f.message || ""} onChange={setField("whatsapp", "message")} placeholder="Hi! I'd like to…" />
            </div>
          </>
        );
      case "vcard":
        return (
          <>
            <div className="field row2">
              <div>
                <label><span className="idx">01</span>First name</label>
                <input type="text" value={f.firstName || ""} onChange={setField("vcard", "firstName")} />
              </div>
              <div>
                <label>Last name</label>
                <input type="text" value={f.lastName || ""} onChange={setField("vcard", "lastName")} />
              </div>
            </div>
            <div className="field">
              <label><span className="idx">02</span>Phone</label>
              <input type="text" value={f.phone || ""} onChange={setField("vcard", "phone")} placeholder="+1 555 123 4567" />
            </div>
            <div className="field">
              <label><span className="idx">03</span>Email</label>
              <input type="text" value={f.email || ""} onChange={setField("vcard", "email")} placeholder="name@example.com" />
            </div>
            <div className="field">
              <label><span className="idx">04</span>Company</label>
              <input type="text" value={f.org || ""} onChange={setField("vcard", "org")} placeholder="Optional" />
            </div>
            <div className="field">
              <label><span className="idx">05</span>Website</label>
              <input type="text" value={f.url || ""} onChange={setField("vcard", "url")} placeholder="https://example.com" />
            </div>
          </>
        );
      case "event":
        return (
          <>
            <div className="field">
              <label><span className="idx">01</span>Event title</label>
              <input type="text" value={f.title || ""} onChange={setField("event", "title")} placeholder="Team meetup" />
            </div>
            <div className="field row2">
              <div>
                <label><span className="idx">02</span>Starts</label>
                <input type="datetime-local" value={f.start || ""} onChange={setField("event", "start")} />
              </div>
              <div>
                <label>Ends</label>
                <input type="datetime-local" value={f.end || ""} onChange={setField("event", "end")} />
              </div>
            </div>
            <div className="field">
              <label><span className="idx">03</span>Location</label>
              <input type="text" value={f.location || ""} onChange={setField("event", "location")} placeholder="Optional" />
            </div>
            <div className="field">
              <label><span className="idx">04</span>Description</label>
              <textarea rows={3} value={f.description || ""} onChange={setField("event", "description")} placeholder="Optional" />
            </div>
          </>
        );
      case "geo":
        return (
          <div className="field row2">
            <div>
              <label><span className="idx">01</span>Latitude</label>
              <input type="text" value={f.lat || ""} onChange={setField("geo", "lat")} placeholder="37.786971" />
            </div>
            <div>
              <label>Longitude</label>
              <input type="text" value={f.lng || ""} onChange={setField("geo", "lng")} placeholder="-122.399677" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{styles}</style>
      <ToastStack toasts={toasts} />

      <div ref={topbarRef} className={"topbar" + (scrolled ? " is-scrolled" : "")}>
        <div className="brand">
          <img className="brand-mark" src={logo} alt="" />
          <div className="brand-name">QR Code Builder</div>
        </div>
        <div className="user-chip">
          <button className="icon-btn" onClick={resetToDefaults} title="Reset to defaults">
            <RotateCcw size={15} />
          </button>
          {user?.picture ? (
            <img
              src={user.picture}
              alt=""
              className="user-avatar"
              referrerPolicy="no-referrer"
              title={user?.name || "Signed in"}
            />
          ) : (
            <span className="user-avatar user-avatar-fallback" title={user?.name || "Signed in"}>
              {initialsOf(user?.name)}
            </span>
          )}
          <button className="icon-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: topbarH }}>
      <div className="layout">
        <div className="panel">
          <div className="section-title">QR code type</div>
          <div className="type-grid">
            {QR_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={"type-opt" + (state.qrType === t.id ? " active" : "")}
                  onClick={() => setQrType(t.id)}
                >
                  <Icon size={17} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {renderTypeFields()}

          <button type="button" className="copy-data-btn" onClick={copyQrData}>
            <Copy size={12.5} /> Copy encoded data
          </button>

          <div className="section-title">Card label</div>
          <div className="field">
            <label>Title</label>
            <input type="text" value={state.title} onChange={set("title")} />
          </div>
          <div className="field">
            <label>Subtitle</label>
            <input type="text" value={state.subtitle} onChange={set("subtitle")} />
          </div>

          <div className="panel-tabs" role="tablist" aria-label="Builder sections">
            <button
              type="button"
              role="tab"
              aria-selected={panelTab === "design"}
              className={"panel-tab" + (panelTab === "design" ? " active" : "")}
              onClick={() => setPanelTab("design")}
            >
              <Palette size={14} /> Design
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panelTab === "presets"}
              className={"panel-tab" + (panelTab === "presets" ? " active" : "")}
              onClick={() => setPanelTab("presets")}
            >
              <Bookmark size={14} /> Presets
              {presets.length > 0 && <span className="panel-tab-count">{presets.length}</span>}
            </button>
          </div>

          {panelTab === "design" && (
            <div className="tab-panel">
              <div className="section-title">Body Shape</div>
              <div className="field">
                <div className="shape-grid shape-grid-3">
                  {DOT_STYLES.map((d) => (
                    <button
                      type="button"
                      key={d.val}
                      className={"shape-opt" + (state.dotType === d.val ? " active" : "")}
                      onClick={() => setState((s) => ({ ...s, dotType: d.val }))}
                    >
                      <span className="shape-preview shape-preview-body">
                        {[0, 1, 2, 3].map((i) => (
                          <span key={i} className={`dot-tile dot-tile-${d.val}`} />
                        ))}
                      </span>
                      <span className="shape-label">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="section-title">Eye Frame Shape</div>
              <div className="field">
                <div className="shape-grid shape-grid-3">
                  {EYE_FRAME_SHAPES.map((d) => (
                    <button
                      type="button"
                      key={d.val}
                      className={"shape-opt" + (state.cornerSquareType === d.val ? " active" : "")}
                      onClick={() => setState((s) => ({ ...s, cornerSquareType: d.val }))}
                    >
                      <span className="shape-preview">
                        <span className={`eye-frame eye-frame-${d.val}`} />
                      </span>
                      <span className="shape-label">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="section-title">Eye Ball Shape</div>
              <div className="field">
                <div className="shape-grid shape-grid-2">
                  {EYE_BALL_SHAPES.map((d) => (
                    <button
                      type="button"
                      key={d.val}
                      className={"shape-opt" + (state.cornerDotType === d.val ? " active" : "")}
                      onClick={() => setState((s) => ({ ...s, cornerDotType: d.val }))}
                    >
                      <span className="shape-preview">
                        <span className={`eye-ball eye-ball-${d.val}`} />
                      </span>
                      <span className="shape-label">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="section-title">Colors</div>
              <div className="field row2">
                <div className="color-field">
                  <input type="color" value={state.dotColor} onChange={set("dotColor")} />
                  <span>Dots</span>
                </div>
                <div className="color-field">
                  <input type="color" value={state.bgColor} onChange={set("bgColor")} />
                  <span>Background</span>
                </div>
              </div>
              <div className="field row2">
                <div className="color-field">
                  <input type="color" value={state.cornerColor} onChange={set("cornerColor")} />
                  <span>Corner sq.</span>
                </div>
                <div className="color-field">
                  <input type="color" value={state.cornerDotColor} onChange={set("cornerDotColor")} />
                  <span>Corner dot</span>
                </div>
              </div>

              {contrast < 2.5 ? (
                <div className="contrast-note warn">
                  <AlertTriangle size={14} />
                  <span>Low contrast between dots and background — scanners may struggle to read this code.</span>
                </div>
              ) : (
                <div className="contrast-note ok">
                  <ShieldCheck size={14} />
                  <span>Contrast looks good for reliable scanning.</span>
                </div>
              )}

              <div className="section-title">Logo</div>

              <label className="checkbox-field bg-remove-toggle">
                <input
                  type="checkbox"
                  checked={state.removeLogoBg}
                  onChange={toggleRemoveBg}
                />
                <ImageOff size={14} />
                <span>Remove background behind logo</span>
              </label>

              {!state.logo ? (
                <label className="upload">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  <span>Drop or click to upload a logo (optional)</span>
                </label>
              ) : (
                <div className="logo-preview">
                  <div className="logo-thumb">
                    <img src={state.logo} alt="" />
                    {bgRemoving && <span className="logo-thumb-spinner" />}
                  </div>
                  <span className="logo-name">{bgRemoving ? "Removing background…" : "Logo added"}</span>
                  <button onClick={removeLogo}>Remove</button>
                </div>
              )}
              {state.removeLogoBg && (
                <p className="hint-text">
                  <Eraser size={12} /> Works best on logos with a plain, solid-color background.
                </p>
              )}
              {state.logo && (
                <div className="contrast-note warn" style={{ marginTop: 10 }}>
                  <AlertTriangle size={14} />
                  <span>A logo covers part of the code — high error correction keeps it scannable, but test it before printing.</span>
                </div>
              )}

              <div className="quick-icon-label">Or pick a quick icon</div>
              <div className="quick-icon-grid">
                {QUICK_LOGO_ICONS.map((icon) => (
                  <button
                    type="button"
                    key={icon.id}
                    className="quick-icon-opt"
                    title={icon.label}
                    onClick={() => applyQuickIcon(icon)}
                  >
                    <img src={quickIconToDataUrl(icon)} alt={icon.label} />
                  </button>
                ))}
              </div>

              <div className="section-title">Card</div>
              <div className="color-field" style={{ maxWidth: 200 }}>
                <input type="color" value={state.cardBg} onChange={set("cardBg")} />
                <span>Frame color</span>
              </div>
            </div>
          )}

          {panelTab === "presets" && (
            <div className="tab-panel">
              <div className="section-title">Save current design</div>
              <div className="preset-save-row">
                <input
                  type="text"
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && savePreset()}
                />
                <button className="btn small primary" onClick={savePreset}>
                  <Save size={13} /> Save
                </button>
              </div>

              <button className="dropdown-toggle" onClick={() => setShowPresets((s) => !s)}>
                {presets.length} saved preset{presets.length === 1 ? "" : "s"}
                <ChevronDown size={14} style={{ transform: showPresets ? "rotate(180deg)" : "none" }} />
              </button>
              {showPresets && (
                <div className="preset-list">
                  {presets.length === 0 && (
                    <div className="preset-empty">
                      No presets saved yet — design a code above, name it, and save it here to reuse later.
                    </div>
                  )}
                  {presets.map((p) => (
                    <div className="preset-row" key={p.name}>
                      <button className="preset-load" onClick={() => loadPreset(p)}>{p.name}</button>
                      <button className="icon-btn" onClick={() => deletePreset(p.name)} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="stage" id="qr-stage">
          <div className="canvas-shell">
            {/* Always mounted (so the renderer has a stable DOM node to draw
                into) but only visible once phase === "ready". */}
            <div
              className="canvas-card"
              style={{
                background: state.cardBg,
                visibility: phase === "ready" ? "visible" : "hidden",
                position: phase === "ready" ? "relative" : "absolute",
              }}
            >
              <div className="scan-line" ref={scanLineRef} />
              <div ref={renderRef} />
              <div className="card-title">{state.title}</div>
              <div className="card-sub">{state.subtitle}</div>

              {phase === "ready" && isStale && (
                <div className="stale-overlay">
                  <span>Design updated</span>
                  <button type="button" className="btn small primary" onClick={generateQr}>
                    <RefreshCw size={13} /> Regenerate
                  </button>
                </div>
              )}
            </div>

            {phase === "idle" && (
              <div className="qr-placeholder">
                <QrCode size={40} />
                <p>Your QR code isn't generated yet</p>
                <button type="button" className="btn primary generate-btn" onClick={generateQr}>
                  <Sparkles size={16} /> Generate QR Code
                </button>
              </div>
            )}

            {phase === "scanning" && (
              <div className="qr-placeholder qr-scanning">
                <div className="scan-ring">
                  <ScanLine size={26} className="scan-ring-icon" />
                </div>
                <p className="scan-status">{SCAN_MESSAGES[scanMsgIdx]}</p>
                <div className="scan-progress"><span /></div>
              </div>
            )}
          </div>

          <div className="actions">
            <button className="btn primary" onClick={downloadPng} disabled={phase !== "ready"}>
              <Download size={15} /> Download PNG
            </button>
            <button className="btn" onClick={downloadSvg} disabled={phase !== "ready"}>
              <Download size={15} /> Download SVG
            </button>
          </div>

          <div className="meta-line">
            <span>Error correction: <b>H (30%)</b></span>
            <span>Renders: <b>100% in-browser</b></span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="preview-jump"
        onClick={() => document.getElementById("qr-stage")?.scrollIntoView({ behavior: "smooth" })}
      >
        <Eye size={15} /> Preview QR
      </button>

      <Footer />
      </div>
    </>
  );
}

const styles = `
  /* Top bar is truly fixed — not sticky — so it can never be scrolled out
     of view, disappear, or drift, regardless of what's happening in the
     content below. The page content is offset by its measured height
     (see topbarH / .page-content) so nothing renders underneath it. */
  .topbar{
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 60;
    display:flex; align-items:center; justify-content:space-between;
    gap: 12px;
    flex-wrap: nowrap;
    padding:16px 28px;
    padding-top: calc(16px + env(safe-area-inset-top));
    background: rgba(11,13,18,0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom:1px solid transparent;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .topbar.is-scrolled{
    border-bottom-color: var(--border);
    box-shadow: 0 8px 24px rgba(0,0,0,.35);
  }
  .page-content{ min-width:0; }
  .brand{ display:flex; align-items:center; gap:12px; min-width:0; }
  .brand-mark{
    width:32px; height:32px; border-radius:9px; flex-shrink:0;
    object-fit: cover;
    border: 1px solid var(--border-strong);
  }
  .brand-name{ font-weight:700; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .user-chip{ display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-muted); min-width:0; }
  .user-avatar{
    width:28px; height:28px; border-radius:50%; flex-shrink:0;
    object-fit: cover;
    border: 1px solid var(--border-strong);
  }
  .user-avatar-fallback{
    display:flex; align-items:center; justify-content:center;
    background: var(--surface-2); color: var(--accent);
    font-size:11px; font-weight:700; letter-spacing:.02em;
    font-family:'JetBrains Mono', monospace;
    cursor: default;
  }
  .icon-btn{
    background:var(--surface-2); border:1px solid var(--border); color:var(--text-muted);
    border-radius:8px; padding:6px; cursor:pointer; display:flex; flex-shrink:0;
  }
  .icon-btn:hover{ color:var(--text); border-color:var(--border-strong); }

  .layout{ display:grid; grid-template-columns:400px 1fr; }
  .panel{ padding:26px 26px 60px; border-right:1px solid var(--border); min-width:0; }

  .field{ margin-bottom:20px; }
  .field label{
    display:block; font-family:'JetBrains Mono', monospace; font-size:11px;
    letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;
  }
  .field label .idx{ color:var(--accent); margin-right:6px; }
  input[type=text], input[type=url], input[type=password], input[type=datetime-local],
  textarea, select{
    width:100%; background:var(--surface-2); border:1px solid var(--border);
    color:var(--text); padding:10px 12px; border-radius:9px; font-size:14px; outline:none;
    font-family:inherit;
  }
  input[type=text]:focus, input[type=url]:focus, input[type=password]:focus,
  input[type=datetime-local]:focus, textarea:focus, select:focus{ border-color:var(--accent); }
  textarea{ resize:vertical; min-height:64px; line-height:1.5; }
  select{ cursor:pointer; appearance:none; -webkit-appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238a90a0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 10px center; padding-right:32px;
  }
  input[type=datetime-local]{ color-scheme: dark; }
  .input-with-btn{ display:flex; align-items:center; gap:8px; }
  .input-with-btn input{ flex:1; }
  .checkbox-field{
    display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--text-muted);
    background:var(--surface-2); border:1px solid var(--border); border-radius:9px;
    padding:0 12px; cursor:pointer;
  }
  .checkbox-field input{ width:15px; height:15px; accent-color:var(--accent); cursor:pointer; }
  .row2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .row2 label{
    display:block; font-family:'JetBrains Mono', monospace; font-size:11px;
    letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;
  }
  .row2 label .idx{ color:var(--accent); margin-right:6px; }

  .copy-data-btn{
    display:inline-flex; align-items:center; gap:6px;
    background:none; border:1px dashed var(--border-strong); color:var(--text-muted);
    border-radius:8px; padding:7px 11px; font-size:11.5px;
    font-family:'JetBrains Mono', monospace; cursor:pointer; margin:-8px 0 22px;
  }
  .copy-data-btn:hover{ color:var(--accent); border-color:var(--accent); }

  .panel-tabs{
    display:flex; gap:6px; margin:6px 0 18px;
    background:var(--surface-2); border:1px solid var(--border); border-radius:11px; padding:4px;
  }
  .panel-tab{
    flex:1; display:flex; align-items:center; justify-content:center; gap:7px;
    background:none; border:none; border-radius:8px; padding:9px 10px;
    font-family:'JetBrains Mono', monospace; font-size:12px; color:var(--text-muted); cursor:pointer;
  }
  .panel-tab.active{ background:var(--surface); color:var(--accent); box-shadow:0 1px 2px rgba(0,0,0,.3); }
  .panel-tab-count{
    background:rgba(94,234,212,0.14); color:var(--accent); border-radius:999px;
    font-size:10px; padding:1px 6px; line-height:1.5;
  }
  .tab-panel{ animation: tab-fade 0.18s ease both; }
  @keyframes tab-fade{ from{ opacity:0; transform:translateY(4px);} to{ opacity:1; transform:translateY(0);} }

  .contrast-note{
    display:flex; align-items:flex-start; gap:8px;
    border-radius:9px; padding:10px 12px; font-size:11.5px; line-height:1.5; margin-top:12px;
  }
  .contrast-note svg{ flex-shrink:0; margin-top:1px; }
  .contrast-note.warn{
    background:rgba(251,191,110,0.08); border:1px solid rgba(251,191,110,0.3); color:#fbbf6e;
  }
  .contrast-note.ok{
    background:rgba(94,234,212,0.06); border:1px solid rgba(94,234,212,0.22); color:var(--accent);
  }

  .type-grid{
    display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:24px;
  }
  .type-opt{
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
    border:1px solid var(--border); background:var(--surface-2); border-radius:11px;
    padding:12px 4px; cursor:pointer; color:var(--text-muted);
    font-family:'JetBrains Mono', monospace; font-size:10.5px; text-align:center;
  }
  .type-opt span{ line-height:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  .type-opt:hover{ border-color:var(--border-strong); color:var(--text); }
  .type-opt.active{ border-color:var(--accent); color:var(--accent); background:rgba(94,234,212,0.08); }
  .color-field{ display:flex; align-items:center; gap:10px; background:var(--surface-2);
    border:1px solid var(--border); border-radius:9px; padding:7px 10px; }
  .color-field input[type=color]{ width:26px; height:26px; border:none; border-radius:6px; padding:0; background:none; cursor:pointer; }
  .color-field span{ font-family:'JetBrains Mono', monospace; font-size:11.5px; color:var(--text-muted); }

  .style-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .style-opt{
    border:1px solid var(--border); background:var(--surface-2); border-radius:9px;
    padding:9px 4px; text-align:center; cursor:pointer; font-size:11px;
    color:var(--text-muted); font-family:'JetBrains Mono', monospace;
  }
  .style-opt.active{ border-color:var(--accent); color:var(--accent); background:rgba(94,234,212,0.08); }

  /* Body / Eye Frame / Eye Ball shape pickers ------------------------- */
  .shape-grid{ display:grid; gap:8px; }
  .shape-grid-3{ grid-template-columns:repeat(3,1fr); }
  .shape-grid-2{ grid-template-columns:repeat(2,1fr); }
  .shape-opt{
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
    border:1px solid var(--border); background:var(--surface-2); border-radius:11px;
    padding:12px 6px; cursor:pointer; color:var(--text-muted);
    font-family:'JetBrains Mono', monospace; font-size:10.5px;
  }
  .shape-opt:hover{ border-color:var(--border-strong); color:var(--text); }
  .shape-opt.active{ border-color:var(--accent); color:var(--accent); background:rgba(94,234,212,0.08); }
  .shape-preview{ width:40px; height:40px; display:flex; align-items:center; justify-content:center; }
  .shape-label{ line-height:1; white-space:nowrap; }

  /* Body shape preview: 2x2 grid of mini modules, shaped per dot type */
  .shape-preview-body{ display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:3px; }
  .dot-tile{ width:16px; height:16px; background:currentColor; }
  .dot-tile-square{ border-radius:0; }
  .dot-tile-dots{ border-radius:50%; transform:scale(.82); }
  .dot-tile-rounded{ border-radius:5px; }
  .dot-tile-extra-rounded{ border-radius:9px; }
  .dot-tile-classy{ border-radius:0; clip-path:polygon(0 0,100% 0,100% 65%,65% 100%,0 100%); }
  .dot-tile-classy-rounded{ border-radius:5px; clip-path:polygon(0 0,100% 0,100% 65%,65% 100%,0 100%); }
  .dot-tile-diamond{ clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%); transform:scale(.95); }
  .dot-tile-star{ clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
  .dot-tile-hexagon{ clip-path:polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%); }
  .dot-tile-cross{ clip-path:polygon(35% 0%,65% 0%,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0% 65%,0% 35%,35% 35%); }
  .dot-tile-triangle{ clip-path:polygon(50% 0%,100% 100%,0% 100%); }
  .dot-tile-leaf{ border-radius:55% 0% 55% 0%; }

  /* Eye frame preview: hollow ring, shape = corner-square type */
  .eye-frame{ width:36px; height:36px; border:6px solid currentColor; box-sizing:border-box; display:block; }
  .eye-frame-square{ border-radius:0; }
  .eye-frame-rounded{ border-radius:20%; }
  .eye-frame-extra-rounded{ border-radius:38%; }
  .eye-frame-circle, .eye-frame-dot{ border-radius:50%; }
  .eye-frame-leaf{ border-radius:45% 0% 45% 0%; }
  .eye-frame-leaf-inverse{ border-radius:0% 45% 0% 45%; }
  .eye-frame-diamond{ clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%); }
  .eye-frame-octagon{ clip-path:polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%); }

  /* Eye ball preview: filled center block, shape = corner-dot type */
  .eye-ball{ width:20px; height:20px; background:currentColor; display:block; }
  .eye-ball-square{ border-radius:0; }
  .eye-ball-dot{ border-radius:50%; }
  .eye-ball-rounded{ border-radius:28%; }
  .eye-ball-extra-rounded{ border-radius:45%; }
  .eye-ball-diamond{ clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%); }
  .eye-ball-star{ clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
  .eye-ball-leaf{ border-radius:50% 0% 50% 0%; }
  .eye-ball-cross{ clip-path:polygon(35% 0%,65% 0%,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0% 65%,0% 35%,35% 35%); }

  .upload{ border:1.5px dashed var(--border); border-radius:9px; padding:16px; text-align:center;
    cursor:pointer; color:var(--text-muted); font-size:12.5px; display:block; }
  .upload:hover{ border-color:var(--accent-3); color:var(--accent-3); }
  .upload input{ display:none; }
  .logo-preview{ display:flex; align-items:center; gap:10px; }
  .logo-preview .logo-thumb{ position:relative; width:32px; height:32px; flex-shrink:0; }
  .logo-preview img{ width:32px; height:32px; border-radius:6px; object-fit:contain; background:#fff; }
  .logo-preview .logo-name{ font-size:12px; color:var(--text-muted); flex:1; }
  .logo-preview button{ background:none; border:1px solid var(--border); color:var(--text-muted);
    border-radius:6px; padding:4px 8px; font-size:11px; cursor:pointer; }
  .logo-thumb-spinner{
    position:absolute; inset:-3px; border-radius:8px; border:2px solid transparent;
    border-top-color:var(--accent); animation:spin .8s linear infinite;
  }
  @keyframes spin{ to{ transform:rotate(360deg); } }

  .bg-remove-toggle{ width:100%; margin-bottom:12px; padding:9px 12px; justify-content:flex-start; }
  .bg-remove-toggle span{ flex:1; text-align:left; }
  .hint-text{
    display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-muted);
    margin:8px 0 0;
  }

  .quick-icon-label{
    font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.06em;
    text-transform:uppercase; color:var(--text-muted); margin:18px 0 10px;
  }
  .quick-icon-grid{ display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
  .quick-icon-opt{
    border:1px solid var(--border); background:var(--surface-2); border-radius:9px;
    padding:6px; cursor:pointer; display:flex; align-items:center; justify-content:center;
  }
  .quick-icon-opt:hover{ border-color:var(--accent); }
  .quick-icon-opt img{ width:24px; height:24px; border-radius:6px; display:block; }

  .section-title{
    font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.08em;
    text-transform:uppercase; color:var(--text-muted); margin:30px 0 14px; display:flex; align-items:center; gap:10px;
  }
  .section-title::after{ content:''; flex:1; height:1px; background:var(--border); }
  .panel > .section-title:first-child{ margin-top:0; }

  .preset-save-row{ display:flex; gap:8px; margin-bottom:12px; }
  .preset-save-row input{ flex:1; background:var(--surface-2); border:1px solid var(--border);
    color:var(--text); padding:9px 10px; border-radius:8px; font-size:13px; outline:none; }
  .btn.small{ padding:9px 12px; font-size:11.5px; }

  .dropdown-toggle{
    width:100%; display:flex; align-items:center; justify-content:space-between;
    background:var(--surface-2); border:1px solid var(--border); color:var(--text-muted);
    border-radius:8px; padding:9px 12px; font-family:'JetBrains Mono', monospace; font-size:12px; cursor:pointer;
  }
  .preset-list{ margin-top:8px; display:flex; flex-direction:column; gap:6px; }
  .preset-empty{ font-size:12px; color:var(--text-muted); padding:6px 2px; }
  .preset-row{ display:flex; align-items:center; gap:8px; }
  .preset-load{
    flex:1; text-align:left; background:var(--surface-2); border:1px solid var(--border);
    color:var(--text); border-radius:8px; padding:8px 10px; font-size:12.5px; cursor:pointer;
  }
  .preset-load:hover{ border-color:var(--accent); }

  .stage{ display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; }
  .canvas-shell{ position:relative; width:100%; max-width:420px; min-height:420px; display:flex; align-items:center; justify-content:center; }
  .canvas-card{
    border-radius:28px; padding:38px 38px 28px;
    box-shadow: 0 30px 80px -20px rgba(0,0,0,.65);
    display:flex; flex-direction:column; align-items:center;
  }
  .card-title{ font-weight:700; font-size:18px; color:#141821; margin-top:18px; }
  .card-sub{ font-family:'JetBrains Mono', monospace; font-size:11.5px; color:#8a90a0; margin-top:4px; }
  .scan-line{
    position:absolute; left:38px; right:38px; height:2px;
    background:linear-gradient(90deg, transparent, var(--accent), transparent);
    top:38px; opacity:0; pointer-events:none;
  }
  .scan-line.playing{ animation: scan 1.1s ease-in-out; }
  @keyframes scan{
    0%{ top:38px; opacity:0; } 10%{ opacity:1; } 90%{ opacity:1; }
    100%{ top:calc(100% - 100px); opacity:0; }
  }

  /* "Generate to see it" placeholder, shown before the first generation */
  .qr-placeholder{
    position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:16px; text-align:center; border:1.5px dashed var(--border); border-radius:28px;
    background:var(--surface-2); color:var(--text-muted); padding:32px;
  }
  .qr-placeholder svg{ color:var(--text-muted); }
  .qr-placeholder p{ font-size:13px; margin:0; }
  .generate-btn{ padding:13px 26px; font-size:13px; }

  /* Scanning loader — plays for a beat while the code is "generated" */
  .qr-scanning{ border-style:solid; border-color:var(--border-strong); }
  .scan-ring{
    width:64px; height:64px; border-radius:50%; border:2px solid var(--border-strong);
    display:flex; align-items:center; justify-content:center; position:relative;
  }
  .scan-ring::before{
    content:''; position:absolute; inset:-2px; border-radius:50%;
    border:2px solid transparent; border-top-color:var(--accent); border-right-color:var(--accent);
    animation:spin 1s linear infinite;
  }
  .scan-ring-icon{ color:var(--accent); animation:pulse 1.4s ease-in-out infinite; }
  @keyframes pulse{ 0%,100%{ opacity:.55; } 50%{ opacity:1; } }
  .scan-status{
    font-family:'JetBrains Mono', monospace; font-size:12px; color:var(--text); min-height:16px;
  }
  .scan-progress{
    width:180px; height:4px; border-radius:999px; background:var(--border); overflow:hidden;
  }
  .scan-progress span{
    display:block; height:100%; background:var(--accent); border-radius:999px;
    width:0%; animation:fillbar 3s linear forwards;
  }
  @keyframes fillbar{ from{ width:0%; } to{ width:100%; } }

  /* Overlay shown on top of a previously-generated code once the design
     has changed underneath it, prompting the user to regenerate. */
  .stale-overlay{
    position:absolute; inset:0; border-radius:28px;
    background:rgba(11,13,18,0.72); backdrop-filter:blur(2px);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;
  }
  .stale-overlay span{
    font-family:'JetBrains Mono', monospace; font-size:12px; color:#fff;
    background:rgba(255,255,255,0.1); padding:5px 12px; border-radius:999px;
  }

  .actions{ display:flex; gap:12px; margin-top:28px; }
  .btn{
    font-family:'JetBrains Mono', monospace; font-size:12.5px; border-radius:9px; padding:12px 20px;
    cursor:pointer; border:1px solid var(--border); background:var(--surface-2); color:var(--text);
    display:flex; align-items:center; gap:8px;
  }
  .btn.primary{ background:var(--accent); color:#0b0d12; border-color:var(--accent); font-weight:700; }
  .btn:hover{ border-color:var(--border-strong); }
  .btn:disabled{ opacity:.4; cursor:not-allowed; }
  .btn:disabled:hover{ border-color:var(--border); }
  .meta-line{ margin-top:18px; font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--text-muted); display:flex; gap:18px; }
  .meta-line b{ color:var(--accent); font-weight:500; }

  /* The QR canvas/SVG is rendered at a fixed pixel size by the qr-code-styling
     library; scale it down visually to fit any screen without losing quality. */
  .canvas-card canvas, .canvas-card svg{ max-width:100%; height:auto; display:block; }

  .preview-jump{ display:none; }

  @media (max-width: 880px){
    .layout{ grid-template-columns:1fr; }
    .panel{ border-right:none; border-bottom:1px solid var(--border); }

    .preview-jump{
      display:flex; align-items:center; gap:7px;
      position:fixed; left:50%; bottom:calc(18px + env(safe-area-inset-bottom));
      transform:translateX(-50%);
      background:var(--accent); color:#0b0d12; border:none; border-radius:999px;
      padding:12px 20px; font-weight:700; font-size:12.5px;
      font-family:'JetBrains Mono', monospace; cursor:pointer;
      box-shadow:0 10px 30px -6px rgba(0,0,0,.6); z-index:50;
    }
  }

  @media (max-width: 640px){
    .topbar{ padding:14px 18px; padding-top:calc(14px + env(safe-area-inset-top)); }
    .brand-name{ font-size:14.5px; }
    .panel{ padding:14px 18px 40px; }
    .stage{ padding:28px 16px 40px; }
    .type-grid{ grid-template-columns:repeat(4,1fr); gap:7px; }
    .style-grid{ grid-template-columns:repeat(2,1fr); }
    .canvas-card{ padding:28px 22px 22px; width:100%; max-width:340px; }
    .canvas-shell{ max-width:340px; min-height:340px; }
    .actions{ flex-direction:column; width:100%; max-width:340px; }
    .actions .btn{ width:100%; justify-content:center; }
    .meta-line{ flex-direction:column; gap:6px; align-items:center; text-align:center; }
    .row2{ grid-template-columns:1fr 1fr; gap:10px; }
  }

  @media (max-width: 400px){
    .type-grid{ grid-template-columns:repeat(3,1fr); }
    .row2{ grid-template-columns:1fr; }
    .user-name{ display:none; }
    .brand-name{ font-size:13.5px; }
  }
`;
