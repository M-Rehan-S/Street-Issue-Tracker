from flask import Blueprint, request, jsonify, session, current_app
from extensions import db
from services import get_ml_service, get_nearby_duplicates
from models import User, Report, Vote
from werkzeug.utils import secure_filename
from sqlalchemy import text
import os


api_bp = Blueprint('api', __name__)


def _require_login():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Not logged in.'})
    return None


def _require_super_admin():
    err = _require_login()
    if err:
        return err
    if session.get('role', '').lower() != 'SuperAdmin'.lower():
        return jsonify({'success': False, 'error': 'Access denied.'})
    return None

def _require_admin():
    err = _require_login()
    if err:
        return err
    if session.get('role', '').lower() != 'Admin'.lower() and session.get('role', '').lower() != 'SuperAdmin'.lower():
        return jsonify({'success': False, 'error': 'Access denied.'})
    return None

# ------------------------------------------------------------------
# ------------------------------------------------------------------ lemme cook

@api_bp.route('/personal-details', methods=['POST'])
def change():
    err = _require_login()
    if err:
        return err

    try:
        data     = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        phone    = data.get('phone', '').strip()
        email    = data.get('email', '').strip()

        if not any([username, password, phone, email]):
            return jsonify({'success': False, 'error': 'At least one field is required.'})

        user_id     = session.get('UID')
        user = User.query.get(user_id)
        if user:
            if username and username != user.Username:
                user.Username = username
            if password:
                user.Password = password
            if phone:
                user.PhoneNumber = phone
            if email:
                user.Email = email
            db.session.commit()

        if username:
            session['username'] = username

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


# ------------------------------------------------------------------
# Report Method
# ------------------------------------------------------------------

@api_bp.route('/report', methods=['POST'])
def report():
    err = _require_login()
    if err:
        return err

    try:
        image      = request.files.get('image')
        model_path = current_app.config['MODEL_PATH']
        ml         = get_ml_service(model_path)
        result     = ml.predict(image.stream)
        latitude   = request.form.get('latitude')
        longitude  = request.form.get('longitude')
        location  = request.form.get('location')
        description = request.form.get('description')

        # Save the report to the database
        if result.get('label') == 'Normal':
            return jsonify({'success': True, **result})  # No need to save normal reports
        
        # Spatial Query running here to check if there's an existing report within some distance
        
        near_reports = get_nearby_duplicates(latitude, longitude, 'Pothole', radius=100)

        if near_reports:
            return jsonify({'success': True, 'message': 'Similar issue reported nearby.', 'nearby_duplicates': near_reports})

        user_id = session.get('UID')
        
        filename = secure_filename(image.filename)
        # This is just a harcocde image url for testing
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        image.save(filepath)
        image_url = f"/{filepath}" 
        new_report = Report(SubmitterID=user_id, Category=result.get('label'),
                            AIConfidenceScore=result.get('confidence'),
                            Status=('Reported' if result.get('confidence')<80 else 'Inspected'),
                            Latitude=latitude, Longitude=longitude, Location = location,
                            ImageURL = image_url, Description = description)
        db.session.add(new_report)
        db.session.commit()
        return jsonify({'success': True, **result, 'nearby_duplicates': []})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@api_bp.route('/report/<uuid:report_id>/status', methods=['PATCH'])
def update_report_status(report_id):
    data = request.get_json()

    if not data or 'status' not in data:
        return jsonify({"success": False, "error": "Missing status data"}), 400

    new_status = data.get('status')

    try:
        report = Report.query.filter(Report.ReportID == report_id).first()
        if not report:
            return jsonify({'success': False, 'error': 'Report Not Found'})
        # Convert the UUID object to a string explicitly
        admin_id_str = str(session.get('UID'))

        # Use the quote format required by SET LOCAL
        db.session.execute(
            text("SELECT set_config('app.current_admin_id', :admin_id, true)"),
            {'admin_id': admin_id_str}
        )
        report.Status = new_status
        db.session.commit()
        print(f"Updating Report {report_id} to {new_status}") 

        return jsonify({
            "success": True, 
            "message": f"Status updated to {new_status}"
        }), 200


    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ------------------------------------------------------------------
# Admin — role management
# ------------------------------------------------------------------

