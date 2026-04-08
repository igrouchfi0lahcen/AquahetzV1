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

app = Flask(__name__)
app.config['SECRET_KEY'] = 'aquahertz_super_secret_key_123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///aquahertz.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'welcome'

# ================= 1. جداول قاعدة البيانات =================
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class SensorData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vibration = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

with app.app_context():
    db.create_all()

# ================= 2. إعدادات الذكاء الاصطناعي (AI Model) =================
try:
    with open('aquahertz_ai_model.pkl', 'rb') as file:
        ai_model = pickle.load(file)
        print("🤖 AI Model Loaded Successfully!")
except Exception as e:
    print("⚠️ AI Model not found! Falling back to manual rules. (Please run train_ai.py)")
    ai_model = None

# ================= 3. إعدادات الكابل (Serial USB) =================
SERIAL_PORT = 'COM6'  # <-- بدّل هادي بالبورت ديالك يلا تبدل
BAUD_RATE = 115200
device_is_online = False

def read_from_cable():
    global device_is_online
    try:
        # فتح الاتصال مع الكابل
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"✅ Connected to ESP32 on {SERIAL_PORT} via CABLE!")
        device_is_online = True
        
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                try:
                    data = json.loads(line)
                    vib_val = data.get("vibration", 0)
                    
                    status = "Normal"
                    
                    # 🧠 التحليل بالذكاء الاصطناعي
                    if ai_model:
                        # الموديل كيتسنى داتا على شكل قائمة 2D
                        prediction = ai_model.predict([[vib_val]])
                        status = prediction[0]
                    else:
                        # قواعد عادية (إلا ماكانش الموديل)
                        if vib_val > 1500: status = "Critical Leak"
                        elif vib_val > 80: status = "Small Leak"

                    # حفظ الداتا فالداتابيز
                    with app.app_context():
                        new_reading = SensorData(vibration=vib_val, status=status)
                        db.session.add(new_reading)
                        db.session.commit()
                        
                except json.JSONDecodeError:
                    pass # تجاهل القراءات الخاطئة
            time.sleep(0.01)
            
    except serial.SerialException as e:
        print(f"❌ Cannot connect to {SERIAL_PORT}. Is it plugged in?")
        device_is_online = False

# تشغيل قراءة الكابل فالخلفية باش السيرفور يبقى خدام
serial_thread = threading.Thread(target=read_from_cable, daemon=True)
serial_thread.start()

# ================= 4. روابط الواجهة (Routes) =================

@app.route('/welcome')
def welcome(): 
    return render_template('welcome.html')

@app.route('/order')
def order():
    return render_template('order.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
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
        username = request.form.get('username')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

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
            "sub_days": 24, # (تقدر تبدلها من بعد وتجبدها من الداتابيز)
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

# ================= 5. تشغيل السيرفور =================
if __name__ == '__main__':
    print("🚀 AquaHertz Server running via USB Cable with AI!")
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)