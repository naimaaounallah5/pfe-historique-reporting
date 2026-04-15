# ============================================================
#  watcher.py — Surveillance automatique de WAS_DB
#
#  Lance ce fichier UNE SEULE FOIS → il tourne en permanence
#  Chaque fois qu'une nouvelle ligne est ajoutée dans la DB
#  → ETL se relance automatiquement
#  → KPIs recalculés
#  → Dashboard mis à jour en temps réel
#
#  Commande : python watcher.py
# ============================================================

import time
import pyodbc
import requests
from datetime import datetime
from config    import CONNECTION_STRING

# ============================================================
# --- Configuration du watcher ---
# INTERVALLE  : vérification toutes les X secondes
# TABLES      : vraies tables surveillées (après ETL)
# ============================================================

INTERVALLE_SECONDES = 10  # vérifie toutes les 10 secondes

# Tables surveillées + leur clé primaire
# On surveille les vraies tables (pas _avant_ETL)
TABLES_SURVEILLEES = {
    "DIM_Client":      "Id_Client",
    "DIM_Fournisseur": "Id_Fournisseur",
    "DIM_Temps":       "Id_Temps",
    "DIM_Produit":     "Id_Produit",
    "DIM_Machine":     "Id_Machine",
    "FAIT_Achats":     "Id_Achat",
    "FAIT_Ventes":     "Id_Vente",
    "FAIT_Production": "Id_Production",
    "FAIT_Qualite":    "Id_Qualite",
    "FAIT_Stock":      "Id_Stock",
}

# ============================================================
# --- compter_lignes() ---
# Compte les lignes dans chaque table surveillée
# Retourne un dictionnaire { nom_table: nb_lignes }
# ============================================================

def compter_lignes():
    """
    Compte les lignes actuelles dans chaque table surveillée.
    Retourne { nom_table: nb_lignes } ou None si erreur.
    """
    try:
        conn    = pyodbc.connect(CONNECTION_STRING)
        cursor  = conn.cursor()
        comptes = {}

        for table in TABLES_SURVEILLEES:
            cursor.execute(f"SELECT COUNT(*) FROM dbo.{table}")
            comptes[table] = cursor.fetchone()[0]

        cursor.close()
        conn.close()
        return comptes

    except Exception as e:
        print(f"   ❌ Erreur comptage : {e}")
        return None

# ============================================================
# --- lancer_etl() ---
# Lance le pipeline ETL complet
# Extract → Transform → Load → Notify backend
# ============================================================

def lancer_etl():
    """
    Nouvelle donnée détectée dans les tables réelles
    → Recalcule les KPIs directement
    → Notifie le frontend via SignalR
    Pas besoin de relancer l'ETL complet
    """
    print("\n" + "="*60)
    print(f"  🚀 RECALCUL KPIs — DÉMARRAGE")
    print(f"  📅 {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}")
    print("="*60)

    try:
        # ── Notifier le backend directement ──────────────────
        # Le backend recalcule Montant_Total_Achats
        # et Retard_Livraison dans FAIT_Achats
        # puis notifie le frontend via SignalR
        print("\n📡 NOTIFICATION DU BACKEND...")
        response = requests.post(
            "http://localhost:5088/api/etl/notify",
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ KPIs recalculés — {data['lignes']} lignes mises à jour")
            print(f"   🟢 Dashboard mis à jour en temps réel !")
        else:
            print(f"   ⚠️  Erreur backend : {response.status_code}")

        print("="*60)
        print(f"  ✅ RECALCUL TERMINÉ")
        print(f"  📅 {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}")
        print("="*60 + "\n")
        return True

    except requests.exceptions.ConnectionError:
        print("   ❌ Backend non disponible (http://localhost:5088)")
        return False
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return False

# ============================================================
# --- surveiller() ---
# Boucle principale — tourne indéfiniment
# Compare le nombre de lignes toutes les X secondes
# Si changement détecté → lance l'ETL automatiquement
# ============================================================

def surveiller():
    """
    Surveille la DB en permanence.
    Lance l'ETL automatiquement si changement détecté.
    """
    print("\n" + "="*60)
    print("  👁️  WATCHER WAS_DB — DÉMARRAGE")
    print(f"  📅 {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}")
    print(f"  ⏱️  Vérification toutes les {INTERVALLE_SECONDES} secondes")
    print("  ℹ️  Ctrl+C pour arrêter")
    print("="*60)

    # ── Snapshot initial ─────────────────────────────────────
    print("\n📊 Snapshot initial de la DB...")
    comptes_precedents = compter_lignes()

    if comptes_precedents is None:
        print("❌ Impossible de se connecter à la DB. Arrêt.")
        return

    for table, nb in comptes_precedents.items():
        print(f"   {table:20} : {nb} lignes")

    print(f"\n✅ Surveillance active — en attente de changements...\n")

    # ── Boucle principale ────────────────────────────────────
    while True:
        try:
            time.sleep(INTERVALLE_SECONDES)

            comptes_actuels = compter_lignes()
            if comptes_actuels is None:
                print("⚠️  Connexion DB perdue — nouvelle tentative...")
                continue

            # ── Détecter les changements ─────────────────────
            changements = []
            for table, nb_actuel in comptes_actuels.items():
                nb_precedent = comptes_precedents.get(table, 0)
                if nb_actuel != nb_precedent:
                    diff  = nb_actuel - nb_precedent
                    signe = "+" if diff > 0 else ""
                    changements.append(f"{table} ({signe}{diff} lignes)")

            # ── Si changement → lancer ETL ───────────────────
            if changements:
                print(f"\n🔔 CHANGEMENT DÉTECTÉ à {datetime.now().strftime('%H:%M:%S')} :")
                for c in changements:
                    print(f"   📌 {c}")

                lancer_etl()

                # Mettre à jour le snapshot après ETL
                comptes_precedents = compter_lignes() or comptes_actuels

            else:
                # Aucun changement → log discret
                print(f"   ⏳ {datetime.now().strftime('%H:%M:%S')} — Aucun changement détecté")

        except KeyboardInterrupt:
            print("\n\n⛔ Watcher arrêté manuellement.")
            break
        except Exception as e:
            print(f"⚠️  Erreur watcher : {e}")
            time.sleep(INTERVALLE_SECONDES)


# ============================================================
# --- POINT D'ENTRÉE ---
# python watcher.py → démarre la surveillance automatique
# ============================================================

if __name__ == "__main__":
    surveiller()