@api_bp.route('/get-roles')
def get_roles():
    err = _require_super_admin()
    if err:
        return err

    try:
        roles = [{'id' : 1, 'name' : 'Admin'}]       
        return jsonify({'success': True, 'roles': roles})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@api_bp.route('/add-member', methods=['POST'])
def add_member():
    err = _require_super_admin()
    if err:
        return err

    try:
        data     = request.get_json()
        username = data.get('username', '').strip()
        cnic     = data.get('cnic', '').strip()
        role_name  = data.get('role_name', '').strip()
        passcode = data.get('passcode', '').strip()
        email    = data.get('email', '').strip()
        phone    = data.get('phoneNo', '').strip()

        if not all([username, cnic, role_name, passcode, email, phone]):
            return jsonify({'success': False, 'error': 'All fields are required.'})

        if User.query.filter((User.Name == username) | (User.CNIC == cnic)).first():
            return jsonify({'success': False, 'error': 'Username or CNIC already exists.'})
        
        db.session.add(User(Name = username, CNIC = cnic, PasswordHash = passcode, Role = role_name, Email = email, PhoneNumber = phone))
        db.session.commit()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@api_bp.route('/reports')
def reports():
    err = _require_login()
    if err:
        return err
    try:
        reports = Report.query.order_by(Report.VoteCount.desc()).limit(10).all()
        print('Reports count', len(reports))
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    return jsonify({'success': True, 'reports': [
        {
            'ReportID': r.ReportID,
            'SubmitterID': r.SubmitterID,
            'Category': r.Category,
            'AIConfidenceScore': r.AIConfidenceScore,
            'Status': r.Status,
            'CreatedAt': r.CreatedAt.isoformat(sep=' ', timespec='minutes'),
            'VoteCount': r.VoteCount, 
            'Description': r.Description,
            'Location': r.Location, 
            'ImageURL': r.ImageURL
        } for r in reports
    ]})

@api_bp.route('/inspection/reports')
def inspection_routes():
    err = _require_admin()
    if err:
        return err
    try:
        session.get('UID')
        reports = Report.query.filter(Report.Status == 'Reported', Report.AIConfidenceScore < 80).order_by(Report.CreatedAt.asc()).all()

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    return jsonify({'success': True, 'reports': [
        {
            'ReportID': r.ReportID,
            'SubmitterID': r.SubmitterID,
            'Category': r.Category,
            'AIConfidenceScore': r.AIConfidenceScore,
            'Status': r.Status,
            'CreatedAt': r.CreatedAt.isoformat(sep=' ', timespec='minutes'),
            'VoteCount': r.VoteCount, 
            'Description': r.Description,
            'Location': r.Location, 
            'ImageURL': r.ImageURL
        } for r in reports
    ]})

@api_bp.route('/manage-admins/list')
def list_admins():
    err = _require_super_admin()
    if err:
        return err
    try:
        admins = User.query.filter(User.Role == 'Admin').all()
        return jsonify({'success': True, 'admins': [
            {
                'username' : a.Name,
                'cnic' : a.CNIC,
                'email' : a.Email,
                'phone' : a.PhoneNumber,
                'uid' : a.UserID
            } for a in admins
        ]})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    
@api_bp.route('/inspection/override/<uuid:report_id>', methods=['POST'])
def override_inspection(report_id):
    err = _require_super_admin()
    if err:
        return err
    try:
        report = Report.query.get(report_id)
        if report:
            report.Status = 'Inspected'
            db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    
@api_bp.route('/vote/<uuid:report_id>', methods=['POST'])
def vote(report_id):
    err = _require_login()
    if err:
        return err
    try:
        report = Report.query.get(report_id)
        report.VoteCount = (report.VoteCount or 0) + 1
        db.session.commit()
        user_id = session.get('UID')
        new_vote = Vote(ReportID=report_id, UserID=user_id)
        db.session.add(new_vote)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Vote added.'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
@api_bp.route('/vote/<uuid:report_id>', methods=['DELETE'])
def remove_vote(report_id):
    err = _require_login()
    if err:
        return err
    try:
        report = Report.query.get(report_id)
        report.VoteCount = max(0, (report.VoteCount or 1) - 1)
        db.session.commit()
        user_id = session.get('UID')
        vote = Vote.query.filter_by(ReportID=report_id, UserID=user_id).first()
        if vote:
            db.session.delete(vote)
            db.session.commit()
        return jsonify({'success': True, 'message': 'Vote removed.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})