import { Accelerometer, Gyroscope } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function FeaturePreview() {
  const [features, setFeatures] = useState<{ name: string, value: number }[]>([]);

  const accelBuffer = useRef<number[][]>([]);
  const gyroBuffer = useRef<number[][]>([]);
  const SAMPLING_RATE = 20;
  const MAX_SAMPLES = 300;

  

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
      const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const std = (arr: number[], m: number) =>
        Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);

      if (acc.length < MAX_SAMPLES || gyro.length < MAX_SAMPLES) return;
    
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

      // jerkAcc
      const meanFreqJerkAccX = computeMeanFreq(jerkAcc.map(v => v[0]));
      const meanFreqJerkAccY = computeMeanFreq(jerkAcc.map(v => v[1]));
      const meanFreqJerkAccZ = computeMeanFreq(jerkAcc.map(v => v[2]));

      // jerkGyro
      const meanFreqJerkGyroX = computeMeanFreq(jerkGyro.map(v => v[0]));
      const meanFreqJerkGyroY = computeMeanFreq(jerkGyro.map(v => v[1]));
      const meanFreqJerkGyroZ = computeMeanFreq(jerkGyro.map(v => v[2]));

      // magnitudes
      const meanFreqMagAcc = computeMeanFreq(magAcc);
      const meanFreqMagGyro = computeMeanFreq(magGyro);
      const meanFreqMagJerkAcc = computeMeanFreq(magJerkAcc);
      const meanFreqMagJerkGyro = computeMeanFreq(magJerkGyro);

      
      const gravityMag = computeDerivedSignals(acc).mag; // déjà dérivé dans ton code via magAcc = gravityMag

      const tGravityAccMagFeatures = [
        {name: 'tGravityAcc-std()-Y', value: std(acc.map(v => v[1]), mean(acc.map(v => v[1]))) },
        {name: 'tGravityAccMag-sma()',value: gravityMag.reduce((sum, v) => sum + Math.abs(v), 0) / gravityMag.length},
        {name: 'tGravityAccMag-skewness()',value: skewness(gravityMag)},
        {name: 'tGravityAccMag-kurtosis()',value: kurtosis(gravityMag)}
      ];

    
      const freqFeatures = [
        { name: 'acc-meanFreq-X', value: meanFreqAccX },
        { name: 'acc-meanFreq-Y', value: meanFreqAccY },
        { name: 'acc-meanFreq-Z', value: meanFreqAccZ },
        { name: 'gyro-meanFreq-X', value: meanFreqGyroX },
        { name: 'gyro-meanFreq-Y', value: meanFreqGyroY },
        { name: 'gyro-meanFreq-Z', value: meanFreqGyroZ },
        { name: 'jerkAcc-meanFreq-X', value: meanFreqJerkAccX },
        { name: 'jerkAcc-meanFreq-Y', value: meanFreqJerkAccY },
        { name: 'jerkAcc-meanFreq-Z', value: meanFreqJerkAccZ },
        { name: 'jerkGyro-meanFreq-X', value: meanFreqJerkGyroX },
        { name: 'jerkGyro-meanFreq-Y', value: meanFreqJerkGyroY },
        { name: 'jerkGyro-meanFreq-Z', value: meanFreqJerkGyroZ },
        { name: 'magAcc-meanFreq', value: meanFreqMagAcc },
        { name: 'magGyro-meanFreq', value: meanFreqMagGyro },
        { name: 'magJerkAcc-meanFreq', value: meanFreqMagJerkAcc },
        { name: 'magJerkGyro-meanFreq', value: meanFreqMagJerkGyro },
      ];  
    
      const accMeanVec = [mean(acc.map(v => v[0])), mean(acc.map(v => v[1])), mean(acc.map(v => v[2]))];
      const gyroMeanVec = [mean(gyro.map(v => v[0])), mean(gyro.map(v => v[1])), mean(gyro.map(v => v[2]))];
      const jerkAccMeanVec = [mean(jerkAcc.map(v => v[0])), mean(jerkAcc.map(v => v[1])), mean(jerkAcc.map(v => v[2]))];
      const jerkGyroMeanVec = [mean(jerkGyro.map(v => v[0])), mean(jerkGyro.map(v => v[1])), mean(jerkGyro.map(v => v[2]))];
    
      const gravityMean = [...accMeanVec];
    
      const angleFeatures = [
        { name: 'angleAccGravity', value: angleBetweenVectors(accMeanVec, gravityMean) },
        { name: 'angleJerkAccGravity', value: angleBetweenVectors(jerkAccMeanVec, gravityMean) },
        { name: 'angleGyroGravity', value: angleBetweenVectors(gyroMeanVec, gravityMean) },
        { name: 'angleJerkGyroGravity', value: angleBetweenVectors(jerkGyroMeanVec, gravityMean) },
        { name: 'angleXGravity', value: angleBetweenVectors([1, 0, 0], gravityMean) },
        { name: 'angleYGravity', value: angleBetweenVectors([0, 1, 0], gravityMean) },
        { name: 'angleZGravity', value: angleBetweenVectors([0, 0, 1], gravityMean) }
      ];
    
      const maxIndsFeatures = [
        { name: 'acc-maxInds-X', value: maxFreqIndex(acc.map(v => v[0])) },
        { name: 'acc-maxInds-Y', value: maxFreqIndex(acc.map(v => v[1])) },
        { name: 'acc-maxInds-Z', value: maxFreqIndex(acc.map(v => v[2])) },
        { name: 'gyro-maxInds-X', value: maxFreqIndex(gyro.map(v => v[0])) },
        { name: 'gyro-maxInds-Y', value: maxFreqIndex(gyro.map(v => v[1])) },
        { name: 'gyro-maxInds-Z', value: maxFreqIndex(gyro.map(v => v[2])) },
        { name: 'jerkAcc-maxInds-X', value: maxFreqIndex(jerkAcc.map(v => v[0])) },
        { name: 'jerkAcc-maxInds-Y', value: maxFreqIndex(jerkAcc.map(v => v[1])) },
        { name: 'jerkAcc-maxInds-Z', value: maxFreqIndex(jerkAcc.map(v => v[2])) },
        { name: 'jerkGyro-maxInds-X', value: computeMaxIndsFromFFT(jerkGyro.map(v => v[0])) },
        { name: 'jerkGyro-maxInds-Y', value: computeMaxIndsFromFFT(jerkGyro.map(v => v[1])) },
        { name: 'jerkGyro-maxInds-Z', value: computeMaxIndsFromFFT(jerkGyro.map(v => v[2])) },
        { name: 'magAcc-maxInds', value: computeMaxIndsFromFFT(magAcc) },
        { name: 'magGyro-maxInds', value: computeMaxIndsFromFFT(magGyro) },
        { name: 'magJerkAcc-maxInds', value: computeMaxIndsFromFFT(magJerkAcc) },
        { name: 'magJerkGyro-maxInds', value: computeMaxIndsFromFFT(magJerkGyro) }
      ];
    
      const fftAccFeatures = [
        ...computeFFTStats(acc.map(v => v[0]), 'fBodyAcc-X'),
        ...computeFFTStats(acc.map(v => v[1]), 'fBodyAcc-Y'),
        ...computeFFTStats(acc.map(v => v[2]), 'fBodyAcc-Z')
      ];

      const fftGyroFeatures = [
        ...computeFFTStats(gyro.map(v => v[0]), 'fBodyGyro-X'),
        ...computeFFTStats(gyro.map(v => v[1]), 'fBodyGyro-Y'),
        ...computeFFTStats(gyro.map(v => v[2]), 'fBodyGyro-Z')
      ];
      
      const fftJerkAccFeatures = [
        ...computeFFTStats(jerkAcc.map(v => v[0]), 'fBodyAccJerk-X'),
        ...computeFFTStats(jerkAcc.map(v => v[1]), 'fBodyAccJerk-Y'),
        ...computeFFTStats(jerkAcc.map(v => v[2]), 'fBodyAccJerk-Z')
      ];
      
      const fftJerkGyroFeatures = [
        ...computeFFTStats(jerkGyro.map(v => v[0]), 'fBodyGyroJerk-X'),
        ...computeFFTStats(jerkGyro.map(v => v[1]), 'fBodyGyroJerk-Y'),
        ...computeFFTStats(jerkGyro.map(v => v[2]), 'fBodyGyroJerk-Z')
      ];
      
      const fftMagFeatures = [
        ...computeFFTStats(magAcc, 'fBodyAccMag'),
        ...computeFFTStats(magGyro, 'fBodyGyroMag'),
        ...computeFFTStats(magJerkAcc, 'fBodyAccJerkMag'),
        ...computeFFTStats(magJerkGyro, 'fBodyGyroJerkMag')
      ];
      //console.log("💥 jerkAccZ exemple :", jerkAcc.map(v => v[2]).slice(0, 5));

      const bandsEnergyAccX = computeBandsEnergyUCIHAR(acc.map(v => v[0]));
      const bandsEnergyAccY = computeBandsEnergyUCIHAR(acc.map(v => v[1]));
      const bandsEnergyAccZ = computeBandsEnergyUCIHAR(acc.map(v => v[2]));
      const tBodyAccJerkMean = computeMeanVector(jerkAcc);


      const bannedBands = ["1,8", "1,16", "1,24", "17,24"];

      const bandFeatures = [
        // accX
        ...bandsEnergyAccX
          .filter(b => !bannedBands.includes(b.name))
          .map(b => ({ name: `accX-${b.name}`, value: b.value })),
        // accY
        ...bandsEnergyAccY
          .filter(b => !bannedBands.includes(b.name))
          .map(b => ({ name: `accY-${b.name}`, value: b.value })),
        // accZ
        ...bandsEnergyAccZ
          .filter(b => !bannedBands.includes(b.name))
          .map(b => ({ name: `accZ-${b.name}`, value: b.value })),

        // les autres sont OK
        ...computeBandsEnergyUCIHAR(gyro.map(v => v[0])).map(b => ({ name: `gyroX-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(gyro.map(v => v[1])).map(b => ({ name: `gyroY-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(gyro.map(v => v[2])).map(b => ({ name: `gyroZ-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(jerkAcc.map(v => v[0])).map(b => ({ name: `jerkAccX-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(jerkAcc.map(v => v[1])).map(b => ({ name: `jerkAccY-${b.name}`, value: b.value })),
        ...computeBandsEnergyUCIHAR(jerkAcc.map(v => v[2])).map(b => ({ name: `jerkAccZ-${b.name}`, value: b.value }))
      ];


      const finalMissingFeatures = [
        {
          name: 'fBodyAcc-bandsEnergy()-1,8',
          value: (bandsEnergyAccX.find(b => b.name === '1,8')?.value ?? 0) +
                 (bandsEnergyAccY.find(b => b.name === '1,8')?.value ?? 0) +
                 (bandsEnergyAccZ.find(b => b.name === '1,8')?.value ?? 0)
        },
        {
          name: 'fBodyAcc-bandsEnergy()-1,16',
          value: (bandsEnergyAccX.find(b => b.name === '1,16')?.value ?? 0) +
                 (bandsEnergyAccY.find(b => b.name === '1,16')?.value ?? 0) +
                 (bandsEnergyAccZ.find(b => b.name === '1,16')?.value ?? 0)
        },
        {
          name: 'fBodyAcc-bandsEnergy()-1,24',
          value: (bandsEnergyAccX.find(b => b.name === '1,24')?.value ?? 0) +
                 (bandsEnergyAccY.find(b => b.name === '1,24')?.value ?? 0) +
                 (bandsEnergyAccZ.find(b => b.name === '1,24')?.value ?? 0)
        },
        {
          name: 'fBodyAcc-bandsEnergy()-17,24',
          value: (bandsEnergyAccX.find(b => b.name === '17,24')?.value ?? 0) +
                 (bandsEnergyAccY.find(b => b.name === '17,24')?.value ?? 0) +
                 (bandsEnergyAccZ.find(b => b.name === '17,24')?.value ?? 0)
        },
        {
          name: 'angle(tBodyAccJerkMean,gravityMean)',
          value: angleBetweenVectors(tBodyAccJerkMean, gravityMean)
        },
        {
          name: 'fBodyAcc-bandsEnergy()-17,32',
          value:
            (bandsEnergyAccX.find(b => b.name === '17,32')?.value ?? 0) +
            (bandsEnergyAccY.find(b => b.name === '17,32')?.value ?? 0) +
            (bandsEnergyAccZ.find(b => b.name === '17,32')?.value ?? 0)
        },
        {
          name: 'fBodyAcc-bandsEnergy()-25,32',
          value:
            (bandsEnergyAccX.find(b => b.name === '25,32')?.value ?? 0) +
            (bandsEnergyAccY.find(b => b.name === '25,32')?.value ?? 0) +
            (bandsEnergyAccZ.find(b => b.name === '25,32')?.value ?? 0)
        },
        {
          name: 'fBodyAcc-bandsEnergy()-25,48',
          value:
            (bandsEnergyAccX.find(b => b.name === '25,48')?.value ?? 0) +
            (bandsEnergyAccY.find(b => b.name === '25,48')?.value ?? 0) +
            (bandsEnergyAccZ.find(b => b.name === '25,48')?.value ?? 0)
        },
        {
          name: 'fBodyAcc-bandsEnergy()-33,40',
          value:
            (bandsEnergyAccX.find(b => b.name === '33,40')?.value ?? 0) +
            (bandsEnergyAccY.find(b => b.name === '33,40')?.value ?? 0) +
            (bandsEnergyAccZ.find(b => b.name === '33,40')?.value ?? 0)
        }        
      ];
      
      const skewKurtFeatures = [
        // Acc
        { name: 'acc-skewness-X', value: skewness(acc.map(v => v[0])) },
        { name: 'acc-skewness-Y', value: skewness(acc.map(v => v[1])) },
        { name: 'acc-skewness-Z', value: skewness(acc.map(v => v[2])) },
        { name: 'acc-kurtosis-X', value: kurtosis(acc.map(v => v[0])) },
        { name: 'acc-kurtosis-Y', value: kurtosis(acc.map(v => v[1])) },
        { name: 'acc-kurtosis-Z', value: kurtosis(acc.map(v => v[2])) },
      
        // Gyro
        { name: 'gyro-skewness-X', value: skewness(gyro.map(v => v[0])) },
        { name: 'gyro-skewness-Y', value: skewness(gyro.map(v => v[1])) },
        { name: 'gyro-skewness-Z', value: skewness(gyro.map(v => v[2])) },
        { name: 'gyro-kurtosis-X', value: kurtosis(gyro.map(v => v[0])) },
        { name: 'gyro-kurtosis-Y', value: kurtosis(gyro.map(v => v[1])) },
        { name: 'gyro-kurtosis-Z', value: kurtosis(gyro.map(v => v[2])) },
         

        // Magnitudes
        { name: 'magAcc-skewness', value: skewness(magAcc) },
        { name: 'magAcc-kurtosis', value: kurtosis(magAcc) },
        { name: 'magGyro-skewness', value: skewness(magGyro) },
        { name: 'magGyro-kurtosis', value: kurtosis(magGyro) },
        { name: 'magJerkAcc-skewness', value: skewness(magJerkAcc) },
        { name: 'magJerkAcc-kurtosis', value: kurtosis(magJerkAcc) },
        { name: 'magJerkGyro-skewness', value: skewness(magJerkGyro) },
        { name: 'magJerkGyro-kurtosis', value: kurtosis(magJerkGyro) }
      ];
      
      function renameToUCINames(features: { name: string, value: number }[]) {
        const renameMap: Record<string, string> = {
          acc: "tBodyAcc",
          jerkAcc: "tBodyAccJerk",
          gyro: "tBodyGyro",
          jerkGyro: "tBodyGyroJerk",
          magAcc: "tBodyAccMag",
          magGyro: "tBodyGyroMag",
          magJerkAcc: "tBodyAccJerkMag",
          magJerkGyro: "tBodyGyroJerkMag",
          fBodyAccMag: "fBodyAccMag",
          fBodyGyroMag: "fBodyGyroMag",
          fBodyAccJerkMag: "fBodyAccJerkMag",
          fBodyGyroJerkMag: "fBodyGyroJerkMag",
          fBodyAcc: "fBodyAcc",
          fBodyGyro: "fBodyGyro",
          fBodyAccJerk: "fBodyAccJerk",
          fBodyGyroJerk: "fBodyGyroJerk"
        };
      
        return features.map(({ name, value }) => {
          let newName = name;
      
          // Préfixes
          for (const [prefix, target] of Object.entries(renameMap)) {
            if (newName.startsWith(prefix + "-")) {
              newName = newName.replace(prefix + "-", target + "-");
              break;
            }
          }
      
          // BandsEnergy corrections (UCI style)
          if (newName.includes("bandsEnergy")) {
            newName = newName
              .replace(/^.*?-(bandsEnergy\(\)-[\d,]+)/, "fBodyAcc-" + "$1") // fallback
              .replace(/^acc([XYZ])/, "fBodyAcc-$1")
              .replace(/^gyro([XYZ])/, "fBodyGyro-$1")
              .replace(/^jerkAcc([XYZ])/, "fBodyAccJerk-$1")
              .replace(/^jerkGyro([XYZ])/, "fBodyGyroJerk-$1")
              .replace(/-bandsEnergy-/, "-bandsEnergy()-");
          }
      
          // Correction du bug dans les noms angle
          if (newName === "angle(tBodyAccJerkMean),gravityMean)") {
            newName = "angle(tBodyAccJerkMean,gravityMean)";
          }
      
          // Angles explicites
          const angleMap: Record<string, string> = {
            angleAccGravity: "angle(tBodyAccMean,gravity)",
            angleJerkAccGravity: "angle(tBodyAccJerkMean,gravityMean)",
            angleGyroGravity: "angle(tBodyGyroMean,gravityMean)",
            angleJerkGyroGravity: "angle(tBodyGyroJerkMean,gravityMean)",
            angleXGravity: "angle(X,gravityMean)",
            angleYGravity: "angle(Y,gravityMean)",
            angleZGravity: "angle(Z,gravityMean)"
          };
          if (newName in angleMap) newName = angleMap[newName];
      
          // Standardiser les noms
          newName = newName.replace(/-(mean|std|min|max|energy|entropy|sma|iqr|skewness|kurtosis|meanFreq|mad|maxInds)(?!\()/g, "-$1()");
      
          return { name: newName, value };
        });
      }
      
      
    
      
      const fBodyGyroMag = computeDerivedSignals(gyro).magJerk; // pour être cohérent avec fBodyGyroMag
      const meanAbsDev = (arr: number[]) => {
        const m = mean(arr);
        return arr.reduce((s, x) => s + Math.abs(x - m), 0) / arr.length;
      };

      const gyroMagMissingFeatures = [
        {
          name: 'fBodyBodyGyroMag-mad()',
          value: meanAbsDev(fBodyGyroMag)
        }
      ];

      // ArCoeff sur signaux 1D (ordre 4)
      const computeARCoeff2 = (signal: number[]): number => {
        const m = mean(signal);
        const centered = signal.map(x => x - m);
        const N = centered.length;
        if (N <= 2) return 0;
        const num = centered.slice(0, N - 2).reduce((sum, x, i) => sum + x * centered[i + 2], 0);
        const denom = centered.slice(0, N - 2).reduce((sum, x) => sum + x * x, 0);
        return denom !== 0 ? num / denom : 0;
      };

      const arCoeffScalarFeatures = [
        { name: 'tBodyAccJerkMag-arCoeff()2', value: computeARCoeff2(magJerkAcc) },
        { name: 'tBodyGyroJerkMag-arCoeff()2', value: computeARCoeff2(magJerkGyro) },
        { name: 'tGravityAccMag-arCoeff()2', value: computeARCoeff2(magAcc) }
      ];

      const mad = (arr: number[]) => {
        const m = mean(arr);
        return arr.reduce((s, x) => s + Math.abs(x - m), 0) / arr.length;
      };
      
      const fftMadFeatures = [
        // fBodyAcc
        { name: 'fBodyAcc-mad()-X', value: mad(acc.map(v => v[0])) },
        { name: 'fBodyAcc-mad()-Y', value: mad(acc.map(v => v[1])) },
        { name: 'fBodyAcc-mad()-Z', value: mad(acc.map(v => v[2])) },
      
        // fBodyGyro
        { name: 'fBodyGyro-mad()-X', value: mad(gyro.map(v => v[0])) },
        { name: 'fBodyGyro-mad()-Y', value: mad(gyro.map(v => v[1])) },
        { name: 'fBodyGyro-mad()-Z', value: mad(gyro.map(v => v[2])) },
      
        // fBodyAccJerk
        { name: 'fBodyAccJerk-mad()-X', value: mad(jerkAcc.map(v => v[0])) },
        { name: 'fBodyAccJerk-mad()-Y', value: mad(jerkAcc.map(v => v[1])) },
        { name: 'fBodyAccJerk-mad()-Z', value: mad(jerkAcc.map(v => v[2])) },
      
        // fBodyGyroJerk
        { name: 'fBodyGyroJerk-mad()-X', value: mad(jerkGyro.map(v => v[0])) },
        { name: 'fBodyGyroJerk-mad()-Y', value: mad(jerkGyro.map(v => v[1])) },
        { name: 'fBodyGyroJerk-mad()-Z', value: mad(jerkGyro.map(v => v[2])) },
      ];

      const fftMaxIndsFeatures = [
        { name: 'fBodyAcc-maxInds-X', value: maxFreqIndex(acc.map(v => v[0])) },
        { name: 'fBodyAcc-maxInds-Y', value: maxFreqIndex(acc.map(v => v[1])) },
        { name: 'fBodyAcc-maxInds-Z', value: maxFreqIndex(acc.map(v => v[2])) },
      
        { name: 'fBodyGyro-maxInds-X', value: maxFreqIndex(gyro.map(v => v[0])) },
        { name: 'fBodyGyro-maxInds-Y', value: maxFreqIndex(gyro.map(v => v[1])) },
        { name: 'fBodyGyro-maxInds-Z', value: maxFreqIndex(gyro.map(v => v[2])) },
      
        { name: 'fBodyAccJerk-maxInds-X', value: maxFreqIndex(jerkAcc.map(v => v[0])) },
        { name: 'fBodyAccJerk-maxInds-Y', value: maxFreqIndex(jerkAcc.map(v => v[1])) },
        { name: 'fBodyAccJerk-maxInds-Z', value: maxFreqIndex(jerkAcc.map(v => v[2])) },
      
        { name: 'fBodyGyroJerk-maxInds-X', value: maxFreqIndex(jerkGyro.map(v => v[0])) },
        { name: 'fBodyGyroJerk-maxInds-Y', value: maxFreqIndex(jerkGyro.map(v => v[1])) },
        { name: 'fBodyGyroJerk-maxInds-Z', value: maxFreqIndex(jerkGyro.map(v => v[2])) }
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
        ...bandFeatures,
        ...angleFeatures,
        ...maxIndsFeatures,
        ...fftAccFeatures,
        ...fftGyroFeatures,
        ...fftJerkAccFeatures,
        ...fftJerkGyroFeatures,
        ...fftMagFeatures,
        ...skewKurtFeatures,
        ...tGravityAccMagFeatures,
        ...gyroMagMissingFeatures,
        ...arCoeffScalarFeatures,
        ...fftMadFeatures,
        ...fftMaxIndsFeatures,
        ...finalMissingFeatures
      ];
     
      // Supprimer les doublons en gardant le premier
      const uniqueMap = new Map<string, number>();
      for (const f of allFeatures) {
        if (!uniqueMap.has(f.name) && typeof f.value === 'number' && !isNaN(f.value)) {
          uniqueMap.set(f.name, f.value);
        }
      }
      
      
      const uniqueFeatures = Array.from(uniqueMap, ([name, value]) => ({ name, value }));

      const renamedFeatures = renameToUCINames(uniqueFeatures);

      const bannedSuffixes = [
        "-bandsEnergy()-1,8",
        "-bandsEnergy()-1,16",
        "-bandsEnergy()-1,24",
        "-bandsEnergy()-17,24"
      ];
      
      const bannedExtraNames = [
        "angle(tBodyAccJerkMean,gravityMean)",
        "fBodyAcc-X-bandsEnergy()-1,16",
        "fBodyAcc-X-bandsEnergy()-1,24",
        "fBodyAcc-X-bandsEnergy()-1,32",
        "fBodyAcc-X-bandsEnergy()-1,33",
        "fBodyAcc-X-bandsEnergy()-1,48",
        "fBodyAcc-X-bandsEnergy()-1,64",
        "fBodyAcc-Y-bandsEnergy()-1,32",
        "fBodyAcc-Z-bandsEnergy()-1,32",
        "fBodyAcc-Y-bandsEnergy()-1,33",
        "fBodyAcc-Z-bandsEnergy()-1,33"
      ];
      
      
      const filteredFinal = renamedFeatures.filter(f =>
        !(
          (
            (f.name.startsWith("fBodyAcc-X") ||
             f.name.startsWith("fBodyAcc-Y") ||
             f.name.startsWith("fBodyAcc-Z"))
            && bannedSuffixes.some(suffix => f.name.endsWith(suffix))
          ) || bannedExtraNames.includes(f.name)
        )
      );
      
      setFeatures(filteredFinal);
      
      
      //console.log('📤 Export des features :');
      //console.log(renamedFeatures.map(f => `${f.name}`).join('\n'));
      //console.log(filteredFinal.map((f, i) => `${i + 1} ${f.name}`).join('\n'));
      
      
      //setFeatures(renamedFeatures);

      /*console.log('🔢 Nombre total de features calculées :', allFeatures.length);
      console.log("⚠️ Duplicates détectés :", allFeatures.length - uniqueFeatures.length ? allFeatures.filter((f, i, arr) => arr.findIndex(x => x.name === f.name) !== i).map(f => f.name) : "aucun");
      console.log("🧮 Total unique:", filteredFinal.length);*/
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

export function computeBandsEnergyUCIHAR(signal: number[]): { name: string, value: number }[] {
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
    [0, 7], [8, 15], [16, 23], [24, 31], [32, 39], [40, 47], [48, 55], [56, 63],
    [0, 15], [16, 31], [32, 47], [48, 63],
    [0, 23], [24, 47],
    [0, 31], [32, 63],
    [0, 47],
    [0, 63],
    [8, 23], [24, 39], [40, 55],
    [8, 31], [32, 55], [8, 47],
    [16, 39], [24, 55], [16, 47], [24, 63], [16, 63],
    [33, 63], [0, 32]
  ];  // ✅ Total: 33 bandes
  
  
  
  
  
  

  
  const features: { name: string, value: number }[] = [];

  bands.forEach(([start, end], i) => {
    if (end < spectrum.length) {
      const energy = spectrum.slice(start, end + 1).reduce((sum, val) => sum + val, 0);
      features.push({
        name: `bandsEnergy-${start + 1},${end + 1}`,
        value: energy
      });
    } else {
      console.log(`❌ Skipped band [${start}, ${end}] (spectrum too short, spectrum.length=${spectrum.length})`);
    }
  });

  return features;
}

function angleBetweenVectors(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
  if (normA === 0 || normB === 0) return 0;
  const cos = dot / (normA * normB);
  return Math.acos(Math.min(Math.max(cos, -1), 1)); // Clamp to [-1, 1]
}

function maxFreqIndex(signal: number[]): number {
  const N = signal.length;
  if (N === 0) return 0;

  const spectrum = Array(Math.floor(N / 2)).fill(0);
  for (let k = 0; k < spectrum.length; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(angle);
      im -= signal[n] * Math.sin(angle);
    }
    spectrum[k] = Math.sqrt(re ** 2 + im ** 2);
  }

  let max = -Infinity, idx = 0;
  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i] > max) {
      max = spectrum[i];
      idx = i;
    }
  }
  return idx + 1; // pour commencer à 1 comme dans UCI HAR
}

function computeMaxIndsFromFFT(signal: number[]): number {
  const N = signal.length;
  if (N === 0) return 0;

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

  let maxVal = -Infinity;
  let maxIndex = 0;

  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i] > maxVal) {
      maxVal = spectrum[i];
      maxIndex = i + 1; // 1-based index like UCI HAR
    }
  }

  return maxIndex;
}

