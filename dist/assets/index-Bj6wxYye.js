import{r as i,j as e,N as P,u as C,a as V,L as X,S as Z,C as ee,T as te,D as T,B as re,R as oe,b as k,d as ae,e as ne}from"./vendor-BON2IoCi.js";import{Q as ie}from"./qr-engine-_zoGukUA.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))c(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&c(r)}).observe(document,{childList:!0,subtree:!0});function p(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function c(n){if(n.ep)return;n.ep=!0;const s=p(n);fetch(n.href,s)}})();const S="qrb_";function A(t){try{const o=localStorage.getItem(S+t);return o===null?null:JSON.parse(o)}catch{return null}}function M(t,o){try{return localStorage.setItem(S+t,JSON.stringify(o)),!0}catch{return!1}}function I(t){try{localStorage.removeItem(S+t)}catch{}}function J(t){return(t==null?void 0:t.sub)||(t==null?void 0:t.email)||"guest"}function se(t,o){return A(`${J(t)}:${o}`)}function O(t,o,p){return M(`${J(t)}:${o}`,p)}const y="session",le=12*60*60*1e3;function ce(){const t=A(y);return t?t.expiresAt&&Date.now()>t.expiresAt?(I(y),null):t:null}function j(){const[t,o]=i.useState(ce),p=i.useCallback(n=>{const s=Date.now(),r={...n,issuedAt:s,expiresAt:s+le};M(y,r),o(r)},[]),c=i.useCallback(()=>{I(y),o(null)},[]);return i.useEffect(()=>{if(!(t!=null&&t.expiresAt))return;const n=t.expiresAt-Date.now();if(n<=0){c();return}const s=setTimeout(c,n),r=()=>{document.visibilityState==="visible"&&Date.now()>t.expiresAt&&c()};return document.addEventListener("visibilitychange",r),()=>{clearTimeout(s),document.removeEventListener("visibilitychange",r)}},[t,c]),{user:t,isAuthenticated:!!t,login:p,logout:c}}function de({children:t}){const{isAuthenticated:o}=j();return o?t:e.jsx(P,{to:"/login",replace:!0})}const Q="/assets/logo-BBQftYfK.png";function pe(){var n;const t=C(),o=V(),{isAuthenticated:p}=j(),c=((n=o.state)==null?void 0:n.from)==="login";return i.useEffect(()=>{document.title="Loading | QR Code Builder"},[]),i.useEffect(()=>{const s=setTimeout(()=>{t(p?"/builder":"/login",{replace:!0})},1400);return()=>clearTimeout(s)},[p,t]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        .mp-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          color: var(--text);
          background:
            radial-gradient(circle at 1px 1px, #1c2028 1.4px, transparent 1.4px) 0 0/22px 22px,
            radial-gradient(900px 500px at 100% -10%, rgba(94,234,212,0.10), transparent 60%),
            radial-gradient(900px 500px at -10% 110%, rgba(124,58,237,0.12), transparent 60%),
            var(--bg);
          padding: 24px;
        }

        .mp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.35;
          pointer-events: none;
          animation: mp-float 14s ease-in-out infinite;
        }
        .mp-blob-1 { width: 360px; height: 360px; background: #5eead4; top: -100px; left: -80px; }
        .mp-blob-2 { width: 420px; height: 420px; background: #7c9cff; bottom: -160px; right: -100px; animation-duration: 18s; }
        .mp-blob-3 { width: 260px; height: 260px; background: #fbbf6e; top: 40%; left: 60%; opacity: 0.22; animation-duration: 22s; }

        @keyframes mp-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-16px) scale(1.05); }
        }

        .mp-card {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 48px 40px;
          border-radius: 26px;
          max-width: 420px;
          width: 100%;
          background: rgba(17,20,27,0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          animation: mp-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .mp-chip {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
          background: rgba(94, 234, 212, 0.08);
          border: 1px solid rgba(94, 234, 212, 0.28);
          color: var(--accent);
          margin-bottom: 24px;
        }
        .mp-chip .pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: #5eead4;
          animation: mp-pulse 1.8s ease-in-out infinite;
        }
        @keyframes mp-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(94,234,212,0.6); }
          50%     { box-shadow: 0 0 0 10px rgba(94,234,212,0); }
        }

        .mp-logo-wrap {
          width: 120px;
          height: 120px;
          margin: 0 auto 22px;
          border-radius: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          animation: mp-logo-float 3s ease-in-out infinite;
        }
        .mp-logo-wrap img {
          width: 100%; height: 100%; object-fit: contain;
        }
        @keyframes mp-logo-float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-8px); }
        }

        .mp-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
        }
        .mp-title .grad {
          background: linear-gradient(135deg, var(--accent), var(--accent-2) 50%, var(--accent-3));
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
        }
        .mp-sub {
          margin: 0 0 28px;
          font-size: 14px;
          color: var(--text-muted);
        }

        .mp-loader {
          position: relative;
          width: 100%;
          height: 6px;
          border-radius: 4px;
          overflow: hidden;
          background: rgba(148, 163, 184, 0.14);
          margin-bottom: 12px;
        }
        .mp-loader::before {
          content: "";
          position: absolute; top: 0; left: 0; bottom: 0;
          width: 40%;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3));
          animation: mp-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes mp-slide {
          0%   { left: -40%; }
          100% { left: 100%; }
        }

        .mp-loading-text {
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }
        .mp-loading-text .dot { display: inline-block; animation: mp-blink 1.4s infinite; }
        .mp-loading-text .dot:nth-child(2) { animation-delay: 0.2s; }
        .mp-loading-text .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes mp-blink {
          0%, 80%, 100% { opacity: 0.3; }
          40%           { opacity: 1; }
        }

        @keyframes mp-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .mp-blob, .mp-logo-wrap, .mp-card, .mp-loader::before, .mp-loading-text .dot {
            animation: none !important;
          }
        }
      `}),e.jsxs("div",{className:"mp-wrapper",children:[e.jsx("span",{className:"mp-blob mp-blob-1"}),e.jsx("span",{className:"mp-blob mp-blob-2"}),e.jsx("span",{className:"mp-blob mp-blob-3"}),e.jsxs("div",{className:"mp-card",children:[e.jsxs("span",{className:"mp-chip",children:[e.jsx("span",{className:"pulse"}),"client-side · no backend"]}),e.jsx("div",{className:"mp-logo-wrap",children:e.jsx("img",{src:Q,alt:"QR Code Builder"})}),e.jsxs("h1",{className:"mp-title",children:["QR Code ",e.jsx("span",{className:"grad",children:"Builder"})]}),e.jsx("p",{className:"mp-sub",children:c?"Signed in — preparing your workspace…":"Preparing your workspace, please wait…"}),e.jsx("div",{className:"mp-loader","aria-hidden":"true"}),e.jsxs("div",{className:"mp-loading-text",children:["Loading",e.jsx("span",{className:"dot",children:"."}),e.jsx("span",{className:"dot",children:"."}),e.jsx("span",{className:"dot",children:"."})]})]})]})]})}function xe({onSuccess:t,onError:o}){return i.useRef(null),i.useEffect(()=>{},[void 0,t,o]),e.jsxs("div",{className:"google-btn-missing",children:["Add a Google Client ID to ",e.jsx("code",{children:".env"})," as"," ",e.jsx("code",{children:"VITE_GOOGLE_CLIENT_ID"})," to turn on sign-in. See the README for the two-minute setup."]})}function ge(){return e.jsxs("footer",{className:"app-footer",children:[e.jsx("span",{className:"app-footer__tag","aria-hidden":"true",children:"</>"}),e.jsx("span",{className:"app-footer__text",children:"QR Code Builder — generated and exported entirely in your browser."})]})}function ue(){const t=C(),{login:o}=j(),[p,c]=i.useState("");i.useEffect(()=>{document.title="Sign in | QR Code Builder"},[]);const n=i.useCallback(r=>{o(r),t("/",{replace:!0,state:{from:"login"}})},[o,t]),s=i.useCallback(()=>{c("Something went wrong signing in. Please try again.")},[]);return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        .login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 1px 1px, #1c2028 1.4px, transparent 1.4px) 0 0/22px 22px,
            radial-gradient(900px 500px at 100% -10%, rgba(94,234,212,0.10), transparent 60%),
            radial-gradient(900px 500px at -10% 110%, rgba(124,58,237,0.12), transparent 60%),
            var(--bg);
          padding: 24px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: var(--shadow);
          padding: 40px 32px 32px;
          text-align: center;
        }

        .login-card__logo {
          width: 84px;
          height: 84px;
          margin: 0 auto 18px;
          border-radius: 20px;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .login-card__logo img { width: 100%; height: 100%; object-fit: contain; }

        .login-card__chip {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 13px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
          background: rgba(94, 234, 212, 0.08);
          border: 1px solid rgba(94, 234, 212, 0.28);
          color: var(--accent);
          margin-bottom: 16px;
        }
        .login-card__chip .pulse { width: 7px; height: 7px; border-radius: 50%; background: #5eead4; }

        .login-card__title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
          color: var(--text);
        }
        .login-card__subtitle {
          font-size: 13.5px;
          color: var(--text-muted);
          margin: 0 0 28px;
          line-height: 1.5;
        }

        .google-btn-row { display: flex; justify-content: center; margin-bottom: 16px; }
        .google-btn-slot { min-height: 44px; display: flex; justify-content: center; }
        .google-btn-missing {
          font-size: 12.5px;
          color: var(--text-muted);
          background: var(--surface-2);
          border: 1px dashed var(--border-strong);
          border-radius: 10px;
          padding: 14px 16px;
          line-height: 1.6;
          text-align: left;
        }
        .google-btn-missing code {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 11.5px;
        }

        .login-error {
          font-size: 12.5px;
          color: #fecaca;
          background: rgba(248, 113, 113, 0.10);
          border: 1px solid rgba(248, 113, 113, 0.35);
          border-radius: 8px;
          padding: 9px 12px;
          margin-bottom: 16px;
        }

        .guest-link {
          display: block;
          margin-top: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-muted);
          background: none;
          border: none;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }
        .guest-link:hover { color: var(--text); }

        .login-divider { display: flex; align-items: center; gap: 10px; margin: 22px 0; }
        .login-divider .line { flex: 1; height: 1px; background: var(--border); }

        .login-tip {
          display: flex;
          gap: 10px;
          text-align: left;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .login-tip .icon { font-size: 16px; line-height: 1; }
        .login-tip .meta { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
      `}),e.jsxs("div",{className:"login-page",children:[e.jsxs("div",{className:"login-card",children:[e.jsxs("span",{className:"login-card__chip",children:[e.jsx("span",{className:"pulse"}),"Secure sign-in"]}),e.jsx("div",{className:"login-card__logo",children:e.jsx("img",{src:Q,alt:"QR Code Builder"})}),e.jsx("h2",{className:"login-card__title",children:"Welcome to QR Code Builder"}),e.jsx("p",{className:"login-card__subtitle",children:"Sign in with Google to save presets and pick up where you left off on any device."}),p&&e.jsx("div",{className:"login-error",children:p}),e.jsx("div",{className:"google-btn-row",children:e.jsx(xe,{onSuccess:n,onError:s})}),e.jsxs("div",{className:"login-divider",children:[e.jsx("div",{className:"line"}),e.jsx("div",{className:"line"})]}),e.jsxs("div",{className:"login-tip",children:[e.jsx("span",{className:"icon",children:"🔒"}),e.jsx("div",{className:"meta",children:"Everything runs in this browser. Nothing is uploaded to a server — Google sign-in only identifies which local presets belong to you."})]})]}),e.jsx(ge,{})]})]})}const me=[{val:"dots",label:"Dots"},{val:"rounded",label:"Round"},{val:"classy",label:"Classy"},{val:"square",label:"Square"}],fe={data:"https://example.com",title:"QR Code Builder",subtitle:"example.com",dotType:"dots",dotColor:"#0e214a",bgColor:"#ffffff",cornerColor:"#0e214a",cornerDotColor:"#0e214a",cardBg:"#ffffff",logo:null};function be(){const t=C(),{user:o,logout:p}=j(),c=i.useRef(null),n=i.useRef(null),s=i.useRef(null),[r,f]=i.useState(fe),[m,w]=i.useState([]),[z,R]=i.useState(""),[B,L]=i.useState(!1);i.useEffect(()=>{document.title="QR Code Builder"},[]),i.useEffect(()=>{const a=se(o,"presets")||[];w(a)},[o]),i.useEffect(()=>{n.current=new ie({width:340,height:340,type:"canvas",data:r.data,margin:8,qrOptions:{errorCorrectionLevel:"H"},dotsOptions:{color:r.dotColor,type:r.dotType},backgroundOptions:{color:r.bgColor},cornersSquareOptions:{color:r.cornerColor,type:"extra-rounded"},cornersDotOptions:{color:r.cornerDotColor,type:"dot"},imageOptions:{crossOrigin:"anonymous",margin:10,imageSize:.32}}),c.current&&n.current.append(c.current)},[]);const E=i.useCallback(()=>{const a=s.current;a&&(a.classList.remove("playing"),a.offsetWidth,a.classList.add("playing"))},[]);i.useEffect(()=>{n.current&&(n.current.update({data:r.data||"https://example.com",dotsOptions:{color:r.dotColor,type:r.dotType},backgroundOptions:{color:r.bgColor},cornersSquareOptions:{color:r.cornerColor,type:"extra-rounded"},cornersDotOptions:{color:r.cornerDotColor,type:"dot"},image:r.logo||void 0}),E())},[r,E]);const g=a=>x=>f(d=>({...d,[a]:x.target.value})),q=a=>{const x=a.target.files[0];if(!x)return;const d=new FileReader;d.onload=_=>f(D=>({...D,logo:_.target.result})),d.readAsDataURL(x)},U=()=>f(a=>({...a,logo:null})),F=async()=>{const a=await n.current.getRawData("png"),x=URL.createObjectURL(a),d=new Image;d.onload=()=>{const u=d.width+120,b=d.height+60*2+110,v=document.createElement("canvas");v.width=u,v.height=b;const l=v.getContext("2d"),h=36;l.fillStyle=r.cardBg,l.beginPath(),l.moveTo(h,0),l.arcTo(u,0,u,b,h),l.arcTo(u,b,0,b,h),l.arcTo(0,b,0,0,h),l.arcTo(0,0,u,0,h),l.closePath(),l.fill(),l.drawImage(d,60,60),l.textAlign="center",l.fillStyle="#141821",l.font='700 30px "Space Grotesk", sans-serif',l.fillText(r.title,u/2,d.height+60+42),l.fillStyle="#8a90a0",l.font='500 17px "JetBrains Mono", monospace',l.fillText(r.subtitle,u/2,d.height+60+72),v.toBlob(K=>{const N=document.createElement("a");N.href=URL.createObjectURL(K),N.download=(r.title||"qr-code").replace(/\s+/g,"-").toLowerCase()+".png",N.click()})},d.src=x},G=()=>{n.current.download({name:(r.title||"qr-code").replace(/\s+/g,"-").toLowerCase(),extension:"svg"})},Y=()=>{const a=z.trim();if(!a)return;const x=[...m.filter(d=>d.name!==a),{name:a,state:r}];w(x),O(o,"presets",x),R("")},W=a=>{f(a.state),L(!1)},H=a=>{const x=m.filter(d=>d.name!==a);w(x),O(o,"presets",x)},$=()=>{p(),t("/login",{replace:!0})};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:he}),e.jsxs("div",{className:"topbar",children:[e.jsxs("div",{className:"brand",children:[e.jsx("div",{className:"brand-mark",children:"QR"}),e.jsx("div",{className:"brand-name",children:"QR Code Builder"})]}),e.jsxs("div",{className:"user-chip",children:[(o==null?void 0:o.picture)&&e.jsx("img",{src:o.picture,alt:"",className:"user-avatar"}),e.jsx("span",{className:"user-name",children:(o==null?void 0:o.name)||"Signed in"}),e.jsx("button",{className:"icon-btn",onClick:$,title:"Sign out",children:e.jsx(X,{size:15})})]})]}),e.jsxs("div",{className:"layout",children:[e.jsxs("div",{className:"panel",children:[e.jsxs("div",{className:"field",children:[e.jsxs("label",{children:[e.jsx("span",{className:"idx",children:"01"}),"Destination URL / text"]}),e.jsx("input",{type:"text",value:r.data,onChange:g("data"),placeholder:"https://example.com"})]}),e.jsxs("div",{className:"field",children:[e.jsxs("label",{children:[e.jsx("span",{className:"idx",children:"02"}),"Title"]}),e.jsx("input",{type:"text",value:r.title,onChange:g("title")})]}),e.jsxs("div",{className:"field",children:[e.jsxs("label",{children:[e.jsx("span",{className:"idx",children:"03"}),"Subtitle"]}),e.jsx("input",{type:"text",value:r.subtitle,onChange:g("subtitle")})]}),e.jsx("div",{className:"section-title",children:"Style"}),e.jsxs("div",{className:"field",children:[e.jsx("label",{children:"Dot shape"}),e.jsx("div",{className:"style-grid",children:me.map(a=>e.jsx("div",{className:"style-opt"+(r.dotType===a.val?" active":""),onClick:()=>f(x=>({...x,dotType:a.val})),children:a.label},a.val))})]}),e.jsxs("div",{className:"field row2",children:[e.jsxs("div",{className:"color-field",children:[e.jsx("input",{type:"color",value:r.dotColor,onChange:g("dotColor")}),e.jsx("span",{children:"Dots"})]}),e.jsxs("div",{className:"color-field",children:[e.jsx("input",{type:"color",value:r.bgColor,onChange:g("bgColor")}),e.jsx("span",{children:"Background"})]})]}),e.jsxs("div",{className:"field row2",children:[e.jsxs("div",{className:"color-field",children:[e.jsx("input",{type:"color",value:r.cornerColor,onChange:g("cornerColor")}),e.jsx("span",{children:"Corner sq."})]}),e.jsxs("div",{className:"color-field",children:[e.jsx("input",{type:"color",value:r.cornerDotColor,onChange:g("cornerDotColor")}),e.jsx("span",{children:"Corner dot"})]})]}),e.jsx("div",{className:"section-title",children:"Logo"}),r.logo?e.jsxs("div",{className:"logo-preview",children:[e.jsx("img",{src:r.logo,alt:""}),e.jsx("span",{className:"logo-name",children:"Logo added"}),e.jsx("button",{onClick:U,children:"Remove"})]}):e.jsxs("label",{className:"upload",children:[e.jsx("input",{type:"file",accept:"image/*",onChange:q}),e.jsx("span",{children:"Drop or click to upload a logo (optional)"})]}),e.jsx("div",{className:"section-title",children:"Card"}),e.jsxs("div",{className:"color-field",style:{maxWidth:200},children:[e.jsx("input",{type:"color",value:r.cardBg,onChange:g("cardBg")}),e.jsx("span",{children:"Frame color"})]}),e.jsx("div",{className:"section-title",children:"Presets"}),e.jsxs("div",{className:"preset-save-row",children:[e.jsx("input",{type:"text",placeholder:"Preset name",value:z,onChange:a=>R(a.target.value)}),e.jsxs("button",{className:"btn small primary",onClick:Y,children:[e.jsx(Z,{size:13})," Save"]})]}),e.jsxs("button",{className:"dropdown-toggle",onClick:()=>L(a=>!a),children:[m.length," saved preset",m.length===1?"":"s",e.jsx(ee,{size:14,style:{transform:B?"rotate(180deg)":"none"}})]}),B&&e.jsxs("div",{className:"preset-list",children:[m.length===0&&e.jsx("div",{className:"preset-empty",children:"No presets saved yet."}),m.map(a=>e.jsxs("div",{className:"preset-row",children:[e.jsx("button",{className:"preset-load",onClick:()=>W(a),children:a.name}),e.jsx("button",{className:"icon-btn",onClick:()=>H(a.name),title:"Delete",children:e.jsx(te,{size:13})})]},a.name))]})]}),e.jsxs("div",{className:"stage",children:[e.jsxs("div",{className:"canvas-card",style:{background:r.cardBg},children:[e.jsx("div",{className:"scan-line",ref:s}),e.jsx("div",{ref:c}),e.jsx("div",{className:"card-title",children:r.title}),e.jsx("div",{className:"card-sub",children:r.subtitle})]}),e.jsxs("div",{className:"actions",children:[e.jsxs("button",{className:"btn primary",onClick:F,children:[e.jsx(T,{size:15})," Download PNG"]}),e.jsxs("button",{className:"btn",onClick:G,children:[e.jsx(T,{size:15})," Download SVG"]})]}),e.jsxs("div",{className:"meta-line",children:[e.jsxs("span",{children:["Error correction: ",e.jsx("b",{children:"H (30%)"})]}),e.jsxs("span",{children:["Renders: ",e.jsx("b",{children:"100% in-browser"})]})]})]})]})]})}const he=`
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
`,ve=[{path:"/",component:pe},{path:"/login",component:ue}],ye=[{path:"/builder",component:be}];function je(){return e.jsx(re,{children:e.jsxs(oe,{children:[ve.map(({path:t,component:o})=>e.jsx(k,{path:t,element:e.jsx(o,{})},t)),ye.map(({path:t,component:o})=>e.jsx(k,{path:t,element:e.jsx(de,{children:e.jsx(o,{})})},t)),e.jsx(k,{path:"*",element:e.jsx(P,{to:"/",replace:!0})})]})})}ae.createRoot(document.getElementById("root")).render(e.jsx(ne.StrictMode,{children:e.jsx(je,{})}));"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})});
