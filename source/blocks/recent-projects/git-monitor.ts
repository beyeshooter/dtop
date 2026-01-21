import fs from 'node:fs';
import path from 'node:path';
import {exec} from 'node:child_process';
import util from 'node:util';

const execPromise = util.promisify(exec);

export type ProjectData = {
	name: string;
	path: string;
};

export function getProjectDetails(paths: string[]): ProjectData[] {
	return paths.map(p => ({
		name: path.basename(p), // Extracts 'node-file-watcher' from the full path
		path: p,
	}));
}

export const getRecentProjects = (projectsRoot: string): ProjectData[] => {
	try {
		const dirs = fs
			.readdirSync(projectsRoot)
			.filter(f => {
				const fullPath = path.join(projectsRoot, f);
				return fs.statSync(fullPath).isDirectory() && !f.startsWith('.');
			})
			.map(f => {
				const fullPath = path.join(projectsRoot, f);
				return {
					name: f,
					path: fullPath,
					mtime: fs.statSync(fullPath).mtime, // Last Modified Time
				};
			})
			.sort((a, b) => b.mtime.getTime() - a.mtime.getTime()) // Sort Newest -> Oldest
			.slice(0, 3); // Take top 3

		return dirs.map(({name, path}) => ({name, path}));
	} catch {
		return [];
	}
};

export type GitStatus = {
	isRepo: boolean;
	branch?: string;
	ahead: number;
	behind: number;
	changes: number;
};

export const getGitStatus = async (projectPath: string): Promise<GitStatus> => {
	try {
		// This command gets Branch info AND File status in one go
		// --porcelain=v2: Stable, parseable format
		// --branch: Includes branch name and ahead/behind counts
		const {stdout} = await execPromise('git status --porcelain=v2 --branch', {
			cwd: projectPath,
			timeout: 200,
		});

		const lines = stdout.split('\n');
		let branch: string | undefined = 'HEAD';
		let ahead = 0;
		let behind = 0;
		let changes = 0;

		for (const line of lines) {
			// Parse Branch Info
			if (line.startsWith('# branch.head')) branch = line.split(' ')[2];
			if (line.startsWith('# branch.ab')) {
				// Format: # branch.ab +Ahead -Behind
				const parts = line.split(' ');
				ahead = Number.parseInt(parts[2]?.replace('+', '') || '0') || 0;
				behind = Number.parseInt(parts[3]?.replace('-', '') || '0') || 0;
			}

			// Count Changes (Modified, Added, Deleted, Untracked)
			if (/^[12?]/.test(line)) changes++;
		}

		return {isRepo: true, branch, ahead, behind, changes};
	} catch {
		// Not a git repo or error
		return {isRepo: false, branch: '-', ahead: 0, behind: 0, changes: 0};
	}
};
