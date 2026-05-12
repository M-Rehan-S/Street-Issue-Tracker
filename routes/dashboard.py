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
        reports = []
        reports = Report.query.filter_by(SubmitterID=session.get('UID'), Category = 'Pothole').order_by(Report.CreatedAt.desc()).all()
        recent_report = None
        if session.get('role', '').lower() == 'Citizen'.lower():
            recent_report = Report.query.filter_by(SubmitterID=session.get('UID')).order_by(Report.CreatedAt.desc()).first()
        else:
            recent_report = Report.query.order_by(Report.CreatedAt.desc()).first()
        return_reports = [{
            'location': report.Location,
            'category': report.Category,
            'status': report.Status,
            'date': report.CreatedAt.isoformat(sep=' ', timespec='minutes'),
            'image_url': report.ImageURL
        } for report in reports]
        total = Report.query.count()
        trending = Report.query.order_by(Report.VoteCount.desc()).limit(7).all()
        trending_reports = [{
            'location': trending.Location,
            'category': trending.Category,
            'status': trending.Status,
            'date': trending.CreatedAt.isoformat(sep=' ', timespec='minutes'),
            'image_url': trending.ImageURL
        } for trending in trending]
        return jsonify({'success': True, 'your_reports': return_reports, 'stats' : {
            'total': total,
            'fixed': len([r for r in return_reports if r['status'] == 'Resolved']),
            'pending': len([r for r in return_reports if r['status'] == 'InProgress']),
            'open' : len([r for r in return_reports if r['status'] == 'Reported'])
        },
        'recent_report': {
            'location': recent_report.Location,
            'category': recent_report.Category,
            'status': recent_report.Status,
            'date': recent_report.CreatedAt.isoformat(sep=' ', timespec='minutes'),
            'image_url': recent_report.ImageURL
        } if recent_report else None,
        'most_faced' : trending_reports
        }
        )
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


@dashboard_bp.route('/leaderboard')
def leaderboard():
    redir = _login_required()
    if redir:
        return redir
    return render_template('communityLeaderboard.html')


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
