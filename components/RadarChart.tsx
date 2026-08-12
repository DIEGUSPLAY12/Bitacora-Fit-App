import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface RadarChartProps {
  data: Record<string, number>;
  size?: number;
  color?: string;
}

export function RadarChart({ data, size = 300, color = colors.accent }: RadarChartProps) {
  const keys = Object.keys(data);
  const numAxes = keys.length;
  
  if (numAxes === 0) return null;

  const maxDataValue = Math.max(...Object.values(data));
  const maxVal = maxDataValue > 0 ? maxDataValue : 100;

  const center = size / 2;
  const radius = (size / 2) * 0.65; 

  const angleStep = (Math.PI * 2) / numAxes;

  const getPoint = (value: number, index: number, max: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const dataPoints = keys.map((key, i) => getPoint(data[key], i, maxVal));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const gridLevels = [0.33, 0.66, 1];
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {gridLevels.map((level, levelIdx) => {
          const points = keys.map((_, i) => getPoint(maxVal * level, i, maxVal));
          const polygonString = points.map(p => `${p.x},${p.y}`).join(' ');
          return (
            <Polygon
              key={`grid-${levelIdx}`}
              points={polygonString}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              fill="none"
            />
          );
        })}

        {keys.map((_, i) => {
          const endPoint = getPoint(maxVal, i, maxVal);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        <Polygon
          points={dataPolygon}
          stroke={color}
          strokeWidth="2"
          fill={color}
          fillOpacity="0.3"
        />

        {keys.map((key, i) => {
          const labelPoint = getPoint(maxVal * 1.3, i, maxVal);
          
          let textAnchor = "middle" as any;
          if (labelPoint.x < center - 10) textAnchor = "end";
          if (labelPoint.x > center + 10) textAnchor = "start";

          return (
            <SvgText
              key={`label-${i}`}
              x={labelPoint.x}
              y={labelPoint.y + 4}
              fill={colors.textSecondary}
              fontSize="12"
              fontFamily={typography.fontFamily.bold}
              textAnchor={textAnchor}
            >
              {key}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
