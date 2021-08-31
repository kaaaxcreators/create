import execa from 'execa';
import { constants } from 'fs';
import { access, mkdir, writeFile } from 'fs/promises';
import { Ora } from 'ora';
import { join } from 'path';

import { CONFIG, ESLINT, LicenseGitignore, SCRIPTS, TEMPLATES, VSCODE } from './templates';

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

async function recursiveSetupDir(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  a: Record<string, any>,
  options: OPTIONS,
  depth: string[] = []
): Promise<boolean> {
  for (const level in a) {
    if (typeof a[level] === 'string') {
      await writeFile(join(options.FOLDER, ...depth, level), a[level]);
    } else if (typeof a[level] === 'object') {
      await mkdir(join(options.FOLDER, ...depth, level));
      await recursiveSetupDir(a[level], options, [...depth, level]);
    }
  }
  return true;
}

/**
 * Add Stylint, ESLint, Prettier, TypeScript, VSCode Files to Directory
 * @param options The Options
 * @returns {Promise<boolean>} True if succeeded
 */
export async function setupDir(options: OPTIONS): Promise<boolean> {
  try {
    // ESLint
    await writeFile(
      join(options.FOLDER, '.eslintrc.json'),
      JSON.stringify(ESLINT(options.WEB), null, 2)
    );

    // .vscode
    await recursiveSetupDir(VSCODE(options.WEB), options);

    // templates
    await recursiveSetupDir(await TEMPLATES(options), options);

    // LICENSE and .gitignore
    await recursiveSetupDir(await LicenseGitignore(options), options);

    // Git
    await execa('git', ['init'], { reject: false, cwd: options.FOLDER });

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
  const config = CONFIG(options.WEB);
  const JSON: PACKAGEJSON = {
    name: options.NAME,
    version: options.VERSION,
    description: options.DESCRIPTION,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    author: options.AUTHOR + ` <${options.EMAIL}>`,
    license: options.LICENSE,
    scripts: config.scripts,
    dependencies: {},
    devDependencies: {},
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
    publishConfig: { access: 'public' }
  };
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
  const depsString = CONFIG(options.WEB).packages;
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
  return true;
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
  types?: string;
  author: string;
  license: string;
  repository?: { url: string; type: string };
  homepage?: string;
  bugs?: { url: string };
  engines?: { node: string };
  funding?: { type: string; url: string };
  files?: string[];
  publishConfig?: { access?: string };
  scripts: SCRIPTS;
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
  GITHUB: boolean;
}
