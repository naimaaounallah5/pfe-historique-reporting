// WAS-backend/Repositories/TempsArretRepository.cs
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.DTOs;
using System.Data;

namespace WAS_backend.Repositories
{
    public class TempsArretRepository : ITempsArretRepository
    {
        private readonly AppDbContext _context;
        private readonly string _connectionString;

        public TempsArretRepository(AppDbContext context)
        {
            _context = context;
            _connectionString = _context.Database.GetConnectionString() ?? "";
        }

        public async Task<TempsArretResponseDTO> GetTempsArret(TempsArretQueryParams queryParams)
        {
            try
            {
                var data = new List<TempsArretRawDTO>();

                // Utiliser ADO.NET pour éviter les problèmes de mapping EF
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    var sql = @"
                        SELECT 
                            p.Id_Production,
                            p.Id_Machine,
                            p.Id_Produit,
                            p.Nb_Heure_Machine,
                            p.Temps_Arret,
                            ISNULL(m.Nom, '') as MachineNom,
                            ISNULL(m.Groupe, '') as MachineGroupe,
                            ISNULL(pr.Description, '') as ProduitNom,
                            ISNULL(t.Annee, 0) as Annee,
                            ISNULL(t.Mois, 0) as Mois,
                            ISNULL(t.Trimestre, 0) as Trimestre
                        FROM FAIT_Production p
                        LEFT JOIN DIM_Machine m ON p.Id_Machine = m.Id_Machine
                        LEFT JOIN DIM_Produit pr ON p.Id_Produit = pr.Id_Produit
                        LEFT JOIN DIM_Temps t ON p.Id_Temps = t.Id_Temps
                        WHERE p.Temps_Arret IS NOT NULL AND p.Temps_Arret > 0";

                    using (var command = new SqlCommand(sql, connection))
                    {
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                data.Add(new TempsArretRawDTO
                                {
                                    Id_Production = reader.GetInt32(0),
                                    Id_Machine = reader.GetInt32(1),
                                    Id_Produit = reader.GetInt32(2),
                                    Nb_Heure_Machine = Convert.ToDouble(reader.GetValue(3)),
                                    Temps_Arret = Convert.ToDouble(reader.GetValue(4)),
                                    MachineNom = reader.GetString(5),
                                    MachineGroupe = reader.GetString(6),
                                    ProduitNom = reader.GetString(7),
                                    Annee = reader.GetInt32(8),
                                    Mois = reader.GetInt32(9),
                                    Trimestre = reader.GetInt32(10)
                                });
                            }
                        }
                    }
                }

                // Années disponibles
                var annees = await _context.DimTemps
                    .Select(t => t.Annee)
                    .Distinct()
                    .OrderBy(a => a)
                    .ToListAsync();

                if (!data.Any())
                {
                    return new TempsArretResponseDTO
                    {
                        Annees = annees,
                        Global = new TempsArretGlobalDTO(),
                        ParMachine = new List<TempsArretParMachineDTO>(),
                        ParTemps = new List<TempsArretParTempsDTO>(),
                        ParProduit = new List<TempsArretParProduitDTO>()
                    };
                }

                // Filtrer selon les paramètres
                var filteredData = data.AsEnumerable();
                
                if (queryParams.MachineId.HasValue)
                    filteredData = filteredData.Where(p => p.Id_Machine == queryParams.MachineId.Value);
                
                if (queryParams.ProduitId.HasValue)
                    filteredData = filteredData.Where(p => p.Id_Produit == queryParams.ProduitId.Value);
                
                if (queryParams.Annee.HasValue)
                    filteredData = filteredData.Where(p => p.Annee == queryParams.Annee.Value);
                
                if (queryParams.Trimestre.HasValue)
                    filteredData = filteredData.Where(p => p.Trimestre == queryParams.Trimestre.Value);

                var dataList = filteredData.ToList();

                // Calcul global
                var totalMinutes = dataList.Sum(p => p.Temps_Arret);
                var global = new TempsArretGlobalDTO
                {
                    TotalArretMinutes = Math.Round(totalMinutes, 2),
                    TotalArretHeures = Math.Round(totalMinutes / 60.0, 2),
                    NbOrdres = dataList.Count,
                    MoyenneArretParOrdre = dataList.Count > 0 ? Math.Round(totalMinutes / dataList.Count, 2) : 0
                };

