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
  const updated = fileContents.replace(/^(\s*"version": ?)"[^"]+",/m, (_, pre) => `${pre}"${version}",`);
  writeFileSync(filePath, updated)
}

for(const path of config['version-jsons']) {
  swapVersion(join(import.meta.dirname, '..', path));
}
