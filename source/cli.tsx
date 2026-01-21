#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import React from 'react';
import meow from 'meow';
import {render} from 'ink';
import Dashboard from './app.js';

const cli = meow(
	`
	Usage
	  $ dtop [command]

	Commands
	  init    Generate a default config.yml in ~/.config/dtop/

	Examples
	  $ dtop
	  $ dtop init
`,
	{
		importMeta: import.meta,
	},
);

if (cli.input[0] === 'init') {
	const defaultConfig = `statusBar:
  refreshInterval: 4000
  location:
    enabled: false
  date:
    enabled: true
  time:
    enabled: true
    format: 'HH:mm:ss'
  wifi:
    enabled: true
  battery:
    enabled: true
  node:
    enabled: true
  python3:
    enabled: true
  git:
    enabled: true
cpu:
  refreshInterval: 2000
memory:
  refreshInterval: 2000
disks:
  refreshInterval: 4000
network:
  refreshInterval: 5000
  public_ip:
    refreshInterval: 300000
portScanner:
  refreshInterval: 3000
  list:
    - name: Mysql
      port: 3306
    - name: Postgres
      port: 5432
    - name: Redis
      port: 6379
    - name: Mongo
      port: 27017
services:
  refreshInterval: 5000
  list:
    - name: google
      host: 8.8.8.8
    - name: cloudflare
      host: 1.1.1.1
    - name: gitlab
      host: gitlab.com
    - name: backend
      host: http://127.0.1.1:3000/
projects:
  refreshInterval: 5000
  list:
    - /your/path/to/project
proccesses:
  refreshInterval: 4000
docker:
  refreshInterval: 4000
theme:
  primary: blue
  secondary: cyan
  success: green
  warning: yellow
  error: red
  text: white
`;

	const configDir = path.join(os.homedir(), '.config', 'dtop');
	const configPath = path.join(configDir, 'config.yml');

	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, {recursive: true});
	}

	if (fs.existsSync(configPath)) {
		console.error(`Config file already exists at ${configPath}`);
		process.exit(1);
	}

	fs.writeFileSync(configPath, defaultConfig);
	console.log(`Config file generated at ${configPath}`);
	process.exit(0);
}

// 1. Define codes outside
const ENTER_ALT = '\u001B[?1049h';
const LEAVE_ALT = '\u001B[?1049l';
const HIDE_CURSOR = '\u001B[?25l';
const SHOW_CURSOR = '\u001B[?25h';

// 2. Switch screens SYNCHRONOUSLY before React starts
process.stdout.write(ENTER_ALT + HIDE_CURSOR);

// 4. Start Ink
const {waitUntilExit} = render(<Dashboard />);

// 5. Safety net: ensure terminal restores if the app crashes
waitUntilExit()
	.then(() => {
		process.stdout.write(LEAVE_ALT + SHOW_CURSOR);
	})
	.catch(() => {
		process.stdout.write(LEAVE_ALT + SHOW_CURSOR);
	});
