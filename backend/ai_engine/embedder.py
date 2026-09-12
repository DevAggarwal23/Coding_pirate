"""
Embedder — Real sentence-transformers all-MiniLM-L6-v2 (384-dim dense vectors).
Lazy-loads the model on first call so the server starts fast.
Falls back to zero-vector if the library isn't installed (rule-based matching
still works perfectly).
"""
import logging
import numpy as np
from typing import Union, Optional

logger = logging.getLogger(__name__)

# ── Lazy singleton ─────────────────────────────────────────────────────────────
_model = None
_MODEL_NAME = "all-MiniLM-L6-v2"
_DIM = 384


def _get_model():
    """Load the sentence-transformers model once, cache globally."""
    global _model
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(_MODEL_NAME)
        logger.info(f"✅ Loaded embedding model '{_MODEL_NAME}' ({_DIM}-dim)")
        return _model
    except Exception as e:
        logger.warning(f"⚠️  Could not load embedding model: {e}. Using zero-vector fallback.")
        return None


def encode(text: str) -> np.ndarray:
    """
    Generate a 384-dim dense vector for a single text string.
    Returns numpy array (float32).
    """
    model = _get_model()
    if model is None:
        return np.zeros(_DIM, dtype=np.float32)
    try:
        vec = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        return vec.astype(np.float32)
    except Exception as e:
        logger.warning(f"Encoding failed for text of len {len(text)}: {e}")
        return np.zeros(_DIM, dtype=np.float32)


def encode_batch(texts: list[str]) -> np.ndarray:
    """
    Batch-encode a list of strings into an (N, 384) numpy matrix.
    Returns numpy array (float32) — ready for FAISS indexing.
    """
    model = _get_model()
    if model is None:
        return np.zeros((len(texts), _DIM), dtype=np.float32)
    try:
        vecs = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True,
                            batch_size=32, show_progress_bar=False)
        return vecs.astype(np.float32)
    except Exception as e:
        logger.warning(f"Batch encoding failed for {len(texts)} texts: {e}")
        return np.zeros((len(texts), _DIM), dtype=np.float32)
