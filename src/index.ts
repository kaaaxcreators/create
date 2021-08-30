#!/usr/bin/env node

import { Command, Option } from 'commander';
import ora from 'ora';

import { run } from './setup';

const program = new Command('@kaaaxcreators/create');

const PACKAGEJSON_NAME_REGEX = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

program
  .argument('<folder>', 'Folder to create')
  .option('-n, --name [name]', 'Project name')
  .option('-w, --web', 'Enable HTML Support', false)
  .option('-a, --author [author]', 'Project Author', 'Bernd Storath')
  .option('-d, --description [description]', 'Project Description', '')
  .option('-v, --version [version]', 'Project Version', '1.0.0')
  .option('-e, --email [email]', 'Author Email', 'bernd@kaaaxcreators.de')
  .option('-l, --license [license]', 'Project License', 'MIT')
  .option('-g, --github', 'Add Github Files', false)
  .addOption(
    new Option('-m, --manager [manager]', 'Project Manager')
      .choices(['npm', 'yarn'])
      .default('yarn')
  );

program.parse(process.argv);

const options = program.opts();

const folder = program.args[0];

const spinner = ora('Starting');
spinner.start();

const runOptions = {
  AUTHOR: options.author,
  EMAIL: options.email,
  LICENSE: options.license,
  DESCRIPTION: options.description,
  VERSION: options.version,
  NAME: options.name || folder,
  FOLDER: folder,
  WEB: options.web,
  MANAGER: options.manager,
  ORA: spinner,
  GITHUB: options.github
};

if (!PACKAGEJSON_NAME_REGEX.test(runOptions.NAME)) {
  spinner.text = `Name or Folder is not a valid Name String (No Uppercase, No Spaces, Regex: "${PACKAGEJSON_NAME_REGEX.toString()}")`;
  spinner.fail();
  process.exit(1);
}

run(runOptions)
  .then((v) => {
    if (typeof v === 'string') {
      spinner.text = v;
      spinner.fail();
      process.exit(1);
    } else if (v === true) {
      spinner.text = 'Done';
      spinner.succeed();
      process.exit(0);
    } else {
      spinner.text = 'Unknown Error';
      spinner.fail();
      process.exit(1);
    }
  })
  .catch((v) => {
    spinner.text = v.message;
    spinner.fail();
    process.exit(1);
  });
