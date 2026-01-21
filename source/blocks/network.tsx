import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import Divider from 'ink-divider';
import si from 'systeminformation';

import TitledBox from '../components/titled-box.js';
import {type ConfigType} from '../config.js';

const formatSpeed = (bytes: number) => {
	if (bytes === 0) return '0 B/s';
	const sizes = ['B/s', 'kB/s', 'MB/s', 'GB/s'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
};

function Network({
	config,
	theme,
	width,
}: {
	readonly config?: ConfigType['network'];
	readonly theme?: ConfigType['theme'];
	readonly width?: string;
}) {
	const [stats, setStats] = useState<{
		ip: string;
		rxSec: number;
		txSec: number;
		iface: string;
		vpnIp: string;
		ping: number | undefined;
	}>({
		ip: 'N/A',
		rxSec: 0,
		txSec: 0,
		iface: 'loading...',
		vpnIp: 'Checking...',
		ping: undefined,
	});

	const [netInfo, setNetInfo] = useState({
		ip: 'Loading...',
		country: '',
		isp: '',
		city: '',
	});

	useEffect(() => {
		const fetchNetwork = async () => {
			try {
				const networkIfaces = await si.networkInterfaces();
				const defaultIface = networkIfaces.find(iface => iface.default);
				const vpnIface = networkIfaces.find(
					iface =>
						!iface.default &&
						!iface.internal &&
						iface.ip4 &&
						/^(tun|tap|ppp|utun|wg)/i.test(iface.iface),
				);

				const [data, latency] = await Promise.all([
					si.networkStats(defaultIface?.iface || ''),
					si.inetLatency(),
				]);

				if (data && data.length > 0) {
					setStats({
						ip: defaultIface?.ip4 || 'N/A',
						rxSec: data[0]?.rx_sec ?? 0,
						txSec: data[0]?.tx_sec ?? 0,
						iface: defaultIface?.iface || 'N/A',
						vpnIp: vpnIface?.ip4 || 'Not Connected',
						ping: latency,
					});
				}
			} catch {
				// Handle errors silently or log them
			}
		};

		fetchNetwork();

		const interval = setInterval(fetchNetwork, config?.refreshInterval || 3000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	useEffect(() => {
		const fetchIP = async () => {
			try {
				const response = await fetch('http://ip-api.com/json/');
				const data = await response.json();

				if (data.status === 'success') {
					setNetInfo({
						ip: data.query,
						country: data.countryCode, // E.g., "MA"
						isp: data.isp,
						city: data.city,
					});
				}
			} catch {
				setNetInfo(previous => ({...previous, public_ip: 'Error'}));
			}
		};

		fetchIP();
		const interval = setInterval(
			fetchIP,
			config?.public_ip.refreshInterval || 300_000,
		);
		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<TitledBox borderStyle="single" titles={['Network']} width={width}>
			<Box flexDirection="column" marginLeft={1} marginRight={1}>
				<Box flexDirection="column">
					<Box>
						<Text bold color={theme?.text || 'white'}>
							🌍 WAN
						</Text>
						<Text bold>: {netInfo.ip}</Text>
					</Box>
					<Box>
						<Text bold color={theme?.text || 'white'}>
							🏠 LAN
						</Text>
						<Text bold>
							: {stats.ip} ({stats.iface})
						</Text>
					</Box>
					<Box>
						<Text bold color={theme?.text || 'white'}>
							🔒 VPN
						</Text>
						<Text bold>: {stats.vpnIp}</Text>
					</Box>
				</Box>
				<Divider />
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text bold>Ping</Text>
						<Text>
							:{' '}
							{typeof stats.ping === 'number'
								? `${stats.ping.toFixed(0)}ms`
								: '...'}
						</Text>
					</Box>
					<Box flexDirection="row" gap={1}>
						<Box flexDirection="row" gap={1}>
							<Box>
								<Text color={theme?.success || 'green'}>▼</Text>
							</Box>
							<Box>
								<Text>{formatSpeed(stats.rxSec)}</Text>
							</Box>
						</Box>
						<Box flexDirection="row" gap={1}>
							<Box>
								<Text color={theme?.primary || '#0096FF'}>▲</Text>
							</Box>
							<Box>
								<Text>{formatSpeed(stats.txSec)}</Text>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</TitledBox>
	);
}

export default Network;
