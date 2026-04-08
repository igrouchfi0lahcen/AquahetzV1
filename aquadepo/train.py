import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle

print("1. Loading Data...")
# كيقرا الداتا من ملف CSV اللي صاوبتي
data = pd.read_csv('dataset.csv')

# كنقسمو الداتا: X هي الاهتزاز، y هي النتيجة (Label)
X = data[['vibration']] 
y = data['label']

# كنقسمو الداتا لـ 80% للتدريب و 20% للامتحان
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("2. Training AI Model...")
# كنصاوبو الموديل وندربوه
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# كنشوفو شحال جاب فالتنقيط (الدقة)
accuracy = model.score(X_test, y_test)
print(f"✅ Training Complete! Model Accuracy: {accuracy * 100:.2f}%")

print("3. Saving Model...")
# كنسجلو الموديل فملف باش نخدمو بيه فالـ Flask
with open('aquahertz_ai_model.pkl', 'wb') as file:
    pickle.dump(model, file)
print("💾 Model saved as 'aquahertz_ai_model.pkl'")