import { Gyroscope } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // Abonnement au gyroscope
    const subscription = Gyroscope.addListener(gyroscopeData => {
      setData(gyroscopeData);
    });

    // Nettoyage à la fin
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Données du gyroscope</Text>
      <Text>x: {roundValue(data.x)}</Text>
      <Text>y: {roundValue(data.y)}</Text>
      <Text>z: {roundValue(data.z)}</Text>

    </View>
  );
}

const roundValue = (value: number) => {
  const precision = 0.01; // seuil
  return Math.abs(value) < precision ? 0 : value.toFixed(3);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    marginVertical: 4,
  },
});
