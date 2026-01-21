import React, {useState, useEffect, useRef} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import {ScrollView, type ScrollViewRef} from 'ink-scroll-view';

import si from 'systeminformation';
import TitledBox from '../components/titled-box.js';
import {firstUpperCase, isValidUrl} from '../helpers.js';
import {type ConfigType} from '../config.js';

function ServicesHealth({
	config,
	theme,
	width,
}: {
	readonly config?: ConfigType['services'];
	readonly theme?: ConfigType['theme'];
	readonly width?: string;
}) {
	const scrollRef = useRef<ScrollViewRef>(null);
	const {stdout} = useStdout();
	const [isFocused, setIsFocused] = useState(false);

	const [_services, setServices] = useState<
		Array<{
			id: number;
			name: string;
			host: string;
			latency?: number | undefined;
		}>
	>(
		config?.list
			? config.list.map((service, index) => ({
					id: index + 1,
					name: service.name,
					host: service.host,
					latency: undefined,
			  }))
			: [],
	);

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
		if (input === 's') {
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
		const fetchLatency = async () => {
			if (!config?.list) return;

			const promises = config.list.map(async (service, index) => {
				let latency: number | undefined;
				try {
					if (!isValidUrl(service.host)) {
						latency = await si.inetLatency(service.host);
					} else {
						const response = await si.inetChecksite(service.host);
						if (response.status === 200) {
							latency = response.ms;
						}
					}
				} catch {
					// Latency remains null
				}

				return {
					id: index + 1,
					name: service.name,
					host: service.host,
					latency,
				};
			});

			const updatedServices = await Promise.all(promises);
			setServices(updatedServices);
		};

		fetchLatency();

		const interval = setInterval(fetchLatency, config?.refreshInterval || 3000);

		return () => {
			clearInterval(interval);
		};
	}, [config]);

	return (
		<TitledBox
			borderStyle="single"
			titles={['Services Health']}
			borderColor={isFocused ? theme?.secondary || 'cyan' : undefined}
			width={width}
		>
			<Box marginLeft={1} marginRight={1}>
				{_services.length > 0 ? (
					<Box flexDirection="column" gap={1}>
						<Box flexDirection="row">
							<Box width="50%">
								<Text bold underline>
									SERVICE
								</Text>
							</Box>
							<Box width="25%">
								<Text bold underline>
									PING
								</Text>
							</Box>
							<Box width="25%">
								<Text bold underline>
									STATUS
								</Text>
							</Box>
						</Box>
						<ScrollView ref={scrollRef} height={6}>
							{_services.map(service => {
								return (
									<Box key={service.id} flexDirection="row" marginBottom={1}>
										<Box width="50%">
											<Text
												color={theme?.secondary || '#9f9fff'}
												wrap="truncate-end"
											>
												{firstUpperCase(service.name)}
											</Text>
										</Box>
										<Box width="25%">
											<Text {...(!service.latency && {dimColor: true})}>
												{service.latency ? `${service.latency}ms` : 'N/A'}
											</Text>
										</Box>
										<Box width="25%">
											<Text
												color={
													service.latency
														? theme?.success || 'green'
														: theme?.error || 'red'
												}
												{...(!service.latency && {dimColor: true})}
											>
												{service.latency ? '🟢 OK' : '🔴 NOT OK'}
											</Text>
										</Box>
									</Box>
								);
							})}
						</ScrollView>
					</Box>
				) : (
					<Box>
						<Text>No services found.</Text>
					</Box>
				)}
			</Box>
		</TitledBox>
	);
}

export default ServicesHealth;
