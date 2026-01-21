export const isValidUrl = (string: string) => {
	try {
		new URL(string);
		return true;
	} catch {
		return false;
	}
};

export const firstUpperCase = (string_: string) => {
	return string_.charAt(0).toUpperCase() + string_.slice(1);
};

export const formatBytes = (bytes: number) => {
	if (bytes === 0) return '0B';
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
};
