import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';

import si from 'systeminformation';
import TitledBox from '../components/titled-box.js';
import {type ConfigType} from '../config.js';

function Cpu({
	config,
	theme,
	width,
}: {
	readonly config?: ConfigType['cpu'];
	readonly theme?: ConfigType['theme'];
	readonly width?: string;
}) {
	const [cpuData, setCpuData] = useState({
		usage: 0,
		currentSpeed: '0.00',
		cpuName: '',
		cores: 0,
		temp: 0,
		loadAvg: 0,
	});

	useEffect(() => {
		const fetchData = async () => {
			const [loadData, currentSpeed, nameData, temporary] = await Promise.all([
				si.currentLoad(),
				si.cpuCurrentSpeed(),
				si.cpu(),
				si.cpuTemperature(),
			]);

			setCpuData({
				usage: Number(loadData.currentLoad.toFixed(2)),
				loadAvg: loadData.avgLoad,
				currentSpeed: currentSpeed.avg.toFixed(2).toString(),
				cpuName: `${nameData.manufacturer} ${nameData.brand}`,
				cores: nameData.cores,
				temp: temporary.max || temporary.main || 0,
			});
		};

		fetchData();
		const timer = setInterval(fetchData, config?.refreshInterval || 2000);
		return () => {
			clearInterval(timer);
		};
	}, []);

	const barLength = Math.floor(cpuData.usage / 5);
	const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

	return (
		<TitledBox borderStyle="single" titles={['CPU Usage']} width={width}>
			<Box
				marginLeft={1}
				marginRight={1}
				flexDirection="row"
				justifyContent="space-between"
				width="100%"
			>
				<Box flexDirection="column">
					<Box>
						<Text bold>CPU Model: </Text>
						<Text>{cpuData.cpuName}</Text>
					</Box>
					<Box flexDirection="row" gap={1}>
						<Text bold>Avg:</Text>
						<Text
							color={
								cpuData.usage > 80
									? theme?.error || 'red'
									: theme?.success || 'green'
							}
						>
							{bar} {cpuData.usage}%
						</Text>
					</Box>
				</Box>

				<Box flexDirection="column" marginRight={1}>
					<Box>
						<Text bold>Current Speed: </Text>
						<Text>{cpuData.currentSpeed} GHz | </Text>
						<Text bold>Cores: </Text>
						<Text>{cpuData.cores}</Text>
					</Box>

					<Box flexDirection="row" gap={2}>
						<Text bold>Avg Load: </Text>
						<Text>{cpuData.loadAvg} |</Text>
						<Text bold>Temp: </Text>
						<Text>
							<Text
								color={
									cpuData.temp > 75
										? theme?.error || 'red'
										: theme?.success || 'green'
								}
							>
								{cpuData.temp > 0 ? cpuData.temp : 'N/A'}
							</Text>
							°C
						</Text>
					</Box>
				</Box>
			</Box>
		</TitledBox>
	);
}

export default Cpu;
