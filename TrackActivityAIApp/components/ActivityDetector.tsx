import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

// @ts-ignore
const modelJson = require('../assets/model_tfjs/model.json');
// @ts-ignore
const modelWeights = [require('../assets/model_tfjs/group1-shard1of1.bin')];

export default function ActivityDetector() {
  const [modelReady, setModelReady] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('📱 Plateforme :', Platform.OS);
    
        if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
          console.warn('❌ rn-webgl non supporté sur cette plateforme');
          return;
        }
    
        const availableBackends = tf.engine().registry;
        console.log('🧠 Backends disponibles :', availableBackends);
    
        await tf.setBackend('rn-webgl');
        await tf.ready();
    
        console.log('✅ Backend actif :', tf.getBackend());
    
        const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
        console.log('✅ Modèle chargé');
    
        setModelReady(true);
    
        const input = tf.tensor2d([Array(561).fill(0)], [1, 561]);
        const output = model.predict(input) as tf.Tensor;
        const result = output.argMax(-1).dataSync()[0];
        console.log('🎯 Résultat prédiction :', result);
        setPrediction(result);
      } catch (error) {
        console.error('❌ Erreur dans le modèle :', error);
      }
    };
    

    loadModel();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Détection d'activité</Text>
      <Text>{modelReady ? `Prédiction : ${prediction}` : 'Chargement du modèle...'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
});