function computeFFTStats(signal: number[], label: string): { name: string, value: number }[] {
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

  const mean = spectrum.reduce((a, b) => a + b, 0) / spectrum.length;
  const std = Math.sqrt(spectrum.reduce((s, v) => s + (v - mean) ** 2, 0) / spectrum.length);
  const totalEnergy = spectrum.reduce((a, b) => a + b, 0);
  const meanFreq = spectrum.reduce((sum, val, i) => sum + i * val, 0) / totalEnergy;
  const skewness = spectrum.reduce((s, x) => s + ((x - mean) / std) ** 3, 0) / spectrum.length;
  const kurtosis = spectrum.reduce((s, x) => s + ((x - mean) / std) ** 4, 0) / spectrum.length;

  return [
    { name: `${label}-mean`, value: mean },
    { name: `${label}-std`, value: std },
    { name: `${label}-meanFreq`, value: meanFreq },
    { name: `${label}-skewness`, value: skewness },
    { name: `${label}-kurtosis`, value: kurtosis }
  ];
}

function computeMeanVector(data: number[][]): number[] {
  const n = data.length;
  if (n === 0) return [0, 0, 0];
  const sum = data.reduce((acc, cur) => acc.map((v, i) => v + cur[i]), [0, 0, 0]);
  return sum.map(v => v / n);
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  item: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  name: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: 'bold' },
});
