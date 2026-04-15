// WAS-backend/DTOs/QualiteDTO.cs
using System;
using System.Collections.Generic;

namespace WAS_backend.DTOs
{
    public class TauxDefautGlobal
    {
        public double TauxDefautMoyen { get; set; }
        public int NombreProduitsControles { get; set; }
        public int NombreDefauts { get; set; }
        public int NombreProduitsConformes { get; set; }
        public double TauxConformite { get; set; }
    }

    public class DefautParProduit
    {
        public string Produit { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Categorie { get; set; } = string.Empty;
        public string Groupe { get; set; } = string.Empty;
        public int NombreControles { get; set; }
        public int NombreDefauts { get; set; }
        public double TauxDefaut { get; set; }
        public double TauxConformite { get; set; }
    }

    public class DefautParTemps
    {
        public string Label { get; set; } = string.Empty;
        public int Mois { get; set; }
        public int Trimestre { get; set; }
        public int Annee { get; set; }
        public int NombreControles { get; set; }
        public int NombreDefauts { get; set; }
        public double TauxDefaut { get; set; }
    }

    public class DefautParMachine
    {
        public string Machine { get; set; } = string.Empty;
        public string Groupe { get; set; } = string.Empty;
        public string Site { get; set; } = string.Empty;
        public int NombreControles { get; set; }
        public int NombreDefauts { get; set; }
        public double TauxDefaut { get; set; }
    }

    public class QualiteFilters
    {
        public List<int> Annees { get; set; } = new();
        public List<int> Trimestres { get; set; } = new();
        public List<string> Produits { get; set; } = new();
        public List<string> Machines { get; set; } = new();
        public List<string> Categories { get; set; } = new();
    }

    public class QualiteResponse
    {
        public TauxDefautGlobal? Global { get; set; }
        public List<DefautParProduit>? ParProduit { get; set; }
        public List<DefautParTemps>? ParTemps { get; set; }
        public List<DefautParMachine>? ParMachine { get; set; }
        public QualiteFilters? Filters { get; set; }
    }

    public class QualiteQueryParams
    {
        public int? Annee { get; set; }
        public int? Trimestre { get; set; }
        public string? Produit { get; set; }
        public string? Machine { get; set; }
        public string? Categorie { get; set; }
    }
}