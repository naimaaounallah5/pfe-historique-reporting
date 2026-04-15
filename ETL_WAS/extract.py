# ============================================================
#  extract.py — Extraction des données depuis WAS_DB
#  Lit les tables directement (sans _avant_ETL)
#  Pour FAIT_Achats : ignore les colonnes calculées
#  (Montant_Total_Achats, Retard_Livraison) car elles
#  sont recalculées par le backend après l'ETL
# ============================================================

import pyodbc
import pandas as pd
from config import (
    CONNECTION_STRING,
    TABLES_AVANT_ETL,
    PRIMARY_KEYS
)

# ============================================================
# Colonnes à lire pour chaque table FAIT
# On exclut les colonnes calculées par le backend
# ============================================================
COLONNES_PAR_TABLE = {
    "FAIT_Achats": [
        "Id_Achat", "Id_Temps", "Id_Produit", "Id_Fournisseur",
        "QteCommandee", "PrixUnitaireAchat",
        "Delai_Livraison_Convenu", "DelaiLivraisonReel"
    ],
    # Les autres tables → SELECT * complet
}

def get_connection():
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        print("✅ Connexion établie avec WAS_DB")
        return conn
    except Exception as e:
        print(f"❌ Impossible de se connecter à WAS_DB")
        print(f"   Détail erreur : {e}")
        return None


def extraire_table(nom_table):
    conn = get_connection()
    if conn is None:
        return None

    try:
        # ── Si table avec colonnes calculées → SELECT partiel ──
        if nom_table in COLONNES_PAR_TABLE:
            cols = ", ".join(COLONNES_PAR_TABLE[nom_table])
            query = f"SELECT {cols} FROM dbo.{nom_table}"
        else:
            query = f"SELECT * FROM dbo.{nom_table}"

        df = pd.read_sql(query, conn)
        print(f"✅ Table [{nom_table}] extraite → {len(df)} lignes, {len(df.columns)} colonnes")
        return df

    except Exception as e:
        print(f"❌ Erreur lors de l'extraction de [{nom_table}]")
        print(f"   Détail : {e}")
        return None

    finally:
        conn.close()


def extraire_toutes_tables():
    print("\n" + "="*60)
    print("  EXTRACTION — Lecture des tables")
    print("="*60)

    donnees = {}

    for nom_table in TABLES_AVANT_ETL:
        print(f"\n📥 Extraction de : {nom_table}")
        df = extraire_table(nom_table)

        if df is not None:
            donnees[nom_table] = df
        else:
            print(f"⚠️  Table [{nom_table}] ignorée à cause d'une erreur")

    print("\n" + "="*60)
    print(f"  EXTRACTION TERMINÉE : {len(donnees)}/{len(TABLES_AVANT_ETL)} tables extraites")
    print("="*60 + "\n")

    return donnees


def afficher_apercu(donnees):
    print("\n" + "="*60)
    print("  APERÇU DES DONNÉES EXTRAITES")
    print("="*60)

    for nom_table, df in donnees.items():
        print(f"\n📋 TABLE : {nom_table}")
        print(f"   Lignes    : {len(df)}")
        print(f"   Colonnes  : {list(df.columns)}")
        print(df.head(3).to_string(index=False))
        print("-" * 60)


def compter_problemes(donnees):
    print("\n" + "="*60)
    print("  RAPPORT DES PROBLÈMES DÉTECTÉS (avant ETL)")
    print("="*60)

    rapport = {}

    for nom_table, df in donnees.items():
        nb_null     = int(df.isnull().sum().sum())
        pk          = PRIMARY_KEYS.get(nom_table)
        nb_doublons = int(df.duplicated(subset=[pk]).sum()) if pk and pk in df.columns else 0

        rapport[nom_table] = {
            "nb_lignes":   len(df),
            "nb_null":     nb_null,
            "nb_doublons": nb_doublons,
        }

        print(f"\n📈 {nom_table}")
        print(f"   Lignes totales : {len(df)}")
        print(f"   Valeurs NULL   : {nb_null}")
        print(f"   Doublons (PK)  : {nb_doublons}")

    print("\n" + "="*60 + "\n")
    return rapport


if __name__ == "__main__":
    donnees = extraire_toutes_tables()
    afficher_apercu(donnees)
    compter_problemes(donnees)