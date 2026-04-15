# ============================================================
#  config.py — Connexion à la base de données WAS_DB
# ============================================================

import pyodbc

DB_CONFIG = {
    "server":             "localhost",
    "database":           "WAS_DB",
    "driver":             "ODBC Driver 17 for SQL Server",
    "trusted_connection": "yes"
}

CONNECTION_STRING = (
    f"DRIVER={{{DB_CONFIG['driver']}}};"
    f"SERVER={DB_CONFIG['server']};"
    f"DATABASE={DB_CONFIG['database']};"
    f"Trusted_Connection={DB_CONFIG['trusted_connection']};"
)

def tester_connexion():
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        print("✅ Connexion à WAS_DB réussie !")
        conn.close()
    except Exception as e:
        print(f"❌ Erreur de connexion : {e}")

# ============================================================
# --- Tables SOURCE : lecture directe sans _avant_ETL ---
# ============================================================

TABLES_AVANT_ETL = [
    "DIM_Client",
    "DIM_Fournisseur",
    "DIM_Temps",
    "DIM_Produit",
    "DIM_Machine",
    "FAIT_Ventes",
    "FAIT_Achats",
    "FAIT_Production",
    "FAIT_Qualite",
    "FAIT_Stock",
]

# ============================================================
# --- Tables DESTINATION : mêmes tables (nettoyage sur place)
# ============================================================

TABLES_APRES_ETL = [
    "DIM_Client",
    "DIM_Fournisseur",
    "DIM_Temps",
    "DIM_Produit",
    "DIM_Machine",
    "FAIT_Ventes",
    "FAIT_Achats",
    "FAIT_Production",
    "FAIT_Qualite",
    "FAIT_Stock",
]

# ============================================================
# --- Clés primaires ---
# ============================================================

PRIMARY_KEYS = {
    "DIM_Client":      "Id_Client",
    "DIM_Fournisseur": "Id_Fournisseur",
    "DIM_Temps":       "Id_Temps",
    "DIM_Produit":     "Id_Produit",
    "DIM_Machine":     "Id_Machine",
    "FAIT_Ventes":     "Id_Vente",
    "FAIT_Achats":     "Id_Achat",
    "FAIT_Production": "Id_Production",
    "FAIT_Qualite":    "Id_Qualite",
    "FAIT_Stock":      "Id_Stock",
}

# ============================================================
# --- Colonnes texte à nettoyer ---
# ============================================================

COLONNES_TEXTE = {
    "DIM_Client":      ["Nom", "Prenom", "Ville", "Pays"],
    "DIM_Fournisseur": ["Nom", "Prenom", "Ville", "Pays"],
    "DIM_Produit":     ["Description", "Categorie", "Groupe", "Unite_Mesure"],
    "DIM_Machine":     ["Nom", "Groupe", "Site"],
}

# ============================================================
# --- Seuil valeurs aberrantes ---
# ============================================================

SEUIL_ABERRANT = 9999
