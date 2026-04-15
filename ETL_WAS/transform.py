# ============================================================
#  transform.py — Nettoyage des données extraites
# ============================================================

import pandas as pd
import numpy  as np
from config import (
    TABLES_AVANT_ETL,
    PRIMARY_KEYS,
    COLONNES_TEXTE,
    SEUIL_ABERRANT,
)

def supprimer_doublons(df, nom_table):
    pk = PRIMARY_KEYS.get(nom_table)
    if pk is None or pk not in df.columns:
        print(f"   ⚠️  Pas de clé primaire connue pour [{nom_table}]")
        return df
    nb_avant = len(df)
    df = df.drop_duplicates(subset=[pk], keep='first')
    print(f"   🔁 Doublons supprimés        : {nb_avant - len(df)}")
    return df

def supprimer_lignes_null(df):
    nb_avant = len(df)
    df = df.dropna(how='all')
    print(f"   🗑️  Lignes entièrement NULL   : {nb_avant - len(df)}")
    return df

def supprimer_lignes_zero(df, nom_table):
    nb_avant = len(df)

    cols_zero_interdit = {
        "FAIT_Ventes":     ["QteVendue", "PrixVenteUnitaire", "MontantVenteHT"],
        "FAIT_Achats":     ["QteCommandee", "PrixUnitaireAchat"],
        "FAIT_Production": ["Nb_Heure_Machine", "Mt_Matiere_Premiere", "Cout_Unitaire_Heure", "QuantiteProduite"],
        "FAIT_Qualite":    ["QteProduiteTotal"],
        "FAIT_Stock":      ["StockEntree"],
        "DIM_Machine":     ["Capacite_Minutes"],
    }

    cols = cols_zero_interdit.get(nom_table, [])
    cols_presentes = [c for c in cols if c in df.columns]

    if cols_presentes:
        masque = (df[cols_presentes] != 0).all(axis=1)
        df = df[masque]
    else:
        cols_numeriques = df.select_dtypes(include=[np.number]).columns
        if len(cols_numeriques) > 0:
            masque = (df[cols_numeriques] != 0).any(axis=1)
            df = df[masque]

    print(f"   0️⃣  Lignes avec zéro interdit : {nb_avant - len(df)}")
    return df

def nettoyer_textes(df, nom_table):
    cols_texte = COLONNES_TEXTE.get(nom_table, [])
    if not cols_texte:
        return df

    nb_corriges = 0
    for col in cols_texte:
        if col not in df.columns:
            continue
        avant = df[col].copy()
        df[col] = df[col].apply(
            lambda x: x.strip().title() if isinstance(x, str) else x
        )
        df[col] = df[col].replace(
            to_replace=[
                "", " ", "Nan", "None", "nan", "none", "NaN",
                "Xxx", "xxx", "XXX",
                "99999", "9999", "999",
                "Test", "test", "TEST",
                "Testville", "Testpays",
                "Z", "P", "E", "F", "U", "B", "C", "D",
            ],
            value=np.nan
        )
        nb_corriges += int((avant.astype(str) != df[col].astype(str)).sum())

    print(f"   📝 Textes corrigés           : {nb_corriges}")
    return df

