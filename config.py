import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'secret_key_for_session')

    # SQLAlchemy (PostgreSQL)
    SQLALCHEMY_DATABASE_URI = os.getenv('SQL_ALCHEMY_DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask-MySQLdb (legacy MySQL queries)
    MYSQL_HOST     = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_USER     = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('DB_PASSWORD', '')
    MYSQL_DB       = os.getenv('MYSQL_DB', 'StreetIssueTracker')

    # ML model
    BASE_DIR   = os.path.abspath(os.path.dirname(__file__))
    MODEL_PATH = os.path.join(BASE_DIR, 'model', 'model.tflite')
