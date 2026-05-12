from flask import Blueprint, request, redirect, url_for, flash, session
from extensions import db
from models.user import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        username = request.form.get('username')
        password = request.form.get('password')
        cnic     = request.form.get('CNIC')
        email    = request.form.get('email')

        if not username or not password or not cnic or not email:
            flash("All fields are required!")
            return redirect(url_for('dashboard.home'))
        
        if User.query.filter((User.Name == username) | (User.CNIC == cnic)).first():
            flash("Username already exists! OR CNIC Already Registered")
            return redirect(url_for('dashboard.home'))
        print('Me idher aarha hu')
        db.session.add(User(Name = username, CNIC = cnic, PasswordHash = password, Role = 'Citizen'))
        db.session.commit()

        session['logged_in'] = True
        session['username']  = username
        session['role']      = 'Citizen'
        session['UID']       = User.query.filter(User.Name == username).first().UID
        flash("Account created!")

    except Exception as e:
        print(f"DEBUG ERROR: {e}")
        flash(f"Database Error: {str(e)}")

    return redirect(url_for('dashboard.dashboard'))


@auth_bp.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    try:
        user = User.query.filter_by(Name=username, PasswordHash=password).first()
        if user:
            session['logged_in'] = True
            session['username']  = username
            session['role']      = user.Role
            session['UID']       = user.UserID
            return redirect(url_for('dashboard.dashboard'))
    except Exception as e:
        print(f"DEBUG ERROR: {e}")
        flash(f"Database Error: {str(e)}")
        return redirect(url_for('dashboard.home'))

    flash("Login Failed! Check your username or password.")
    return redirect(url_for('dashboard.home'))


@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('dashboard.home'))