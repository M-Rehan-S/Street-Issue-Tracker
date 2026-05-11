import uuid
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy import func
from extensions import db

report_status_enum = ENUM('Reported', 'Inspected', 'InProgress', 'Resolved', name='report_status', create_type=False)

class ReportAuditLog(db.Model):
    __tablename__ = 'ReportAuditLog'

    LogID           = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    AdminID         = db.Column(UUID(as_uuid=True), db.ForeignKey('User.UserID'))
    ReportID        = db.Column(UUID(as_uuid=True), db.ForeignKey('Report.ReportID'))
    OldStatus       = db.Column(report_status_enum)
    NewStatus       = db.Column(report_status_enum)
    Timestamp       = db.Column(db.DateTime, server_default=func.now())
