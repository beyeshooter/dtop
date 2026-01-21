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

function DisksBlock({
	config,
	theme,
	width,
}: {
	readonly config?: ConfigType['disks'];
	readonly theme?: ConfigType['theme'];
	readonly width?: string;
}) {
	const [stats, setStats] = useState({
		total: 0,
		used: 0,
		free: 0,
		rx: 0,
		wx: 0,
	});

	useEffect(() => {
		const fetchData = async () => {
			const fsSize = await si.fsSize();
			const fsStats = await si.fsStats();

			let total = 0;
			let used = 0;

			const rootDrive = fsSize.find(d => d.mount === '/');
			if (rootDrive) {
				// On some OSes (like macOS with APFS), `used` on the root volume
				// doesn't reflect the total used space on the disk.
				// Calculating used space as `size - available` gives a more
				// accurate representation of what a user would consider "used".
				total = rootDrive.size;
				used = rootDrive.size - rootDrive.available;
			} else {
				for (const drive of fsSize) {
					total += drive.size;
					used += drive.used;
				}
			}

			setStats({
				total,
				used,
				free: total - used,
				rx: fsStats.rx_sec || 0,
				wx: fsStats.wx_sec || 0,
			});
		};

		fetchData();
		const timer = setInterval(fetchData, config?.refreshInterval || 2000);
		return () => {
			clearInterval(timer);
		};
	}, []);

	const usedPercent = stats.total > 0 ? (stats.used / stats.total) * 100 : 0;
	const freePercent = 100 - usedPercent;

	const barLength = Math.floor(usedPercent / 5);
	const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

	const freeBarLength = Math.floor(freePercent / 5);
	const freeBar = '█'.repeat(freeBarLength) + '░'.repeat(20 - freeBarLength);

	return (
		<TitledBox borderStyle="single" titles={['Disks Usage']} width={width}>
			<Box marginLeft={1} flexDirection="column">
				<Box flexDirection="row" gap={2}>
					<Box flexDirection="column">
						<Text bold>Free:</Text>
						<Text bold>Usage:</Text>
						<Text bold>Total:</Text>
						<Text bold>I/O:</Text>
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

						<Text>{formatBytes(stats.total)}</Text>
						<Text>
							{formatBytes(stats.rx)}/s / {formatBytes(stats.wx)}/s
						</Text>
					</Box>

					<Box flexDirection="column">
						<Text>{formatBytes(stats.free)}</Text>
						<Text>{formatBytes(stats.used)}</Text>
					</Box>
				</Box>
			</Box>
		</TitledBox>
	);
}

export default DisksBlock;
