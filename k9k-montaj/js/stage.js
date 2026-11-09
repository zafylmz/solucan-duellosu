/** Özgün kesit. Renault çizimi değildir. Volan solda, silindir 1 solda. */

const boreX = [300, 424, 548, 672];
const crankY = 378;
const upPin = crankY - 36;
const downPin = crankY + 36;
const pinY = [upPin, downPin, downPin, upPin];
const wristY = [198, 270, 270, 198];

function throws() {
  return boreX.map((x, i) => {
    const y = pinY[i];
    return `
      <g class="throw">
        <line x1="${x}" y1="${crankY}" x2="${x}" y2="${y}" stroke="#8b939a" stroke-width="16" stroke-linecap="round"/>
        <circle cx="${x}" cy="${y}" r="11" fill="#d5dbe0" stroke="#2a241c" stroke-width="1.4"/>
      </g>`;
  }).join("");
}

function conrods() {
  return boreX.map((x, i) => `
    <g>
      <line x1="${x}" y1="${wristY[i]}" x2="${x}" y2="${pinY[i]}" stroke="#5e6770" stroke-width="7" stroke-linecap="round"/>
      <circle cx="${x}" cy="${wristY[i]}" r="5" fill="#2a241c"/>
    </g>`).join("");
}

function pistons() {
  return boreX.map((x, i) => {
    const top = wristY[i] - 36;
    const down = i === 1 || i === 2;
    return `
      <g class="piston ${down ? "down" : "up"}">
        <rect x="${x - 28}" y="${top}" width="56" height="44" rx="5" fill="#d2b07a" stroke="#2a241c" stroke-width="1.2"/>
        <rect x="${x - 28}" y="${top + 7}" width="56" height="3.5" fill="#8d6840"/>
        <rect x="${x - 28}" y="${top + 13}" width="56" height="3" fill="#8d6840"/>
        <rect x="${x - 28}" y="${top + 18}" width="56" height="4" fill="#6d5334"/>
        <text x="${x}" y="${top + 34}" text-anchor="middle" class="mini">${i + 1}</text>
      </g>`;
  }).join("");
}

function liners() {
  return boreX.map((x) => `
    <g>
      <rect x="${x - 36}" y="168" width="8" height="132" fill="#5c6770"/>
      <rect x="${x + 28}" y="168" width="8" height="132" fill="#5c6770"/>
    </g>`).join("");
}

function valves() {
  return boreX.map((x) => `
    <g>
      <line x1="${x - 12}" y1="118" x2="${x - 12}" y2="162" stroke="#2a241c" stroke-width="2"/>
      <line x1="${x + 12}" y1="118" x2="${x + 12}" y2="162" stroke="#2a241c" stroke-width="2"/>
      <ellipse cx="${x - 12}" cy="164" rx="8" ry="3" fill="#3a4248"/>
      <ellipse cx="${x + 12}" cy="164" rx="8" ry="3" fill="#3a4248"/>
      <circle cx="${x - 12}" cy="112" r="7" fill="#c5ced6" stroke="#2a241c" stroke-width="1"/>
      <circle cx="${x + 12}" cy="112" r="7" fill="#c5ced6" stroke="#2a241c" stroke-width="1"/>
    </g>`).join("");
}

function mainBolts() {
  const caps = [248, 362, 486, 610, 724];
  const tighten = [3, 2, 4, 1, 5];
  return caps.map((x, i) => {
    const orderIndex = tighten.indexOf(i + 1);
    const a = orderIndex * 2 + 1;
    return `
      <g>
        <path d="M${x - 22} 396 v18 h44 v-18" fill="none" stroke="#2a241c" stroke-width="6" stroke-linejoin="round"/>
        <circle data-group="mainbolts" data-seq="${a}" cx="${x - 10}" cy="416" r="5" class="bolt"/>
        <circle data-group="mainbolts" data-seq="${a + 1}" cx="${x + 10}" cy="416" r="5" class="bolt"/>
        <text x="${x}" y="438" text-anchor="middle" class="mini">${i + 1}</text>
      </g>`;
  }).join("");
}

