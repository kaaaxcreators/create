Not maintained anymore. Very likely to still work
# @kaaaxcreators/create

[![Release CI](https://github.com/kaaaxcreators/create/actions/workflows/release.yml/badge.svg)](https://github.com/kaaaxcreators/create/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/@kaaaxcreators/create)](https://www.npmjs.com/package/@kaaaxcreators/create)
[![TypeScript](https://badgen.net/badge/TypeScript/strict%20💪/blue)](https://www.typescriptlang.org/)

## Basic Typescript ESLint Template

### 🚀 Usage

#### NPM

```bash
npm init @kaaaxcreators <project name> [-- args]
```

Example: `npm init @kaaaxcreators test -- -g -w`

⚠️ When using PowerShell: `npm init '@kaaaxcreators' <project name> [-- args]`

#### NPX

```bash
npx @kaaaxcreators/create <project name> [args]
```

Example: `npx @kaaaxcreators/create test -g -w`

### 📖 Options

| Parameter                        | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| -n, --name [name]                | Project name                                                  |
| -w, --web                        | Enable HTML Support (default: false)                          |
| -a, --author [author]            | Project Author (default: "Bernd Storath")                     |
| -d, --description [description]  | Project Description (default: "")                             |
| -v, --version [version]          | Project Version (default: "1.0.0")                            |
| -e, --email [email]              | Author Email (default: "bernd@kaaaxcreators.de")              |
| -l, --license [license]          | Project License (default: "MIT")                              |
| -g, --github                     | Add Github Files (default: false)                             |
| -m, --manager [manager]          | Project Manager (choices: "npm", "yarn", default: "yarn")     |
| -h, --help                       | display help for command                                      |

### 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
