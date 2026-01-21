import React, {useEffect, useState, useRef} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import {ScrollView, type ScrollViewRef} from 'ink-scroll-view';
import TitledBox from '../../components/titled-box.js';

import {type ConfigType} from '../../config.js';
import {
	getGitStatus,
	type ProjectData,
	type GitStatus,
	getProjectDetails,
	getRecentProjects,
} from './git-monitor.js';

type Project = {
	git: GitStatus;
} & ProjectData;

function RecentProjects({
	config,
	theme,
	width,
}: {
	readonly config?: ConfigType['projects'];
	readonly theme?: ConfigType['theme'];
	readonly width?: string;
}) {
	const scrollRef = useRef<ScrollViewRef>(null);
	const {stdout} = useStdout();
	const [isFocused, setIsFocused] = useState(false);

	const [projects, setProjects] = useState<Project[]>([]);
	const [dirs, setDirs] = useState<ProjectData[]>([]);
	const isFetching = useRef(false);
	const projectsCache = useRef<Map<string, Project>>(new Map());

	useEffect(() => {
		const handleResize = () => {
			scrollRef.current?.remeasure();
		};

		stdout?.on('resize', handleResize);
		return () => {
			stdout?.off('resize', handleResize);
		};
	}, [stdout]);

	useInput((input, key) => {
		if (input === 'r') {
			setIsFocused(previous => !previous);
		}

		if (isFocused) {
			if (key.upArrow) {
				scrollRef.current?.scrollBy(-1);
			}

			if (key.downArrow) {
				scrollRef.current?.scrollBy(1);
			}

			if (key.pageUp) {
				const height = scrollRef.current?.getViewportHeight() || 1;
				scrollRef.current?.scrollBy(-height);
			}

			if (key.pageDown) {
				const height = scrollRef.current?.getViewportHeight() || 1;
				scrollRef.current?.scrollBy(height);
			}
		}
	});

	// 1. Discovery Phase: Get list of directories once
	// This prevents heavy FS scanning on every tick which causes IO contention
	useEffect(() => {
		try {
			let foundDirs: ProjectData[] = [];
			foundDirs =
				config?.list && config.list.length > 0
					? getProjectDetails(config.list)
					: getRecentProjects('/Users/soufianeboukdir/Projects');
			setDirs(foundDirs);
		} catch {}
	}, [config]);

	// 2. Monitoring Phase: Check git status for discovered directories
	useEffect(() => {
		if (dirs.length === 0) return;

		let isMounted = true;
		const fetchData = async () => {
			if (isFetching.current) return;
			isFetching.current = true;

			try {
				const data: Project[] = [];
				for (const dir of dirs) {
					if (!isMounted) break;
					try {
						const git = await getGitStatus(dir.path);
						if (git.isRepo) {
							const project = {...dir, git};
							data.push(project);
							projectsCache.current.set(dir.path, project);
						} else {
							projectsCache.current.delete(dir.path);
						}

						// Increased delay to reduce IO contention
						await new Promise(resolve => setTimeout(resolve, 100));
					} catch {
						const cached = projectsCache.current.get(dir.path);
						if (cached) data.push(cached);
					}
				}

				if (isMounted) setProjects(data);
			} finally {
				isFetching.current = false;
			}
		};

		fetchData();

		const interval = setInterval(fetchData, config?.refreshInterval || 10_000);
		return () => {
			isMounted = false;
			clearInterval(interval);
		};
	}, [dirs, config?.refreshInterval]);

	return (
		<TitledBox
			borderStyle="single"
			titles={['Git Projects']}
			borderColor={isFocused ? theme?.secondary || 'cyan' : undefined}
			width={width}
		>
			<Box marginLeft={1} marginRight={1} flexDirection="column">
				{projects.length > 0 ? (
					<Box flexDirection="column" gap={0}>
						<Box flexDirection="row" marginBottom={1}>
							<Box width="35%">
								<Text bold underline>
									Project
								</Text>
							</Box>
							<Box width="40%">
								<Text bold underline>
									Branch
								</Text>
							</Box>
							<Box width="25%">
								<Text bold underline>
									Status
								</Text>
							</Box>
						</Box>
						<ScrollView ref={scrollRef} height={6}>
							{projects.map((p, i) => (
								<Box key={i} flexDirection="row" marginBottom={1} columnGap={1}>
									<Box width="35%">
										<Text
											bold
											color={theme?.text || 'white'}
											wrap="truncate-end"
										>
											{p.name}
										</Text>
									</Box>
									<Box width="40%">
										{p.git && (
											<Text
												color={theme?.secondary || 'cyan'}
												wrap="truncate-end"
											>
												 {p.git.branch}
											</Text>
										)}
									</Box>
									<Box width="25%" flexDirection="row">
										{p.git && (
											<>
												{p.git.behind > 0 && (
													<Text color={theme?.error || 'red'}>
														↓{p.git.behind}{' '}
													</Text>
												)}
												{p.git.ahead > 0 && (
													<Text color={theme?.success || 'green'}>
														↑{p.git.ahead}{' '}
													</Text>
												)}
												{p.git.changes > 0 && (
													<Text color={theme?.warning || 'yellow'}>
														● {p.git.changes}{' '}
													</Text>
												)}
												{p.git.behind === 0 &&
													p.git.ahead === 0 &&
													p.git.changes === 0 && (
														<Text color={theme?.success || 'green'}>
															✔ Clean
														</Text>
													)}
											</>
										)}
									</Box>
								</Box>
							))}
						</ScrollView>
					</Box>
				) : (
					<Box>
						<Text>No projects found.</Text>
					</Box>
				)}
			</Box>
		</TitledBox>
	);
}

export default RecentProjects;
