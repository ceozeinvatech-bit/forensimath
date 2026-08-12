from dotenv import load_dotenv
import os
from pymongo import MongoClient

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

MONGODB_URI = os.getenv('MONGODB_URI')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'forensimath')

if not MONGODB_URI:
    raise RuntimeError('MONGODB_URI is not set in backend/.env')

client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]

def get_db():
    return db
