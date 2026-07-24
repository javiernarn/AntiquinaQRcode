import React, { useEffect, useRef, useState, useCallback } from "react";
import QRCodeStyling from "qr-code-styling";
import { useNavigate } from "react-router-dom";
import { LogOut, Download, Save, Trash2, ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getUserStorage, setUserStorage } from "../utils/storage";

const DOT_STYLES = [
  { val: "dots", label: "Dots" },
  { val: "rounded", label: "Round" },
  { val: "classy", label: "Classy" },
  { val: "square", label: "Square" },
];

const DEFAULT_STATE = {
  data: "https://example.com",
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

export default function BuilderPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const renderRef = useRef(null);
  const qrRef = useRef(null);
  const scanLineRef = useRef(null);

  const [state, setState] = useState(DEFAULT_STATE);
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    document.title = "QR Code Builder";
  }, []);

  // Load this user's saved presets on mount / when user changes.
  useEffect(() => {
    const saved = getUserStorage(user, "presets") || [];
    setPresets(saved);
  }, [user]);

  // Init QR renderer once.
  useEffect(() => {
    qrRef.current = new QRCodeStyling({
      width: 340,
      height: 340,
      type: "canvas",
      data: state.data,
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
      data: state.data || "https://example.com",
      dotsOptions: { color: state.dotColor, type: state.dotType },
      backgroundOptions: { color: state.bgColor },
      cornersSquareOptions: { color: state.cornerColor, type: "extra-rounded" },
      cornersDotOptions: { color: state.cornerDotColor, type: "dot" },
      image: state.logo || undefined,
    });
    playScan();
  }, [state, playScan]);

  const set = (key) => (e) => setState((s) => ({ ...s, [key]: e.target.value }));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setState((s) => ({ ...s, logo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const removeLogo = () => setState((s) => ({ ...s, logo: null }));

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
      });
    };
    img.src = url;
  };

  const downloadSvg = () => {
    qrRef.current.download({
      name: (state.title || "qr-code").replace(/\s+/g, "-").toLowerCase(),
      extension: "svg",
    });
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const next = [...presets.filter((p) => p.name !== name), { name, state }];
    setPresets(next);
    setUserStorage(user, "presets", next);
    setPresetName("");
  };

  const loadPreset = (p) => {
    setState(p.state);
    setShowPresets(false);
  };

  const deletePreset = (name) => {
    const next = presets.filter((p) => p.name !== name);
    setPresets(next);
    setUserStorage(user, "presets", next);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <style>{styles}</style>

      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">QR</div>
          <div className="brand-name">QR Code Builder</div>
        </div>
        <div className="user-chip">
          {user?.picture && <img src={user.picture} alt="" className="user-avatar" />}
          <span className="user-name">{user?.name || "Signed in"}</span>
          <button className="icon-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div className="layout">
        <div className="panel">
          <div className="field">
            <label><span className="idx">01</span>Destination URL / text</label>
            <input type="text" value={state.data} onChange={set("data")} placeholder="https://example.com" />
          </div>

          <div className="field">
            <label><span className="idx">02</span>Title</label>
            <input type="text" value={state.title} onChange={set("title")} />
          </div>
          <div className="field">
            <label><span className="idx">03</span>Subtitle</label>
            <input type="text" value={state.subtitle} onChange={set("subtitle")} />
          </div>

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

          <div className="section-title">Card</div>
          <div className="color-field" style={{ maxWidth: 200 }}>
            <input type="color" value={state.cardBg} onChange={set("cardBg")} />
            <span>Frame color</span>
          </div>

          <div className="section-title">Presets</div>
          <div className="preset-save-row">
            <input
              type="text"
              placeholder="Preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
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
              {presets.length === 0 && <div className="preset-empty">No presets saved yet.</div>}
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

        <div className="stage">
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
    </>
  );
}

const styles = `
  .topbar{
    display:flex; align-items:center; justify-content:space-between;
    padding:18px 28px;
    border-bottom:1px solid var(--border);
  }
  .brand{ display:flex; align-items:center; gap:12px; }
  .brand-mark{
    width:32px; height:32px; border-radius:8px;
    background: conic-gradient(from 180deg, var(--accent), var(--accent-3), var(--accent));
    display:flex; align-items:center; justify-content:center;
    font-family:'JetBrains Mono', monospace; font-weight:700; color:#0b0d12; font-size:12px;
  }
  .brand-name{ font-weight:700; font-size:16px; }
  .user-chip{ display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-muted); }
  .user-avatar{ width:26px; height:26px; border-radius:50%; }
  .icon-btn{
    background:var(--surface-2); border:1px solid var(--border); color:var(--text-muted);
    border-radius:8px; padding:6px; cursor:pointer; display:flex;
  }
  .icon-btn:hover{ color:var(--text); border-color:var(--border-strong); }

  .layout{ display:grid; grid-template-columns:400px 1fr; min-height:calc(100vh - 66px); }
  .panel{ padding:26px 26px 60px; border-right:1px solid var(--border); overflow-y:auto; }

  .field{ margin-bottom:20px; }
  .field label{
    display:block; font-family:'JetBrains Mono', monospace; font-size:11px;
    letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;
  }
  .field label .idx{ color:var(--accent); margin-right:6px; }
  input[type=text], input[type=url]{
    width:100%; background:var(--surface-2); border:1px solid var(--border);
    color:var(--text); padding:10px 12px; border-radius:9px; font-size:14px; outline:none;
  }
  input[type=text]:focus{ border-color:var(--accent); }
  .row2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
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

  @media (max-width: 880px){
    .layout{ grid-template-columns:1fr; }
    .panel{ border-right:none; border-bottom:1px solid var(--border); }
  }
`;
