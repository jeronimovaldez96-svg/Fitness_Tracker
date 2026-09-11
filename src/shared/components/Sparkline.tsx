import Svg, { Polyline } from 'react-native-svg';

import { useTheme } from '@/core/theme';

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
};

export function Sparkline({ values, width = 110, height = 32, color, strokeWidth = 2 }: SparklineProps) {
  const { colors } = useTheme();
  const strokeColor = color ?? colors.ink;

  if (values.length < 2) return <Svg width={width} height={height} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const padding = strokeWidth;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const normalized = (value - min) / span;
      const y = padding + (1 - normalized) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    </Svg>
  );
}
