from flask import Flask, render_template, jsonify, redirect, url_for, flash, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import serial
import threading
import json
import datetime
import time
import pickle
import warnings
import os

# ==============================
# Initial configuration
# ==============================
warnings.filterwarnings("ignore", category=UserWarning)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'aquahertz_super_secret_key_123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///aquahertz.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'welcome'

# ==============================
# Database tables
# ==============================
class User(UserMixin, db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


class SensorData(db.Model):
    __tablename__ = "sensor_data"

    id = db.Column(db.Integer, primary_key=True)
    vibration = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


with app.app_context():
    db.create_all()

# ==============================
# AI Model loading
# ==============================
try:
    with open('aquahertz_ai_model.pkl', 'rb') as file:
        ai_model = pickle.load(file)
        print("🤖 AI Model Loaded Successfully!")
except Exception:
    print("⚠️ AI Model not found! Falling back to manual rules. (Please run train_ai.py)")
    ai_model = None

# ==============================
# Serial configuration
# ==============================
SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
BAUD_RATE = 115200
device_is_online = False


def predict_status(vib_val):
    if ai_model and vib_val > 0:
        try:
            prediction = ai_model.predict([[vib_val]])
            return str(prediction[0])
        except Exception as e:
            print(f"⚠️ AI prediction failed, using fallback rules: {e}")

    if vib_val > 800:
        return "Critical Leak"
    elif vib_val > 300:
        return "Small Leak"
    else:
        return "Normal"


def serial_reader():
    global device_is_online

    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
            print(f"🚀 Serial Thread Started on {SERIAL_PORT}")
            device_is_online = True

            while True:
                try:
                    if ser.in_waiting > 0:
                        line = ser.readline().decode('utf-8', errors='ignore').strip()

                        if not line:
                            continue

                        print(f"📡 Raw data: {line}")

                        if '{' not in line:
                            continue

                        start_idx = line.find('{')
                        clean_line = line[start_idx:]

                        data = json.loads(clean_line)
                        vib_val = int(data.get("vibration", 0))

                        print(f"⚡ Vibration: {vib_val}")

                        status = predict_status(vib_val)

                        print(f"🧠 Status: {status}")
                        print("-" * 40)

                        with app.app_context():
                            new_entry = SensorData(vibration=vib_val, status=status)
                            db.session.add(new_entry)
                            db.session.commit()
                            print(f"✅ Saved to DB | ID: {new_entry.id}")

                except json.JSONDecodeError as e:
                    print(f"❌ JSON Decode Error: {e}")
                except ValueError as e:
                    print(f"❌ Value Error: {e}")
                except Exception as e:
                    print(f"❌ Data Parsing Error: {e}")

                time.sleep(0.01)

        except Exception as e:
            device_is_online = False
            print(f"❌ Serial Connection Error: {e}")
            print("🔁 Retrying serial connection in 3 seconds...")
            time.sleep(3)


serial_thread = threading.Thread(target=serial_reader, daemon=True)
serial_thread.start()

# ==============================
# Routes
# ==============================
@app.route('/welcome')
def welcome():
    return render_template('welcome.html')


@app.route('/order')
def order():
    return render_template('order.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')

    return render_template('login.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        confirm_password = request.form.get('confirm_password', '').strip()

        if not username or not password or not confirm_password:
            flash('Please fill in all fields.')
            return redirect(url_for('signup'))

        if password != confirm_password:
            flash('Passwords do not match!')
            return redirect(url_for('signup'))

        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists. Please choose another one.')
            return redirect(url_for('signup'))

        hashed_pw = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(username=username, password=hashed_pw)
        db.session.add(new_user)
        db.session.commit()

        print(f"✅ New User Created: {username}")
        return redirect(url_for('login'))

    return render_template('signup.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('welcome'))


@app.route('/')
@login_required
def dashboard():
    return render_template('index.html', user=current_user)


@app.route('/api/live-data', methods=['GET'])
@login_required
def live_data():
    latest = SensorData.query.order_by(SensorData.id.desc()).first()

    if latest:
        return jsonify({
            "vibration": latest.vibration,
            "status": latest.status,
            "device_status": "Online" if device_is_online else "Offline",
            "sub_days": 24,
            "sub_type": "Premium Plan",
            "username": current_user.username
        })

    return jsonify({
        "vibration": 0,
        "status": "Waiting...",
        "device_status": "Offline",
        "sub_days": 24,
        "sub_type": "Premium Plan",
        "username": current_user.username
    })


@app.route('/api/history-stats')
@login_required
def history_stats():
    normal_count = SensorData.query.filter_by(status='Normal').count()
    small_leak_count = SensorData.query.filter_by(status='Small Leak').count()
    critical_count = SensorData.query.filter_by(status='Critical Leak').count()

    recent_events = SensorData.query.order_by(SensorData.id.desc()).limit(10).all()
    events_list = []

    for e in recent_events:
        events_list.append({
            "id": e.id,
            "vibration": e.vibration,
            "status": e.status,
            "time": e.timestamp.strftime("%H:%M:%S")
        })

    return jsonify({
        "stats": [normal_count, small_leak_count, critical_count],
        "events": events_list
    })

# ==============================
# Run server
# ==============================
if __name__ == '__main__':
    print("🚀 AquaHertz Server running via USB Cable with AI!")
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)