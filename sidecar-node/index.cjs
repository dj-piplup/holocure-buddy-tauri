const {join} = require('path');
const os = require('os');
const { readFileSync, existsSync, writeFileSync, mkdirSync } = require('fs');
// Remember to double check with ./src/assets/default_config.json if this doesn't make sense
const defaultConfigBase = {
  "textColor": "#F0F0F0",
  "backgroundColor": "#2B2B33",
  "borderColor": "#666",
  "clearedColor": "#008000",
  "selectedColor": "#E6641E",
  "font": "system-ui"
}


let cachedLibPath;

const homedir = os.homedir();
const appDataFolder = join(homedir, process.platform === 'win32' ? '\\AppData\\Local\\' : '/.local/share/')
const configFolder = join(appDataFolder, 'Holocure-Buddy');
const configFile = join(configFolder, 'config.json');

if(!existsSync(configFile)){
  if(!existsSync(configFolder)) {
    mkdirSync(configFolder);
  }
  writeFileSync(configFile, defaultConfig());
}

function getLibraryPath(){
  if(cachedLibPath){
      return cachedLibPath;
  }
  const steamFolder = process.platform === 'win32' ? 'C:/Program Files (x86)/Steam' : join(homedir,'.local','share','Steam');

  const librariesString = readFileSync(join(steamFolder,'steamapps','libraryfolders.vdf')).toString()
      .replaceAll(/"\t\t"/g,'":"').replaceAll(/"\n\s*{/g,'":{').replaceAll(/"(\n\t*")/g,(_,c)=>'",'+c).replaceAll('\t','  ');
  const libraries = Object.values(JSON.parse(`\{${librariesString}\}`).libraryfolders);
  const holocureLibrary = libraries.find(l => '2420510' in l.apps);
  cachedLibPath = join(holocureLibrary.path, 'steamapps');
  return cachedLibPath;
}


function findFiles(){
    if(process.platform === 'win32'){
      save = join(appDataFolder, 'HoloCure', 'save_n.dat');
    } else {
      const libPath = getLibraryPath();
      save = join(libPath,'compatdata','2420510','pfx','drive_c','users','steamuser','AppData','Local','HoloCure','save_n.dat');
    }
    const libPath = getLibraryPath();
    data = join(libPath, 'common','HoloCure','data.win');

    if(!save || !existsSync(save)) {
      save = undefined;
    }
    if(!data || !existsSync(data)) {
      data = undefined;
    }

    return {
      save, data
    }
}

function defaultConfig() {
  const {save, data} = findFiles();
  return JSON.stringify({
    ...defaultConfigBase,
    ...(save ? {save} : {}),
    ...(data ? {data} : {})
  });
}