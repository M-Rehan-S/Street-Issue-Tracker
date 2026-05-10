from flask import Blueprint, request, redirect, url_for, flash, session
from extensions import mysql

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        username = request.form.get('username')
        password = request.form.get('password')
        cnic     = request.form.get('CNIC')

        cur = mysql.connection.cursor()
        cur.execute(
            "SELECT * FROM Users WHERE Username = %s OR CNIC = %s",
            (username, cnic)
        )
        if cur.fetchone():
            flash("Username already exists! OR CNIC Already Registered")
            cur.close()
            return redirect(url_for('dashboard.home'))

        cur.execute(
            "INSERT INTO Users(Username, Password, CNIC, RID) VALUES(%s, %s, %s, %s)",
            (username, password, cnic, '1')
        )
        mysql.connection.commit()
        cur.close()

        cur2 = mysql.connection.cursor()
        cur2.execute(
            "SELECT UID, R_Name, Username FROM Users u "
            "INNER JOIN Role r ON r.RID = u.RID WHERE Username = %s",
            (username,)
        )
        info = cur2.fetchone()
        cur2.close()

        session['logged_in'] = True
        session['username']  = username
        session['role']      = info[1]
        session['UID']       = info[0]
        flash("Account created! Now try logging in.")

    except Exception as e:
        print(f"DEBUG ERROR: {e}")
        flash(f"Database Error: {str(e)}")

    return redirect(url_for('dashboard.dashboard'))


@auth_bp.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    cur = mysql.connection.cursor()
    cur.execute(
        "SELECT u.UID, u.Username, u.Password, r.R_Name "
        "FROM Users u INNER JOIN Role r USING (RID) "
        "WHERE Username = %s AND Password = %s",
        (username, password)
    )
    user = cur.fetchone()
    cur.close()

    if user:
        session['logged_in'] = True
        session['username']  = username
        session['role']      = user[3]
        session['UID']       = user[0]
        return redirect(url_for('dashboard.dashboard'))

    flash("Login Failed! Check your username or password.")
    return redirect(url_for('dashboard.home'))


@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('dashboard.home'))