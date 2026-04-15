// WAS-backend/DTOs/StockDTO.cs
using System;
using System.Collections.Generic;

namespace WAS_backend.DTOs
{
    public class StockGlobal
    {
        public double StockTotal { get; set; }
        public double EntreesTotales { get; set; }
        public double SortiesTotales { get; set; }
        public int NombreProduits { get; set; }
        public double RotationMoyenne { get; set; }
        public int ProduitsEnAlerte { get; set; }
    }

    public class StockParProduit
    {
        public string Produit { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Categorie { get; set; } = string.Empty;
        public string Groupe { get; set; } = string.Empty;
        public string TypeProduit { get; set; } = string.Empty; // ✅ ajouté
        public double StockDisponible { get; set; }
        public double Entrees { get; set; }
        public double Sorties { get; set; }
        public double Rotation { get; set; }
        public bool EstEnAlerte { get; set; }
    }

    public class StockParTemps
    {
        public string Label { get; set; } = string.Empty;
        public int Mois { get; set; }
        public int Trimestre { get; set; }
        public int Annee { get; set; }
        public double Entrees { get; set; }
        public double Sorties { get; set; }
        public double StockMoyen { get; set; }
    }

    public class StockResponse
    {
        public StockGlobal Global { get; set; } = new();
        public List<StockParProduit> ParProduit { get; set; } = new();
        public List<StockParTemps> ParTemps { get; set; } = new();
    }

    public class StockQueryParams
    {
        public int? Annee { get; set; }
        public int? Trimestre { get; set; }
        public string? Produit { get; set; }
        public string? Categorie { get; set; }
    }
}