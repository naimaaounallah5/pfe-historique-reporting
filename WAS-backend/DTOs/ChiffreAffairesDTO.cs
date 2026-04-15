// WAS-backend/DTOs/ChiffreAffairesDTO.cs
using System;
using System.Collections.Generic;

namespace WAS_backend.DTOs
{
    public class CA_Global
    {
        public double CaTotal { get; set; }
        public double CroissanceAnnuelle { get; set; }
        public int NombreClientsActifs { get; set; }
        public int NombreProduitsVendus { get; set; }
        public double CaMoyenMensuel { get; set; }
    }

    public class CA_Client
    {
        public int ClientId { get; set; }
        public string ClientNom { get; set; } = string.Empty;
        public string ClientPrenom { get; set; } = string.Empty;
        public double Ca { get; set; }
        public double PartPourcentage { get; set; }
        public double EvolutionAnnuelle { get; set; }
    }

    public class CA_Produit
    {
        public int ProduitId { get; set; }
        public string ProduitNom { get; set; } = string.Empty;
        public string Categorie { get; set; } = string.Empty;
        public double Ca { get; set; }
        public int QuantiteVendue { get; set; }
        public double PartPourcentage { get; set; }
        public double EvolutionAnnuelle { get; set; }
    }

    public class CA_Temps
    {
        public string Periode { get; set; } = string.Empty;
        public int Mois { get; set; }
        public int Trimestre { get; set; }
        public int Annee { get; set; }
        public double Ca { get; set; }
        public int NbVentes { get; set; }
    }

    public class CA_Response
    {
        public CA_Global Global { get; set; } = new();
        public List<CA_Client> Clients { get; set; } = new();
        public List<CA_Produit> Produits { get; set; } = new();
        public List<CA_Temps> Temps { get; set; } = new();
        public List<int> Annees { get; set; } = new();
        public List<int> Trimestres { get; set; } = new();
    }

    public class CA_QueryParams
    {
        public int? Annee { get; set; }
        public int? Trimestre { get; set; }
        public int? ClientId { get; set; }
        public int? ProduitId { get; set; }
    }
}