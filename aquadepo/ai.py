import serial
import json
import csv
import time

# Configuration du port (Vérifie bien que c'est COM6)
SERIAL_PORT = 'COM6' 
BAUD_RATE = 115200

def collect():
    try:
        # Connexion à l'ESP32
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print("✅ Connecté à l'ESP32 avec succès !")
        
        # Création du fichier CSV
        with open('real_dataset.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['vibration', 'label'])
            
            # Les phases d'apprentissage pour l'IA
            etapes = [
                ("Normal", "Laissez le capteur au repos (Silence total)..."),
                ("Small Leak", "Tapotez TRÈS légèrement le capteur (Petite fuite)..."),
                ("Critical Leak", "Frappez ou secouez le capteur plus fort (Grosse fuite)...")
            ]
            
            for label, instruction in etapes:
                print(f"\n--- 🛠️ Phase : {label} ---")
                print(f"👉 Instruction : {instruction}")
                input("Appuyez sur ENTRÉE pour commencer l'enregistrement de cette phase...")
                
                count = 0
                while count < 200: # On enregistre 200 points par état
                    if ser.in_waiting > 0:
                        # Lecture de la ligne envoyée par l'ESP32
                        ligne = ser.readline().decode('utf-8', errors='ignore').strip()
                        try:
                            data = json.loads(ligne)
                            # On écrit la valeur réelle du capteur dans le CSV
                            writer.writerow([data['vibration'], label])
                            count += 1
                            
                            # Barre de progression simple
                            if count % 50 == 0: 
                                print(f"⏳ Progression : {count}/200 points collectés...")
                        except:
                            pass
                print(f"✅ Enregistrement terminé pour : {label}")
        
        print("\n🎉 Bravo ! Votre fichier 'real_dataset.csv' est prêt avec de VRAIES données !")
        
    except Exception as e:
        print(f"❌ Erreur : {e}")
        print("💡 Conseil : Vérifiez que le Moniteur Série de VS Code/PlatformIO est bien FERMÉ.")

if __name__ == "__main__":
    collect()