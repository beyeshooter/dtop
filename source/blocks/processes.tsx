import React, {useState, useEffect, useRef} from 'react';
import {Box, Text, useInput} from 'ink';

import {ScrollList, type ScrollListRef} from 'ink-scroll-list';
import si from 'systeminformation';
import TitledBox from '../components/titled-box.js';
import {type ConfigType} from '../config.js';
import {formatBytes} from '../helpers.js';

function Processes({
	config,
	theme,
	width,
}: {
	readonly config?: ConfigType['processes'];
	readonly theme?: ConfigType['theme'];
	readonly width?: string;
}) {
	const listRef = useRef<ScrollListRef>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [processes, setProcesses] = useState<
		Array<{
			pid: number;
			name: string;
			cpu: number;
			mem: number;
			memRss: number;
		}>
	>([]);

	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex(previous => Math.max(previous - 1, 0));
		}

		if (key.downArrow) {
			setSelectedIndex(previous =>
				Math.min(previous + 1, processes.length - 1),
			);
		}

		if (input === 'g') {
			setSelectedIndex(0); // Jump to first
		}

		if (input === 'G') {
			setSelectedIndex(processes.length - 1); // Jump to last
		}
	});

	useEffect(() => {
		const timer = setInterval(async () => {
			si.processes(data => {
				const sortedCpuList = data.list.sort((a, b) => b.cpu - a.cpu);
				setProcesses(sortedCpuList.slice(0, 20));
			});
		}, config?.refreshInterval || 1000);
		return () => {
			clearInterval(timer);
		};
	}, []);

	return (
		<TitledBox borderStyle="single" titles={['Processes']}>
			<Box
				marginLeft={1}
				marginRight={1}
				flexDirection="row"
				justifyContent="space-between"
				width={width}
				height={20}
			>
				<ScrollList ref={listRef} selectedIndex={selectedIndex}>
					<Box flexDirection="column" gap={1}>
						<Box flexDirection="row">
							<Box width="15%">
								<Text bold underline>
									Pid
								</Text>
							</Box>
							<Box width="45%">
								<Text bold underline>
									Name
								</Text>
							</Box>
							<Box width="15%">
								<Text bold underline>
									CPU
								</Text>
							</Box>
							<Box width="25%">
								<Text bold underline>
									Mem Usage
								</Text>
							</Box>
						</Box>
						{processes.map((process: any) => (
							<Box key={process.pid} flexDirection="row">
								<Box width="15%">
									<Text bold>{process.pid}</Text>
								</Box>
								<Box width="45%">
									<Text color={theme?.secondary || 'cyan'} wrap="truncate-end">
										{process.name}
									</Text>
								</Box>
								<Box width="15%">
									<Text>{process.cpu.toFixed(2)}%</Text>
								</Box>
								<Box width="25%">
									<Text>
										{formatBytes(process.memRss)} ({process.mem.toFixed(1)}%)
									</Text>
								</Box>
							</Box>
						))}
					</Box>
				</ScrollList>
			</Box>
		</TitledBox>
	);
}

export default Processes;