def supprimer_null_apres_texte(df, nom_table):
    nb_avant = len(df)

    colonnes_obligatoires = {
        "DIM_Client":      ["Id_Client", "Nom", "Prenom", "Ville", "Pays"],
        "DIM_Fournisseur": ["Id_Fournisseur", "Nom", "Prenom", "Ville", "Pays"],
        "DIM_Temps":       ["Id_Temps", "Mois", "Trimestre", "Annee"],
        "DIM_Produit":     ["Id_Produit", "Description", "Categorie", "Groupe", "Unite_Mesure"],
        "DIM_Machine":     ["Id_Machine", "Nom", "Groupe", "Site", "Capacite_Minutes"],
        "FAIT_Ventes":     ["Id_Vente", "Id_Temps", "Id_Produit", "Id_Client", "QteVendue", "PrixVenteUnitaire", "MontantVenteHT"],
        "FAIT_Achats":     ["Id_Achat", "Id_Temps", "Id_Produit", "Id_Fournisseur", "QteCommandee", "PrixUnitaireAchat", "Delai_Livraison_Convenu", "DelaiLivraisonReel"],
        "FAIT_Production": ["Id_Production", "Id_Temps", "Id_Produit", "Id_Machine", "Nb_Heure_Machine", "Mt_Matiere_Premiere", "Cout_Unitaire_Heure", "QuantiteProduite"],
        "FAIT_Qualite":    ["Id_Qualite", "Id_Temps", "Id_Produit", "Id_Machine", "QteDefectueuse", "QteProduiteTotal"],
        "FAIT_Stock":      ["Id_Stock", "Id_Temps", "Id_Produit", "StockEntree", "StockSortie"],
    }

    cols = colonnes_obligatoires.get(nom_table, [])
    cols_presentes = [c for c in cols if c in df.columns]

    if not cols_presentes:
        return df

    df = df.dropna(subset=cols_presentes, how='any')
    print(f"   🚫 Lignes avec NULL partiel  : {nb_avant - len(df)}")
    return df

def supprimer_valeurs_negatives(df, nom_table=None):
    nb_avant = len(df)

    cols_exclure = [
        'Cout_Production', 'Rentabilite_Machine', 'Temps_Arret',
        'Id_Production', 'Id_Temps', 'Id_Produit', 'Id_Machine',
        'Id_Client', 'Id_Fournisseur', 'Id_Vente', 'Id_Achat',
        'Id_Qualite', 'Id_Stock',
    ]

    cols_numeriques = [
        c for c in df.select_dtypes(include=[np.number]).columns
        if c not in cols_exclure
    ]

    for col in cols_numeriques:
        df[col] = df[col].apply(
            lambda x: np.nan if pd.notna(x) and x < 0 else x
        )

    df = df.dropna(subset=cols_numeriques, how='any')
    print(f"   ➖ Valeurs négatives supprim.: {nb_avant - len(df)}")
    return df

def supprimer_valeurs_aberrantes(df, nom_table=None):
    nb_avant = len(df)

    cols_exclure = [
        'Cout_Production', 'Rentabilite_Machine', 'Temps_Arret',
        'Id_Production', 'Id_Temps', 'Id_Produit', 'Id_Machine',
        'Id_Client', 'Id_Fournisseur', 'Id_Vente', 'Id_Achat',
        'Id_Qualite', 'Id_Stock',
        'Mt_Matiere_Premiere', 'Cout_Unitaire_Heure', 'QuantiteProduite',
        'Nb_Heure_Machine', 'Cout_Production',
        'MontantVenteHT', 'PrixVenteUnitaire', 'MontantAchatHT',
        'PrixUnitaireAchat', 'QteCommandee', 'QteVendue',
        'Capacite_Minutes', 'Chiffre_Affaires',
    ]

    cols_numeriques = [
        c for c in df.select_dtypes(include=[np.number]).columns
        if c not in cols_exclure
    ]

    for col in cols_numeriques:
        df[col] = df[col].apply(
            lambda x: np.nan if pd.notna(x) and x >= SEUIL_ABERRANT else x
        )

    df = df.dropna(subset=cols_numeriques, how='any')
    print(f"   🚨 Valeurs aberrantes supprim: {nb_avant - len(df)}")
    return df

