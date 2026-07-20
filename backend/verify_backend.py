import sys
import os
import unittest

# Append workspace path to system path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class TestSkillBridgeBackend(unittest.TestCase):
    def test_imports(self):
        """Verify that all core modules import successfully."""
        try:
            from app.config import settings
            from app.db.session import engine, Base, SessionLocal, get_db
            from app.models.models import User, Profile, Job, Application, SkillMatch, LearningRoadmap
            from app.schemas.schemas import UserRegister, UserLogin
            from app.services.auth_service import get_password_hash, verify_password, create_access_token
            from app.services.embedding_service import get_embedding, calculate_similarity, calculate_skill_match
            from app.services.vector_search import vector_index
            from app.services.gemini_service import get_career_guidance, generate_learning_roadmap
            
            print("[+] All modules imported successfully!")
        except ImportError as e:
            self.fail(f"Import failed: {e}")

    def test_database_and_models(self):
        """Verify that DB tables are created and relationships exist."""
        from app.db.session import engine, Base, SessionLocal
        from app.models.models import User, Profile, Job
        
        # Build tables in SQLite (temporary check)
        Base.metadata.create_all(bind=engine)
        
        db = SessionLocal()
        try:
            # Check user insert
            test_user = User(email="test_student@example.com", hashed_password="hashed_dummy", role="student")
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            
            # Check profile link
            profile = Profile(user_id=test_user.id, name="Test Candidate", skills="Python, SQL")
            db.add(profile)
            db.commit()
            
            # Verify retrieval
            user_retrieved = db.query(User).filter(User.email == "test_student@example.com").first()
            self.assertIsNotNone(user_retrieved)
            self.assertEqual(user_retrieved.profile.name, "Test Candidate")
            
            print("[+] Database tables and relationships validated successfully.")
            
            # Clean up
            db.delete(profile)
            db.delete(test_user)
            db.commit()
        except Exception as e:
            db.rollback()
            self.fail(f"Database validation failed: {e}")
        finally:
            db.close()

    def test_skill_matching(self):
        """Verify Sentence-BERT math matching and token overlay functions."""
        from app.services.embedding_service import calculate_skill_match
        
        # Test exact match
        res_exact = calculate_skill_match("Python, React", "Python, React")
        self.assertEqual(res_exact["match_percentage"], 100)
        self.assertEqual(len(res_exact["skill_gap"]), 0)
        
        # Test partial match
        res_partial = calculate_skill_match("Python, SQL", "Python, React, AWS")
        self.assertTrue(0 < res_partial["match_percentage"] < 100)
        self.assertIn("react", res_partial["skill_gap"])
        self.assertIn("aws", res_partial["skill_gap"])
        
        print(f"[+] Skill matching verified. Partial match ratio: {res_partial['match_percentage']}%")

    def test_faiss_search(self):
        """Verify FAISS vector index builder and query scanning."""
        from app.db.session import SessionLocal, Base, engine
        from app.models.models import User, Job
        from app.services.vector_search import vector_index
        
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        
        try:
            # Add temp employer and jobs
            emp = User(email="emp@example.com", hashed_password="hashed_dummy", role="freelancer")
            db.add(emp)
            db.commit()
            db.refresh(emp)
            
            job1 = Job(owner_id=emp.id, title="Frontend Dev", description="React, Tailwind, HTML", skills_required="React", budget=1000)
            job2 = Job(owner_id=emp.id, title="AI Engineer", description="Python, PyTorch, Gemini, FAISS", skills_required="Python", budget=2000)
            db.add(job1)
            db.add(job2)
            db.commit()
            
            # Rebuild index
            vector_index.rebuild(db)
            
            # Query semantic search
            results = vector_index.search(db, "AI internship", top_k=2)
            self.assertTrue(len(results) > 0)
            self.assertEqual(results[0][0].title, "AI Engineer") # Top match should be the AI Engineer job
            
            print(f"[+] FAISS search verified. Top Match: {results[0][0].title} with score {results[0][1]:.2f}")
            
            # Cleanup
            db.delete(job1)
            db.delete(job2)
            db.delete(emp)
            db.commit()
        except Exception as e:
            db.rollback()
            self.fail(f"FAISS search test failed: {e}")
        finally:
            db.close()

if __name__ == "__main__":
    with open("test_results.txt", "w", encoding="utf-8") as f:
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        sys.stdout = f
        sys.stderr = f
        try:
            runner = unittest.TextTestRunner(stream=f, verbosity=2)
            unittest.main(testRunner=runner, exit=False)
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr

