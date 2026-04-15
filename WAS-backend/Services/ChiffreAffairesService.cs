// WAS-backend/Services/ChiffreAffairesService.cs
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WAS_backend.Data;
using WAS_backend.DTOs;
using WAS_backend.Models;

namespace WAS_backend.Services
{
    public interface IChiffreAffairesService
    {
        Task<CA_Response> GetChiffreAffaires(CA_QueryParams queryParams);
    }

    public class ChiffreAffairesService : IChiffreAffairesService
    {
        private readonly AppDbContext _context;

        public ChiffreAffairesService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CA_Response> GetChiffreAffaires(CA_QueryParams queryParams)
        {
            // ✅ ÉTAPE 1: Mettre à jour la colonne Chiffre_Affaires dans FAIT_Ventes
            await MettreAJourChiffreAffaires();

            var query = _context.FaitVentes
                .Include(f => f.DimClient)
                .Include(f => f.DimProduit)
                .Include(f => f.DimTemps)
                .AsQueryable();

            // Application des filtres
            if (queryParams.Annee.HasValue)
                query = query.Where(f => f.DimTemps != null && f.DimTemps.Annee == queryParams.Annee);

            if (queryParams.Trimestre.HasValue)
                query = query.Where(f => f.DimTemps != null && f.DimTemps.Trimestre == queryParams.Trimestre);

            if (queryParams.ClientId.HasValue)
                query = query.Where(f => f.IdClient == queryParams.ClientId);

            if (queryParams.ProduitId.HasValue)
                query = query.Where(f => f.IdProduit == queryParams.ProduitId);

            var data = await query.ToListAsync();

            // Années disponibles
            var annees = await _context.DimTemps
                .Select(t => t.Annee)
                .Distinct()
                .OrderBy(a => a)
                .ToListAsync();

            var trimestres = new List<int> { 1, 2, 3, 4 };

            if (!data.Any())
            {
                return new CA_Response
                {
                    Annees = annees,
                    Trimestres = trimestres
                };
            }

            // Calcul du CA Total
            var caTotal = data.Sum(f => f.MontantVenteHT);

            // Clients distincts
            var clientsIds = data.Select(f => f.IdClient).Distinct().ToList();
            
            // Calcul de la croissance avec les vraies années de ventes
            var croissance = await CalculerCroissanceReelle(queryParams.Annee);
            
            // Calcul global
            var global = new CA_Global
            {
                CaTotal = Math.Round(caTotal, 2),
                NombreClientsActifs = clientsIds.Count,
                NombreProduitsVendus = data.Select(f => f.IdProduit).Distinct().Count(),
                CaMoyenMensuel = data.Count > 0 ? Math.Round(caTotal / data.Count, 2) : 0,
                CroissanceAnnuelle = croissance
            };

            // Par Client
            var parClient = data
                .Where(f => f.DimClient != null)
                .GroupBy(f => new { f.IdClient, f.DimClient!.Nom, f.DimClient!.Prenom })
                .Select(g => new CA_Client
                {
                    ClientId = g.Key.IdClient,
                    ClientNom = g.Key.Nom,
                    ClientPrenom = g.Key.Prenom,
                    Ca = Math.Round(g.Sum(f => f.MontantVenteHT), 2),
                    PartPourcentage = caTotal > 0 
                        ? Math.Round(g.Sum(f => f.MontantVenteHT) / caTotal * 100, 2)
                        : 0,
                    EvolutionAnnuelle = 0
                })
                .OrderByDescending(c => c.Ca)
                .ToList();

            // Par Produit
            var parProduit = data
                .Where(f => f.DimProduit != null)
                .GroupBy(f => new { f.IdProduit, f.DimProduit!.Description, f.DimProduit!.Categorie })
                .Select(g => new CA_Produit
                {
                    ProduitId = g.Key.IdProduit,
                    ProduitNom = g.Key.Description,
                    Categorie = g.Key.Categorie ?? "Non catégorisé",
                    Ca = Math.Round(g.Sum(f => f.MontantVenteHT), 2),
                    QuantiteVendue = (int)g.Sum(f => f.QteVendue),
                    PartPourcentage = caTotal > 0 
                        ? Math.Round(g.Sum(f => f.MontantVenteHT) / caTotal * 100, 2)
                        : 0,
                    EvolutionAnnuelle = 0
                })
                .OrderByDescending(p => p.Ca)
                .ToList();

            // Par Temps
            var parTemps = data
                .Where(f => f.DimTemps != null)
                .GroupBy(f => new { f.DimTemps!.Mois, f.DimTemps!.Trimestre, f.DimTemps!.Annee })
                .Select(g => new CA_Temps
                {
                    Periode = GetMonthLabel(g.Key.Mois, g.Key.Annee),
                    Mois = g.Key.Mois,
                    Trimestre = g.Key.Trimestre,
                    Annee = g.Key.Annee,
                    Ca = Math.Round(g.Sum(f => f.MontantVenteHT), 2),
                    NbVentes = g.Count()
                })
                .OrderBy(t => t.Annee)
                .ThenBy(t => t.Mois)
                .ToList();

            return new CA_Response
            {
                Global = global,
                Clients = parClient,
                Produits = parProduit,
                Temps = parTemps,
                Annees = annees,
                Trimestres = trimestres
            };
        }

        // ✅ NOUVELLE MÉTHODE: Met à jour la colonne Chiffre_Affaires dans FAIT_Ventes
        private async Task MettreAJourChiffreAffaires()
        {
            try
            {
                // Récupérer toutes les ventes où Chiffre_Affaires est NULL
                var ventes = await _context.FaitVentes
                    .Where(v => v.ChiffreAffaires == null)
                    .ToListAsync();

                if (!ventes.Any())
                {
                    Console.WriteLine("✅ Tous les Chiffre_Affaires sont déjà remplis");
                    return;
                }

                Console.WriteLine($"📝 Mise à jour de {ventes.Count} lignes dans FAIT_Ventes");

                foreach (var vente in ventes)
                {
                    // Calculer le Chiffre d'Affaires = Quantité × Prix unitaire
                    vente.ChiffreAffaires = vente.QteVendue * vente.PrixVenteUnitaire;
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ {ventes.Count} lignes mises à jour dans la colonne Chiffre_Affaires");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur lors de la mise à jour de Chiffre_Affaires: {ex.Message}");
            }
        }

        // Méthode qui calcule la croissance avec les vraies années de ventes
        private async Task<double> CalculerCroissanceReelle(int? anneeCourante)
        {
            try
            {
                // Récupérer toutes les années qui ont des ventes
                var anneesAvecVentes = await _context.FaitVentes
                    .Where(f => f.DimTemps != null)
                    .Select(f => f.DimTemps!.Annee)
                    .Distinct()
                    .OrderByDescending(a => a)
                    .ToListAsync();

                Console.WriteLine("═══════════════════════════════════════════");
                Console.WriteLine($"📅 Années avec ventes: {string.Join(", ", anneesAvecVentes)}");
                Console.WriteLine("═══════════════════════════════════════════");

                if (anneesAvecVentes.Count < 2)
                {
                    Console.WriteLine("⚠️ Pas assez d'années pour calculer la croissance");
                    return 0;
                }

                // Si une année spécifique est demandée
                if (anneeCourante.HasValue)
                {
                    Console.WriteLine($"🔍 Année demandée: {anneeCourante.Value}");
                    
                    // Vérifier que l'année demandée a des ventes
                    if (!anneesAvecVentes.Contains(anneeCourante.Value))
                    {
                        Console.WriteLine($"⚠️ L'année {anneeCourante.Value} n'a pas de ventes");
                        return 0;
                    }

                    // Trouver l'année précédente qui a des ventes
                    var anneePrecedente = anneesAvecVentes.FirstOrDefault(a => a < anneeCourante.Value);
                    
                    if (anneePrecedente == 0)
                    {
                        Console.WriteLine($"⚠️ Pas d'année précédente avec ventes pour {anneeCourante.Value}");
                        return 0;
                    }

                    var caCourant = await _context.FaitVentes
                        .Where(f => f.DimTemps != null && f.DimTemps.Annee == anneeCourante)
                        .SumAsync(f => f.MontantVenteHT);

                    var caPrecedent = await _context.FaitVentes
                        .Where(f => f.DimTemps != null && f.DimTemps.Annee == anneePrecedente)
                        .SumAsync(f => f.MontantVenteHT);

                    Console.WriteLine($"💰 CA {anneeCourante}: {caCourant:F0} DT");
                    Console.WriteLine($"💰 CA {anneePrecedente}: {caPrecedent:F0} DT");

                    if (caPrecedent == 0)
                    {
                        Console.WriteLine($"⚠️ CA précédent nul pour {anneePrecedente}");
                        return 0;
                    }

                    var croissance = Math.Round((caCourant - caPrecedent) / caPrecedent * 100, 2);
                    Console.WriteLine($"📈 Croissance: {croissance}%");
                    Console.WriteLine("═══════════════════════════════════════════");
                    
                    return croissance;
                }

                // Sinon, prendre les 2 dernières années avec ventes
                var derniereAnnee = anneesAvecVentes[0];
                var anneeAvant = anneesAvecVentes[1];

                Console.WriteLine($"📊 Comparaison: {derniereAnnee} vs {anneeAvant}");

                var caDernier = await _context.FaitVentes
                    .Where(f => f.DimTemps != null && f.DimTemps.Annee == derniereAnnee)
                    .SumAsync(f => f.MontantVenteHT);

                var caAvant = await _context.FaitVentes
                    .Where(f => f.DimTemps != null && f.DimTemps.Annee == anneeAvant)
                    .SumAsync(f => f.MontantVenteHT);

                Console.WriteLine($"💰 CA {derniereAnnee}: {caDernier:F0} DT");
                Console.WriteLine($"💰 CA {anneeAvant}: {caAvant:F0} DT");

                if (caAvant == 0)
                {
                    Console.WriteLine($"⚠️ CA précédent nul pour {anneeAvant}");
                    return 0;
                }

                var croissanceGlobale = Math.Round((caDernier - caAvant) / caAvant * 100, 2);
                Console.WriteLine($"📈 Croissance globale: {croissanceGlobale}%");
                Console.WriteLine("═══════════════════════════════════════════");
                
                return croissanceGlobale;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur calcul croissance: {ex.Message}");
                return 0;
            }
        }

        private string GetMonthLabel(int mois, int annee)
        {
            string[] moisNoms = { "Jan", "Fév", "Mar", "Avr", "Mai", "Jun", 
                                  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc" };
            return $"{moisNoms[mois - 1]} {annee}";
        }
    }
}