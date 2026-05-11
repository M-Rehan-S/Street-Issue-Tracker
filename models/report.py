import uuid
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy import func
from extensions import db

report_status_enum = ENUM(
    'Reported', 'Inspected', 'In Progress', 'Resolved',
    name='report_status', create_type=False
)

class Report(db.Model):
    __tablename__ = 'Report'

    ReportID             = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    SubmitterID          = db.Column(UUID(as_uuid=True), db.ForeignKey('User.UserID'))
    ImageURL             = db.Column(db.Text)
    Category             = db.Column(db.String(50))
    Location            = db.Column(db.String(255))
    Latitude             = db.Column(db.Numeric(9, 6))
    Longitude            = db.Column(db.Numeric(9, 6))
    Status               = db.Column(report_status_enum, default='Reported')
    AIConfidenceScore    = db.Column(db.Float)
    VoteCount            = db.Column(db.Integer, default=0)
    CreatedAt            = db.Column(db.DateTime, server_default=func.now())
    UpdatedAt            = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())
    ExpectedTimeOfArrival = db.Column(db.DateTime)
    Description          = db.Column(db.Text)
