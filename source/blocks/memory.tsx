import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import si from 'systeminformation';

import TitledBox from '../components/titled-box.js';
import {type ConfigType} from '../config.js';

function formatBytes(bytes: number) {
	if (bytes === 0) return '0B';
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

function MemoryBlock({
	config,
	theme,
	width,
}: {
	readonly config?: ConfigType['memory'];
	readonly theme?: ConfigType['theme'];
	readonly width?: string;
}) {
	const [mem, setMem] = useState<any>({
		total: 0,
		free: 0,
		used: 0,
		active: 0,
		available: 0,
		swaptotal: 0,
		swapused: 0,
	});

	useEffect(() => {
		const fetchData = async () => {
			const data = await si.mem();
			setMem(data);
		};

		fetchData();
		const timer = setInterval(fetchData, config?.refreshInterval || 2000);
		return () => {
			clearInterval(timer);
		};
	}, []);

	const total = mem.total || 1;
	const swapTotal = mem.swaptotal || 1;

	const usedPercent = (mem.active / total) * 100;
	const freePercent = (mem.available / total) * 100;
	const swapPercent = (mem.swapused / swapTotal) * 100;

	const barLength = Math.floor(usedPercent / 5);
	const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

	const freeBarLength = Math.floor(freePercent / 5);
	const freeBar = '█'.repeat(freeBarLength) + '░'.repeat(20 - freeBarLength);

	const swapBarLength = Math.floor(swapPercent / 5);
	const swapBar = '█'.repeat(swapBarLength) + '░'.repeat(20 - swapBarLength);

	return (
		<TitledBox borderStyle="single" titles={['Memory Usage']} width={width}>
			<Box marginLeft={1} marginRight={1} flexDirection="column">
				<Box flexDirection="row" gap={2}>
					<Box flexDirection="column">
						<Text bold>Free:</Text>
						<Text bold>Usage:</Text>
						<Text bold>Swap:</Text>
						<Text bold>Total:</Text>
					</Box>

					<Box flexDirection="column">
						<Box flexDirection="row">
							<Box width="15%">
								<Text
									color={
										freePercent > 80
											? theme?.error || 'red'
											: theme?.success || 'green'
									}
								>
									{freePercent.toFixed(0)}%
								</Text>
							</Box>
							<Box>
								<Text
									color={
										freePercent > 80
											? theme?.error || 'red'
											: theme?.success || 'green'
									}
								>
									{freeBar}
								</Text>
							</Box>
						</Box>

						<Box flexDirection="row">
							<Box width="15%">
								<Text
									color={
										usedPercent > 80
											? theme?.error || 'red'
											: theme?.success || 'green'
									}
								>
									{usedPercent.toFixed(0)}%
								</Text>
							</Box>
							<Box>
								<Text
									color={
										usedPercent > 80
											? theme?.error || 'red'
											: theme?.success || 'green'
									}
								>
									{bar}
								</Text>
							</Box>
						</Box>

						<Box flexDirection="row">
							<Box width="15%">
								<Text
									color={
										swapPercent > 50
											? theme?.warning || 'yellow'
											: theme?.success || 'green'
									}
								>
									{swapPercent.toFixed(0)}%
								</Text>
							</Box>
							<Box>
								<Text
									color={
										swapPercent > 50
											? theme?.warning || 'yellow'
											: theme?.success || 'green'
									}
								>
									{swapBar}
								</Text>
							</Box>
						</Box>
						<Text>{formatBytes(mem.total)}</Text>
					</Box>

					<Box flexDirection="column">
						<Text>{formatBytes(mem.available)}</Text>
						<Text>{formatBytes(mem.active)}</Text>
						<Text>{formatBytes(mem.swapused)}</Text>
					</Box>
				</Box>
			</Box>
		</TitledBox>
	);
}

export default MemoryBlock;
