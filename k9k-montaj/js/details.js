function card(title, body) {
  return `<figure class="inset"><figcaption>${title}</figcaption>${body}</figure>`;
}

function svg(inner, vb = "0 0 320 168") {
  return `<svg viewBox="${vb}" class="detail">${inner}</svg>`;
}

const ink = "#241e18";

export function detailFor(step) {
  switch (step.id) {
    case "prep":
      return card(
        "Yön",
        svg(`
          <text x="16" y="28" class="d">volan</text>
          <text x="250" y="28" class="d">triger</text>
          ${[40, 100, 160, 220].map((x, i) => `<g><rect x="${x}" y="48" width="44" height="64" rx="4" fill="#d7dee4" stroke="${ink}"/><text x="${x + 22}" y="86" text-anchor="middle" class="num">${i + 1}</text></g>`).join("")}
          <path d="M62 132 H250" stroke="${ink}" stroke-width="1.2" marker-end="url(#none)"/>
          <text x="160" y="156" text-anchor="middle" class="d">ateşleme 1 – 3 – 4 – 2</text>
        `)
      );
    case "shells":
      return card(
        "Kabuk yönü",
        svg(`
          <path d="M40 110 A70 70 0 0 1 180 110" fill="#8fb4c9" stroke="${ink}" stroke-width="2"/>
          <path d="M70 100 h70 M90 90 h40" stroke="${ink}" stroke-width="2"/>
          <text x="110" y="48" text-anchor="middle" class="d">yivli · bloğa</text>
          <path d="M190 110 A70 70 0 0 1 310 110" fill="#d7dee4" stroke="${ink}" stroke-width="2"/>
          <text x="250" y="48" text-anchor="middle" class="d">düz · kapağa</text>
          <text x="160" y="150" text-anchor="middle" class="d">sırt kuru, yüzey yağlı</text>
        `)
      );
    case "crank":
      return card(
        "Yatak 3, itme pulları",
        svg(`
          ${[30, 90, 150, 210, 270].map((x, i) => `<g><rect x="${x}" y="70" width="36" height="28" rx="3" fill="${i === 2 ? "#e7c3a4" : "#d7dee4"}" stroke="${ink}"/><text x="${x + 18}" y="89" text-anchor="middle" class="num">${i + 1}</text></g>`).join("")}
          <rect x="146" y="62" width="5" height="44" fill="#c4622d"/>
          <rect x="185" y="62" width="5" height="44" fill="#c4622d"/>
          <text x="160" y="140" text-anchor="middle" class="d">kanallar kranka bakar</text>
        `)
      );
    case "mains":
      return card(
        "Ana yatak sırası",
        svg(`
          ${[["3", 150], ["2", 90], ["4", 210], ["1", 30], ["5", 270]].map(([n, x], i) => `
            <g data-group="mainbolts" data-seq="${i + 1}">
              <rect x="${x}" y="48" width="40" height="48" rx="4" fill="#d7dee4" stroke="${ink}" class="seq"/>
              <text x="${x + 20}" y="78" text-anchor="middle" class="num">${n}</text>
            </g>`).join("")}
          <text x="160" y="130" text-anchor="middle" class="d">sıkma 3 → 2 → 4 → 1 → 5</text>
          <text x="160" y="152" text-anchor="middle" class="d">25 Nm, sonra 47°</text>
        `)
      );
    case "rings":
      return card(
        "Segman, TOP yukarı",
        svg(`
          <circle cx="100" cy="84" r="46" fill="none" stroke="${ink}" stroke-width="8" stroke-dasharray="70 18"/>
          <circle cx="100" cy="84" r="30" fill="none" stroke="#8d6840" stroke-width="6" stroke-dasharray="48 16" stroke-dashoffset="20"/>
          <text x="100" y="88" text-anchor="middle" class="num">TOP</text>
          <text x="210" y="70" class="d">ağızlar eşit dağılır</text>
          <text x="210" y="94" class="d">kompresyon 0,20–0,35</text>
          <text x="210" y="118" class="d">yağ 0,25–0,50</text>
        `)
      );
    case "pistons":
      return card(
        "V işareti volana",
        svg(`
          <rect x="70" y="36" width="80" height="96" rx="8" fill="#d2b07a" stroke="${ink}"/>
          <text x="110" y="90" text-anchor="middle" class="num">V</text>
          <path d="M40 84 H70" stroke="#c4622d" stroke-width="2"/>
          <text x="24" y="78" class="d">volan</text>
          <text x="180" y="80" class="d">silindir 1 solda</text>
          <text x="180" y="104" class="d">pim sekmanı çentiğin tersi</text>
        `)
      );
    case "rods":
      return card(
        "Biyel kapağı",
        svg(`
          <rect x="40" y="40" width="90" height="70" rx="6" fill="#d7dee4" stroke="${ink}"/>
          <rect x="40" y="110" width="90" height="28" rx="4" fill="#c5ced6" stroke="${ink}"/>
          <circle data-group="rodbolts" data-seq="1" cx="62" cy="124" r="6" class="bolt"/>
          <circle data-group="rodbolts" data-seq="2" cx="108" cy="124" r="6" class="bolt"/>
          <text x="160" y="78" class="d">kapak kendi gövdesine</text>
          <text x="160" y="104" class="d">20 Nm + 45°</text>
          <text x="160" y="130" class="d">oturma yüzeyi kuru</text>
        `)
      );
    case "pump":
      return card(
        "Pompayı yağla",
        svg(`
          <circle cx="70" cy="80" r="28" fill="#3c444b" stroke="${ink}"/>
          <circle cx="150" cy="80" r="16" fill="#d7dee4" stroke="${ink}"/>
          <path d="M98 80 H134" stroke="${ink}" stroke-width="4"/>
          <text x="190" y="74" class="d">zincir, sonra pompa</text>
          <text x="190" y="98" class="d">25 ± 2,5 Nm</text>
          <text x="190" y="122" class="d">süzgeçten yağ bas</text>
        `)
      );
    case "front":
      return card(
        "Ön kapak ve devridaim",
        svg(`
          <rect x="30" y="24" width="120" height="120" rx="8" fill="#d7dee4" stroke="${ink}"/>
          <circle cx="90" cy="84" r="22" fill="#9eb6c4" stroke="${ink}"/>
          ${[[40, 36], [90, 36], [140, 36], [40, 84], [140, 84], [40, 128], [90, 128], [140, 128]].map(([x, y], i) => `<circle data-group="frontbolts" data-seq="${i + 1}" cx="${x}" cy="${y}" r="5" class="bolt"/>`).join("")}
          <text x="180" y="70" class="d">cıvatalar 11 Nm</text>
          <text x="180" y="94" class="d">pompa diş kilidi</text>
          <text x="180" y="118" class="d">PTFE dudağa dokunma</text>
        `)
      );
    case "sump":
      return card(
        "Silikon fitili",
        svg(`
          <rect x="30" y="40" width="200" height="80" rx="6" fill="none" stroke="${ink}" stroke-width="2"/>
          <path d="M46 56 H214 M46 104 H214" stroke="#c4622d" stroke-width="4" stroke-linecap="round"/>
          <circle cx="46" cy="80" r="4" fill="#c4622d"/>
          <circle cx="214" cy="80" r="4" fill="#c4622d"/>
          <text x="40" y="150" class="d">5 mm fitil · tapa 20 Nm · cıvata 14 Nm</text>
        `)
      );
    case "flywheel":
      return card(
        "Volan tipini ayır",
        svg(`
          <rect x="16" y="28" width="130" height="110" rx="6" fill="#efe6d4" stroke="${ink}"/>
          <text x="81" y="54" text-anchor="middle" class="d">tek kütle</text>
          <text x="81" y="92" text-anchor="middle" class="num">55 Nm</text>
          <rect x="166" y="28" width="138" height="110" rx="6" fill="#efe6d4" stroke="${ink}"/>
          <text x="235" y="54" text-anchor="middle" class="d">çift kütle</text>
          <text x="235" y="92" text-anchor="middle" class="num">20 Nm</text>
          <text x="235" y="116" text-anchor="middle" class="d">+ 36°</text>
        `)
      );
    case "valves":
      return card(
        "Boşluk, soğuk",
        svg(`
          <text x="20" y="40" class="d">emme</text><text x="120" y="40" class="num">0,20</text>
          <text x="20" y="78" class="d">egzoz</text><text x="120" y="78" class="num">0,40</text>
          <text x="20" y="120" class="d">1 bindirmedeyken 4 ölçülür</text>
          <text x="20" y="144" class="d">3→2 · 4→1 · 2→3</text>
        `)
      );
    case "cam":
      return card(
        "Kapak 1 volanda, 1 ve 6’da macun",
        svg(`
          ${[24, 74, 124, 174, 224, 274].map((x, i) => `<rect x="${x}" y="50" width="36" height="40" rx="3" fill="${i === 0 || i === 5 ? "#e7c3a4" : "#d7dee4"}" stroke="${ink}"/><text x="${x + 18}" y="76" text-anchor="middle" class="num">${i + 1}</text>`).join("")}
          <text x="160" y="130" text-anchor="middle" class="d">11 ± 1,1 Nm · Loctite 518 sadece 1 ve 6</text>
          <text x="160" y="152" text-anchor="middle" class="d">kasnak somunu 30 Nm + 86°</text>
        `)
      );
    case "manifolds":
      return card(
        "Enjektör kendi silindirine",
        svg(`
          ${[40, 100, 160, 220].map((x, i) => `<g><rect x="${x}" y="36" width="28" height="50" rx="3" fill="#6d5434" stroke="${ink}"/><rect x="${x - 4}" y="86" width="36" height="6" fill="#b87333"/><text x="${x + 14}" y="120" text-anchor="middle" class="num">${i + 1}</text></g>`).join("")}
          <text x="40" y="150" class="d">bakır pul yeni · braket 28 Nm · buji 15 Nm</text>
        `)
      );
    case "injection":
      return card(
        "Bir boru bitmeden diğeri yok",
        svg(`
          <rect x="20" y="70" width="70" height="36" rx="4" fill="#4a545c" stroke="${ink}"/>
          <text x="55" y="92" text-anchor="middle" class="on-dark">pompa</text>
          <rect x="125" y="30" width="70" height="24" rx="4" fill="#3c444b" stroke="${ink}"/>
          <text x="160" y="46" text-anchor="middle" class="on-dark">ray</text>
          <rect x="230" y="80" width="28" height="40" fill="#6d5434" stroke="${ink}"/>
          <path d="M90 88 H125 V54" fill="none" stroke="#8d3d28" stroke-width="3"/>
          <path d="M195 42 H230 V80" fill="none" stroke="#8d3d28" stroke-width="3"/>
          <text x="20" y="146" class="d">24 Nm, parça 025–029 ise 38 Nm</text>
        `)
      );
    case "gasket":
      return card(
        "Kapak cıvataları, merkezden dışa",
        svg(`
          <text x="16" y="22" class="d">egzoz</text>
          ${boltRow([8, 4, 2, 6, 10], 48)}
          ${boltRow([7, 3, 1, 5, 9], 100)}
          <text x="16" y="156" class="d">önce 25 Nm, kontrol, sonra 255°</text>
        `, "0 0 320 170")
      );
    case "rocker":
      return card(
        "Külbütör, 2 mm fitil",
        svg(`
          <rect x="30" y="40" width="200" height="70" rx="10" fill="#ece7df" stroke="${ink}"/>
          ${[50, 90, 130, 170, 210].map((x, i) => `<circle data-group="rockerbolts" data-seq="${i + 1}" cx="${x}" cy="74" r="6" class="bolt"/>`).join("")}
          <text x="30" y="140" class="d">12 ± 1,2 Nm · dört silikon fitil</text>
        `)
      );
    case "turbo":
      return card(
        "Turbo yağı",
        svg(`
          <circle cx="70" cy="84" r="32" fill="#8d9398" stroke="${ink}"/>
          <path d="M102 70 H180" stroke="#c4622d" stroke-width="4"/>
          <path d="M102 100 H180" stroke="#3c444b" stroke-width="4"/>
          <text x="188" y="74" class="d">besleme 23 / 35</text>
          <text x="188" y="106" class="d">dönüş 12 Nm</text>
          <text x="20" y="146" class="d">çalıştırmadan yağ bas</text>
        `)
      );
    case "timing":
      return card(
        "19 diş, pimler oturur",
        svg(`
          <circle cx="70" cy="40" r="18" fill="#d7dee4" stroke="${ink}"/>
          <circle cx="150" cy="70" r="14" fill="#4a545c" stroke="${ink}"/>
          <circle cx="70" cy="120" r="20" fill="#d7dee4" stroke="${ink}"/>
          <path d="M70 22 C120 20 170 40 150 56 C170 90 120 100 70 100" fill="none" stroke="#1c1e1c" stroke-width="5"/>
          <text x="190" y="50" class="d">kam pimi Mot. 1430</text>
          <text x="190" y="74" class="d">ÜÖN pimi Mot. 1489</text>
          <text x="190" y="98" class="d">kam–pompa arası 19 diş</text>
          <text x="190" y="122" class="d">gergi 27 Nm</text>
        `)
      );
    case "timing-check":
      return card(
        "İbre pencerenin ortasında",
        svg(`
          <path d="M40 110 A70 70 0 0 1 180 110" fill="none" stroke="${ink}" stroke-width="10"/>
          <path d="M70 110 A40 40 0 0 1 150 110" fill="#e7c3a4"/>
          <line x1="110" y1="110" x2="110" y2="62" stroke="#c4622d" stroke-width="3"/>
          <text x="200" y="80" class="d">iki tur saat yönü</text>
          <text x="200" y="104" class="d">pimler tekrar girmeli</text>
          <text x="200" y="128" class="d">tapa 20 Nm</text>
        `)
      );
    case "oilside":
      return card(
        "Filtre ve eşanjör",
        svg(`
          <rect x="40" y="40" width="80" height="50" rx="4" fill="#9eb6c4" stroke="${ink}"/>
          <text x="80" y="70" text-anchor="middle" class="d">45 Nm</text>
          <circle cx="180" cy="64" r="28" fill="#2a241c" stroke="${ink}"/>
          <text x="180" y="68" text-anchor="middle" class="on-dark">14</text>
          <text x="40" y="130" class="d">conta yağlı · kulak deliğe oturur</text>
          <text x="40" y="152" class="d">müşir 30–35 Nm</text>
        `)
      );
    case "accessories":
      return card(
        "Ayak 1’den 6’ya",
        svg(`
          ${[30, 78, 126, 174, 222, 270].map((x, i) => `<g data-group="accbolts" data-seq="${i + 1}"><rect x="${x}" y="40" width="36" height="36" rx="4" class="seq" fill="#d7dee4" stroke="${ink}"/><text x="${x + 18}" y="64" text-anchor="middle" class="num">${i + 1}</text></g>`).join("")}
          <text x="30" y="110" class="d">1–6 : 44 Nm</text>
          <text x="30" y="134" class="d">7 numaralı alt cıvata : 21 Nm</text>
          <text x="30" y="158" class="d">kayışsız çalıştırma</text>
        `)
      );
    default:
      return card(step.title, svg(`<text x="16" y="80" class="d">${step.title}</text>`));
  }
}

function boltRow(nums, y) {
  return nums.map((n, i) => {
    const x = 36 + i * 56;
    return `<g data-group="headbolts" data-seq="${n}"><circle cx="${x}" cy="${y}" r="16" class="seq" fill="#d7dee4" stroke="#241e18"/><text x="${x}" y="${y + 5}" text-anchor="middle" class="num">${n}</text></g>`;
  }).join("");
}

export function playSequence(group) {
  const nodes = [...document.querySelectorAll(`[data-group="${group}"]`)].sort(
    (a, b) => Number(a.dataset.seq) - Number(b.dataset.seq)
  );
  nodes.forEach((n) => n.classList.remove("hot"));
  let i = 0;
  const step = () => {
    if (i > 0) nodes[i - 1].classList.add("done");
    if (i >= nodes.length) return;
    nodes[i].classList.add("hot");
    i += 1;
    window.setTimeout(step, 260);
  };
  if (nodes.length) step();
  return nodes.length;
}
