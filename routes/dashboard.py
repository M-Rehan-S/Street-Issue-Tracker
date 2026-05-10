from flask import Blueprint, render_template, redirect, url_for, flash, session

dashboard_bp = Blueprint('dashboard', __name__)


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


@dashboard_bp.route('/report-issue')
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
    if session.get('role', '').lower() != 'super admin':
        flash("Access denied. Admins only.")
        return redirect(url_for('dashboard.dashboard'))
    return render_template('members.html')