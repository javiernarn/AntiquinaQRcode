import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import QRCodeStyling from "qr-code-styling";
import { useNavigate } from "react-router-dom";
import {
  LogOut, Download, Save, Trash2, ChevronDown,
  Link2, Type, Wifi, Mail, Phone, MessageSquare, MessageCircle,
  User, Calendar, MapPin, Eye, EyeOff,
  Palette, Bookmark, Copy, RotateCcw, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getUserStorage, setUserStorage } from "../utils/storage";
import Footer from "../components/Footer";
import ToastStack from "../components/ToastStack";
import { useToasts } from "../hooks/useToasts";
import logo from "../assets/images/logo.png";

const DOT_STYLES = [
  { val: "dots", label: "Dots" },
  { val: "rounded", label: "Round" },
  { val: "classy", label: "Classy" },
  { val: "square", label: "Square" },
];

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
  title: "QR Code Builder",
  subtitle: "example.com",
  dotType: "dots",
  dotColor: "#0e214a",
  bgColor: "#ffffff",
  cornerColor: "#0e214a",
  cornerDotColor: "#0e214a",
  cardBg: "#ffffff",
  logo: null,
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

  // Init QR renderer once.
  useEffect(() => {
    qrRef.current = new QRCodeStyling({
      width: 340,
      height: 340,
      type: "canvas",
      data: qrData || " ",
      margin: 8,
      qrOptions: { errorCorrectionLevel: "H" },
      dotsOptions: { color: state.dotColor, type: state.dotType },
      backgroundOptions: { color: state.bgColor },
      cornersSquareOptions: { color: state.cornerColor, type: "extra-rounded" },
      cornersDotOptions: { color: state.cornerDotColor, type: "dot" },
      imageOptions: { crossOrigin: "anonymous", margin: 10, imageSize: 0.32 },
    });
    if (renderRef.current) qrRef.current.append(renderRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playScan = useCallback(() => {
    const el = scanLineRef.current;
    if (!el) return;
    el.classList.remove("playing");
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add("playing");
  }, []);

  // Keep the renderer in sync with state.
  useEffect(() => {
    if (!qrRef.current) return;
    qrRef.current.update({
      data: qrData || " ",
      dotsOptions: { color: state.dotColor, type: state.dotType },
      backgroundOptions: { color: state.bgColor },
      cornersSquareOptions: { color: state.cornerColor, type: "extra-rounded" },
      cornersDotOptions: { color: state.cornerDotColor, type: "dot" },
      image: state.logo || undefined,
    });
    playScan();
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

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setState((s) => ({ ...s, logo: ev.target.result }));
      pushToast("Logo added to QR code", "success");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setState((s) => ({ ...s, logo: null }));
    pushToast("Logo removed", "default");
  };

  const downloadPng = async () => {
    const blob = await qrRef.current.getRawData("png");
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const pad = 60;
      const textH = 110;
      const w = img.width + pad * 2;
      const h = img.height + pad * 2 + textH;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");

      const radius = 36;
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
      ctx.font = '700 30px "Space Grotesk", sans-serif';
      ctx.fillText(state.title, w / 2, img.height + pad + 42);
      ctx.fillStyle = "#8a90a0";
      ctx.font = '500 17px "JetBrains Mono", monospace';
      ctx.fillText(state.subtitle, w / 2, img.height + pad + 72);

      canvas.toBlob((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = (state.title || "qr-code").replace(/\s+/g, "-").toLowerCase() + ".png";
        a.click();
        pushToast("PNG downloaded", "success");
      });
    };
    img.src = url;
  };

  const downloadSvg = () => {
    qrRef.current.download({
      name: (state.title || "qr-code").replace(/\s+/g, "-").toLowerCase(),
      extension: "svg",
    });
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

      <div className={"topbar" + (scrolled ? " is-scrolled" : "")}>
        <div className="brand">
          <img className="brand-mark" src={logo} alt="" />
          <div className="brand-name">QR Code Builder</div>
        </div>
        <div className="user-chip">
          <button className="icon-btn" onClick={resetToDefaults} title="Reset to defaults">
            <RotateCcw size={15} />
          </button>
          {user?.picture && <img src={user.picture} alt="" className="user-avatar" />}
          <span className="user-name">{user?.name || "Signed in"}</span>
          <button className="icon-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>

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
              <div className="section-title">Style</div>
              <div className="field">
                <label>Dot shape</label>
                <div className="style-grid">
                  {DOT_STYLES.map((d) => (
                    <div
                      key={d.val}
                      className={"style-opt" + (state.dotType === d.val ? " active" : "")}
                      onClick={() => setState((s) => ({ ...s, dotType: d.val }))}
                    >
                      {d.label}
                    </div>
                  ))}
                </div>
              </div>

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
              {!state.logo ? (
                <label className="upload">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  <span>Drop or click to upload a logo (optional)</span>
                </label>
              ) : (
                <div className="logo-preview">
                  <img src={state.logo} alt="" />
                  <span className="logo-name">Logo added</span>
                  <button onClick={removeLogo}>Remove</button>
                </div>
              )}
              {state.logo && (
                <div className="contrast-note warn" style={{ marginTop: 10 }}>
                  <AlertTriangle size={14} />
                  <span>A logo covers part of the code — high error correction keeps it scannable, but test it before printing.</span>
                </div>
              )}

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
          <div className="canvas-card" style={{ background: state.cardBg }}>
            <div className="scan-line" ref={scanLineRef} />
            <div ref={renderRef} />
            <div className="card-title">{state.title}</div>
            <div className="card-sub">{state.subtitle}</div>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={downloadPng}>
              <Download size={15} /> Download PNG
            </button>
            <button className="btn" onClick={downloadSvg}>
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
    </>
  );
}

const styles = `
  /* Top bar stays pinned in place while the rest of the page scrolls,
     on desktop as well as iOS / Android mobile browsers. */
  .topbar{
    position: sticky;
    top: 0;
    z-index: 60;
    display:flex; align-items:center; justify-content:space-between;
    gap: 12px;
    flex-wrap: wrap;
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
  .brand{ display:flex; align-items:center; gap:12px; min-width:0; }
  .brand-mark{
    width:32px; height:32px; border-radius:9px; flex-shrink:0;
    object-fit: cover;
    border: 1px solid var(--border-strong);
  }
  .brand-name{ font-weight:700; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .user-chip{ display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-muted); min-width:0; }
  .user-name{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:34vw; }
  .user-avatar{ width:26px; height:26px; border-radius:50%; flex-shrink:0; }
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

  .upload{ border:1.5px dashed var(--border); border-radius:9px; padding:16px; text-align:center;
    cursor:pointer; color:var(--text-muted); font-size:12.5px; display:block; }
  .upload:hover{ border-color:var(--accent-3); color:var(--accent-3); }
  .upload input{ display:none; }
  .logo-preview{ display:flex; align-items:center; gap:10px; }
  .logo-preview img{ width:32px; height:32px; border-radius:6px; object-fit:contain; background:#fff; }
  .logo-preview .logo-name{ font-size:12px; color:var(--text-muted); flex:1; }
  .logo-preview button{ background:none; border:1px solid var(--border); color:var(--text-muted);
    border-radius:6px; padding:4px 8px; font-size:11px; cursor:pointer; }

  .section-title{
    font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.08em;
    text-transform:uppercase; color:var(--text-muted); margin:30px 0 14px; display:flex; align-items:center; gap:10px;
  }
  .section-title::after{ content:''; flex:1; height:1px; background:var(--border); }

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
  .canvas-card{
    border-radius:28px; padding:38px 38px 28px;
    box-shadow: 0 30px 80px -20px rgba(0,0,0,.65);
    display:flex; flex-direction:column; align-items:center; position:relative;
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
  .actions{ display:flex; gap:12px; margin-top:28px; }
  .btn{
    font-family:'JetBrains Mono', monospace; font-size:12.5px; border-radius:9px; padding:12px 20px;
    cursor:pointer; border:1px solid var(--border); background:var(--surface-2); color:var(--text);
    display:flex; align-items:center; gap:8px;
  }
  .btn.primary{ background:var(--accent); color:#0b0d12; border-color:var(--accent); font-weight:700; }
  .btn:hover{ border-color:var(--border-strong); }
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
    .panel{ padding:20px 18px 40px; }
    .stage{ padding:28px 16px 40px; }
    .type-grid{ grid-template-columns:repeat(4,1fr); gap:7px; }
    .style-grid{ grid-template-columns:repeat(2,1fr); }
    .canvas-card{ padding:28px 22px 22px; width:100%; max-width:340px; }
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
