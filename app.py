from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_mysqldb import MySQL
import os
import numpy as np
from PIL import Image
import tensorflow as tf
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()



# This tells Flask to look for templates relative to THIS file's location (for venv)
base_dir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__, template_folder=os.path.join(base_dir, 'templates'))
app.secret_key = "secret_key_for_session"
CORS(app)

# 1. Path to your model
model_path = os.path.join(base_dir, 'model/model.tflite')

# 2. Load the TFLite model and allocate tensors
interpreter = tf.lite.Interpreter(model_path=model_path)
interpreter.allocate_tensors()

# 3. Get input and output details (these tell the code where to "plug in" the image)
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Database Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = os.getenv('DB_PASSWORD')
app.config['MYSQL_DB'] = 'StreetIssueTracker'

mysql = MySQL(app)

# --- AUTHENTICATION ROUTES ---


@app.route('/')
def home():
    return render_template('signup-login.html')

@app.route('/register', methods=['POST'])
def register():
    try:
        username = request.form.get('username')
        password = request.form.get('password')
        CNIC     = request.form.get('CNIC')
        
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM Users WHERE Username = %s OR CNIC = %s", (username, CNIC))
        if cur.fetchone():
            flash("Username already exists! OR CNIC Already Registered")
            cur.close()
            return redirect(url_for('home'))

        cur.execute("INSERT INTO Users(Username, Password, CNIC, RID) VALUES(%s, %s, %s, %s)", (username, password, CNIC, '1'))
        mysql.connection.commit()
        cur.close()
        cur2=mysql.connection.cursor()
        cur2.execute("SELECT UID, R_Name, Username  FROM users u INNER JOIN role r ON r.RID = u.RID WHERE Username = %s",(username,))
        info=cur2.fetchone()
        cur2.close()
        session['logged_in'] = True
        session['username']  = username
        session['role'] = info[1]
        session['UID'] =  info[0]
        flash("Account created! Now try logging in.")

    except Exception as e:
        flash(f"Database Error: {str(e)}")
        
    return redirect(url_for('dashboard'))

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    cur = mysql.connection.cursor()
    cur.execute("SELECT u.UID, u.Username, u.Password, r.R_Name FROM Users u INNER JOIN Role r USING (RID) WHERE Username = %s AND Password = %s", (username, password))
    user = cur.fetchone()
    cur.close()

    if user:
        session['logged_in'] = True
        session['username']  = username
        session['role']      = user[3]
        session['UID']        = user[0]
        return redirect(url_for('dashboard'))
    else:
        flash("Login Failed! Check your username or password.")
        return redirect(url_for('home'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# --- APP CONTENT ROUTES ---

@app.route('/personal-details', methods=['POST'])
def change():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Not logged in.'})

    try:
        data     = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        phone    = data.get('phone', '').strip()
        email    = data.get('email', '').strip()

        if not any([username, password, phone, email]):
            return jsonify({'success': False, 'error': 'At least one field is required.'})

        user_id     = session.get('UID')
        set_clauses = []
        params      = []

        if username:
            cur = mysql.connection.cursor()
            cur.execute("SELECT UID FROM Users WHERE Username = %s", (username,))
            existing = cur.fetchone()
            cur.close()
            if existing and existing[0] != user_id:
                return jsonify({'success': False, 'error': 'Username is already taken.'})
            set_clauses.append("Username = %s")
            params.append(username)

        if password:
            set_clauses.append("Password = %s")
            params.append(password)

        if phone:
            set_clauses.append("Phone_Number = %s")
            params.append(phone)

        if email:
            set_clauses.append("Email = %s")
            params.append(email)

        params.append(user_id)
        sql = "UPDATE Users SET {} WHERE UID = %s".format(', '.join(set_clauses))

        cur = mysql.connection.cursor()
        cur.execute(sql, tuple(params))
        mysql.connection.commit()
        cur.close()

        if username:
            session['username'] = username

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        flash("Please log in first")
        return redirect(url_for('home'))
    return render_template('dashboard.html')

@app.route('/report-issue')
def report_issue():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    return render_template('reportIssue.html')

@app.route('/all-reports')
def all_reports():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    return render_template('allReports.html')

@app.route('/resolved')
def resolved():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    return render_template('Resolved.html')

@app.route('/leaderboard')
def leaderboard():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    return render_template('communityLeaderboard.html')

@app.route('/settings')
def settings():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    return render_template('settings.html')

@app.route('/report', methods = ['POST'])
def report():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Not logged in.'})
    
    try:
        image = request.files.get('image')
        img = Image.open(image.stream).convert('RGB')
    
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0  # Normalizing it in the 0-1 range for model
        img_array = np.expand_dims(img_array, axis=0) 
        
        img_array = img_array.astype(np.float32)

        interpreter.set_tensor(input_details[0]['index'], img_array)

        interpreter.invoke()

        prediction = interpreter.get_tensor(output_details[0]['index'])
        probability = float(prediction[0][0])
        
        label = "Pothole" if probability > 0.5 else "Normal"
        confidence = round(probability * 100, 2) if label == "Pothole" else round((1-probability) * 100, 2)
        
        return jsonify({'success': True, 'label': label, 'confidence': confidence})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})    


# --- ADMIN-ONLY ROUTES ---

@app.route('/get-roles')
def get_roles():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Not logged in.'})
    if session.get('role', '').lower() != 'super admin':
        return jsonify({'success': False, 'error': 'Access denied.'})

    try:
        cur = mysql.connection.cursor()

        cur.execute("SELECT RID, R_Name FROM Role WHERE NOT (R_NAME = 'Citizen' OR R_NAME = 'Super Admin')  ORDER BY RID ASC")
        rows = cur.fetchall()
        cur.close()

        roles = [{'id': row[0], 'name': row[1]} for row in rows]
        return jsonify({'success': True, 'roles': roles})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/add-member', methods=['GET', 'POST'])
def add_member():
    if not session.get('logged_in'):
        return redirect(url_for('home'))
    if session.get('role', '').lower() != 'super admin':
        flash("Access denied. Admins only.")
        return redirect(url_for('dashboard'))

    if request.method == 'GET':
        return render_template('members.html')

    
    # POST — register the new member
    if request.method == 'POST':
        try:
            data     = request.get_json()
            username = data.get('username', '').strip()
            cnic     = data.get('cnic', '').strip()
            role_id  = data.get('role_id', '').strip()
            passcode = data.get('passcode', '').strip()
            email    = data.get('email', '').strip()
            phone    = data.get('phoneNo', '').strip()

            if not all([username, cnic, role_id, passcode, email, phone]):
                return jsonify({'success': False, 'error': 'All fields are required.'})

            cur = mysql.connection.cursor()

            cur.execute("SELECT UID FROM Users WHERE Username = %s OR CNIC = %s", (username, cnic))
            if cur.fetchone():
                cur.close()
                return jsonify({'success': False, 'error': 'Username or CNIC already exists.'})
            cur2 = mysql.connection.cursor()
            cur2.execute("SELECT RID FROM Role WHERE RID = %s", (role_id,))
            if not cur2.fetchone():
                cur2.close()
                cur.close()
                return jsonify({'success': False, 'error': 'Selected department does not exist.'})
            cur2.close()
            cur.execute(
                "INSERT INTO Users(Username, Password, CNIC, Email, Phone_Number, RID) VALUES(%s, %s, %s, %s, %s, %s)",
                (username, passcode, cnic, email, phone, role_id)
            )
            mysql.connection.commit()
            cur.close()
            return jsonify({'success': True})

        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})


if __name__ == '__main__':
    app.run(debug=True)
    