export function mountStage(root) {
  root.innerHTML = `
    <svg viewBox="0 0 1040 560" class="engine" role="img" aria-label="K9K kesiti, volan solda">
      <defs>
        <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7 L7 0" stroke="#241e18" stroke-width="0.6" opacity=".28"/>
        </pattern>
        <filter id="paper-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#1a140c" flood-opacity=".18"/>
        </filter>
      </defs>

      <text x="86" y="40" class="endcap">VOLAN</text>
      <text x="900" y="40" class="endcap" text-anchor="end">TRİGER</text>
      <line x1="150" y1="48" x2="890" y2="48" stroke="#241e18" stroke-width="0.6" opacity=".35"/>

      <g class="layer" data-step="0" data-id="block" style="--dx:0;--dy:10px">
        <ellipse cx="520" cy="500" rx="300" ry="16" fill="#d9d0bc"/>
        <rect x="236" y="300" width="548" height="104" rx="8" fill="#3c444b"/>
        <rect x="236" y="300" width="548" height="104" rx="8" fill="url(#hatch)"/>
        <rect x="250" y="168" width="520" height="140" fill="#4a545c" opacity=".35"/>
        ${liners()}
        ${boreX.map((x, i) => `<text x="${x}" y="156" text-anchor="middle" class="cyl">${i + 1}</text>`).join("")}
        <text x="508" y="292" text-anchor="middle" class="ghost">blok</text>
      </g>

      <g class="layer" data-step="1" data-id="shells crank" style="--dx:0;--dy:16px">
        <rect x="214" y="370" width="592" height="16" rx="8" fill="#c5ced6" stroke="#241e18" stroke-width="1.2"/>
        ${throws()}
        ${[248, 362, 486, 610, 724].map((x) => `<rect x="${x - 18}" y="366" width="36" height="24" rx="4" fill="#8fb4c9" stroke="#241e18" stroke-width="1"/>`).join("")}
      </g>

      <g class="layer" data-step="2" data-id="thrust" style="--dx:0;--dy:0">
        <rect x="470" y="360" width="6" height="36" fill="#c4622d"/>
        <rect x="496" y="360" width="6" height="36" fill="#c4622d"/>
        <text x="486" y="354" text-anchor="middle" class="call">itme · yatak 3</text>
      </g>

      <g class="layer" data-step="4" data-id="pistons" style="--dx:0;--dy:-18px">
        ${pistons()}
      </g>

      <g class="layer" data-step="5" data-id="rods" style="--dx:0;--dy:8px">
        ${conrods()}
      </g>

      <g class="layer" data-step="6" data-id="rodbolts" style="--dx:0;--dy:8px">
        ${boreX.map((x, i) => `
          <g>
            <circle data-group="rodbolts" data-seq="${i * 2 + 1}" cx="${x - 8}" cy="${pinY[i] + 14}" r="4.5" class="bolt"/>
            <circle data-group="rodbolts" data-seq="${i * 2 + 2}" cx="${x + 8}" cy="${pinY[i] + 14}" r="4.5" class="bolt"/>
          </g>`).join("")}
      </g>

      <g class="layer" data-step="3" data-id="maincaps mainbolts" style="--dx:0;--dy:14px">
        ${mainBolts()}
      </g>

      <g class="layer" data-step="7" data-id="oilpump pumpchain" style="--dx:20px;--dy:0">
        <circle cx="808" cy="430" r="28" fill="#2e3438" stroke="#241e18" stroke-width="1.5"/>
        <circle cx="808" cy="430" r="10" fill="#c5ced6"/>
        <path d="M748 386 C770 400 780 420 792 430" fill="none" stroke="#241e18" stroke-width="3"/>
        <text x="808" y="474" text-anchor="middle" class="call">yağ pompası</text>
      </g>

      <g class="layer" data-step="8" data-id="frontcover waterpump" style="--dx:18px;--dy:0">
        <rect x="784" y="250" width="132" height="200" rx="12" fill="#d7dee4" stroke="#241e18" stroke-width="1.4"/>
        <circle cx="850" cy="318" r="26" fill="#9eb6c4" stroke="#241e18" stroke-width="1.3"/>
        <text x="850" y="292" text-anchor="middle" class="mini">su</text>
        ${[804, 850, 896].flatMap((x) => [268, 318, 400].map((y, n) => `<circle data-group="frontbolts" data-seq="${n + 1}" cx="${x}" cy="${y}" r="3.5" class="bolt"/>`)).join("")}
      </g>

      <g class="layer" data-step="9" data-id="sump sumpbolts" style="--dx:0;--dy:20px">
        <path d="M250 404 h520 v62 c0 22 -40 36 -260 36 S250 488 250 466 Z" fill="#2a241c" stroke="#241e18" stroke-width="1.2"/>
        ${[280, 360, 440, 520, 600, 680, 740].map((x, i) => `<circle data-group="sumpbolts" data-seq="${i + 1}" cx="${x}" cy="430" r="4" class="bolt light"/>`).join("")}
        <text x="510" y="468" text-anchor="middle" class="on-dark">karter</text>
      </g>

      <g class="layer" data-step="10" data-id="rearseal flywheel clutch" style="--dx:-20px;--dy:0">
        <circle cx="150" cy="${crankY}" r="74" fill="#2c3338" stroke="#241e18" stroke-width="1.4"/>
        <circle cx="150" cy="${crankY}" r="62" fill="none" stroke="#efe6d4" stroke-width="3" stroke-dasharray="3 4"/>
        <circle cx="150" cy="${crankY}" r="22" fill="#d7dee4" stroke="#241e18"/>
        ${[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const r = 46;
          const a = (deg * Math.PI) / 180;
          const x = 150 + Math.cos(a) * r;
          const y = crankY + Math.sin(a) * r;
          return `<circle data-group="flybolts" data-seq="${i + 1}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="bolt light"/>`;
        }).join("")}
        <text x="150" y="${crankY + 96}" text-anchor="middle" class="call">volan</text>
      </g>

      <g class="layer" data-step="11" data-id="valves" style="--dx:0;--dy:-12px">
        ${valves()}
      </g>

      <g class="layer" data-step="12" data-id="cam camcaps" style="--dx:0;--dy:-10px">
        <rect x="268" y="104" width="500" height="18" rx="8" fill="#d5dbe0" stroke="#241e18" stroke-width="1.2"/>
        ${[300, 390, 480, 570, 660, 740].map((x, i) => `
          <g>
            <rect x="${x - 16}" y="96" width="32" height="12" rx="2" fill="${i === 0 || i === 5 ? "#e7c3a4" : "#8d96a0"}" stroke="#241e18" stroke-width="1"/>
            <circle data-group="cambolts" data-seq="${i + 1}" cx="${x}" cy="102" r="3" class="bolt"/>
          </g>`).join("")}
      </g>

      <g class="layer" data-step="15" data-id="gasket head headbolts" style="--dx:0;--dy:-16px">
        <rect x="246" y="78" width="548" height="34" rx="6" fill="#d7dee4" stroke="#241e18" stroke-width="1.5"/>
        <rect x="246" y="112" width="16" height="42" fill="#d7dee4"/>
        <rect x="778" y="112" width="16" height="42" fill="#d7dee4"/>
        <rect x="246" y="154" width="548" height="8" fill="#2f6b4f"/>
        <text x="520" y="100" text-anchor="middle" class="ghost">silindir kapağı</text>
      </g>

      <g class="layer" data-step="13" data-id="exhaust inlet glow injectors" style="--dx:0;--dy:-8px">
        ${boreX.map((x, i) => `
          <g>
            <rect x="${x - 7}" y="52" width="14" height="28" rx="2" fill="#6d5434" stroke="#241e18" stroke-width="1"/>
            <circle data-group="headside" data-seq="${i + 1}" cx="${x}" cy="48" r="4" class="bolt"/>
          </g>`).join("")}
        <text x="300" y="42" class="call">enjektör</text>
      </g>

      <g class="layer" data-step="14" data-id="hppump rail" style="--dx:16px;--dy:-8px">
        <rect x="790" y="150" width="70" height="46" rx="6" fill="#4a545c" stroke="#241e18"/>
        <rect x="300" y="28" width="360" height="16" rx="6" fill="#3c444b" stroke="#241e18"/>
        <path d="M820 150 V44 H660" fill="none" stroke="#8d3d28" stroke-width="3"/>
        <text x="825" y="214" class="call">YP pompa</text>
        <text x="470" y="24" text-anchor="middle" class="call">ray</text>
      </g>

      <g class="layer" data-step="16" data-id="rocker" style="--dx:0;--dy:-14px">
        <path d="M250 70 h530 v-22 c0-16 -30-22 -265-22 S250 32 250 48 Z" fill="#ece7df" stroke="#241e18" stroke-width="1.3"/>
        ${[300, 390, 480, 570, 660, 740].map((x, i) => `<circle data-group="rockerbolts" data-seq="${i + 1}" cx="${x}" cy="52" r="3.5" class="bolt"/>`).join("")}
      </g>

      <g class="layer" data-step="17" data-id="turbo" style="--dx:0;--dy:-12px">
        <circle cx="640" cy="64" r="26" fill="#8d9398" stroke="#241e18" stroke-width="1.4"/>
        <circle cx="640" cy="64" r="10" fill="#d7dee4" stroke="#241e18"/>
        <path d="M614 64 h-40" stroke="#8d3d28" stroke-width="4"/>
        <text x="640" y="108" text-anchor="middle" class="call">turbo</text>
      </g>

      <g class="layer" data-step="18" data-id="timing tensioner campulley" style="--dx:14px;--dy:0">
        <circle cx="860" cy="130" r="28" fill="#d7dee4" stroke="#241e18" stroke-width="1.4"/>
        <circle cx="910" cy="210" r="20" fill="#4a545c" stroke="#241e18"/>
        <circle cx="860" cy="378" r="32" fill="#d7dee4" stroke="#241e18" stroke-width="1.4"/>
        <path d="M860 102 C930 110 960 160 928 210 C960 250 930 340 860 346" fill="none" stroke="#1c1e1c" stroke-width="8" stroke-linecap="round"/>
        <circle cx="930" cy="280" r="12" fill="#c4622d" stroke="#241e18"/>
        <text x="980" y="130" class="call">kam</text>
        <text x="960" y="360" class="call">krank</text>
      </g>

      <g class="layer" data-step="19" data-id="crankpulley" style="--dx:16px;--dy:0">
        <circle cx="980" cy="378" r="40" fill="#3c444b" stroke="#241e18" stroke-width="1.4"/>
        <circle data-group="tdcplug" data-seq="1" cx="980" cy="378" r="8" class="bolt light"/>
        <text x="980" y="436" text-anchor="middle" class="call">kasnak</text>
      </g>

      <g class="layer" data-step="20" data-id="heatex oilfilter" style="--dx:-12px;--dy:8px">
        <rect x="70" y="300" width="36" height="70" rx="6" fill="#9eb6c4" stroke="#241e18"/>
        <circle cx="88" cy="400" r="16" fill="#2a241c" stroke="#efe6d4"/>
        <text x="88" y="454" text-anchor="middle" class="call">filtre</text>
      </g>

      <g class="layer" data-step="21" data-id="bracket alt belt" style="--dx:0;--dy:12px">
        <rect x="70" y="470" width="150" height="36" rx="6" fill="#4a545c" stroke="#241e18"/>
        <circle cx="250" cy="488" r="22" fill="#d7dee4" stroke="#241e18"/>
        <path d="M150 488 H230" stroke="#1c1e1c" stroke-width="6"/>
        <text x="145" y="492" text-anchor="middle" class="on-dark">ayak</text>
      </g>
    </svg>`;
}

export function syncStage(index, step) {
  const focus = new Set(step.focus || []);
  const svg = document.querySelector(".engine");
  if (!svg) return;
  let any = false;
  svg.querySelectorAll(".layer").forEach((el) => {
    const on = Number(el.dataset.step) <= index;
    const ids = (el.dataset.id || "").split(/\s+/);
    const hot = on && ids.some((id) => focus.has(id));
    const became = on && !el.classList.contains("on");
    el.classList.toggle("on", on);
    el.classList.toggle("focus", hot);
    if (hot) any = true;
    if (became) {
      el.classList.add("just");
      el.addEventListener("animationend", () => el.classList.remove("just"), { once: true });
    }
  });
  svg.classList.toggle("has-focus", any);
}

export function replayStep(step) {
  const fresh = new Set(step.introduce || []);
  document.querySelectorAll(".engine .layer").forEach((el) => {
    const ids = (el.dataset.id || "").split(/\s+/);
    if (!ids.some((id) => fresh.has(id))) return;
    el.classList.remove("on", "just");
    void el.getBoundingClientRect();
    el.classList.add("on", "just");
  });
}
