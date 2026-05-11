import os
import numpy as np
from PIL import Image


class MLService:
    """TFLite inference service — tensorflow is imported lazily inside _load().

    Why: TFLite spawns internal threads the moment it is imported. If that
    happens in the master Flask process before the reloader forks a child,
    the child inherits broken thread state and segfaults immediately.
    Keeping the import inside _load() means it only ever runs inside the
    already-forked worker process.
    """

    def __init__(self, model_path: str):
        self.model_path   = model_path
        self._interpreter = None
        self._input_det   = None
        self._output_det  = None

    def _load(self):
        if self._interpreter is not None:
            return

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"TFLite model not found at: {self.model_path}")

        import tensorflow as tf          # deferred — never at module level

        self._interpreter = tf.lite.Interpreter(model_path=self.model_path)
        self._interpreter.allocate_tensors()
        self._input_det  = self._interpreter.get_input_details()
        self._output_det = self._interpreter.get_output_details()

    @staticmethod
    def _preprocess(image_stream) -> np.ndarray:
        img = Image.open(image_stream).convert('RGB').resize((224, 224))
        return np.expand_dims(np.array(img, dtype=np.float32) / 255.0, axis=0)

    def predict(self, image_stream) -> dict:
        self._load()

        img_tensor = self._preprocess(image_stream)
        self._interpreter.set_tensor(self._input_det[0]['index'], img_tensor)
        self._interpreter.invoke()

        probability = float(
            self._interpreter.get_tensor(self._output_det[0]['index'])[0][0]
        )
        label      = 'Pothole' if probability > 0.5 else 'Normal'
        confidence = round(
            probability * 100 if label == 'Pothole' else (1 - probability) * 100, 2
        )
        return {'label': label, 'confidence': confidence}


_service: MLService | None = None

def get_ml_service(model_path: str) -> MLService:
    global _service
    if _service is None:
        _service = MLService(model_path)
    return _service