import axios from 'axios';
import execa from 'execa';
import { constants } from 'fs';
import { access, mkdir, writeFile } from 'fs/promises';
import { Ora } from 'ora';
import { join } from 'path';

import * as DEFAULTS from './defaults';
import { GithubContents } from './types';

/**
 * Check if a Directory exists
 * @param dir The Directory to check
 * @returns {Promise<boolean>} True if the directory exists
 */
async function dirExists(dir: string): Promise<boolean> {
  try {
    await access(dir, constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Create Directory if it doesn't exist
 * @param options The Options
 * @returns {Promise<boolean>} True if new directory created
 */
export async function createDir(options: OPTIONS): Promise<boolean> {
  try {
    if (await dirExists(options.FOLDER)) {
      return false;
    }
    await mkdir(options.FOLDER);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Add Stylint, ESLint, Prettier, TypeScript, VSCode Files to Directory
 * @param options The Options
 * @returns {Promise<boolean>} True if succeeded
 */
export async function setupDir(options: OPTIONS): Promise<boolean> {
  try {
    if (options.WEB) {
      await writeFile(
        join(options.FOLDER, '.stylelintrc.js'),
        'module.exports = ' + JSON.stringify(DEFAULTS.STYLELINT, null, 2) + ';\n'
      );
    }
    await writeFile(
      join(options.FOLDER, '.eslintrc.js'),
      'module.exports = ' +
        JSON.stringify(options.WEB ? DEFAULTS.ESLINT_WEB() : DEFAULTS.ESLINT_DEFAULT, null, 2) +
        ';\n'
    );
    await writeFile(
      join(options.FOLDER, '.prettierrc'),
      JSON.stringify(DEFAULTS.PRETTIER, null, 2)
    );
    await writeFile(join(options.FOLDER, 'release.config.js'), DEFAULTS.RELEASE);
    await mkdir(join(options.FOLDER, 'src'));
    await writeFile(join(options.FOLDER, 'src', 'index.ts'), '');
    const gitginore = await axios.get(
      'https://raw.githubusercontent.com/github/gitignore/master/Node.gitignore',
      { responseType: 'text' }
    );
    await writeFile(join(options.FOLDER, '.gitignore'), gitginore.data);
    await mkdir(join(options.FOLDER, '.vscode'));
    await writeFile(
      join(options.FOLDER, '.vscode', 'settings.json'),
      JSON.stringify(DEFAULTS.VSCODE_SETTINGS, null, 2)
    );
    await writeFile(
      join(options.FOLDER, '.vscode', 'launch.json'),
      JSON.stringify(DEFAULTS.VSCODE_LAUNCH, null, 2)
    );
    await writeFile(
      join(options.FOLDER, '.vscode', 'extensions.json'),
      JSON.stringify(
        options.WEB ? DEFAULTS.VSCODE_EXTENSIONS_WEB() : DEFAULTS.VSCODE_EXTENSIONS,
        null,
        2
      )
    );
    await writeFile(
      join(options.FOLDER, 'README.md'),
      DEFAULTS.README(options.NAME, options.DESCRIPTION, options.LICENSE)
    );
    const licenses = await axios.get<GithubContents[]>(
      'https://api.github.com/repos/licenses/license-templates/contents/templates',
      { responseType: 'json' }
    );
    const license = licenses.data.find(
      (v) => v.name.split('.')[0].toLowerCase() === options.LICENSE.toLowerCase()
    );
    if (license) {
      const response = await axios.get(license.download_url, { responseType: 'text' });
      const text = response.data
        .replace('{{ year }}', new Date().getFullYear())
        .replace('{{ organization }}', options.AUTHOR)
        .replace('{{ project }}', options.NAME);
      await writeFile(join(options.FOLDER, 'LICENSE'), text);
    }
    await execa('git', ['init'], { reject: false, cwd: options.FOLDER });
    await writeFile(
      join(options.FOLDER, 'tsconfig.json'),
      JSON.stringify(DEFAULTS.TSCONFIG, null, 2)
    );
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

/**
 * Generates Basic Package.json
 * @param options The Options
 * @returns {PACKAGEJSON} The Package.json as Object
 */
function generatePackageJSON(options: OPTIONS): PACKAGEJSON {
  const JSON: PACKAGEJSON = {
    name: options.NAME,
    version: options.VERSION,
    description: options.DESCRIPTION,
    main: 'src/index.ts',
    author: options.AUTHOR,
    license: options.LICENSE,
    repository: {
      url: 'git+https://github.com/<user>/<repo>.git',
      type: 'git'
    },
    homepage: 'https://github.com/<user>/<repo>#readme',
    bugs: {
      url: 'https://github.com/<user>/<repo>/issues'
    },
    funding: {
      type: 'individual',
      url: 'https://www.buymeacoffee.com/kaaaxcreators'
    },
    files: ['dist'],
    scripts: DEFAULTS.DEFAULT.scripts,
    dependencies: {},
    devDependencies: {}
  };
  if (options.AUTHOR) {
    JSON.author += ` <${options.EMAIL}>`;
  }
  if (options.WEB) {
    for (const script in DEFAULTS.WEB.scripts) {
      JSON.scripts[script as keyof DEFAULTS.SCRIPTS]! +=
        ' && ' + DEFAULTS.WEB.scripts[script as keyof DEFAULTS.SCRIPTS];
    }
  }
  return JSON;
}

/**
 * Create Package.json
 * @param options The Options
 * @returns {Promise<boolean>} True if Package.json created
 */
export async function writePackageJSON(options: OPTIONS): Promise<boolean> {
  try {
    const packagejson = generatePackageJSON(options);
    await writeFile(join(options.FOLDER, 'package.json'), JSON.stringify(packagejson, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 *
 * @param options The Options
 * @returns {string} List of Packages to install
 */
export function generateDeps(options: OPTIONS): string[] {
  const depsString = DEFAULTS.DEFAULT.packages;
  if (options.WEB) {
    depsString.push(...DEFAULTS.WEB.packages);
  }
  return depsString;
}

/**
 * Install all Dependencies
 * @param options The Options
 * @returns {Promise<boolean>} True if dependencies installed
 */
export async function installPackages(options: OPTIONS): Promise<boolean> {
  try {
    const packages = generateDeps(options);
    const result = await execa(
      options.MANAGER,
      [options.MANAGER === 'yarn' ? 'add' : 'install', ...packages, '-D'],
      { cwd: options.FOLDER }
    );
    if (result.exitCode !== 0) {
      throw result;
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/**
 * Create a new Project
 * @param options The Options
 * @returns {Promise<true | string>} String is the error message
 */
export async function run(options: OPTIONS): Promise<true | string> {
  options.ORA.text = 'Creating Directory';
  const ifDir = await createDir(options);
  if (!ifDir) {
    return "Directory couldn't be created or already exists";
  }
  options.ORA.text = 'Setting up Directory';
  const isSetup = await setupDir(options);
  if (!isSetup) {
    return 'Could not setup directory';
  }
  options.ORA.text = 'Writing Package JSON';
  const ifPackageJSON = await writePackageJSON(options);
  if (!ifPackageJSON) {
    return "Package.json couldn't be created";
  }
  options.ORA.text = 'Installing Packages';
  const isInstalled = await installPackages(options);
  if (!isInstalled) {
    return "Packages couldn't be installed";
  }
  return true;
}

export interface PACKAGEJSON {
  name: string;
  version: string;
  description: string;
  private?: boolean;
  main?: string;
  author: string;
  license: string;
  repository?: { url: string; type: string };
  homepage?: string;
  bugs?: { url: string };
  engines?: { node: string };
  funding?: { type: string; url: string };
  files?: string[];
  scripts: Partial<DEFAULTS.SCRIPTS>;
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
}

export interface OPTIONS {
  WEB: boolean;
  NAME: string;
  DESCRIPTION: string;
  VERSION: string;
  AUTHOR: string;
  EMAIL: string;
  LICENSE: string;
  MANAGER: 'yarn' | 'npm';
  FOLDER: string;
  ORA: Ora;
}
