import { Accelerometer, Gyroscope } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function FeaturePreview() {
  const [features, setFeatures] = useState<{ name: string, value: number }[]>([]);

  const accelBuffer = useRef<number[][]>([]);
  const gyroBuffer = useRef<number[][]>([]);
  const SAMPLING_RATE = 20;
  const MAX_SAMPLES = 128;

  useEffect(() => {
    Accelerometer.setUpdateInterval(SAMPLING_RATE);
    Gyroscope.setUpdateInterval(SAMPLING_RATE);

    const accSub = Accelerometer.addListener(({ x, y, z }) => {
      if (accelBuffer.current.length >= MAX_SAMPLES) accelBuffer.current.shift();
      accelBuffer.current.push([x, y, z]);
    });

    const gyroSub = Gyroscope.addListener(({ x, y, z }) => {
      if (gyroBuffer.current.length >= MAX_SAMPLES) gyroBuffer.current.shift();
      gyroBuffer.current.push([x, y, z]);
    });

    const interval = setInterval(() => {
      const allFeatures: { name: string, value: number }[] = [];

      const acc = accelBuffer.current;
      const gyro = gyroBuffer.current;

      const accFeatures = computeStats(acc, 'acc');
      const gyroFeatures = computeStats(gyro, 'gyro');

      allFeatures.push(...accFeatures, ...gyroFeatures);

      setFeatures(allFeatures);
    }, 1000);

    return () => {
      accSub.remove();
      gyroSub.remove();
      clearInterval(interval);
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Features calculées (live)</Text>
      {features.map(({ name, value }, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.value}>{value.toFixed(4)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function computeStats(data: number[][], prefix: string) {
  if (data.length === 0) return [];

  const X = data.map(d => d[0]);
  const Y = data.map(d => d[1]);
  const Z = data.map(d => d[2]);

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr: number[], m: number) => Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
  const energy = (arr: number[]) => arr.reduce((s, v) => s + v ** 2, 0) / arr.length;
  const min = (arr: number[]) => Math.min(...arr);
  const max = (arr: number[]) => Math.max(...arr);
  const sma = (X: number[], Y: number[], Z: number[]) =>
    X.reduce((s, x, i) => s + Math.abs(x) + Math.abs(Y[i]) + Math.abs(Z[i]), 0) / X.length;

  const mX = mean(X), mY = mean(Y), mZ = mean(Z);

  return [
    { name: `${prefix}-mean-X`, value: mX },
    { name: `${prefix}-mean-Y`, value: mY },
    { name: `${prefix}-mean-Z`, value: mZ },
    { name: `${prefix}-std-X`, value: std(X, mX) },
    { name: `${prefix}-std-Y`, value: std(Y, mY) },
    { name: `${prefix}-std-Z`, value: std(Z, mZ) },
    { name: `${prefix}-min-X`, value: min(X) },
    { name: `${prefix}-min-Y`, value: min(Y) },
    { name: `${prefix}-min-Z`, value: min(Z) },
    { name: `${prefix}-max-X`, value: max(X) },
    { name: `${prefix}-max-Y`, value: max(Y) },
    { name: `${prefix}-max-Z`, value: max(Z) },
    { name: `${prefix}-energy-X`, value: energy(X) },
    { name: `${prefix}-energy-Y`, value: energy(Y) },
    { name: `${prefix}-energy-Z`, value: energy(Z) },
    { name: `${prefix}-sma`, value: sma(X, Y, Z) },
  ];
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  item: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  name: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: 'bold' },
});
