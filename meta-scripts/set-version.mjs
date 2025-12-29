import {readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import config from './custom-script-configs.json' with {type: 'json'};

const versionFlagIndex = process.argv.indexOf('--v');
if(versionFlagIndex < 0 || !process.argv[versionFlagIndex + 1]) {
  console.error('No version specified');
  process.exit(1)
}

const version = process.argv[versionFlagIndex + 1];
if(!/\d+\.\d+\.\d+(\-.+\.\d+)?/.test(version)) {
  console.error('Version does not match pattern: <major>.<minor>.<patch>(-<branch>)?');
  process.exit(1);
}

function swapVersion(filePath) {
  const fileContents = readFileSync(filePath).toString();
  const ext = filePath.match(/\.([^\.]+)$/)?.[1];
  switch(ext) {
    case 'json': {
      return fileContents.replace(/^(\s*"version"\s*:\s*)"[^"]+",/m, (_, pre) => `${pre}"${version}",`);
    }
    case 'toml': {
      return fileContents.replace(/^(\s*version\s*=\s*)"[^"]+"/m, (_, pre) => `${pre}"${version}"`);
    }
  }
}

for(const path of config['version-files']) {
  const updated = swapVersion(path);
  if(!updated) {
    throw new Error(`Couldn't update version of ${path}`);
  }
  writeFileSync(path, updated);
}