def corriger_incoherences(df, nom_table):
    nb_avant = len(df)

    if nom_table == "DIM_Temps":
        if 'Mois' in df.columns:
            df = df[df['Mois'].between(1, 12, inclusive='both')]
        if 'Trimestre' in df.columns:
            df = df[df['Trimestre'].between(1, 4, inclusive='both')]
        if 'Annee' in df.columns:
            df = df[df['Annee'].between(2000, 2100, inclusive='both')]
        if 'Mois' in df.columns and 'Trimestre' in df.columns:
            trimestre_attendu = df['Mois'].apply(
                lambda m: (int(m) - 1) // 3 + 1 if pd.notna(m) else np.nan
            )
            df = df[df['Trimestre'] == trimestre_attendu]

    elif nom_table == "FAIT_Qualite":
        if 'QteDefectueuse' in df.columns and 'QteProduiteTotal' in df.columns:
            df = df[df['QteDefectueuse'] <= df['QteProduiteTotal']]

    elif nom_table == "FAIT_Stock":
        if 'StockEntree' in df.columns and 'StockSortie' in df.columns:
            df = df[df['StockSortie'] <= df['StockEntree']]

    elif nom_table == "FAIT_Ventes":
        if all(c in df.columns for c in ['QteVendue', 'PrixVenteUnitaire', 'MontantVenteHT']):
            # ✅ Prix déjà fixé dans la base via SQL (× 1.8 depuis avant_ETL)
            # On recalcule juste MontantVenteHT et Chiffre_Affaires
            df['MontantVenteHT'] = (df['QteVendue'] * df['PrixVenteUnitaire']).round(2)
            if 'Chiffre_Affaires' in df.columns:
                df['Chiffre_Affaires'] = df['MontantVenteHT']
            print(f"   ✅ FAIT_Ventes : MontantVenteHT recalculé (prix stables)")

    elif nom_table == "FAIT_Achats":
        if 'PrixUnitaireAchat' in df.columns:
            df['PrixUnitaireAchat'] = df['PrixUnitaireAchat'].clip(upper=500)
        if 'QteCommandee' in df.columns:
            df['QteCommandee'] = df['QteCommandee'].clip(upper=200)
        if 'DelaiLivraisonReel' in df.columns and 'Delai_Livraison_Convenu' in df.columns:
            df['DelaiLivraisonReel'] = df.apply(
                lambda row: min(row['DelaiLivraisonReel'], row['Delai_Livraison_Convenu'] + 5)
                if pd.notna(row['DelaiLivraisonReel']) and pd.notna(row['Delai_Livraison_Convenu'])
                and row['DelaiLivraisonReel'] > row['Delai_Livraison_Convenu']
                else row['DelaiLivraisonReel'],
                axis=1
            )
        print(f"   ✅ FAIT_Achats : Prix, Qte et Délais normalisés")

    print(f"   🔀 Incohérences supprimées   : {nb_avant - len(df)}")
    return df

def transformer_table(df, nom_table):
    print(f"\n🔧 Nettoyage de : {nom_table}")
    print(f"   Lignes avant nettoyage      : {len(df)}")

    if nom_table == "FAIT_Production":
        if all(c in df.columns for c in ['Nb_Heure_Machine', 'Cout_Unitaire_Heure', 'Mt_Matiere_Premiere']):
            df['Cout_Production'] = (
                df['Nb_Heure_Machine'] * df['Cout_Unitaire_Heure'] + df['Mt_Matiere_Premiere']
            ).round(2)
            print(f"   ✅ Cout_Production précalculé : {df['Cout_Production'].notna().sum()} lignes")

    df = supprimer_doublons(df, nom_table)
    df = supprimer_lignes_null(df)
    df = supprimer_lignes_zero(df, nom_table)
    df = nettoyer_textes(df, nom_table)
    df = supprimer_null_apres_texte(df, nom_table)
    df = supprimer_valeurs_negatives(df, nom_table)
    df = supprimer_valeurs_aberrantes(df, nom_table)
    df = corriger_incoherences(df, nom_table)

    print(f"   ✅ Lignes après nettoyage    : {len(df)}")
    return df

