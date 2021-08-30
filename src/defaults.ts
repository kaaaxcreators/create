import MDParse from 'json2md';
import YAML from 'yaml';

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

export function ESLINT(web: boolean): ESLINT_RETURN {
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

export interface ESLINT_RETURN {
  root: boolean;
  parser: string;
  parserOptions: {
    ecmaVersion: number;
    sourceType: string;
  };
  env: Record<string, true>;
  plugins: string[];
  extends: string[];
  rules: {
    'prettier/prettier': (
      | string
      // eslint-disable-next-line @typescript-eslint/ban-types
      | {}
      | {
          usePrettierrc: boolean;
        }
    )[];
    'simple-import-sort/imports': string;
    '@typescript-eslint/no-non-null-assertion': string;
    curly: string;
  };
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

export function VSCODE(web: boolean): VSCODE_RETURN {
  const obj = {
    '.vscode': {
      'launch.json': JSON.stringify(VSCODE_LAUNCH, null, 2),
      'extensions.json': JSON.stringify(VSCODE_EXTENSIONS(web), null, 2),
      'settings.json': JSON.stringify(VSCODE_SETTINGS, null, 2)
    }
  };
  return obj;
}

export interface VSCODE_RETURN {
  '.vscode': {
    'launch.json': string;
    'extensions.json': string;
    'settings.json': string;
  };
}

function GITHUB_WORKFLOWS_LINT(manager: 'yarn' | 'npm') {
  const obj = {
    name: 'Lint',
    'runs-on': 'ubuntu-latest',
    if: "!contains(github.event.head_commit.message, '[skip ci]')",
    steps: [
      { name: 'Checkout', uses: 'actions/checkout@v2' },
      {
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v2',
        with: { 'node-version': 14 }
      },
      {
        name: 'Cache node modules',
        uses: 'c-hive/gha-yarn-cache@v2.1.0'
      },
      { name: 'Install dependencies', run: 'yarn install' },
      { name: 'Run lint command', run: 'yarn lint' }
    ]
  };
  if (manager === 'npm') {
    obj.steps[2].uses = 'c-hive/gha-npm-cache@v1';
    obj.steps[3].run = 'npm ci';
    obj.steps[4].run = 'npm run lint';
  }
  return obj;
}

/**
 * Returns Github Workflows either for YARN or NPM.
 */
function GITHUB_WORKFLOWS(manager: 'yarn' | 'npm') {
  const lint = GITHUB_WORKFLOWS_LINT(manager);
  const obj = {
    release: {
      name: 'Release CI',
      on: { push: { branches: ['main'] } },
      jobs: {
        lint: lint,
        release: {
          needs: ['lint'],
          name: 'Build and release',
          'runs-on': 'ubuntu-latest',
          if: "!contains(github.event.head_commit.message, '[skip ci]')",
          steps: [
            { name: 'Checkout', uses: 'actions/checkout@v2' },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v2',
              with: { 'node-version': 14 }
            },
            { name: 'Install dependencies', run: 'yarn install' },
            { name: 'Build TypeScript', run: 'yarn build' },
            {
              name: 'Release',
              run: 'yarn release',
              env: {
                GITHUB_TOKEN: '${{ secrets.GH_PAT }}',
                NPM_TOKEN: '${{ secrets.NPM_TOKEN }}',
                GIT_AUTHOR_NAME: 'kaaaxcreatorsBOT',
                GIT_AUTHOR_EMAIL: 'bernd@kaaaxcreators.de',
                GIT_COMMITTER_NAME: 'kaaaxcreatorsBOT',
                GIT_COMMITTER_EMAIL: 'bernd@kaaaxcreators.de'
              }
            }
          ]
        }
      }
    },
    ci: {
      name: 'CI',
      on: ['push', 'pull_request'],
      jobs: {
        lint: lint,
        test: {
          name: 'Test',
          needs: ['lint'],
          'runs-on': 'ubuntu-latest',
          if: "!contains(github.event.head_commit.message, '[skip ci]')",
          steps: [
            { name: 'Checkout', uses: 'actions/checkout@v2' },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v2',
              with: { 'node-version': 14 }
            },
            {
              name: 'Cache node modules',
              uses: 'c-hive/gha-yarn-cache@v2.1.0'
            },
            { name: 'Install dependencies', run: 'yarn install' },
            { name: 'Run build command', run: 'yarn build' }
          ]
        }
      }
    },
    dependabot: {
      name: 'Dependabot PR CI',
      on: { schedule: [{ cron: '0 */6 * * *' }], workflow_dispatch: null },
      jobs: {
        'auto-merge': {
          name: 'Auto Merge',
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Merge minor/patch updates',
              uses: 'koj-co/dependabot-pr-action@master',
              with: {
                token: '${{ secrets.GH_PAT }}',
                'merge-minor': true,
                'merge-patch': true
              }
            }
          ]
        }
      }
    }
  };
  if (manager === 'npm') {
    // release steps yarn to npm
    obj.release.jobs.release.steps[2].run = 'npm ci';
    obj.release.jobs.release.steps[3].run = 'npm run build';
    obj.release.jobs.release.steps[4].run = 'npm run release';
    // ci steps yarn to npm
    obj.ci.jobs.test.steps[2].uses = 'c-hive/gha-npm-cache@v1';
    obj.ci.jobs.test.steps[3].run = 'npm ci';
    obj.ci.jobs.test.steps[4].run = 'npm run build';
  }
  return obj;
}