                // Par Machine
                var parMachine = dataList
                    .GroupBy(p => new { p.Id_Machine, p.MachineNom, p.MachineGroupe })
                    .Select(g => new TempsArretParMachineDTO
                    {
                        MachineId = g.Key.Id_Machine,
                        MachineNom = g.Key.MachineNom ?? "Inconnue",
                        MachineGroupe = g.Key.MachineGroupe ?? "Non défini",
                        TotalArretMinutes = Math.Round(g.Sum(p => p.Temps_Arret), 2),
                        TotalArretHeures = Math.Round(g.Sum(p => p.Temps_Arret) / 60.0, 2),
                        NbOrdres = g.Count(),
                        Pourcentage = totalMinutes > 0 
                            ? Math.Round(g.Sum(p => p.Temps_Arret) / totalMinutes * 100, 2)
                            : 0
                    })
                    .OrderByDescending(m => m.TotalArretMinutes)
                    .ToList();

                // Par Temps
                var parTemps = dataList
                    .GroupBy(p => new { p.Annee, p.Mois, p.Trimestre })
                    .Select(g => new TempsArretParTempsDTO
                    {
                        Periode = g.Key.Mois > 0 
                            ? GetMonthLabel(g.Key.Mois, g.Key.Annee)
                            : g.Key.Annee.ToString(),
                        Annee = g.Key.Annee,
                        Mois = g.Key.Mois,
                        Trimestre = g.Key.Trimestre,
                        TotalArretMinutes = Math.Round(g.Sum(p => p.Temps_Arret), 2),
                        NbOrdres = g.Count()
                    })
                    .OrderBy(t => t.Annee)
                    .ThenBy(t => t.Mois)
                    .ToList();

                // Par Produit
                var parProduit = dataList
                    .GroupBy(p => new { p.Id_Produit, p.ProduitNom })
                    .Select(g => new TempsArretParProduitDTO
                    {
                        ProduitId = g.Key.Id_Produit,
                        ProduitNom = g.Key.ProduitNom ?? "Inconnu",
                        TotalArretMinutes = Math.Round(g.Sum(p => p.Temps_Arret), 2),
                        NbOrdres = g.Count(),
                        MoyenneArretParOrdre = g.Count() > 0 ? Math.Round(g.Sum(p => p.Temps_Arret) / g.Count(), 2) : 0
                    })
                    .OrderByDescending(p => p.TotalArretMinutes)
                    .ToList();

                return new TempsArretResponseDTO
                {
                    Global = global,
                    ParMachine = parMachine,
                    ParTemps = parTemps,
                    ParProduit = parProduit,
                    Annees = annees
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur dans TempsArretRepository: {ex.Message}");
                Console.WriteLine($"❌ StackTrace: {ex.StackTrace}");
                
                return new TempsArretResponseDTO
                {
                    Annees = new List<int>(),
                    Global = new TempsArretGlobalDTO(),
                    ParMachine = new List<TempsArretParMachineDTO>(),
                    ParTemps = new List<TempsArretParTempsDTO>(),
                    ParProduit = new List<TempsArretParProduitDTO>()
                };
            }
        }

        private string GetMonthLabel(int mois, int annee)
        {
            string[] moisNoms = { "Jan", "Fév", "Mar", "Avr", "Mai", "Jun", 
                                  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc" };
            return $"{moisNoms[mois - 1]} {annee}";
        }
    }

    public class TempsArretRawDTO
    {
        public int Id_Production { get; set; }
        public int Id_Machine { get; set; }
        public int Id_Produit { get; set; }
        public double Nb_Heure_Machine { get; set; }
        public double Temps_Arret { get; set; }
        public string MachineNom { get; set; } = "";
        public string MachineGroupe { get; set; } = "";
        public string ProduitNom { get; set; } = "";
        public int Annee { get; set; }
        public int Mois { get; set; }
        public int Trimestre { get; set; }
    }
}