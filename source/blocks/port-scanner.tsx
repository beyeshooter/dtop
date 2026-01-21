import React, {useState, useEffect, useRef} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import {ScrollView, type ScrollViewRef} from 'ink-scroll-view';

import si, {type Systeminformation} from 'systeminformation';
import TitledBox from '../components/titled-box.js';
import {type ConfigType} from '../config.js';

function PortScanner({
	config,
	theme,
	width,
}: {
	readonly config?: ConfigType['portScanner'];
	readonly theme?: ConfigType['theme'];
	readonly width?: string;
}) {
	const scrollRef = useRef<ScrollViewRef>(null);
	const {stdout} = useStdout();
	const [isFocused, setIsFocused] = useState(false);

	const [knownPorts, _] = useState<
		Array<{id: number; name: string; port: number}>
	>(
		config && config.list
			? config.list.map((port, index) => ({id: index + 1, ...port}))
			: [],
	);
	const [_ports, setPorts] = useState<
		Systeminformation.NetworkConnectionsData[]
	>([]);

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
		if (input === 'p') {
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

	useEffect(() => {
		const fetchPorts = async () => {
			try {
				const data = await si.networkConnections();
				const openPorts = data.filter(conn => conn.state === 'LISTEN');

				setPorts(openPorts);
				// SetLoading(false);
			} catch {
				// SetError(err);
				// setLoading(false);
			}
		};

		fetchPorts();

		const interval = setInterval(fetchPorts, 3000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<TitledBox
			borderStyle="single"
			titles={['Ports Scanner']}
			borderColor={isFocused ? theme?.secondary || 'cyan' : undefined}
			width={width}
		>
			<Box marginLeft={1} marginRight={1}>
				{knownPorts.length > 0 ? (
					<Box flexDirection="column" gap={1}>
						<Box flexDirection="row">
							<Box width="17%">
								<Text bold underline>
									PID
								</Text>
							</Box>
							<Box width="30%">
								<Text bold underline>
									SERVICE
								</Text>
							</Box>
							<Box width="15%">
								<Text bold underline>
									PROTO
								</Text>
							</Box>
							<Box width="20%">
								<Text bold underline>
									PORT
								</Text>
							</Box>
							<Box width="18%">
								<Text bold underline>
									STATUS
								</Text>
							</Box>
						</Box>
						<ScrollView ref={scrollRef} height={6}>
							{knownPorts.map(port => {
								const process = _ports.find(
									p => Number.parseInt(p.localPort) === port.port,
								);
								return (
									<Box key={port.id} flexDirection="row" marginBottom={1}>
										<Box width="17%">
											<Text
												{...(!process && {dimColor: true})}
												wrap="truncate-end"
											>
												{process?.pid || '?'}
											</Text>
										</Box>
										<Box width="30%">
											<Text
												bold
												color={theme?.secondary || '#CF9FFF'}
												{...(!process && {dimColor: true})}
											>
												{port.name}{' '}
											</Text>
										</Box>
										<Box width="15%">
											<Text {...(!process && {dimColor: true})}>
												{process?.protocol || 'TCP'}
											</Text>
										</Box>
										<Box width="20%">
											<Text {...(!process && {dimColor: true})}>
												{process?.localPort || port.port}
											</Text>
										</Box>
										<Box width="18%">
											<Text
												color={
													process
														? theme?.success || 'green'
														: theme?.error || 'red'
												}
												{...(!process && {dimColor: true})}
											>
												{process ? '🟢 OK' : '🔴 NOT OK'}
											</Text>
										</Box>
									</Box>
								);
							})}
						</ScrollView>
					</Box>
				) : (
					<Box>
						<Text>No ports configured.</Text>
					</Box>
				)}
			</Box>
		</TitledBox>
	);
}

export default PortScanner;
