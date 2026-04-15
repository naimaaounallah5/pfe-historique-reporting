# ============================================================
#  load.py — Chargement des données nettoyées dans WAS_DB
# ============================================================

import pyodbc
import pandas as pd
from config import (
    CONNECTION_STRING,
    TABLES_APRES_ETL,
)

def get_connection():
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        return conn
    except Exception as e:
        print(f"❌ Connexion impossible : {e}")
        return None


def charger_table(df, nom_table):
    conn = get_connection()
    if conn is None:
        return 0

    cursor = conn.cursor()

    try:
        colonnes     = list(df.columns)
        cols_str     = ", ".join(colonnes)
        placeholders = ", ".join(["?"] * len(colonnes))

        query = f"INSERT INTO dbo.{nom_table} ({cols_str}) VALUES ({placeholders})"

        donnees = [
            tuple(None if pd.isna(val) else val for val in ligne)
            for ligne in df.itertuples(index=False, name=None)
        ]

        cursor.executemany(query, donnees)
        conn.commit()

        nb_inseres = len(donnees)
        print(f"   ✅ [{nom_table}] : {nb_inseres} lignes insérées")
        return nb_inseres

    except Exception as e:
        print(f"   ❌ Erreur insertion [{nom_table}] : {e}")
        conn.rollback()
        return 0

    finally:
        cursor.close()
        conn.close()


def upsert_generique(df, nom_table, pk_col, cols_update):
    """
    UPSERT générique :
    - Si la ligne existe → UPDATE les colonnes spécifiées
    - Si la ligne n'existe pas → INSERT complet
    """
    conn = get_connection()
    if conn is None:
        return 0

    cursor = conn.cursor()
    nb_traites = 0

    try:
        colonnes = list(df.columns)

        for ligne in df.itertuples(index=False, name=None):
            valeurs = [None if pd.isna(v) else v for v in ligne]
            donnee  = dict(zip(colonnes, valeurs))

            cursor.execute(
                f"SELECT COUNT(*) FROM dbo.{nom_table} WHERE {pk_col} = ?",
                donnee.get(pk_col)
            )
            existe = cursor.fetchone()[0] > 0

            if existe:
                set_clause = ", ".join([f"{c} = ?" for c in cols_update])
                vals_update = [donnee.get(c) for c in cols_update]
                vals_update.append(donnee.get(pk_col))
                cursor.execute(
                    f"UPDATE dbo.{nom_table} SET {set_clause} WHERE {pk_col} = ?",
                    vals_update
                )
            else:
                cols_str     = ", ".join(colonnes)
                placeholders = ", ".join(["?"] * len(colonnes))
                cursor.execute(
                    f"INSERT INTO dbo.{nom_table} ({cols_str}) VALUES ({placeholders})",
                    valeurs
                )

            nb_traites += 1

        conn.commit()
        print(f"   ✅ [{nom_table}] : {nb_traites} lignes UPSERT ✅")
        return nb_traites

    except Exception as e:
        print(f"   ❌ Erreur UPSERT [{nom_table}] : {e}")
        conn.rollback()
        return 0

    finally:
        cursor.close()
        conn.close()


def upsert_produit(df):
    conn = get_connection()
    if conn is None:
        return 0

    cursor = conn.cursor()
    nb_traites = 0

    try:
        colonnes = list(df.columns)

        for ligne in df.itertuples(index=False, name=None):
            valeurs = [None if pd.isna(v) else v for v in ligne]
            donnee  = dict(zip(colonnes, valeurs))

            cursor.execute(
                "SELECT COUNT(*) FROM dbo.DIM_Produit WHERE Id_Produit = ?",
                donnee.get('Id_Produit')
            )
            existe = cursor.fetchone()[0] > 0

            if existe:
                cursor.execute("""
                    UPDATE dbo.DIM_Produit SET
                        Description  = ?,
                        Categorie    = ?,
                        Groupe       = ?,
                        Unite_Mesure = ?
                    WHERE Id_Produit = ?
                """,
                    donnee.get('Description'),
                    donnee.get('Categorie'),
                    donnee.get('Groupe'),
                    donnee.get('Unite_Mesure'),
                    donnee.get('Id_Produit'),
                )
            else:
                cursor.execute("""
                    INSERT INTO dbo.DIM_Produit
                    (Id_Produit, Description, Categorie, Groupe, Unite_Mesure, TypeProduit)
                    VALUES (?, ?, ?, ?, ?, 'Produit Fini')
                """,
                    donnee.get('Id_Produit'),
                    donnee.get('Description'),
                    donnee.get('Categorie'),
                    donnee.get('Groupe'),
                    donnee.get('Unite_Mesure'),
                )

            nb_traites += 1

        conn.commit()
        print(f"   ✅ [DIM_Produit] : {nb_traites} lignes UPSERT (TypeProduit préservé) ✅")
        return nb_traites

    except Exception as e:
        print(f"   ❌ Erreur UPSERT DIM_Produit : {e}")
        conn.rollback()
        return 0

    finally:
        cursor.close()
        conn.close()


