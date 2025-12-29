import * as fs from "@tauri-apps/plugin-fs";
import * as path from "@tauri-apps/api/path";
import { Command } from "@tauri-apps/plugin-shell";
import { Config, Context } from "./Context";
import {
  attachConfigListeners,
  autoRollEnabled,
  deselectRows,
  hasClear,
  hasLetter,
  logClear,
  logLetter,
  renderClears,
  renderLetters,
  selectRow,
  setButtonState,
  writeConfigValues,
} from "./rendering";
import { attachListener, cleanupListeners } from "./events";

let config: Config;
let buddyCtx: Context;
let selected: string | undefined;
let repeatCount = 0;
let styleCheckpoint: Context["styleProps"];
void loadContext();

async function loadContext(): Promise<void> {
  await Command.sidecar("binaries/sidecar-node").execute();
  config = await fs
    .readTextFile("Holocure-Buddy/config.json", {
      baseDir: path.BaseDirectory.Data,
    })
    .then(JSON.parse);
  if (!config.save || !config.data) {
    await promptFileConfig();
  }
  if (!config.save || !config.data) {
    throw new Error(
      "The buddy does not have a configured save file or data file to read"
    );
  }
  buddyCtx = new Context(config);
  await buddyCtx.init();
  if (buddyCtx.saveData) {
    styleCheckpoint = { ...buddyCtx.styleProps };
    attachConfigListeners(
      buddyCtx.styleProps,
      (c) => {
        // On individual config changes
        buddyCtx.styleProps = c;
      },
      () => {
        // On config confirmation
        styleCheckpoint = { ...buddyCtx.styleProps };
        buddyCtx.writeStyleConfig();
      },
      () => {
        // On reset
        buddyCtx.styleProps = styleCheckpoint;
        writeConfigValues(styleCheckpoint);
      }
    );
    handleSaveData(true);
    buddyCtx.onSaveChanged(() => handleSaveData(false));
  }
}

const rollTypes = ["gachikoi", "stage", "any"] as const;
const rollHandlers = Object.fromEntries(
  rollTypes.map((t) => [t, () => handleRoll(t)])
) as Record<(typeof rollTypes)[number], () => void>;

let lastRollType: (typeof rollTypes)[number] = "any";

function canRoll(type: (typeof rollTypes)[number]): boolean {
  switch (type) {
    case "gachikoi": {
      return (
        buddyCtx.saveData?.gachikoi.size !==
        buddyCtx.data?.characterOrder.length
      );
    }
    case "stage": {
      return (
        buddyCtx.saveData?.allDone.size !== buddyCtx.data?.characterOrder.length
      );
    }
    default: {
      return true;
    }
  }
}

function handleRoll(type: (typeof rollTypes)[number]) {
  lastRollType = type;
  const pool = buddyCtx.data!.characterOrder.filter(
    (c) =>
      !(
        (type === "gachikoi" && buddyCtx.saveData?.gachikoi.has(c)) ||
        (type === "stage" && buddyCtx.saveData?.allDone.has(c))
      )
  );

  const newSelected = pool[Math.floor(Math.random() * pool.length)];
  if (newSelected === selected) {
    repeatCount += 1;
  } else {
    repeatCount = 0;
  }
  selectRow(newSelected, repeatCount);
  selected = newSelected;
}

function handleSaveData(initial?: boolean) {
  selected = undefined;
  repeatCount = 0;
  deselectRows();
  if (!initial) {
    for (const character in buddyCtx.saveData?.clears) {
      for (const stage of buddyCtx.saveData.clears[character]) {
        if (!hasClear(character, stage)) {
          logClear(character, stage);
          if (autoRollEnabled()) {
            handleRoll(lastRollType);
          }
        }
      }
    }
    for (const letter of buddyCtx.saveData!.letters) {
      if (!hasLetter(letter)) {
        logLetter(letter);
      }
    }
  }
  renderClears(buddyCtx);
  renderLetters(buddyCtx);
  for (const type of rollTypes) {
    setButtonState(type, rollHandlers[type], canRoll(type));
  }
}

async function promptFileConfig() {
  return false;
}

attachListener(window, 'unload', cleanupListeners)
