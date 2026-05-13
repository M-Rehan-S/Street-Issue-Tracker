from flask import Blueprint, jsonify, render_template, redirect, url_for, flash, session
dashboard_bp = Blueprint('dashboard', __name__)
from models import Report

def _login_required():
    """Return a redirect if the user is not logged in, else None."""
    if not session.get('logged_in'):
        flash("Please log in first")
        return redirect(url_for('dashboard.home'))
    return None


@dashboard_bp.route('/')
def home():
    return render_template('signup-login.html')


@dashboard_bp.route('/dashboard')
def dashboard():
    redir = _login_required()
    if redir:
        return redir
    return render_template('dashboard.html')

@dashboard_bp.route('/loadDashboard')
def load_dashboard():
    redir = _login_required()
    if redir:
        return redir
    try:
        uid = session.get('UID')
        role = session.get('role', '').lower()

        user_reports = Report.query.filter_by(SubmitterID=uid).order_by(Report.CreatedAt.desc()).all()

        return_reports = [{
            'location': r.Location,
            'category': r.Category,
            'status':   r.Status,
            'date':     r.CreatedAt.isoformat(sep=' ', timespec='minutes'),
            'image_url': r.ImageURL
        } for r in user_reports]

        total   = Report.query.count()
        fixed   = Report.query.filter_by(Status='Resolved').count()
        pending = Report.query.filter_by(Status='InProgress').count()
        open_c  = Report.query.filter_by(Status='Reported').count()

        if role == 'citizen':
            recent_report = Report.query.filter_by(SubmitterID=uid).order_by(Report.CreatedAt.desc()).first()
        else:
            recent_report = Report.query.order_by(Report.CreatedAt.desc()).first()

        trending_qs = Report.query.filter(Report.VoteCount > 0).order_by(Report.VoteCount.desc()).limit(7).all()
        trending_reports = [{
            'location':  tr.Location,
            'category':  tr.Category,
            'status':    tr.Status,
            'date':      tr.CreatedAt.isoformat(sep=' ', timespec='minutes'),
            'image_url': tr.ImageURL
        } for tr in trending_qs]

        return jsonify({
            'success': True,
            'your_reports': return_reports,
            'stats': {
                'total':   total,
                'fixed':   fixed,    
                'pending': pending,  
                'open':    open_c    
            },
            'recent_report': {
                'location':  recent_report.Location,
                'category':  recent_report.Category,
                'status':    recent_report.Status,
                'date':      recent_report.CreatedAt.isoformat(sep=' ', timespec='minutes'),
                'image_url': recent_report.ImageURL
            } if recent_report else None,
            'most_faced': trending_reports
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@dashboard_bp.route('/report-issue', methods=['GET'])
def report_issue():
    redir = _login_required()
    if redir:
        return redir
    return render_template('reportIssue.html')


@dashboard_bp.route('/all-reports')
def all_reports():
    redir = _login_required()
    if redir:
        return redir
    return render_template('allReports.html')


@dashboard_bp.route('/resolved')
def resolved():
    redir = _login_required()
    if redir:
        return redir
    return render_template('Resolved.html')

@dashboard_bp.route('/settings')
def settings():
    redir = _login_required()
    if redir:
        return redir
    return render_template('settings.html')


@dashboard_bp.route('/add-member', methods=['GET'])
def add_member_page():
    if not session.get('logged_in'):
        return redirect(url_for('dashboard.home'))
    if session.get('role', '').lower() != 'SuperAdmin'.lower():
        flash("Access denied. Admins only.")
        return redirect(url_for('dashboard.dashboard'))
    return render_template('members.html')

@dashboard_bp.route('/manage-admins')
def manage_admins():
    if not session.get('logged_in'):
        return redirect(url_for('dashboard.home'))
    if session.get('role', '').lower() != 'SuperAdmin'.lower():
        flash("Access denied. Admins only.")
        return redirect(url_for('dashboard.dashboard'))
    return render_template('manageAdmins.html')

@dashboard_bp.route('/inspection')
def inspection():
    if not session.get('logged_in'):
        return redirect(url_for('dashboard.home'))
    if session.get('role', '').lower() == 'Citizen'.lower():
        flash("Access denied.")
        return redirect(url_for('dashboard.dashboard'))
    return render_template('inspection.html')