def upsert_production(df):
    conn = get_connection()
    if conn is None:
        return 0

    cursor = conn.cursor()
    nb_traites = 0

    try:
        colonnes = list(df.columns)

        for ligne in df.itertuples(index=False, name=None):
            valeurs = [None if pd.isna(v) else v for v in ligne]
            donnee  = dict(zip(colonnes, valeurs))

            cursor.execute(
                "SELECT COUNT(*) FROM dbo.FAIT_Production WHERE Id_Production = ?",
                donnee.get('Id_Production')
            )
            existe = cursor.fetchone()[0] > 0

            if existe:
                cursor.execute("""
                    UPDATE dbo.FAIT_Production SET
                        Id_Temps            = ?,
                        Id_Produit          = ?,
                        Id_Machine          = ?,
                        Nb_Heure_Machine    = ?,
                        Mt_Matiere_Premiere = ?,
                        Cout_Unitaire_Heure = ?,
                        QuantiteProduite    = ?,
                        Cout_Production     = ?,
                        Temps_Arret         = ?
                    WHERE Id_Production = ?
                """,
                    donnee.get('Id_Temps'),
                    donnee.get('Id_Produit'),
                    donnee.get('Id_Machine'),
                    donnee.get('Nb_Heure_Machine'),
                    donnee.get('Mt_Matiere_Premiere'),
                    donnee.get('Cout_Unitaire_Heure'),
                    donnee.get('QuantiteProduite'),
                    donnee.get('Cout_Production'),
                    donnee.get('Temps_Arret'),
                    donnee.get('Id_Production'),
                )
            else:
                cols_str     = ", ".join(colonnes)
                placeholders = ", ".join(["?"] * len(colonnes))
                cursor.execute(
                    f"INSERT INTO dbo.FAIT_Production ({cols_str}) VALUES ({placeholders})",
                    valeurs
                )

            nb_traites += 1

        conn.commit()
        print(f"   ✅ [FAIT_Production] : {nb_traites} lignes UPSERT ✅")
        return nb_traites

    except Exception as e:
        print(f"   ❌ Erreur UPSERT FAIT_Production : {e}")
        conn.rollback()
        return 0

    finally:
        cursor.close()
        conn.close()


