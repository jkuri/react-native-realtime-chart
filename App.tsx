import {
  Canvas,
  Group,
  Path,
  SkPath,
  Skia,
  Text,
  matchFont,
  rect
} from '@shopify/react-native-skia';
import {
  ScaleLinear,
  ScaleTime,
  curveBasis,
  line,
  scaleLinear,
  scaleTime
} from 'd3';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

const [width, height] = [Dimensions.get('screen').width - 10, 400];
const [timeSlots, fps] = [40, 60];

type DataPoint = {
  date: Date;
  value: number;
};

const randomInt = (min: number = 0, max: number = 100): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const generateRandomDateValues = (
  n: number = 10,
  min = 0,
  max = 100,
  fromDate: Date = new Date()
): DataPoint[] => {
  return Array.from(Array(n).keys()).map((_, i) => ({
    date: new Date(fromDate.getTime() - n * 1000 + 1000 * i),
    value: randomInt(min, max)
  }));
};

const generateChart = (
  data: DataPoint[]
): {
  curve: SkPath;
  x: ScaleTime<number, number, never>;
  y: ScaleLinear<number, number, never>;
} => {
  const x = scaleTime().range([0, width]);
  const y = scaleLinear()
    .range([height - 20, 20])
    .domain([0, 100]);

  x.domain([
    new Date(new Date().getTime() - 1000 * (timeSlots - 2)),
    new Date(new Date().getTime() - 1000 * 2)
  ]);

  const l = line<DataPoint>()
    .x((d) => x(d.date))
    .y((d) => y(d.value))
    .curve(curveBasis);

  const path = l(data)!;

  return { curve: Skia.Path.MakeFromSVGString(path)!, x, y };
};

export default function App() {
  const [data, setData] = useState<DataPoint[]>(
    generateRandomDateValues(timeSlots)
  );
  const { curve, y } = generateChart(data);
  const path = useSharedValue<string>(curve.toSVGString());
  const yScale = useSharedValue<ScaleLinear<number, number, never>>(y);

  const fontStyle = {
    fontFamily: 'Helvetica',
    fontSize: 11,
    fontWeight: 'bold'
  };
  const font = matchFont(fontStyle as any);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((state) => {
        state.shift();
        state.push({ date: new Date(), value: randomInt() });
        return state;
      });

      return () => clearInterval(interval);
    }, 1000);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const { curve, x, y } = generateChart(data);
      yScale.value = y;
      path.value = curve.toSVGString();
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        <Group>
          {yScale.value.ticks(6).map((label: number, i: number) => {
            const yPoint = yScale.value(label);
            return (
              <Group key={label + i.toString()}>
                <Path
                  color="#090909"
                  style="stroke"
                  strokeWidth={2}
                  path={`M30,${yPoint} L${width},${yPoint}`}
                />
                <Text
                  text={label.toString()}
                  x={0}
                  y={yPoint + 5}
                  color="#474747"
                  font={font}
                />
              </Group>
            );
          })}
        </Group>
        <Group clip={rect(30, 0, width, height)}>
          <Path style="stroke" strokeWidth={2} color="#fff" path={path} />
        </Group>
      </Canvas>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
