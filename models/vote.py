import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func
from extensions import db

class Vote(db.Model):
    __tablename__ = 'Vote'

    VoteID    = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    UserID    = db.Column(UUID(as_uuid=True), db.ForeignKey('User.UserID'))
    ReportID  = db.Column(UUID(as_uuid=True), db.ForeignKey('Report.ReportID'))
    Timestamp = db.Column(db.DateTime, server_default=func.now())

    __table_args__ = (
        db.UniqueConstraint('UserID', 'ReportID', name='unique_user_vote'),
    )
