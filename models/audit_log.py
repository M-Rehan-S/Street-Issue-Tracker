import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func
from extensions import db

class AuditLog(db.Model):
    __tablename__ = 'AuditLog'

    LogID           = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    AdminID         = db.Column(UUID(as_uuid=True), db.ForeignKey('User.UserID'))
    ActionPerformed = db.Column(db.String(255))
    TargetReportID  = db.Column(UUID(as_uuid=True))
    Timestamp       = db.Column(db.DateTime, server_default=func.now())
