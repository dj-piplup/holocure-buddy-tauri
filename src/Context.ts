import {
  BaseDirectory,
  readTextFile,
  watchImmediate,
  writeTextFile,
} from "@tauri-apps/plugin-fs";

export class Context {
  configContents: Config;
  dataFile: string;
  saveFile: string;
  #saveData?: SaveData;
  get saveData(): SaveData | undefined {
    return this.#saveData;
  }
  set saveData(d: SaveData) {
    this.#saveData = d;
    this.#saveDataCallbacks?.forEach((c) => c());
  }

  #dataFileData?: GameData;
  get data() {
    return this.#dataFileData;
  }

  #saveDataCallbacks: (() => void)[] = [];
  onSaveChanged(fn: () => void): () => void {
    this.#saveDataCallbacks.push(fn);
    return () => {
      const index = this.#saveDataCallbacks.indexOf(fn);
      if (index >= 0) {
        this.#saveDataCallbacks.splice(index, 1);
      }
    };
  }

  #styleProps: this["styleProps"];
  #styleSheet: CSSStyleSheet = new CSSStyleSheet();
  get styleProps(): Omit<Config, "save" | "data"> {
    return this.#styleProps;
  }
  set styleProps(v: this["styleProps"]) {
    this.#styleProps = v;
    this.#syncStyleSheet();
  }

  constructor(config: Config) {
    this.configContents = config;
    const { save, data, ...style } = config;
    this.dataFile = data!;
    this.saveFile = save!;
    this.#styleProps = style;
    this.#syncStyleSheet();
  }
  async init() {
    await this.#initData();
    await this.#processSave();
    await watchImmediate(this.saveFile, (event) => {
      // The WatchEvent interface is wrong
      const eventType = event.type as Record<string, {kind: string, mode: string}>; 
      if('access' in eventType && eventType.access.kind === 'close' && eventType.access.mode === 'write') {
        void this.#processSave();
      }
    });
    return;
  }

  writeStyleConfig() {
    const newConfig = {
      ...this.#styleProps,
      save: this.saveFile,
      data: this.dataFile,
    } satisfies Config;
    writeTextFile("Holocure-Buddy/config.json", JSON.stringify(newConfig), {
      baseDir: BaseDirectory.Data,
    });
  }

  #syncStyleSheet() {
    if (!document.adoptedStyleSheets.includes(this.#styleSheet)) {
      document.adoptedStyleSheets.push(this.#styleSheet);
    }
    this.#styleSheet.replaceSync(`
      :root {
        --custom-background-color: ${this.styleProps.backgroundColor};
        --custom-border-color: ${this.styleProps.borderColor};
        --custom-cleared-color: ${this.styleProps.clearedColor};
        --custom-selected-color: ${this.styleProps.selectedColor};
        --custom-text-color: ${this.styleProps.textColor};
        --custom-font: ${this.styleProps.font};
      }
    `);
  }

  async #initData() {
    const dataFileContents = await readTextFile(this.dataFile);
    const letterDataStart = dataFileContents.match(/Shrimp/)?.index;
    const letterDataEnd = dataFileContents.match(/allFanLetters/)?.index;
    this.#dataFileData = {
      characterOrder: [...dataFileContents.matchAll(/([a-z]+)Gachikoi/g)].map(
        (m) => m[1]
      ),
      allLetters:
        letterDataStart && letterDataEnd
          ? (dataFileContents
              .slice(letterDataStart, letterDataEnd)
              .match(/[A-Z]\w+/g) as string[])
          : Array.from<string>([]),
    };
  }

  async #processSave(): Promise<SaveData> {
    const saveFileContents = await readTextFile(this.saveFile);
    const rawSaveData = this.#parseSave(saveFileContents);
    const stages = this.#sortStages(
      rawSaveData.completedStages
        .map((s) => s[0])
        .filter((s) => s.startsWith("STAGE"))
    );
    const clears = this.#getClears(rawSaveData);
    const letters = new Set(rawSaveData.fanletters);
    const gachikoi = new Set(
      rawSaveData.fandomEXP.flatMap(([name, xp]) => (xp >= 100 ? [name] : []))
    );
    const allDone = new Set(
      Object.keys(clears).filter(
        (char) => clears[char].length === stages.length
      )
    );
    const owned = new Set(
      rawSaveData.characters.flatMap(([char, pulls]) => (pulls > 0 ? char : []))
    );
    this.saveData = {
      stages,
      clears,
      letters,
      gachikoi,
      allDone,
      owned,
    } satisfies SaveData;
    return this.saveData;
  }

  #parseSave(fileContents: string): RawSave {
    return JSON.parse(atob(fileContents));
  }

  #getClears(data: RawSave): Record<string, string[]> {
    const allChars = this.data?.characterOrder.slice();
    const byChar: Record<string, string[]> = {};
    for (const [stage, characters] of data.completedStages) {
      characters.forEach(
        (char) => (byChar[char] ??= []) && byChar[char].push(stage)
      );
    }
    return Object.fromEntries(
      allChars?.map((c) => [c, this.#sortStages(byChar[c])]) ?? []
    );
  }

  /**
   * Sorts stages to make sure all hard stages come after all normal stages
   * @param Stage names as an array
   * @returns a copy of the stage array, but sorted as 1-X normal, 1-X hard
   */
  #sortStages(stages: string[]): string[] {
    const copy = stages.slice();
    copy.sort((a, b) => {
      const aHard = /hard/i.test(a);
      const bHard = /hard/i.test(b);
      if (aHard && !bHard) {
        return 1;
      }
      if (bHard && !aHard) {
        return -1;
      }
      const na = parseInt(a);
      const nb = parseInt(b);
      return na - nb;
    });
    return copy;
  }
}

interface RawSave {
  completedStages: [string, string[]][];
  fanletters: string[];
  fandomEXP: [string, number][];
  characters: [string, number][];
}

export interface SaveData {
  stages: string[];
  clears: Record<string, string[]>;
  letters: Set<string>;
  gachikoi: Set<string>;
  allDone: Set<string>;
  owned: Set<string>;
}

export interface GameData {
  characterOrder: string[];
  allLetters: string[];
}

export interface PageContext {
  selected?: string;
}

export interface Config {
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  clearedColor: string;
  selectedColor: string;
  font: string;
  save?: string;
  data?: string;
}
