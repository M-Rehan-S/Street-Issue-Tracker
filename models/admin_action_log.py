import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func
from extensions import db


class ReportAuditLog(db.Model):
    __tablename__ = 'ReportAuditLog'

    LogID           = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    SuperAdminID    = db.Column(UUID(as_uuid=True), db.ForeignKey('User.UserID'))
    TargetAdminID   = db.Column(UUID(as_uuid=True))
    Action          = db.Column(db.String(255))  # e.g., 'StatusChange', 'CommentAdded'
    Timestamp       = db.Column(db.DateTime, server_default=func.now())