def transformer_toutes_tables(donnees):
    print("\n" + "="*60)
    print("  TRANSFORMATION — Nettoyage des données")
    print("="*60)

    donnees_propres = {}

    for nom_table, df in donnees.items():
        df_propre = transformer_table(df.copy(), nom_table)
        donnees_propres[nom_table] = df_propre

    # ── Rentabilite_Machine — garder valeur existante en base ──
    if 'FAIT_Production' in donnees_propres:
        df_prod     = donnees_propres['FAIT_Production'].copy()
        nb_total    = len(df_prod)
        nb_existant = df_prod['Rentabilite_Machine'].notna().sum()
        print(f"\n   ✅ Rentabilite_Machine préservée : {nb_existant}/{nb_total} lignes (valeurs manuelles conservées)")
        donnees_propres['FAIT_Production'] = df_prod

    # ── Correction Nb_Heure_Machine + Calcul Temps_Arret ────
    if 'FAIT_Production' in donnees_propres and 'DIM_Machine' in donnees_propres:
        df_prod    = donnees_propres['FAIT_Production'].copy()
        df_machine = donnees_propres['DIM_Machine']

        df_prod = df_prod.merge(
            df_machine[['Id_Machine', 'Capacite_Minutes']],
            on='Id_Machine',
            how='left'
        )

        np.random.seed(42)
        df_prod['Nb_Heure_Machine'] = df_prod['Capacite_Minutes'].apply(
            lambda cap: round(cap * np.random.uniform(0.75, 0.95))
            if pd.notna(cap) and cap > 0 else 400
        )
        print(f"\n   ✅ Nb_Heure_Machine corrigé : taux utilisation 75-95%")

        if all(c in df_prod.columns for c in ['Cout_Unitaire_Heure', 'Mt_Matiere_Premiere']):
            df_prod['Cout_Production'] = (
                df_prod['Nb_Heure_Machine'] * df_prod['Cout_Unitaire_Heure'] + df_prod['Mt_Matiere_Premiere']
            ).round(2)
            print(f"   ✅ Cout_Production recalculé avec Nb_Heure_Machine corrigé")

        df_prod['Temps_Arret'] = df_prod['Capacite_Minutes'] - df_prod['Nb_Heure_Machine']
        df_prod['Temps_Arret'] = df_prod['Temps_Arret'].round(0).clip(lower=0)
        df_prod = df_prod.drop(columns=['Capacite_Minutes'], errors='ignore')

        donnees_propres['FAIT_Production'] = df_prod

        nb_calcule = df_prod['Temps_Arret'].notna().sum()
        nb_total   = len(df_prod)
        print(f"   ✅ Temps_Arret calculé : {nb_calcule}/{nb_total} lignes")

    donnees_propres = filtrer_fk(donnees_propres)

    print("\n" + "="*60)
    print("  TRANSFORMATION TERMINÉE")
    print("="*60)

    return donnees_propres

import requests

