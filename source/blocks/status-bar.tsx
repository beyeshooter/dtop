import React, {useEffect, useState} from 'react';
import {Box, Text} from 'ink';

import si from 'systeminformation';
import {format} from 'date-fns';
import {type ConfigType} from '../config.js';

function StatusBar({
	config,
	theme,
}: {
	readonly config?: ConfigType['statusBar'];
	readonly theme?: ConfigType['theme'];
}) {
	const [wifi, setWifi] = useState<any>(null);
	const [battery, setBattery] = useState<any>(null);
	const [location, setLocation] = useState('Unknown');
	const [versions, setVersions] = useState<any>({
		node: 'N/A',
		python3: 'N/A',
		git: 'N/A',
	});
	const [time, setTime] = useState(new Date());
	const [date, setDate] = useState(new Date());

	useEffect(() => {
		const fetchVersions = async () => {
			try {
				const softwares = [];

				if (config?.node?.enabled) softwares.push('node');
				if (config?.python3?.enabled) softwares.push('python3');
				if (config?.git?.enabled) softwares.push('git');

				const v: any = await si.versions(softwares.join(','));
				setVersions(v);
			} catch {}
		};

		fetchVersions();

		const fetchInfo = async () => {
			try {
				if (config?.wifi.enabled) {
					const wifiData = await si.wifiConnections();
					if (wifiData && wifiData.length > 0) {
						setWifi(wifiData[0]);
					} else {
						setWifi(null);
					}
				}

				if (config?.battery.enabled) {
					const batteryData = await si.battery();
					setBattery(batteryData);
				}
			} catch {}
		};

		fetchInfo();

		setLocation(getOfflineLocation());

		const interval = setInterval(fetchInfo, config?.refreshInterval || 5000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	useEffect(() => {
		const timer = setInterval(() => {
			setTime(new Date());
			setDate(new Date());
		}, 1000);
		return () => {
			clearInterval(timer);
		};
	}, []);

	const getOfflineLocation = () => {
		try {
			const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
			return tz.split('/')[1]?.replace(/_/g, ' ') || 'Unknown';
		} catch {
			return 'Unknown';
		}
	};

	const getWifiDot = (signal: number) => {
		if (signal >= -60) return <Text color={theme?.success || 'green'}>●</Text>;
		if (signal >= -80) return <Text color={theme?.warning || 'yellow'}>●</Text>;
		return <Text color={theme?.error || 'red'}>●</Text>;
	};

	const items = [
		config?.date?.enabled && (
			<Text key="date">
				📅 {format(date, config.date.format || 'LLL,dd yyyy')}
			</Text>
		),
		config?.time?.enabled && (
			<Text key="time">
				🕒 {format(time, config.time.format || 'HH:mm:ss')}
			</Text>
		),
		config?.location?.enabled && <Text key="location">🏠 {location}</Text>,
		config?.wifi?.enabled && wifi && (
			<Text key="wifi">
				{getWifiDot(wifi.signalLevel)} WiFi:{' '}
				{wifi.ssid === '<redacted>' ? 'Hidden' : wifi.ssid} ({wifi.signalLevel}
				dBm)
			</Text>
		),
		config?.battery?.enabled &&
			(battery && battery.hasBattery ? (
				<Text key="bat">
					🔋 Bat: {battery.percent}% {battery.isCharging && '(charging)'}
				</Text>
			) : (
				<Text key="pwr" color={theme?.success || 'green'}>
					🔌 Power: AC
				</Text>
			)),
		config?.node?.enabled && (
			<Text key="node">📦 Node: {versions.node || 'N/A'}</Text>
		),
		config?.python3?.enabled && (
			<Text key="py">🐍 Python3: {versions.python3 || 'N/A'}</Text>
		),
		config?.git?.enabled && (
			<Text key="git">🐙 Git: {versions.git || 'N/A'}</Text>
		),
	].filter(Boolean);

	return (
		<Box flexDirection="row" width="100%" justifyContent="flex-end">
			{items.map((item, index) => (
				<React.Fragment key={index}>
					{index > 0 && <Text> • </Text>}
					{item}
				</React.Fragment>
			))}
		</Box>
	);
}

export default StatusBar;
