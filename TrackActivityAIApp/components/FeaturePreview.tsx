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
      const acc = accelBuffer.current;
      const gyro = gyroBuffer.current;

      const accFeatures = computeStats(acc, 'acc');
      const gyroFeatures = computeStats(gyro, 'gyro');

      const { jerk: jerkAcc, mag: magAcc, magJerk: magJerkAcc } = computeDerivedSignals(acc);
      const { jerk: jerkGyro, mag: magGyro, magJerk: magJerkGyro } = computeDerivedSignals(gyro);

      const jerkAccFeatures = computeStatsFromSignal('jerkAcc', jerkAcc);
      const jerkGyroFeatures = computeStatsFromSignal('jerkGyro', jerkGyro);
      const magAccFeatures = computeStatsFromSignal('magAcc', magAcc);
      const magGyroFeatures = computeStatsFromSignal('magGyro', magGyro);
      const magJerkAccFeatures = computeStatsFromSignal('magJerkAcc', magJerkAcc);
      const magJerkGyroFeatures = computeStatsFromSignal('magJerkGyro', magJerkGyro);

      const meanFreqAccX = computeMeanFreq(acc.map(v => v[0]));
      const meanFreqAccY = computeMeanFreq(acc.map(v => v[1]));
      const meanFreqAccZ = computeMeanFreq(acc.map(v => v[2]));
      const meanFreqGyroX = computeMeanFreq(gyro.map(v => v[0]));
      const meanFreqGyroY = computeMeanFreq(gyro.map(v => v[1]));
      const meanFreqGyroZ = computeMeanFreq(gyro.map(v => v[2]));

      const freqFeatures = [
        { name: 'acc-meanFreq-X', value: meanFreqAccX },
        { name: 'acc-meanFreq-Y', value: meanFreqAccY },
        { name: 'acc-meanFreq-Z', value: meanFreqAccZ },
        { name: 'gyro-meanFreq-X', value: meanFreqGyroX },
        { name: 'gyro-meanFreq-Y', value: meanFreqGyroY },
        { name: 'gyro-meanFreq-Z', value: meanFreqGyroZ }
      ];

      const bandFeatures = [
        ...computeBandsEnergyUCIHAR(acc.map(v => v[0])).map(b => ({ name: `accX-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(acc.map(v => v[1])).map(b => ({ name: `accY-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(acc.map(v => v[2])).map(b => ({ name: `accZ-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(gyro.map(v => v[0])).map(b => ({ name: `gyroX-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(gyro.map(v => v[1])).map(b => ({ name: `gyroY-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(gyro.map(v => v[2])).map(b => ({ name: `gyroZ-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(jerkAcc.map(v => v[0])).map(b => ({ name: `jerkAccX-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(jerkAcc.map(v => v[1])).map(b => ({ name: `jerkAccY-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(jerkAcc.map(v => v[2])).map(b => ({ name: `jerkAccZ-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(jerkGyro.map(v => v[0])).map(b => ({ name: `jerkGyroX-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(jerkGyro.map(v => v[1])).map(b => ({ name: `jerkGyroY-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(jerkGyro.map(v => v[2])).map(b => ({ name: `jerkGyroZ-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(magAcc).map(b => ({ name: `magAcc-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(magGyro).map(b => ({ name: `magGyro-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(magJerkAcc).map(b => ({ name: `magJerkAcc-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(magJerkGyro).map(b => ({ name: `magJerkGyro-${b.name}`, value: b.value }))
      ];

      const allFeatures = [
        ...accFeatures,
        ...gyroFeatures,
        ...jerkAccFeatures,
        ...jerkGyroFeatures,
        ...magAccFeatures,
        ...magGyroFeatures,
        ...magJerkAccFeatures,
        ...magJerkGyroFeatures,
        ...freqFeatures,
        ...bandFeatures
      ];

      setFeatures(allFeatures);
    }, 1000);
    
    

    return () => {
      clearInterval(interval);
      accSub.remove();
      gyroSub.remove();
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
    const std = (arr: number[], m: number) =>
      Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
    const energy = (arr: number[]) => arr.reduce((s, v) => s + v ** 2, 0) / arr.length;
    const min = (arr: number[]) => Math.min(...arr);
    const max = (arr: number[]) => Math.max(...arr);
    const sma = (X: number[], Y: number[], Z: number[]) =>
      X.reduce((s, x, i) => s + Math.abs(x) + Math.abs(Y[i]) + Math.abs(Z[i]), 0) / X.length;
  
    const iqr = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length / 4)];
      const q3 = sorted[Math.floor(3 * sorted.length / 4)];
      return q3 - q1;
    };
  
    const entropy = (arr: number[]) => {
      const histogram = new Map<number, number>();
      arr.forEach((val) => {
        const bin = Math.round(val * 10) / 10;
        histogram.set(bin, (histogram.get(bin) || 0) + 1);
      });
      const total = arr.length;
      return Array.from(histogram.values())
        .map((count) => {
          const p = count / total;
          return -p * Math.log2(p);
        })
        .reduce((a, b) => a + b, 0);
    };
  
    const correlation = (a: number[], b: number[]) => {
      const meanA = mean(a);
      const meanB = mean(b);
      const num = a.reduce((sum, val, i) => sum + (val - meanA) * (b[i] - meanB), 0);
      const denomA = Math.sqrt(a.reduce((sum, val) => sum + (val - meanA) ** 2, 0));
      const denomB = Math.sqrt(b.reduce((sum, val) => sum + (val - meanB) ** 2, 0));
      return denomA && denomB ? num / (denomA * denomB) : 0;
    };
  
    const arCoefficients = (signal: number[], order: number = 4): number[] => {
      const N = signal.length;
      if (N <= order) return Array(order).fill(0);
      const m = mean(signal);
      const centered = signal.map(x => x - m);
  
      const autocorr = Array(order + 1).fill(0);
      for (let lag = 0; lag <= order; lag++) {
        for (let i = 0; i < N - lag; i++) {
          autocorr[lag] += centered[i] * centered[i + lag];
        }
        autocorr[lag] /= (N - lag);
      }
  
      const a = Array(order).fill(0);
      const E = [autocorr[0]];
      const k: number[] = [];
  
      for (let m = 1; m <= order; m++) {
        let num = autocorr[m];
        for (let i = 0; i < m - 1; i++) {
          num -= a[i] * autocorr[m - i - 1];
        }
        const km = num / E[m - 1];
        k.push(km);
  
        const newA = [...a];
        newA[m - 1] = km;
        for (let i = 0; i < m - 1; i++) {
          newA[i] = a[i] - km * a[m - 2 - i];
        }
  
        a.splice(0, order, ...newA);
        E.push((1 - km * km) * E[m - 1]);
      }
  
      return a;
    };
  
    const mX = mean(X), mY = mean(Y), mZ = mean(Z);
    const arX = arCoefficients(X);
    const arY = arCoefficients(Y);
    const arZ = arCoefficients(Z);
  
    const arFeatures = [
      ...arX.map((val, i) => ({ name: `${prefix}-arCoeff-X,${i + 1}`, value: val })),
      ...arY.map((val, i) => ({ name: `${prefix}-arCoeff-Y,${i + 1}`, value: val })),
      ...arZ.map((val, i) => ({ name: `${prefix}-arCoeff-Z,${i + 1}`, value: val }))
    ];
  
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
      { name: `${prefix}-iqr-X`, value: iqr(X) },
      { name: `${prefix}-iqr-Y`, value: iqr(Y) },
      { name: `${prefix}-iqr-Z`, value: iqr(Z) },
      { name: `${prefix}-entropy-X`, value: entropy(X) },
      { name: `${prefix}-entropy-Y`, value: entropy(Y) },
      { name: `${prefix}-entropy-Z`, value: entropy(Z) },
      { name: `${prefix}-sma`, value: sma(X, Y, Z) },
      { name: `${prefix}-correlation-X,Y`, value: correlation(X, Y) },
      { name: `${prefix}-correlation-X,Z`, value: correlation(X, Z) },
      { name: `${prefix}-correlation-Y,Z`, value: correlation(Y, Z) },
      ...arFeatures
    ];
}
  
function computeDerivedSignals(data: number[][]) {
    // Dérivée (Jerk)
    const jerk: number[][] = [];
    for (let i = 1; i < data.length; i++) {
      const dx = data[i][0] - data[i - 1][0];
      const dy = data[i][1] - data[i - 1][1];
      const dz = data[i][2] - data[i - 1][2];
      jerk.push([dx, dy, dz]);
    }
  
    // Magnitude
    const mag: number[] = data.map(([x, y, z]) => Math.sqrt(x ** 2 + y ** 2 + z ** 2));
  
    // Magnitude du Jerk
    const magJerk: number[] = jerk.map(([x, y, z]) => Math.sqrt(x ** 2 + y ** 2 + z ** 2));
  
    return {
      jerk,
      mag,
      magJerk,
    };
}
  
function computeMeanFreq(signal: number[]): number {
  const N = signal.length;
  if (N === 0) return 0;

  // Apply FFT (real part only)
  const re = [...signal];
  const im = Array(N).fill(0);

  // Perform naive DFT (not optimized FFT but enough for 128 points)
  const spectrum = Array(Math.floor(N / 2)).fill(0);
  for (let k = 0; k < N / 2; k++) {
    let sumRe = 0;
    let sumIm = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      sumRe += signal[n] * Math.cos(angle);
      sumIm -= signal[n] * Math.sin(angle);
    }
    const mag = Math.sqrt(sumRe ** 2 + sumIm ** 2);
    spectrum[k] = mag;
  }

  const totalEnergy = spectrum.reduce((s, v) => s + v, 0);
  if (totalEnergy === 0) return 0;

  const weightedFreq = spectrum.reduce((sum, mag, k) => sum + k * mag, 0);
  return weightedFreq / totalEnergy;
}

function computeStatsFromSignal(prefix: string, signal: number[][] | number[]) {
    if (signal.length === 0) return [];
  
    if (Array.isArray(signal[0])) {
      // 3D signal (X, Y, Z)
      const [X, Y, Z] = [0, 1, 2].map(i => (signal as number[][]).map(row => row[i]));
      return computeStatsFromAxes(prefix, X, Y, Z);
    } else {
      // 1D signal (magnitude)
      const s = signal as number[];
      const mean = s.reduce((a, b) => a + b, 0) / s.length;
      const std = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length);
      const energy = s.reduce((a, b) => a + b ** 2, 0) / s.length;
      const min = Math.min(...s);
      const max = Math.max(...s);
      return [
        { name: `${prefix}-mean`, value: mean },
        { name: `${prefix}-std`, value: std },
        { name: `${prefix}-min`, value: min },
        { name: `${prefix}-max`, value: max },
        { name: `${prefix}-energy`, value: energy }
      ];
    }
}

function skewness(arr: number[]): number {
  const n = arr.length;
  if (n < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n);
  return stdDev === 0 ? 0 : arr.reduce((sum, x) => sum + ((x - mean) / stdDev) ** 3, 0) / n;
}

function kurtosis(arr: number[]): number {
  const n = arr.length;
  if (n < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n);
  return stdDev === 0 ? 0 : arr.reduce((sum, x) => sum + ((x - mean) / stdDev) ** 4, 0) / n;
}
  
function computeStatsFromAxes(prefix: string, X: number[], Y: number[], Z: number[]) {
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr: number[], m: number) => Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
    const energy = (arr: number[]) => arr.reduce((s, v) => s + v ** 2, 0) / arr.length;
  
    const mX = mean(X), mY = mean(Y), mZ = mean(Z);
  
    return [
      { name: `${prefix}-mean-X`, value: mX },
      { name: `${prefix}-mean-Y`, value: mY },
      { name: `${prefix}-mean-Z`, value: mZ },
      { name: `${prefix}-std-X`, value: std(X, mX) },
      { name: `${prefix}-std-Y`, value: std(Y, mY) },
      { name: `${prefix}-std-Z`, value: std(Z, mZ) },
      { name: `${prefix}-energy-X`, value: energy(X) },
      { name: `${prefix}-energy-Y`, value: energy(Y) },
      { name: `${prefix}-energy-Z`, value: energy(Z) },
      { name: `${prefix}-skewness-X`, value: skewness(X) },
      { name: `${prefix}-skewness-Y`, value: skewness(Y) },
      { name: `${prefix}-skewness-Z`, value: skewness(Z) },
      { name: `${prefix}-kurtosis-X`, value: kurtosis(X) },
      { name: `${prefix}-kurtosis-Y`, value: kurtosis(Y) },
      { name: `${prefix}-kurtosis-Z`, value: kurtosis(Z) },
    ];
}

function computeBandsEnergy(signal: number[], bandSize: number = 8): { name: string, value: number }[] {
  const N = signal.length;
  if (N === 0) return [];

  // FFT naive
  const spectrum = Array(Math.floor(N / 2)).fill(0);
  for (let k = 0; k < N / 2; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(angle);
      im -= signal[n] * Math.sin(angle);
    }
    spectrum[k] = re ** 2 + im ** 2; // carré de la magnitude = énergie
  }

  // Découpe en bandes (8 par 8 comme dans UCI HAR)
  const features: { name: string, value: number }[] = [];
  for (let i = 0; i < spectrum.length; i += bandSize) {
    const band = spectrum.slice(i, i + bandSize);
    const energy = band.reduce((sum, val) => sum + val, 0);
    const start = i + 1;
    const end = Math.min(i + bandSize, spectrum.length);
    features.push({
      name: `bandsEnergy-${start},${end}`,
      value: energy
    });
  }

  return features;
}

function computeBandsEnergyUCIHAR(signal: number[]): { name: string, value: number }[] {
  const N = signal.length;
  if (N === 0) return [];

  const spectrum: number[] = Array(Math.floor(N / 2)).fill(0);

  for (let k = 0; k < spectrum.length; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(angle);
      im -= signal[n] * Math.sin(angle);
    }
    spectrum[k] = re ** 2 + im ** 2;
  }

  const bands: [number, number][] = [
    [0, 7], [8, 15], [16, 23], [24, 31], [32, 39], [40, 47], [48, 55], [56, 63],  // bandes de 8
    [0, 15], [16, 31], [32, 47], [48, 63],  // bandes de 16
    [0, 23], [24, 47],  // bandes de 24
    [0, 31], [32, 63],  // bandes de 32
    [0, 47],  // bande de 48
    [0, 63]   // bande complète de 64
  ]

  // Ajout de bandes doublées pour atteindre 33 comme dans UCI HAR
  const finalBands = [...bands, ...bands.slice(0, 15)];

  return finalBands.map(([start, end], i) => {
    const energy = spectrum.slice(start, end + 1).reduce((sum, val) => sum + val, 0);
    return {
      name: `bandsEnergy-${start + 1},${end + 1}`,
      value: energy
    };
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  item: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  name: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: 'bold' },
});
