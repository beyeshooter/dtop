import React, {useEffect, useState} from 'react';
import {Box, useStdout} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

import StatusBar from './blocks/status-bar.js';
import Cpu from './blocks/cpu.js';
import Processes from './blocks/processes.js';
import DockerBlock from './blocks/docker/index.js';
import Network from './blocks/network.js';
import PortScanner from './blocks/port-scanner.js';
import MemoryBlock from './blocks/memory.js';
import DisksBlock from './blocks/disks.js';
import ServicesHealth from './blocks/services-health.js';
import RecentProjects from './blocks/recent-projects/index.js';

import {config} from './config.js';

const useTerminalSize = () => {
	const {stdout} = useStdout();
	const [size, setSize] = useState({
		columns: stdout.columns,
		rows: stdout.rows,
	});

	useEffect(() => {
		const onResize = () => {
			setSize({
				columns: stdout.columns,
				rows: stdout.rows,
			});
		};

		stdout.on('resize', onResize);

		return () => {
			stdout.off('resize', onResize);
		};
	}, [stdout]);

	return size;
};

function Dashboard() {
	const {rows} = useTerminalSize();

	return (
		<Box
			flexDirection="column"
			justifyContent="center"
			height={rows - 1}
			padding={1}
		>
			<Box flexDirection="column">
				<Gradient name="atlas">
					<BigText text="DEV-TOP" align="center" />
				</Gradient>
			</Box>
			<StatusBar config={config?.statusBar} theme={config?.theme} />
			<Box flexDirection="row">
				<Box flexDirection="column">
					<Cpu config={config?.cpu} theme={config?.theme} />

					<Box flexDirection="row">
						<MemoryBlock
							config={config?.memory}
							theme={config?.theme}
							width="50%"
						/>
						<DisksBlock
							config={config?.disks}
							theme={config?.theme}
							width="50%"
						/>
					</Box>

					<Box>
						<Network
							config={config?.network}
							theme={config?.theme}
							width="30%"
						/>
						<PortScanner
							config={config?.portScanner}
							theme={config?.theme}
							width="70%"
						/>
					</Box>

					<Box>
						<ServicesHealth
							config={config?.services}
							theme={config?.theme}
							width="50%"
						/>
						<RecentProjects
							config={config?.projects}
							theme={config?.theme}
							width="50%"
						/>
					</Box>
				</Box>
				<Box flexDirection="column">
					<Processes config={config?.processes} theme={config?.theme} />
					<DockerBlock config={config?.docker} theme={config?.theme} />
				</Box>
			</Box>
		</Box>
	);
}

export default Dashboard;
