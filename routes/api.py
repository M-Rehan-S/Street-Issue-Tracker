from flask import Blueprint, request, jsonify, session, current_app
from extensions import db
from services import get_ml_service
from models import User, Report


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


# ------------------------------------------------------------------
# Personal details
# ------------------------------------------------------------------

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
# ML inference
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

        # Save the report to the database
        if result.get('label') == 'Normal':
            return jsonify({'success': True, **result})  # No need to save normal reports
        user_id = session.get('UID')
        new_report = Report(SubmitterID=user_id, Category=result.get('label'), AIConfidenceScore=result.get('confidence'), Status=('Reported' if result.get('confidence')<80 else 'Inspected'))
        db.session.add(new_report)
        db.session.commit()
        return jsonify({'success': True, **result})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


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
    err = _require_super_admin()
    if err:
        return err
    try:
        uid = session.get('UID')
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