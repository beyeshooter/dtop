import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';

export type ThemeType = {
	primary: string;
	secondary: string;
	success: string;
	warning: string;
	error: string;
	text: string;
	border?: string;
};

export type ConfigType = {
	statusBar: {
		refreshInterval: number;
		location: {
			enabled: boolean;
		};
		date: {
			enabled: boolean;
			format: string;
		};
		time: {
			enabled: boolean;
			format: string;
		};
		wifi: {
			enabled: boolean;
		};
		battery: {
			enabled: boolean;
		};
		node: {
			enabled: boolean;
		};
		python3: {
			enabled: boolean;
		};
		git: {
			enabled: boolean;
		};
	};
	cpu: {
		refreshInterval: number;
	};
	memory: {
		refreshInterval: number;
	};
	disks: {
		refreshInterval: number;
	};
	network: {
		refreshInterval: number;
		public_ip: {
			refreshInterval: number;
		};
	};
	portScanner: {
		refreshInterval: number;
		list: Array<{
			name: string;
			port: number;
		}>;
	};
	services: {
		refreshInterval: number; // In seconds
		list: Array<{
			name: string;
			host: string;
		}>;
	};
	projects: {
		refreshInterval: number;
		list: string[];
	};
	docker: {
		refreshInterval: number;
	};
	processes: {
		refreshInterval: number;
	};
	theme?: ThemeType;
};

function loadConfig(): ConfigType | undefined {
	const configLocations = [
		path.join(os.homedir(), '.config', 'dtop', 'config.yml'),
	];

	for (const configPath of configLocations) {
		if (fs.existsSync(configPath)) {
			try {
				const fileContents = fs.readFileSync(configPath, 'utf8');
				const data = yaml.load(fileContents) as ConfigType;

				// Apply default theme if not present
				if (!data.theme) {
					data.theme = {
						primary: 'blue',
						secondary: 'cyan',
						success: 'green',
						warning: 'yellow',
						error: 'red',
						text: 'white',
					};
				}

				return data;
			} catch (error) {
				console.error(`Error loading config from ${configPath}:`, error);
			}
		}
	}

	return undefined;
}

export const config = loadConfig();
