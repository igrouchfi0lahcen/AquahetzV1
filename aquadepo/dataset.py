import pandas as pd
import random

print("⏳ Generating Synthetic Data...")

dataset = []

# غنصاوبو 1000 قراءة وهمية كتشبه للواقع
for _ in range(1000):
    chance = random.random()
    
    if chance < 0.70:
        # 70% من الوقت، الحالة عادية (اهتزاز بين 5 و 50)
        vibration = random.randint(5, 50)
        label = "Normal"
        
    elif chance < 0.90:
        # 20% من الوقت، فويت صغير (اهتزاز بين 80 و 200)
        vibration = random.randint(80, 200)
        label = "Small Leak"
        
    else:
        # 10% من الوقت، فويت خطير (اهتزاز بين 1500 و 4000)
        vibration = random.randint(1500, 4000)
        label = "Critical Leak"
        
    dataset.append({"vibration": vibration, "label": label})

# تحويل الداتا لجدول وحفظها فملف CSV
df = pd.DataFrame(dataset)
df.to_csv('dataset.csv', index=False)

print("✅ 'dataset.csv' created successfully with 1000 records!")