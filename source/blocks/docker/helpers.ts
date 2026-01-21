export const calculateCpuPercent = (stats: any) => {
	if (!stats.cpu_stats || !stats.precpu_stats) return '0.00%';

	const cpuDelta =
		stats.cpu_stats.cpu_usage.total_usage -
		stats.precpu_stats.cpu_usage.total_usage;
	const systemDelta =
		stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;

	let cpuCount = 0;
	if (stats.cpu_stats.online_cpus) {
		cpuCount = stats.cpu_stats.online_cpus;
	} else if (stats.cpu_stats.cpu_usage.percpu_usage) {
		cpuCount = stats.cpu_stats.cpu_usage.percpu_usage.length;
	}

	let cpuPercent = 0;
	if (systemDelta > 0 && cpuDelta > 0) {
		cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;
	}

	return cpuPercent.toFixed(2) + '%';
};

export const calculateMemoryUsage = (stats: any) => {
	if (
		!stats.memory_stats ||
		!stats.memory_stats.usage ||
		!stats.memory_stats.limit
	) {
		return '0.00%';
	}

	let {usage} = stats.memory_stats;
	// The "cache" value is part of the "usage" figure, but it is memory that can be reclaimed by the kernel.
	// We subtract it to get a better representation of "active" memory usage, similar to `docker stats`.
	if (stats.memory_stats.stats && stats.memory_stats.stats.cache) {
		usage -= stats.memory_stats.stats.cache;
	}

	const percent = (usage / stats.memory_stats.limit) * 100;
	return `${percent.toFixed(2)}%`;
};

function formatBytes(bytes: number) {
	if (bytes === 0) return '0B';
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / 1024 ** i).toFixed(1)}${sizes[i]}`;
}

export const calculateNetworkIO = (stats: any) => {
	if (!stats.networks) return '0B / 0B';
	let rx = 0;
	let tx = 0;
	Object.values(stats.networks).forEach((network: any) => {
		rx += network.rx_bytes;
		tx += network.tx_bytes;
	});
	return `${formatBytes(rx)} / ${formatBytes(tx)}`;
};
