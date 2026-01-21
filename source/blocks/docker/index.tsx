import React, {useEffect, useState, useRef} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import {ScrollView, type ScrollViewRef} from 'ink-scroll-view';

import axios from 'axios';
import TitledBox from '../../components/titled-box.js';
import {type ConfigType} from '../../config.js';
import {
	calculateCpuPercent,
	calculateMemoryUsage,
	calculateNetworkIO,
} from './helpers.js';

const dockerApi = axios.create({
	socketPath: '/var/run/docker.sock',
	baseURL: 'http://localhost/',
});

function DockerBlock({
	config,
	theme,
	width,
}: {
	readonly config?: ConfigType['docker'];
	readonly theme?: ConfigType['theme'];
	readonly width?: string;
}) {
	const scrollRef = useRef<ScrollViewRef>(null);
	const {stdout} = useStdout();

	const [containers, setContainers] = useState<any>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const handleResize = () => scrollRef.current?.remeasure();
		stdout?.on('resize', handleResize);
		return () => {
			stdout?.off('resize', handleResize);
		};
	}, [stdout]);

	const [isFocused, setIsFocused] = useState(false);

	useInput((input, key) => {
		if (input === 'd') {
			setIsFocused(previous => !previous);
		}

		if (isFocused) {
			if (key.upArrow) {
				scrollRef.current?.scrollBy(-1); // Scroll up 1 line
			}

			if (key.downArrow) {
				scrollRef.current?.scrollBy(1); // Scroll down 1 line
			}

			if (key.pageUp) {
				// Scroll up by viewport height
				const height = scrollRef.current?.getViewportHeight() || 1;
				scrollRef.current?.scrollBy(-height);
			}

			if (key.pageDown) {
				const height = scrollRef.current?.getViewportHeight() || 1;
				scrollRef.current?.scrollBy(height);
			}
		}
	});

	useEffect(() => {
		const fetchContainers = async () => {
			try {
				const {data} = await dockerApi.get('/containers/json?all=true');

				const sorted = data.sort((a: any, b: any) => {
					const isRunningA = a.State === 'running';
					const isRunningB = b.State === 'running';

					if (isRunningA && !isRunningB) return -1;
					if (!isRunningA && isRunningB) return 1;

					return a.Names[0].localeCompare(b.Names[0]);
				});

				const statsPromises = sorted.map(async (container: any) => {
					const {data: stats} = await dockerApi.get(
						`/containers/${container.Id}/stats?stream=false`,
					);

					return {
						name: container.Names[0].replace(/^\//, ''),
						id: container.Id.slice(0, 12),
						state: container.State,
						Image: container.Image,
						cpu: calculateCpuPercent(stats),
						memory: calculateMemoryUsage(stats),
						netIO: calculateNetworkIO(stats),
					};
				});

				const results = await Promise.all(statsPromises);

				setContainers(results);
				setLoading(false);
			} catch (error_: any) {
				if (error_.response) {
					setError(error_.response.data.message);
				} else {
					setError(error_.message);
				}

				setLoading(false);
			}
		};

		fetchContainers();

		const interval = setInterval(
			fetchContainers,
			config?.refreshInterval || 2000,
		);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<TitledBox
			borderStyle="single"
			titles={['Docker']}
			borderColor={isFocused ? theme?.secondary || 'cyan' : undefined}
			width={width}
		>
			<Box marginLeft={1} marginRight={1}>
				{loading ? (
					<Text color={theme?.warning || 'yellow'}>
						Loading Docker containers...
					</Text>
				) : error ? (
					<Text color={theme?.error || 'red'}>Error: {error}</Text>
				) : containers.length === 0 ? (
					<Text>No Docker containers found.</Text>
				) : (
					<Box flexDirection="column" gap={1}>
						<Box flexDirection="row">
							<Box width="34%">
								<Text bold underline>
									Name
								</Text>
							</Box>
							<Box width="12%">
								<Text bold underline>
									State
								</Text>
							</Box>
							<Box width="12%">
								<Text bold underline>
									CPU
								</Text>
							</Box>
							<Box width="12%">
								<Text bold underline>
									Mem
								</Text>
							</Box>
							<Box width="30%">
								<Text bold underline>
									Net I/O (RX/TX)
								</Text>
							</Box>
						</Box>
						<ScrollView ref={scrollRef} height={10}>
							{containers.map((container: any) => (
								<Box key={container.id} flexDirection="row" marginBottom={1}>
									<Box width="34%">
										<Text bold wrap="truncate-end">
											{container.name}
										</Text>
									</Box>
									<Box width="12%">
										<Text
											color={
												container.state === 'running'
													? theme?.success || 'green'
													: container.state === 'restarting'
													? theme?.warning || 'yellow'
													: theme?.error || 'red'
											}
										>
											{container.state}
										</Text>
									</Box>
									<Box width="12%">
										<Text>{container.cpu}</Text>
									</Box>
									<Box width="12%">
										<Text>{container.memory}</Text>
									</Box>
									<Box width="30%">
										<Text>{container.netIO}</Text>
									</Box>
								</Box>
							))}
						</ScrollView>
					</Box>
				)}
			</Box>
		</TitledBox>
	);
}

export default DockerBlock;
