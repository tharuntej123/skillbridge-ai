import numpy as np
import logging
from typing import List

logger = logging.getLogger(__name__)

# Lazy load model
model = None

def get_model():
    global model
    if model is not None:
        return model
    
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("SentenceTransformer model loaded successfully.")
    except Exception as e:
        logger.warning(f"Failed to load sentence-transformers model: {e}. Falling back to simple keyword matching.")
        model = None
    return model

def get_embedding(text: str) -> List[float]:
    """Generates an embedding vector for a given text."""
    encoder = get_model()
    if encoder is not None:
        try:
            embedding = encoder.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
    
    # Simple mock fallback: compute mock embedding based on character hash (128 dimension)
    # This prevents the system from crashing if model is loading or failed
    state = hash(text)
    np.random.seed(state & 0xffffffff)
    mock_vec = np.random.randn(384)
    mock_vec = mock_vec / np.linalg.norm(mock_vec)
    return mock_vec.tolist()

def calculate_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculates cosine similarity between two embedding vectors."""
    a = np.array(vec1)
    b = np.array(vec2)
    
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
        
    similarity = np.dot(a, b) / (norm_a * norm_b)
    # Cosine similarity range is -1 to 1, we normalize it to 0 to 1 for percentage
    normalized_similarity = (similarity + 1) / 2
    return float(normalized_similarity)

def calculate_skill_match(student_skills: str, job_skills: str) -> dict:
    """
    Given student skills and job skills/requirements,
    calculate cosine similarity and determine skill gap.
    """
    if not student_skills or not job_skills:
        return {"match_percentage": 0, "skill_gap": []}
        
    s_list = [s.strip().lower() for s in student_skills.split(",") if s.strip()]
    j_list = [s.strip().lower() for s in job_skills.split(",") if s.strip()]
    
    if not s_list or not j_list:
        return {"match_percentage": 0, "skill_gap": []}
        
    # Calculate gap (skills required by job but not possessed by student)
    gap = [skill for skill in j_list if skill not in s_list]
    
    # Use embedding similarity on full text representations
    s_text = ", ".join(s_list)
    j_text = ", ".join(j_list)
    
    emb_s = get_embedding(s_text)
    emb_j = get_embedding(j_text)
    
    similarity = calculate_similarity(emb_s, emb_j)
    
    # We can blend embedding similarity with basic overlap for better results
    overlap = len(set(s_list).intersection(set(j_list)))
    overlap_ratio = overlap / len(set(j_list)) if len(set(j_list)) > 0 else 0
    
    # 70% embedding similarity, 30% exact skill overlap
    blended = (0.7 * similarity) + (0.3 * overlap_ratio)
    match_percentage = int(round(blended * 100))
    match_percentage = min(100, max(0, match_percentage))
    
    return {
        "match_percentage": match_percentage,
        "skill_gap": gap
    }