MDParse.converters.betterOL = (input: string[]) => {
  const listed = input.map((v, i) => `\n${i + 1}. ${v}`);
  return listed.join('');
};
MDParse.converters.betterUL = (input: string[]) => {
  const listed = input.map((v) => `\n- ${v}`);
  return listed.join('');
};

MDParse.converters.bold = (input: string) => `**${input}**`;

MDParse.converters.header = (input: Omit<HEADER, 2>) =>
  `${MDParse.converters.bold(input[0], MDParse)}\n${input[1]}`;

MDParse.converters.headerWithOL = (input: HEADER) =>
  `${MDParse.converters.bold(input[0], MDParse)}\n${input[1]}\n${MDParse.converters.betterOL(
    input[2],
    MDParse
  )}`;

MDParse.converters.headerWithUL = (input: Omit<HEADER, 1>) =>
  `${MDParse.converters.bold(input[0], MDParse)}\n${MDParse.converters.betterUL(
    input[2],
    MDParse
  )}`;

interface HEADER {
  /** Text to be bold */
  0: string;
  /** text to be below */
  1: string;
  /** UL or OL */
  2: string[];
}

export const GITHUB_ISSUE_TEMPLATES = {
  bug: {
    header: {
      name: 'Bug report',
      about: 'Create a report to help us improve',
      title: '',
      labels: 'bug',
      assignees: ''
    },
    body: [
      { header: ['Describe the bug', 'A clear and concise description of what the bug is.'] },
      {
        headerWithOL: [
          'To Reproduce',
          'Steps to reproduce the behavior:',
          ["Go to '...'", "Click on '....'", "Scroll down to '....'", 'See error']
        ]
      },
      {
        header: [
          'Expected behavior',
          'A clear and concise description of what you expected to happen.'
        ]
      },
      { header: ['Screenshots', 'If applicable, add screenshots to help explain your problem.'] },
      {
        headerWithUL: [
          'Details (please complete the following information):',
          undefined,
          ['Node Version: [e.g. latest, v16.6.0]', 'OS [e.g. ubuntu 20.04, windows 10]']
        ]
      },
      { header: ['Additional context', 'Add any other context about the problem here.'] }
    ]
  },
  feature: {
    header: {
      name: 'Feature request',
      about: 'Suggest an idea for this project',
      title: '',
      labels: 'enhancement',
      assignees: ''
    },
    body: [
      {
        header: [
          'Is your feature request related to a problem? Please describe.',
          "A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]"
        ]
      },
      {
        header: [
          "Describe the solution you'd like",
          'A clear and concise description of what you want to happen.'
        ]
      },
      {
        header: [
          "Describe alternatives you've considered",
          "A clear and concise description of any alternative solutions or features you've considered."
        ]
      },
      {
        header: [
          'Additional context',
          'Add any other context or screenshots about the feature request here.'
        ]
      }
    ]
  },
  createHeader: (content: string): string => `---\n${content}\n---\n\n`
};

export function GITHUB(manager: 'yarn' | 'npm'): GITHUB_RETURN {
  return {
    '.github': {
      'dependabot.yml': YAML.stringify({
        version: 2,
        updates: [
          { 'package-ecosystem': 'npm', directory: '/', schedule: { interval: 'daily' } },
          { 'package-ecosystem': 'github-actions', directory: '/', schedule: { interval: 'daily' } }
        ]
      }),
      'FUNDING.yml': YAML.stringify({ custom: 'https://www.buymeacoffee.com/kaaaxcreators' }),
      ISSUE_TEMPLATE: {
        'bug_report.md':
          GITHUB_ISSUE_TEMPLATES.createHeader(YAML.stringify(GITHUB_ISSUE_TEMPLATES.bug.header)) +
          MDParse(GITHUB_ISSUE_TEMPLATES.bug.body, ''),
        'feature_request.md':
          GITHUB_ISSUE_TEMPLATES.createHeader(
            YAML.stringify(GITHUB_ISSUE_TEMPLATES.feature.header)
          ) + MDParse(GITHUB_ISSUE_TEMPLATES.feature.body)
      },
      workflows: {
        'ci.yml': YAML.stringify(GITHUB_WORKFLOWS(manager).ci),
        'dependabot.yml': YAML.stringify(GITHUB_WORKFLOWS(manager).dependabot),
        'release.yml': YAML.stringify(GITHUB_WORKFLOWS(manager).release)
      }
    }
  };
}

export interface GITHUB_RETURN {
  '.github': {
    'dependabot.yml': string;
    'FUNDING.yml': string;
    ISSUE_TEMPLATE: {
      'bug_report.md': string;
      'feature_request.md': string;
    };
    workflows: {
      'ci.yml': string;
      'dependabot.yml': string;
      'release.yml': string;
    };
  };
}

export function README(name: string, description: string, license: string): string {
  const MARKDOWN = `# ${name}\n\n## ${description}\n\n### 📜 License\n\nThis project is licensed under the ${license} License - see the [LICENSE](LICENSE) file for details.\n`;
  return MARKDOWN;
}

export const TSCONFIG = {
  compilerOptions: {
    target: 'es5',
    module: 'commonjs',
    lib: ['ESNext'],
    declaration: true,
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

export interface SCRIPTS {
  release: string;
  lint: string;
  'lint:fix': string;
  build: string;
  dev: string;
  start: string;
}
