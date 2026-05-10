from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mysqldb import MySQL
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
mysql = MySQL()
cors = CORS()
