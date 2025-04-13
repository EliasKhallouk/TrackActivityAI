import tensorflow as tf

# Charger le modèle .h5
model = tf.keras.models.load_model("UCI HAR Dataset/model.h5")

# Convertir au format TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

# Sauvegarder
with open("model.tflite", "wb") as f:
    f.write(tflite_model)
