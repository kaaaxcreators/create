export const DEFAULT: CONFIG<true> = {
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
    dev: 'ts-node src/index.ts'
  }
};

export const WEB: CONFIG<false> = {
  packages: ['stylelint', 'stylelint-config-standard', 'eslint-plugin-html'],
  scripts: {
    lint: 'stylelint **/*.{css,html} --ignore-path ./.gitignore',
    'lint:fix': 'stylelint **/*.{css,html} --ignore-path ./.gitignore --fix'
  }
};

export const ESLINT_DEFAULT = {
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

export function ESLINT_WEB(): typeof ESLINT_DEFAULT {
  const copy = ESLINT_DEFAULT;
  copy.plugins.push('html');
  copy.env['browser'] = true;
  return copy;
}

export const STYLELINT = {
  extends: ['stylelint-config-standard'],
  rules: {
    'no-descending-specificity': null
  }
};

export const PRETTIER = {
  semi: true,
  tabWidth: 2,
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'none'
};

export const RELEASE =
  "// eslint-disable-next-line @typescript-eslint/no-var-requires\nmodule.exports = require('@kaaaxcreators/config').releaseMain;\n";

export const VSCODE_SETTINGS = {
  'files.eol': '\n',
  'editor.tabSize': 2,
  'editor.useTabStops': false,
  'editor.codeActionsOnSave': {
    'source.fixAll.eslint': true
  }
};

export const VSCODE_LAUNCH = {
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

export const VSCODE_EXTENSIONS = {
  recommendations: [
    'dbaeumer.vscode-eslint',
    'coenraads.bracket-pair-colorizer-2',
    'visualstudioexptteam.vscodeintellicode',
    'davidanson.vscode - markdownlint',
    'esbenp.prettier-vscode'
  ]
};

export function VSCODE_EXTENSIONS_WEB(): typeof VSCODE_EXTENSIONS {
  const copy = VSCODE_EXTENSIONS;
  copy.recommendations.push('stylelint.vscode-stylelint');
  return copy;
}

export function README(name: string): string {
  const MARKDOWN = `# ${name}\n`;
  return MARKDOWN;
}

export const TSCONFIG = {
  compilerOptions: {
    target: 'es5',
    module: 'commonjs',
    lib: ['ESNext'],
    outDir: './dist',
    rootDir: './src',
    downlevelIteration: true,
    strict: true,
    moduleResolution: 'node',
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  }
};

export interface CONFIG<T extends boolean> {
  packages: string[];
  scripts: T extends false ? Partial<SCRIPTS> : T extends true ? SCRIPTS : never;
}

export interface SCRIPTS {
  release: string;
  lint: string;
  'lint:fix': string;
  build: string;
  dev: string;
}
