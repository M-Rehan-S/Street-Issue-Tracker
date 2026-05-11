import uuid
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy import func
from extensions import db

user_role_enum = ENUM('Citizen', 'Admin', 'SuperAdmin', name='user_role', create_type=False)

class User(db.Model): 
    __tablename__ = 'User'

    UserID         = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    Name           = db.Column(db.String(100))
    Email          = db.Column(db.String(50), unique=True)
    PasswordHash   = db.Column(db.String(255))
    Role           = db.Column(user_role_enum)
    CreatedAt      = db.Column(db.DateTime, server_default=func.now())
    AssignedRegion = db.Column(db.String(100))
    CNIC          = db.Column(db.String(15), unique=True)
    PhoneNumber    = db.Column(db.String(20), nullable=True)

    reports = db.relationship('Report', backref='submitter', lazy=True)