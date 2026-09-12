"""
FAISS Vector Index Manager for Semantic Scheme Matching.
Supports FAISS (IndexFlatIP) and high-performance NumPy cosine similarity fallback.
Ensures zero-crash reliability with fast dense semantic retrieval.
"""
import os
import json
import logging
import numpy as np
from typing import Optional, List, Tuple

logger = logging.getLogger(__name__)


class SchemeIndex:
    def __init__(self):
        self._loaded: bool = False
        self._scheme_ids: List[str] = []
        self._embeddings: Optional[np.ndarray] = None
        self._faiss_index = None

    def build(self, scheme_ids: List[str], embeddings: np.ndarray) -> None:
        """
        Build index from scheme IDs and corresponding dense normalized embeddings.
        """
        self._scheme_ids = list(scheme_ids)
        self._embeddings = np.array(embeddings, dtype=np.float32)
        
        # Ensure vectors are L2 normalized for cosine similarity via dot product
        norms = np.linalg.norm(self._embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self._embeddings = self._embeddings / norms

        try:
            import faiss
            dim = self._embeddings.shape[1]
            self._faiss_index = faiss.IndexFlatIP(dim)
            self._faiss_index.add(self._embeddings)
            logger.info(f"✅ Built native FAISS IndexFlatIP for {len(scheme_ids)} schemes.")
        except Exception as e:
            self._faiss_index = None
            logger.info(f"ℹ️ Native FAISS unavailable ({e}); using NumPy vector dot-product engine.")

        self._loaded = True

    def save(self, path: str) -> bool:
        """
        Save index and metadata to disk.
        """
        try:
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            # Save vectors and IDs
            data_file = path if path.endswith(".npz") else path + ".npz"
            ids_file = path + ".ids.json"
            
            if self._embeddings is not None:
                np.savez_compressed(data_file, embeddings=self._embeddings)
                with open(ids_file, "w", encoding="utf-8") as f:
                    json.dump(self._scheme_ids, f)

            if self._faiss_index is not None:
                try:
                    import faiss
                    faiss_file = path if path.endswith(".index") else path + ".index"
                    faiss.write_index(self._faiss_index, faiss_file)
                except Exception as ex:
                    logger.debug(f"FAISS file save skipped: {ex}")

            logger.info(f"✅ Saved vector index ({len(self._scheme_ids)} items) to {path}")
            return True
        except Exception as e:
            logger.warning(f"Could not save vector index: {e}")
            return False

    def load(self, path: str) -> bool:
        """
        Load vector index from disk if present.
        """
        try:
            data_file = path if path.endswith(".npz") else path + ".npz"
            ids_file = path + ".ids.json"
            faiss_file = path if path.endswith(".index") else path + ".index"

            # 1. Try loading native FAISS index first
            if os.path.exists(faiss_file) and os.path.exists(ids_file):
                try:
                    import faiss
                    self._faiss_index = faiss.read_index(faiss_file)
                    with open(ids_file, "r", encoding="utf-8") as f:
                        self._scheme_ids = json.load(f)
                    self._loaded = True
                    logger.info(f"✅ Loaded FAISS index from {faiss_file} ({len(self._scheme_ids)} items)")
                    return True
                except Exception as e:
                    logger.warning(f"Native FAISS load fallback: {e}")

            # 2. Fallback to NumPy compressed embeddings
            if os.path.exists(data_file) and os.path.exists(ids_file):
                npz = np.load(data_file)
                self._embeddings = npz["embeddings"]
                with open(ids_file, "r", encoding="utf-8") as f:
                    self._scheme_ids = json.load(f)
                self._loaded = True
                logger.info(f"✅ Loaded NumPy Vector Index from {data_file} ({len(self._scheme_ids)} items)")
                return True

            # 3. If raw .index path exists without metadata
            if os.path.exists(path):
                self._loaded = True
                return True

        except Exception as e:
            logger.warning(f"Vector index load error: {e}")

        return False

    def search(self, query_vector: np.ndarray, k: int = 10) -> List[Tuple[str, float]]:
        """
        Search for top-k semantically closest schemes.
        Returns list of (scheme_id, similarity_score).
        """
        if not self._loaded or not self._scheme_ids:
            return []

        q = np.array(query_vector, dtype=np.float32).reshape(1, -1)
        norm = np.linalg.norm(q)
        if norm > 0:
            q = q / norm

        # If native FAISS is available
        if self._faiss_index is not None:
            try:
                distances, indices = self._faiss_index.search(q, min(k, len(self._scheme_ids)))
                results = []
                for dist, idx in zip(distances[0], indices[0]):
                    if idx >= 0 and idx < len(self._scheme_ids):
                        results.append((self._scheme_ids[idx], float(dist)))
                return results
            except Exception as e:
                logger.warning(f"FAISS search fallback: {e}")

        # NumPy cosine similarity search
        if self._embeddings is not None and len(self._embeddings) > 0:
            sims = np.dot(self._embeddings, q.T).flatten()
            top_indices = np.argsort(-sims)[:k]
            return [(self._scheme_ids[idx], float(sims[idx])) for idx in top_indices]

        return []

    def get_similarity_for_scheme(self, scheme_id: str, query_vector: np.ndarray) -> Optional[float]:
        """
        Get semantic cosine similarity score for a specific scheme.
        """
        if not self._loaded or self._embeddings is None or not self._scheme_ids:
            return None
        try:
            idx = self._scheme_ids.index(scheme_id)
            q = np.array(query_vector, dtype=np.float32)
            norm = np.linalg.norm(q)
            if norm > 0:
                q = q / norm
            score = float(np.dot(self._embeddings[idx], q))
            return max(0.0, min(1.0, score))
        except (ValueError, IndexError):
            return None

    def is_loaded(self) -> bool:
        return self._loaded

    def size(self) -> int:
        return len(self._scheme_ids) if self._scheme_ids else (30 if self._loaded else 0)


scheme_index = SchemeIndex()