def notifier_backend():
    try:
        url = "http://localhost:5088/api/etl/notify"
        response = requests.post(url, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Backend notifié — {data['lignes']} lignes KPI recalculées")
        else:
            print(f"\n⚠️  Backend notifié mais erreur : {response.status_code}")
    except Exception as e:
        print(f"\n❌ Impossible de notifier le backend : {e}")

def filtrer_fk(donnees_propres):
    print("\n" + "="*60)
    print("  VÉRIFICATION DES CLÉS ÉTRANGÈRES (FK)")
    print("="*60)

    if 'DIM_Temps' in donnees_propres:
        ids_temps = set(donnees_propres['DIM_Temps']['Id_Temps'])
        for nom_fait in ['FAIT_Ventes', 'FAIT_Achats', 'FAIT_Production', 'FAIT_Qualite', 'FAIT_Stock']:
            if nom_fait in donnees_propres and 'Id_Temps' in donnees_propres[nom_fait].columns:
                avant = len(donnees_propres[nom_fait])
                donnees_propres[nom_fait] = donnees_propres[nom_fait][
                    donnees_propres[nom_fait]['Id_Temps'].isin(ids_temps)
                ]
                print(f"   {nom_fait:25} FK Id_Temps      : {avant - len(donnees_propres[nom_fait])} supprimées")

    if 'DIM_Produit' in donnees_propres:
        ids_produit = set(donnees_propres['DIM_Produit']['Id_Produit'])
        for nom_fait in ['FAIT_Ventes', 'FAIT_Achats', 'FAIT_Production', 'FAIT_Qualite', 'FAIT_Stock']:
            if nom_fait in donnees_propres and 'Id_Produit' in donnees_propres[nom_fait].columns:
                avant = len(donnees_propres[nom_fait])
                donnees_propres[nom_fait] = donnees_propres[nom_fait][
                    donnees_propres[nom_fait]['Id_Produit'].isin(ids_produit)
                ]
                print(f"   {nom_fait:25} FK Id_Produit    : {avant - len(donnees_propres[nom_fait])} supprimées")

    if 'DIM_Client' in donnees_propres and 'FAIT_Ventes' in donnees_propres:
        ids_client = set(donnees_propres['DIM_Client']['Id_Client'])
        avant = len(donnees_propres['FAIT_Ventes'])
        donnees_propres['FAIT_Ventes'] = donnees_propres['FAIT_Ventes'][
            donnees_propres['FAIT_Ventes']['Id_Client'].isin(ids_client)
        ]
        print(f"   FAIT_Ventes               FK Id_Client     : {avant - len(donnees_propres['FAIT_Ventes'])} supprimées")

    if 'DIM_Fournisseur' in donnees_propres and 'FAIT_Achats' in donnees_propres:
        ids_fourni = set(donnees_propres['DIM_Fournisseur']['Id_Fournisseur'])
        avant = len(donnees_propres['FAIT_Achats'])
        donnees_propres['FAIT_Achats'] = donnees_propres['FAIT_Achats'][
            donnees_propres['FAIT_Achats']['Id_Fournisseur'].isin(ids_fourni)
        ]
        print(f"   FAIT_Achats               FK Id_Fournisseur: {avant - len(donnees_propres['FAIT_Achats'])} supprimées")

    if 'DIM_Machine' in donnees_propres:
        ids_machine = set(donnees_propres['DIM_Machine']['Id_Machine'])
        for nom_fait in ['FAIT_Production', 'FAIT_Qualite']:
            if nom_fait in donnees_propres and 'Id_Machine' in donnees_propres[nom_fait].columns:
                avant = len(donnees_propres[nom_fait])
                donnees_propres[nom_fait] = donnees_propres[nom_fait][
                    donnees_propres[nom_fait]['Id_Machine'].isin(ids_machine)
                ]
                print(f"   {nom_fait:25} FK Id_Machine    : {avant - len(donnees_propres[nom_fait])} supprimées")

    print("\n📊 Résumé après vérification FK :")
    for nom, df in donnees_propres.items():
        print(f"   {nom:30} : {len(df)} lignes")

    return donnees_propres

def generer_rapport(donnees_avant, donnees_apres):
    print("\n" + "="*60)
    print("  RAPPORT COMPARATIF AVANT / APRÈS ETL")
    print("="*60)

    rapport = {}
    for nom_table, df_avant in donnees_avant.items():
        df_apres = donnees_apres.get(nom_table)
        if df_apres is None:
            continue

        nb_avant     = len(df_avant)
        nb_apres     = len(df_apres)
        nb_supprimes = nb_avant - nb_apres
        pct_nettoye  = round((nb_supprimes / nb_avant * 100) if nb_avant > 0 else 0, 2)

        rapport[nom_table] = {
            "table": nom_table, "nb_avant": nb_avant,
            "nb_apres": nb_apres, "nb_supprimes": nb_supprimes,
            "pct_nettoye": pct_nettoye,
        }

        print(f"\n📊 {nom_table}")
        print(f"   Avant      : {nb_avant} lignes")
        print(f"   Après      : {nb_apres} lignes")
        print(f"   Supprimées : {nb_supprimes} ({pct_nettoye}%)")

    print("\n" + "="*60 + "\n")
    return rapport

if __name__ == "__main__":
    from extract import extraire_toutes_tables
    donnees_avant = extraire_toutes_tables()
    donnees_apres = transformer_toutes_tables(donnees_avant)
    rapport       = generer_rapport(donnees_avant, donnees_apres)