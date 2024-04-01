import { Canvas, Path, SkPath, Skia } from '@shopify/react-native-skia';
import { curveBasis, line, scaleLinear, scaleTime } from 'd3';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

const [width, height] = [360, 400];
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

const generateChart = (data: DataPoint[]): SkPath => {
  const x = scaleTime().range([0, width]);
  const y = scaleLinear().range([height, 0]).domain([0, 100]);

  x.domain([
    new Date(new Date().getTime() - 1000 * (timeSlots - 2)),
    new Date(new Date().getTime() - 1000 * 2)
  ]);

  const l = line<DataPoint>()
    .x((d) => x(d.date))
    .y((d) => y(d.value))
    .curve(curveBasis);

  const path = l(data)!;

  return Skia.Path.MakeFromSVGString(path)!;
};

export default function App() {
  const [data, setData] = useState<DataPoint[]>(
    generateRandomDateValues(timeSlots)
  );
  const path = useSharedValue<string>(generateChart(data).toSVGString());

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
      path.value = generateChart(data).toSVGString();
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        <Path style="stroke" strokeWidth={2} color="#000" path={path} />
      </Canvas>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
