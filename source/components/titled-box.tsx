import React from 'react';
import {Box, Text} from 'ink';

type Props = {
	readonly titles: string[];
	readonly borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'classic';
	readonly borderColor?: string;
	readonly width?: string | number;
	readonly height?: string | number;
	readonly children: React.ReactNode;
};

const TitledBox = ({
	titles,
	borderStyle = 'single',
	borderColor,
	width,
	height,
	children,
}: Props) => {
	return (
		<Box
			borderStyle={borderStyle}
			borderColor={borderColor}
			width={width}
			height={height}
			flexDirection="column"
		>
			<Box position="absolute" marginTop={-1} marginLeft={1}>
				{titles.map((title, index) => (
					<Text key={index} color={borderColor}>
						<Text> </Text>
						<Text bold>{title}</Text>
						<Text> </Text>
					</Text>
				))}
			</Box>
			{children}
		</Box>
	);
};

export default TitledBox;