def charger_toutes_tables(donnees_propres):
    print("\n" + "="*60)
    print("  CHARGEMENT — Insertion dans les tables après ETL")
    print("="*60)

    conn = get_connection()
    if conn is None:
        return

    cursor = conn.cursor()

    # ── Vider uniquement les tables sans contraintes FK bloquantes ──
    print("\n🗑️  Vidage des tables avant insertion...")
    tables_a_vider = [
        "FAIT_Achats",
        "DIM_Fournisseur",
    ]

    for table in tables_a_vider:
        try:
            cursor.execute(f"DELETE FROM dbo.{table}")
            print(f"   ✅ {table} vidée")
        except Exception as e:
            print(f"   ❌ Erreur vidage {table} : {e}")

    print("   ⏭️  DIM_Client    → UPSERT (référencée par FAIT_Ventes)")
    print("   ⏭️  DIM_Temps     → UPSERT (référencée par FAIT_Ventes)")
    print("   ⏭️  DIM_Machine   → UPSERT (référencée par HistoriqueSCADA)")
    print("   ⏭️  DIM_Produit   → UPSERT (TypeProduit préservé)")
    print("   ⏭️  FAIT_Ventes   → UPSERT (données préservées)")
    print("   ⏭️  FAIT_Qualite  → UPSERT (données préservées)")
    print("   ⏭️  FAIT_Stock    → UPSERT (données préservées)")
    print("   ⏭️  FAIT_Production → UPSERT (Rentabilite_Machine préservée)")

    conn.commit()
    cursor.close()
    conn.close()

    # ── Insertion dans l'ordre DIM puis FAIT ──
    total_insere = 0

    # Colonnes à mettre à jour pour chaque table (sans la PK)
    upsert_config = {
        "DIM_Client":    ("Id_Client",     ["Nom", "Prenom", "Ville", "Pays"]),
        "DIM_Temps":     ("Id_Temps",      ["Mois", "Trimestre", "Annee"]),
        "DIM_Machine":   ("Id_Machine",    ["Nom", "Groupe", "Site", "Capacite_Minutes"]),
        "FAIT_Ventes":   ("Id_Vente",      ["Id_Temps", "Id_Produit", "Id_Client", "QteVendue",
                                             "PrixVenteUnitaire", "MontantVenteHT", "Chiffre_Affaires"]),
        "FAIT_Qualite":  ("Id_Qualite",    ["Id_Temps", "Id_Produit", "Id_Machine",
                                             "QteDefectueuse", "QteProduiteTotal", "Taux_Defauts"]),
        "FAIT_Stock":    ("Id_Stock",      ["Id_Temps", "Id_Produit", "StockEntree",
                                             "StockSortie", "Stock_Disponible"]),
    }

    for nom_table in TABLES_APRES_ETL:
        if nom_table not in donnees_propres:
            print(f"   ⚠️  [{nom_table}] absent des données propres")
            continue

        df = donnees_propres[nom_table]

        if nom_table == "FAIT_Production":
            nb = upsert_production(df)
        elif nom_table == "DIM_Produit":
            nb = upsert_produit(df)
        elif nom_table in upsert_config:
            pk_col, cols_update = upsert_config[nom_table]
            # Filtrer cols_update pour ne garder que celles présentes dans df
            cols_update_presents = [c for c in cols_update if c in df.columns]
            nb = upsert_generique(df, nom_table, pk_col, cols_update_presents)
        else:
            nb = charger_table(df, nom_table)

        total_insere += nb

    print("\n" + "="*60)
    print(f"  CHARGEMENT TERMINÉ")
    print(f"  Total lignes insérées/mises à jour : {total_insere}")
    print("="*60 + "\n")


def verifier_chargement():
    print("\n" + "="*60)
    print("  VÉRIFICATION DU CHARGEMENT")
    print("="*60)

    conn = get_connection()
    if conn is None:
        return

    cursor = conn.cursor()

    for nom_table in TABLES_APRES_ETL:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM dbo.{nom_table}")
            nb     = cursor.fetchone()[0]
            statut = "✅" if nb > 0 else "⚠️  VIDE"
            print(f"   {statut} {nom_table} : {nb} lignes")
        except Exception as e:
            print(f"   ❌ {nom_table} : {e}")

    cursor.close()
    conn.close()
    print("="*60 + "\n")


if __name__ == "__main__":
    from extract   import extraire_toutes_tables
    from transform import transformer_toutes_tables

    print("\n" + "🚀 " * 20)
    print("  LANCEMENT DE L'ETL COMPLET")
    print("🚀 " * 20)

    print("\n📥 ÉTAPE 1/3 : EXTRACTION")
    donnees_avant = extraire_toutes_tables()

    print("\n🔧 ÉTAPE 2/3 : TRANSFORMATION")
    donnees_apres = transformer_toutes_tables(donnees_avant)

    print("\n📤 ÉTAPE 3/3 : CHARGEMENT")
    charger_toutes_tables(donnees_apres)

    verifier_chargement()

    print("✅ ETL COMPLET TERMINÉ AVEC SUCCÈS !\n")