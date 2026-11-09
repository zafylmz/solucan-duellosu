import { STEPS, ALWAYS_REPLACE, SOURCE } from "./procedure.js";
import { mountStage, syncStage, replayStep } from "./stage.js";
import { detailFor, playSequence } from "./details.js";

const KEY = "k9k-cizim-adim";
const DONE = "k9k-cizim-bitti";

const stage = document.querySelector("#stage");
const inset = document.querySelector("#inset");
const ticket = document.querySelector("#ticket");
const bar = document.querySelector("#bar");
const count = document.querySelector("#count");
const sheet = document.querySelector("#sheet");
const sheetBody = document.querySelector("#sheet-body");

mountStage(stage);

let index = 0;
let done = {};
try {
  index = Math.min(STEPS.length - 1, Math.max(0, Number(localStorage.getItem(KEY)) || 0));
  done = JSON.parse(localStorage.getItem(DONE) || "{}");
} catch {
  index = 0;
  done = {};
}
const fromHash = location.hash.match(/^#(\d+)$/);
if (fromHash) index = Math.min(STEPS.length - 1, Number(fromHash[1]));

function persist() {
  localStorage.setItem(KEY, String(index));
  localStorage.setItem(DONE, JSON.stringify(done));
}

function plates(step) {
  if (!step.fasteners.length) return "";
  return `<div class="plates">${step.fasteners.map((f) => `
    <article class="plate">
      <h3>${f.name}</h3>
      <p class="spec">${f.spec}${f.then ? `<span>${f.then}</span>` : ""}</p>
      <p class="meta">${[f.tool, f.order].filter(Boolean).join(" · ")}</p>
    </article>`).join("")}</div>`;
}

function render() {
  const step = STEPS[index];
  syncStage(index, step);
  inset.innerHTML = detailFor(step);
  count.textContent = `${index + 1} / ${STEPS.length}`;
  bar.style.width = `${((index + 1) / STEPS.length) * 100}%`;
  const chips = step.id === "prep"
    ? `<div class="chips">${ALWAYS_REPLACE.map((item) => `<span>${item}</span>`).join("")}</div>`
    : "";
  ticket.innerHTML = `
    <p class="kicker">${step.phase}</p>
    <h1>${step.title}</h1>
    <p class="summary">${step.summary}</p>
    ${chips}
    <ul class="body">${step.body.map((line) => `<li>${line}</li>`).join("")}</ul>
    ${plates(step)}
    ${step.warn ? `<p class="warn">${step.warn}</p>` : ""}
    <label class="done-toggle"><input id="mark" type="checkbox" ${done[step.id] ? "checked" : ""}/> Bu adımı tezgâhta yaptım</label>
    <div class="nav">
      <button id="prev" ${index === 0 ? "disabled" : ""}>Geri</button>
      <button id="act" class="primary grow">${step.boltGroup ? "Sıkma sırasını gör" : "Parçayı yerine oturt"}</button>
      <button id="next" ${index === STEPS.length - 1 ? "disabled" : ""}>İleri</button>
    </div>`;
  document.querySelector("#prev").onclick = () => go(index - 1);
  document.querySelector("#next").onclick = () => go(index + 1);
  document.querySelector("#act").onclick = () => {
    if (step.boltGroup) playSequence(step.boltGroup);
    else replayStep(step);
  };
  document.querySelector("#mark").onchange = (event) => {
    done[step.id] = event.target.checked;
    persist();
  };
  persist();
}

function go(next) {
  index = Math.min(STEPS.length - 1, Math.max(0, next));
  history.replaceState(null, "", `#${index}`);
  render();
}

document.querySelector("#sheet-btn").onclick = () => {
  const rows = STEPS.flatMap((step) => step.fasteners.map((f) => `
    <tr>
      <td>${step.kicker} ${step.title}</td>
      <td>${f.name}</td>
      <td>${f.spec}${f.then ? ` ${f.then}` : ""}</td>
      <td>${f.order || ""}</td>
    </tr>`));
  sheetBody.innerHTML = rows.join("");
  sheet.classList.add("open");
};
document.querySelector("#sheet-close").onclick = () => sheet.classList.remove("open");
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) sheet.classList.remove("open");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") go(index + 1);
  if (event.key === "ArrowLeft") go(index - 1);
  if (event.key === " " && document.activeElement.tagName !== "BUTTON") {
    event.preventDefault();
    document.querySelector("#act")?.click();
  }
});

document.querySelector("#source").textContent = `${SOURCE.title} · ${SOURCE.scope}`;
render();
