import os
import numpy as np
import logging
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.models import Job
from app.services.embedding_service import get_embedding, calculate_similarity

logger = logging.getLogger(__name__)

# Try to import FAISS
FAISS_AVAILABLE = False
try:
    import faiss
    FAISS_AVAILABLE = True
    logger.info("FAISS vector search library loaded successfully.")
except Exception as e:
    logger.warning(f"Failed to load FAISS: {e}. Semantic search will run in NumPy fallback mode.")

class JobVectorIndex:
    def __init__(self):
        self.job_ids: List[str] = []
        self.embeddings: List[List[float]] = []
        self.index = None
        self.dimension = 384  # Dimension of all-MiniLM-L6-v2

    def rebuild(self, db: Session):
        """Fetches all jobs from database and builds the FAISS index."""
        jobs = db.query(Job).all()
        self.job_ids = []
        self.embeddings = []
        
        if not jobs:
            self.index = None
            return
            
        for job in jobs:
            # Create a rich text representation of the job
            job_text = f"Title: {job.title}. Description: {job.description}. Skills required: {job.skills_required}."
            emb = get_embedding(job_text)
            self.job_ids.append(job.id)
            self.embeddings.append(emb)
            
        if not self.embeddings:
            self.index = None
            return
            
        embedding_matrix = np.array(self.embeddings).astype('float32')
        # Normalize vectors for cosine similarity (Inner Product on normalized vectors)
        norms = np.linalg.norm(embedding_matrix, axis=1, keepdims=True)
        # Avoid division by zero
        norms[norms == 0] = 1.0
        normalized_matrix = embedding_matrix / norms
        
        if FAISS_AVAILABLE:
            try:
                # Flat Inner Product index for Cosine Similarity
                self.index = faiss.IndexFlatIP(self.dimension)
                self.index.add(normalized_matrix)
                logger.info(f"FAISS index built successfully with {len(self.job_ids)} jobs.")
            except Exception as e:
                logger.error(f"Error building FAISS index: {e}")
                self.index = None
        else:
            self.index = None

    def search(self, db: Session, query: str, top_k: int = 5) -> List[Tuple[Job, float]]:
        """
        Searches for jobs matching the query text.
        Returns a list of tuples containing (Job, similarity_score).
        """
        if not query:
            return []
            
        query_emb = get_embedding(query)
        q_vec = np.array(query_emb).astype('float32')
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm
            
        # Rebuild index if it's empty but jobs exist
        if not self.job_ids:
            self.rebuild(db)
            
        if not self.job_ids:
            return []
            
        # Search using FAISS if available and built
        if FAISS_AVAILABLE and self.index is not None:
            try:
                # FAISS search returns distances (similarities in IP case) and indexes
                q_vec_expanded = np.expand_dims(q_vec, axis=0)
                similarities, indices = self.index.search(q_vec_expanded, min(top_k, len(self.job_ids)))
                
                results = []
                for score, idx in zip(similarities[0], indices[0]):
                    if idx < 0 or idx >= len(self.job_ids):
                        continue
                    job_id = self.job_ids[idx]
                    job = db.query(Job).filter(Job.id == job_id).first()
                    if job:
                        # Normalize score from [-1, 1] to [0, 1] range for percentages
                        norm_score = float((score + 1) / 2)
                        results.append((job, norm_score))
                return results
            except Exception as e:
                logger.error(f"FAISS search failed, falling back to numpy: {e}")
                
        # NumPy Fallback Search
        results = []
        for job_id, emb in zip(self.job_ids, self.embeddings):
            score = calculate_similarity(query_emb, emb)
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                results.append((job, score))
                
        # Sort by similarity descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

# Singleton instance
vector_index = JobVectorIndex()
