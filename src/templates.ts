import axios from 'axios';
import { Dirent } from 'fs';
import { readdir, readFile } from 'fs/promises';
import Handlebars from 'handlebars';
import { join } from 'path';

import { OPTIONS } from './setup';
import { GithubContents } from './types';

Handlebars.registerHelper('isYARN', (input: string) => input === 'yarn');
Handlebars.registerHelper('isTRUE', (input: string) => input === 'true');

const templatesFolder = join(__dirname, '../', 'templates');

export function CONFIG(web: boolean): CONFIG_RETURN {
  const obj = {
    packages: [
      '@kaaaxcreators/config',
      'eslint',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      'eslint-plugin-simple-import-sort',
      'prettier',
      '@types/node',
      'typescript',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      'ts-node'
    ],
    scripts: {
      release: 'npx semantic-release',
      lint: 'eslint . --ignore-path ./.gitignore',
      'lint:fix': 'eslint . --ignore-path ./.gitignore --fix',
      build: 'tsc',
      dev: 'ts-node src/index.ts',
      start: 'node dist/index.js'
    }
  };
  if (web) {
    obj.packages.push('stylelint', 'stylelint-config-standard', 'eslint-plugin-html');
    obj.scripts.lint += ' && stylelint **/*.{css,html} --ignore-path ./.gitignore';
    obj.scripts['lint:fix'] += ' && stylelint **/*.{css,html} --ignore-path ./.gitignore --fix';
  }
  return obj;
}

export interface CONFIG_RETURN {
  packages: string[];
  scripts: SCRIPTS;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function ESLINT(web: boolean): object {
  const obj = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    env: {
      node: true,
      es6: true
    } as Record<string, true>,
    plugins: ['simple-import-sort', '@typescript-eslint', 'prettier'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier/prettier' // Make sure this is always the last element in the array.
    ],
    rules: {
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
      'simple-import-sort/imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      curly: 'warn'
    }
  };
  if (web) {
    obj.plugins.push('html');
    obj.env['browser'] = true;
  }
  return obj;
}

const VSCODE_SETTINGS = {
  'files.eol': '\n',
  'editor.tabSize': 2,
  'editor.useTabStops': false,
  'editor.codeActionsOnSave': {
    'source.fixAll.eslint': true
  }
};

const VSCODE_LAUNCH = {
  // Credits: https://blog.logrocket.com/how-to-debug-node-js-apps-in-visual-studio-code/
  version: '0.2.0',
  configurations: [
    {
      type: 'pwa-node',
      request: 'launch',
      outputCapture: 'std',
      name: 'Launch Program',
      skipFiles: ['<node_internals>/**'],
      runtimeArgs: ['-r', 'ts-node/register'],
      args: ['${workspaceFolder}/src/index.ts']
    }
  ]
};

function VSCODE_EXTENSIONS(web: boolean) {
  const obj = {
    recommendations: [
      'dbaeumer.vscode-eslint',
      'coenraads.bracket-pair-colorizer-2',
      'visualstudioexptteam.vscodeintellicode',
      'davidanson.vscode-markdownlint',
      'esbenp.prettier-vscode'
    ]
  };
  if (web) {
    obj.recommendations.push('stylelint.vscode-stylelint');
  }
  return obj;
}

export function VSCODE(web: boolean): FolderStructure {
  const obj = {
    '.vscode': {
      'launch.json': JSON.stringify(VSCODE_LAUNCH, null, 2),
      'extensions.json': JSON.stringify(VSCODE_EXTENSIONS(web), null, 2),
      'settings.json': JSON.stringify(VSCODE_SETTINGS, null, 2)
    }
  };
  return obj;
}

export async function TEMPLATES(options: OPTIONS): Promise<FolderStructure> {
  const contents = await readdir(templatesFolder, { withFileTypes: true });
  const folderStructure = await recursiveLookup(contents, templatesFolder, options);
  if (!options.GITHUB) {
    delete folderStructure['.github'];
  }
  if (!options.WEB) {
    delete folderStructure['.stylelintrc.json'];
  }
  return folderStructure;
}

/**
 * Recursive lookup folder and parse Handlebars
 * @param contents The contents of the startFolder
 * @param startFolder path to the folder of the contents
 * @param data The data to pass to handlebars
 */
async function recursiveLookup(
  contents: Dirent[],
  startFolder: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any = {},
  depth: string[] = []
): Promise<FolderStructure> {
  for (const level of contents) {
    if (level.isFile()) {
      const path = join(startFolder, ...depth, level.name);
      const text = (await readFile(path)).toString('utf-8');
      const template = Handlebars.compile(text);
      const result = template(data);
      setDeep(obj, [...depth, level.name], result, true);
      continue;
    } else if (level.isDirectory()) {
      setDeep(obj, [...depth, level.name], {}, true);
      const path = join(startFolder, ...depth, level.name);
      const contents = await readdir(path, {
        withFileTypes: true
      });
      await recursiveLookup(contents, startFolder, data, obj, [...depth, level.name]);
    }
  }
  return obj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FolderStructure = Record<string, any>;

/**
 * Dynamically sets a deeply nested value in an object.
 * @param {any} obj The object which contains the value you want to change/set.
 * @param {string[]} path The array representation of path to the value you want to change/set.
 * @param {any} value The value you want to set it to.
 * @param {boolean} recursive If true, will set value of non-existing path as well.
 * @author <https://stackoverflow.com/a/46008856>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setDeep(obj: any, path: string[], value: any, recursive = false) {
  path.reduce((a, b, level) => {
    level = level + 1;
    if (recursive && typeof a[b] === 'undefined' && level !== path.length) {
      a[b] = {};
      return a[b];
    }

    if (level === path.length) {
      a[b] = value;
      return value;
    }
    return a[b];
  }, obj);
}

export async function LicenseGitignore(options: OPTIONS): Promise<FolderStructure> {
  const READMEText = (await readFile(join(templatesFolder, 'README.md'))).toString('utf-8');
  const READMETemplate = Handlebars.compile(READMEText);
  const README = READMETemplate(options);
  const ConductText = (await readFile(join(templatesFolder, 'CODE_OF_CONDUCT.md'))).toString(
    'utf-8'
  );
  const ConductTemplate = Handlebars.compile(ConductText);
  const Conduct = ConductTemplate(options);
  const license = await getLicense(options);
  const gitignore = await axios.get(
    'https://raw.githubusercontent.com/github/gitignore/master/Node.gitignore',
    { responseType: 'text' }
  );
  const obj = {
    'README.md': README,
    'CODE_OF_CONDUCT.md': Conduct,
    LICENSE: license,
    '.gitignore': gitignore.data
  };
  return obj;
}

/**
 * Gets License Template
 * @param options The Options
 * @returns {Promise<string>} The license text
 */
async function getLicense(options: OPTIONS): Promise<string> {
  const licenses = await axios.get<GithubContents[]>(
    'https://api.github.com/repos/licenses/license-templates/contents/templates',
    { responseType: 'json' }
  );
  const license = licenses.data.find(
    (v) => v.name.split('.')[0].toLowerCase() === options.LICENSE.toLowerCase()
  );
  if (!license) {
    return '';
  }
  const response = await axios.get(license.download_url, { responseType: 'text' });
  const data = {
    year: new Date().getFullYear(),
    organization: options.AUTHOR,
    project: options.NAME
  };
  const text = response.data;
  const licenseTemplate = Handlebars.compile(text);
  return licenseTemplate(data);
}

export interface SCRIPTS {
  release: string;
  lint: string;
  'lint:fix': string;
  build: string;
  dev: string;
  start: string;
}
