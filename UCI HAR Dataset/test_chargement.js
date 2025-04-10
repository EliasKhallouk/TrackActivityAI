import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Remplace les chemins par les bons
const modelJson = require('./assets/model_tfjs/model.json');
const modelWeights = [
  require('./assets/model_tfjs/group1-shard1of1.bin')
];

const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
console.log('✅ Modèle chargé !');
