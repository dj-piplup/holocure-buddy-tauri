import { Config, type Context } from "./Context";
import defaultConfig from "./assets/default_config.json";
import { attachListener, removeListener } from "./events";

const html = String.raw;
type UserConfig = Omit<Config, "save" | "data">;

export function renderClears(context: Context): void {
  const stages = context.saveData!.stages;
  const destination = document.getElementById("clears-zone")!;
  observeSize(destination);
  const rows = [];
  for (const [character, clears] of Object.entries(context.saveData!.clears)) {
    let output = html`<div class="row" id="${character}-row">
      <strong class="name">${formatName(character)}</strong>
      ${stages
        .map(
          (s) =>
            html`<div
              class="${clears.includes(s) ? "cleared stage" : "stage"}"
              id="stage-${character}-${abbrStage(s)}"
            >
              <span>${abbrStage(s)}</span>
            </div>`
        )
        .join("")}
    </div>`;
    rows.push(output);
  }
  destination.innerHTML = rows.join("");
}

export function hasClear(char: string, stage: string): boolean {
  const stageEl = document.getElementById(`stage-${char}-${abbrStage(stage)}`)!;
  return stageEl.classList.contains("cleared");
}

export function autoRollEnabled(): boolean {
  const cb = document.getElementById("auto-roll");
  if (cb instanceof HTMLInputElement) {
    return cb.checked;
  }
  return false;
}

export function renderLetters(context: Context): void {
  const destination = document.getElementById("letters-zone")!;
  observeSize(destination);
  const rows = context.data!.allLetters.map((letter, index) => {
    const clear = context.saveData!.letters.has(letter);
    return html`<div
      class="${clear ? "cleared row" : "row"}"
      id="letter-${letter.toLowerCase()}"
    >
      <div class="stage">${index + 1}</div>
      <div class="letter">${letter}</div>
    </div>`;
  });
  destination.innerHTML = rows.join("");
}

export function hasLetter(letter: string): boolean {
  const letterEl = document.getElementById(`letter-${letter.toLowerCase()}`)!;
  return letterEl.classList.contains("cleared");
}

export function logClear(character: string, stage: string) {
  logEvent(`${formatName(character)} cleared ${stage}`);
}

export function logLetter(letter: string) {
  logEvent(`Obtained fan letter for ${letter}`);
}

export function logEvent(message: string, type: 'error' | 'warning' | 'default' = 'default') {
  const text = document.createElement("pre");
  const d = new Date();
  const time = d.toLocaleTimeString();
  text.classList.add(`logged-${type}`);
  text.innerText = `> (${time}) ${message}`;
  document.getElementById("log-section")?.appendChild(text);
}

export function deselectRows(): void {
  document
    .querySelectorAll(".row[selected]")
    ?.forEach((r) => r.removeAttribute("selected"));
}

export function selectRow(char: string, repeatCount: number): void {
  deselectRows();
  const repeatText = formatRepeatText(repeatCount);
  document.getElementById("output-roll")!.innerText = `${formatName(char)}${
    repeatText && ` (${repeatText})`
  }`;
  document.querySelector(".row[selected]")?.removeAttribute("selected");
  document.getElementById(`${char}-row`)?.setAttribute("selected", "");
}

export function setButtonState(
  type: string,
  handler: () => void,
  enabled: boolean
) {
  const button = document.getElementById(`random-${type}`);
  removeListener(button!, "click", handler);
  if (enabled) {
    button?.classList.remove("hidden");
    attachListener(button!, "click", handler);
  } else {
    button?.classList.add("hidden");
  }
}

const styleInputs = [
  ...document.querySelectorAll<HTMLInputElement>('[id$="-input"'),
];

export function attachConfigListeners(
  tempConfig: UserConfig,
  sendUpdate: (config: UserConfig) => void,
  finalize: () => void,
  reset: () => void
) {
  attachListener(
    document.getElementById("open-config-button")!,
    "click",
    () => {
      document.querySelector<HTMLDialogElement>("#config-modal")?.showModal();
    }
  );
  attachListener(document.getElementById("confirm-config")!, "click", () => {
    sendUpdate(tempConfig);
    finalize();
    document.querySelector<HTMLDialogElement>("#config-modal")?.close();
  });
  attachListener(document.getElementById("cancel-config")!, "click", () => {
    reset();
    document.querySelector<HTMLDialogElement>("#config-modal")?.close();
  });
  attachListener(document.getElementById("clear-config")!, "click", () => {
    for (const k in tempConfig) {
      const key = k as keyof UserConfig;
      tempConfig[key] = defaultConfig[key];
    }
    writeConfigValues(tempConfig);
    sendUpdate(tempConfig);
  });

  styleInputs.forEach((el) => {
    const prop = el.id
      .replace("-input", "")
      .replace(/-(\w)/g, (_, l) => l.toUpperCase()) as keyof UserConfig;
    attachListener(el, "input", () => {
      if (prop.endsWith("Color")) {
        tempConfig[prop] =
          el.value.match(/^\p{Hex}+$/u) &&
          [3, 4, 6, 8].includes(el.value.length)
            ? `#${el.value}`
            : defaultConfig[prop];
      } else {
        tempConfig[prop] = el.value;
      }
      sendUpdate(tempConfig);
    });
  });
  writeConfigValues(tempConfig);
}

export function writeConfigValues(config: UserConfig) {
  styleInputs.forEach((el) => {
    const prop = el.id
      .replace("-input", "")
      .replace(/-(\w)/g, (_, l) => l.toUpperCase()) as keyof UserConfig;
    el.value = config[prop]?.replace(/^#/, "");
  });
}

export function renderVersionNumber(n: string) {
  const el = document.getElementById('version-number');
  if(el){
    el.innerText = `Version: ${n}`;
  }
}

function formatName(char: string) {
  switch (char) {
    default: {
      return `${char[0].toUpperCase()}${char.slice(1)}`;
    }
  }
}

function abbrStage(stageName: string) {
  const result = /^STAGE (?<number>\d+)( \((?<hard>H)ARD\))?$/.exec(
    stageName
  )?.groups;
  return `${result?.number}${result?.hard ?? ""}`;
}

function formatRepeatText(count: number) {
  if (count > 3) {
    return "many times in a row";
  }
  if (count > 0) {
    return Array.from({ length: count }, () => "again").join(" ");
  }
  return "";
}

function sizeCallback(entries: Parameters<ResizeObserverCallback>[0]) {
  const recent = entries[entries.length - 1];
  const { inlineSize } =
    recent.contentBoxSize[recent.contentBoxSize.length - 1];
  const container = recent.target as HTMLElement;
  const colWidth = container
    .querySelector(".row")!
    .getBoundingClientRect().width;
  const thingCount = container.querySelectorAll(".row").length;
  let colCount = Math.floor(inlineSize / (colWidth + 16));
  let colLength = Math.ceil(thingCount / colCount);
  if (colLength < 20) {
    colLength = 20;
    colCount = Math.ceil(thingCount / 20);
  }
  if (colCount < 1) {
    colCount = 1;
    colLength = thingCount;
  }
  container.style.setProperty("--column-length", colLength.toString());
  container.style.setProperty("--column-width", `${colWidth}px`);
}

let observing = new Map();
function observeSize(el: HTMLElement) {
  if (!observing.has(el.id)) {
    const obs = new ResizeObserver(sizeCallback).observe(el);
    observing.set(el.id, obs);
  }
}
