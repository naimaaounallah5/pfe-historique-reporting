# ============================================================
#  main.py — Point d'entrée principal de l'ETL
#
#  C'est LE fichier qu'on lance pour tout exécuter.
#  Il appelle extract.py → transform.py → load.py dans l'ordre.
#  À la fin : notifie le backend → KPIs recalculés → SignalR
#
#  Commande : python main.py
# ============================================================

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import time
import requests
from datetime import datetime
from extract   import extraire_toutes_tables
from transform import transformer_toutes_tables, generer_rapport
from load      import charger_toutes_tables, verifier_chargement


# ============================================================
#  notifier_backend()
#  Appelle le backend C# après l'ETL pour :
#  1. Recalculer les KPIs dans FAIT_Achats
#  2. Sauvegarder les KPIs dans la DB
#  3. Notifier le frontend via SignalR → dashboard mis à jour
# ============================================================
def notifier_backend():
    print("\n📡 NOTIFICATION DU BACKEND...")
    try:
        url      = "http://localhost:5088/api/etl/notify"
        response = requests.post(url, timeout=30)

        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ KPIs recalculés — {data['lignes']} lignes mises à jour dans FAIT_Achats")
            print(f"   🟢 Dashboard frontend mis à jour en temps réel via SignalR")
        else:
            print(f"   ⚠️  Backend répondu avec erreur : {response.status_code}")
            print(f"   {response.text}")

    except requests.exceptions.ConnectionError:
        print("   ❌ Backend non disponible (http://localhost:5088)")
        print("   ℹ️  Lance le backend avec : cd C:\\WAS\\backend && dotnet run")
    except requests.exceptions.Timeout:
        print("   ❌ Timeout — le backend met trop de temps à répondre")
    except Exception as e:
        print(f"   ❌ Erreur inattendue : {e}")


def main():

    # ── En-tête ──────────────────────────────────────────────
    print("\n" + "="*60)
    print("  🚀 ETL WAS_DB — DÉMARRAGE")
    print(f"  📅 {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}")
    print("="*60)

    debut_total = time.time()

    # ══ ÉTAPE 1 — EXTRACT ════════════════════════════════════
    print("\n📥 ÉTAPE 1/3 — EXTRACT (lecture des données)")
    debut = time.time()
    donnees_sales = extraire_toutes_tables()
    print(f"⏱️  Extract terminé en {time.time() - debut:.1f} secondes")

    if not donnees_sales:
        print("❌ Aucune donnée extraite. ETL annulé.")
        return

    # ══ ÉTAPE 2 — TRANSFORM ══════════════════════════════════
    print("\n🧹 ÉTAPE 2/3 — TRANSFORM (nettoyage des données)")
    debut = time.time()
    donnees_propres = transformer_toutes_tables(donnees_sales)
    generer_rapport(donnees_sales, donnees_propres)
    print(f"⏱️  Transform terminé en {time.time() - debut:.1f} secondes")

    # ══ ÉTAPE 3 — LOAD ═══════════════════════════════════════
    print("\n💾 ÉTAPE 3/3 — LOAD (écriture dans WAS_DB)")
    debut = time.time()
    charger_toutes_tables(donnees_propres)
    verifier_chargement()
    print(f"⏱️  Load terminé en {time.time() - debut:.1f} secondes")

    # ══ ÉTAPE 4 — NOTIFIER BACKEND ═══════════════════════════
    notifier_backend()

    # ── Bilan final ──────────────────────────────────────────
    duree_totale = time.time() - debut_total
    print("="*60)
    print(f"  ✅ ETL TERMINÉ EN {duree_totale:.1f} SECONDES")
    print(f"  📅 {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
