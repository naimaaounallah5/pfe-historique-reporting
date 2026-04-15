using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.DTOs;
using WAS_backend.Models;

namespace WAS_backend.Repositories
{
    public class HistoriqueRepository : IHistoriqueRepository
    {
        private readonly AppDbContext _context;

        public HistoriqueRepository(AppDbContext context)
        {
            _context = context;
        }

        // ════════════════════════════════════════════════════
        // SCADA
        // ════════════════════════════════════════════════════
        public async Task<HistoriquePageResult<HistoriqueSCADADto>> GetSCADAAsync(HistoriqueQueryParams p)
        {
            var query = _context.HistoriqueSCADA
                .Include(x => x.Machine)
                .Include(x => x.Produit)
                .AsQueryable();

            if (!string.IsNullOrEmpty(p.Recherche))
                query = query.Where(x =>
                    x.NumeroEntree.Contains(p.Recherche) ||
                    x.NumeroOrdre.Contains(p.Recherche)  ||
                    x.NumeroOperation.Contains(p.Recherche));

            if (!string.IsNullOrEmpty(p.Statut))
                query = query.Where(x => x.Statut == p.Statut);

            if (p.DateDebut.HasValue)
                query = query.Where(x => x.DateEnregistrement >= p.DateDebut.Value);

            if (p.DateFin.HasValue)
                query = query.Where(x => x.DateEnregistrement <= p.DateFin.Value);

            if (!string.IsNullOrEmpty(p.CentreTravail))
                query = query.Where(x => x.Machine != null && x.Machine.Nom == p.CentreTravail);

            var total = await query.CountAsync();

            var donnees = await query
                .OrderBy(x => x.Id)
                .Skip((p.Page - 1) * p.PageSize)
                .Take(p.PageSize)
                .Select(x => new HistoriqueSCADADto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomMachine         = x.Machine != null ? x.Machine.Nom : "",
                    NomProduit         = x.Produit  != null ? x.Produit.Description : "",
                    NumeroOperation    = x.NumeroOperation,
                    NumeroOrdre        = x.NumeroOrdre,
                    QuantiteProduite   = x.QuantiteProduite,
                    QuantiteRebut      = x.QuantiteRebut,
                    RunTime            = x.RunTime,
                    StopTime           = x.StopTime,
                    SetupTime          = x.SetupTime,
                    HeureDebut         = x.HeureDebut,
                    HeureFin           = x.HeureFin,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .ToListAsync();

            return new HistoriquePageResult<HistoriqueSCADADto>
            {
                Donnees     = donnees,
                TotalLignes = total,
                Page        = p.Page,
                PageSize    = p.PageSize
            };
        }

        public async Task<List<HistoriqueSCADADto>> ExportSCADAAsync(HistoriqueQueryParams p)
        {
            var query = _context.HistoriqueSCADA
                .Include(x => x.Machine)
                .Include(x => x.Produit)
                .AsQueryable();

            if (!string.IsNullOrEmpty(p.Recherche))
                query = query.Where(x =>
                    x.NumeroEntree.Contains(p.Recherche) ||
                    x.NumeroOrdre.Contains(p.Recherche)  ||
                    x.NumeroOperation.Contains(p.Recherche));

            if (!string.IsNullOrEmpty(p.Statut))
                query = query.Where(x => x.Statut == p.Statut);

            if (p.DateDebut.HasValue)
                query = query.Where(x => x.DateEnregistrement >= p.DateDebut.Value);

            if (p.DateFin.HasValue)
                query = query.Where(x => x.DateEnregistrement <= p.DateFin.Value);

            if (!string.IsNullOrEmpty(p.CentreTravail))
                query = query.Where(x => x.Machine != null && x.Machine.Nom == p.CentreTravail);

            return await query
                .OrderBy(x => x.Id)
                .Select(x => new HistoriqueSCADADto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomMachine         = x.Machine != null ? x.Machine.Nom : "",
                    NomProduit         = x.Produit  != null ? x.Produit.Description : "",
                    NumeroOperation    = x.NumeroOperation,
                    NumeroOrdre        = x.NumeroOrdre,
                    QuantiteProduite   = x.QuantiteProduite,
                    QuantiteRebut      = x.QuantiteRebut,
                    RunTime            = x.RunTime,
                    StopTime           = x.StopTime,
                    SetupTime          = x.SetupTime,
                    HeureDebut         = x.HeureDebut,
                    HeureFin           = x.HeureFin,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .ToListAsync();
        }

        public async Task<HistoriqueSCADADto?> GetSCADAByIdAsync(int id)
        {
            return await _context.HistoriqueSCADA
                .Include(x => x.Machine)
                .Include(x => x.Produit)
                .Where(x => x.Id == id)
                .Select(x => new HistoriqueSCADADto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomMachine         = x.Machine != null ? x.Machine.Nom : "",
                    NomProduit         = x.Produit  != null ? x.Produit.Description : "",
                    NumeroOperation    = x.NumeroOperation,
                    NumeroOrdre        = x.NumeroOrdre,
                    QuantiteProduite   = x.QuantiteProduite,
                    QuantiteRebut      = x.QuantiteRebut,
                    RunTime            = x.RunTime,
                    StopTime           = x.StopTime,
                    SetupTime          = x.SetupTime,
                    HeureDebut         = x.HeureDebut,
                    HeureFin           = x.HeureFin,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .FirstOrDefaultAsync();
        }

        // ════════════════════════════════════════════════════
        // WMS
        // ════════════════════════════════════════════════════
        public async Task<HistoriquePageResult<HistoriqueWMSDto>> GetWMSAsync(HistoriqueQueryParams p)
        {
            var query = _context.HistoriqueWMS
                .Include(x => x.Produit)
                .AsQueryable();

            if (!string.IsNullOrEmpty(p.Recherche))
                query = query.Where(x =>
                    x.NumeroEntree.Contains(p.Recherche) ||
                    x.NumeroLot.Contains(p.Recherche)    ||
                    x.Zone.Contains(p.Recherche));

            if (!string.IsNullOrEmpty(p.Statut))
                query = query.Where(x => x.Statut == p.Statut);

            if (p.DateDebut.HasValue)
                query = query.Where(x => x.DateEnregistrement >= p.DateDebut.Value);

            if (p.DateFin.HasValue)
                query = query.Where(x => x.DateEnregistrement <= p.DateFin.Value);

            var total = await query.CountAsync();

            var donnees = await query
                .OrderBy(x => x.Id)
                .Skip((p.Page - 1) * p.PageSize)
                .Take(p.PageSize)
                .Select(x => new HistoriqueWMSDto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomProduit         = x.Produit != null ? x.Produit.Description : "",
                    NumeroLot          = x.NumeroLot,
                    Zone               = x.Zone,
                    TypeMouvement      = x.TypeMouvement,
                    QuantiteTraitee    = x.QuantiteTraitee,
                    QuantiteRejetee    = x.QuantiteRejetee,
                    DureeTraitement    = x.DureeTraitement,
                    DureeArret         = x.DureeArret,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .ToListAsync();

            return new HistoriquePageResult<HistoriqueWMSDto>
            {
                Donnees     = donnees,
                TotalLignes = total,
                Page        = p.Page,
                PageSize    = p.PageSize
            };
        }

        public async Task<List<HistoriqueWMSDto>> ExportWMSAsync(HistoriqueQueryParams p)
        {
            var query = _context.HistoriqueWMS
                .Include(x => x.Produit)
                .AsQueryable();

            if (!string.IsNullOrEmpty(p.Recherche))
                query = query.Where(x =>
                    x.NumeroEntree.Contains(p.Recherche) ||
                    x.NumeroLot.Contains(p.Recherche)    ||
                    x.Zone.Contains(p.Recherche));

            if (!string.IsNullOrEmpty(p.Statut))
                query = query.Where(x => x.Statut == p.Statut);

            if (p.DateDebut.HasValue)
                query = query.Where(x => x.DateEnregistrement >= p.DateDebut.Value);

            if (p.DateFin.HasValue)
                query = query.Where(x => x.DateEnregistrement <= p.DateFin.Value);

            return await query
                .OrderBy(x => x.Id)
                .Select(x => new HistoriqueWMSDto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomProduit         = x.Produit != null ? x.Produit.Description : "",
                    NumeroLot          = x.NumeroLot,
                    Zone               = x.Zone,
                    TypeMouvement      = x.TypeMouvement,
                    QuantiteTraitee    = x.QuantiteTraitee,
                    QuantiteRejetee    = x.QuantiteRejetee,
                    DureeTraitement    = x.DureeTraitement,
                    DureeArret         = x.DureeArret,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .ToListAsync();
        }

        public async Task<HistoriqueWMSDto?> GetWMSByIdAsync(int id)
        {
            return await _context.HistoriqueWMS
                .Include(x => x.Produit)
                .Where(x => x.Id == id)
                .Select(x => new HistoriqueWMSDto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomProduit         = x.Produit != null ? x.Produit.Description : "",
                    NumeroLot          = x.NumeroLot,
                    Zone               = x.Zone,
                    TypeMouvement      = x.TypeMouvement,
                    QuantiteTraitee    = x.QuantiteTraitee,
                    QuantiteRejetee    = x.QuantiteRejetee,
                    DureeTraitement    = x.DureeTraitement,
                    DureeArret         = x.DureeArret,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .FirstOrDefaultAsync();
        }

        // ════════════════════════════════════════════════════
        // QDC
        // ════════════════════════════════════════════════════
        public async Task<HistoriquePageResult<HistoriqueQDCDto>> GetQDCAsync(HistoriqueQueryParams p)
        {
            var query = _context.HistoriqueQDC
                .Include(x => x.Produit)
                .Include(x => x.Machine)
                .AsQueryable();

            if (!string.IsNullOrEmpty(p.Recherche))
                query = query.Where(x =>
                    x.NumeroEntree.Contains(p.Recherche)    ||
                    x.LigneProduction.Contains(p.Recherche) ||
                    x.TypeControle.Contains(p.Recherche));

            if (!string.IsNullOrEmpty(p.Statut))
                query = query.Where(x => x.Statut == p.Statut);

            if (p.DateDebut.HasValue)
                query = query.Where(x => x.DateEnregistrement >= p.DateDebut.Value);

            if (p.DateFin.HasValue)
                query = query.Where(x => x.DateEnregistrement <= p.DateFin.Value);

            var total = await query.CountAsync();

            var donnees = await query
                .OrderBy(x => x.Id)
                .Skip((p.Page - 1) * p.PageSize)
                .Take(p.PageSize)
                .Select(x => new HistoriqueQDCDto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomProduit         = x.Produit  != null ? x.Produit.Description : "",
                    NomMachine         = x.Machine  != null ? x.Machine.Nom : "",
                    LigneProduction    = x.LigneProduction,
                    TypeControle       = x.TypeControle,
                    QuantiteControlee  = x.QuantiteControlee,
                    QuantiteDefaut     = x.QuantiteDefaut,
                    TauxDefaut         = x.TauxDefaut,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .ToListAsync();

            return new HistoriquePageResult<HistoriqueQDCDto>
            {
                Donnees     = donnees,
                TotalLignes = total,
                Page        = p.Page,
                PageSize    = p.PageSize
            };
        }

        public async Task<List<HistoriqueQDCDto>> ExportQDCAsync(HistoriqueQueryParams p)
        {
            var query = _context.HistoriqueQDC
                .Include(x => x.Produit)
                .Include(x => x.Machine)
                .AsQueryable();

            if (!string.IsNullOrEmpty(p.Recherche))
                query = query.Where(x =>
                    x.NumeroEntree.Contains(p.Recherche)    ||
                    x.LigneProduction.Contains(p.Recherche) ||
                    x.TypeControle.Contains(p.Recherche));

            if (!string.IsNullOrEmpty(p.Statut))
                query = query.Where(x => x.Statut == p.Statut);

            if (p.DateDebut.HasValue)
                query = query.Where(x => x.DateEnregistrement >= p.DateDebut.Value);

            if (p.DateFin.HasValue)
                query = query.Where(x => x.DateEnregistrement <= p.DateFin.Value);

            return await query
                .OrderBy(x => x.Id)
                .Select(x => new HistoriqueQDCDto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomProduit         = x.Produit  != null ? x.Produit.Description : "",
                    NomMachine         = x.Machine  != null ? x.Machine.Nom : "",
                    LigneProduction    = x.LigneProduction,
                    TypeControle       = x.TypeControle,
                    QuantiteControlee  = x.QuantiteControlee,
                    QuantiteDefaut     = x.QuantiteDefaut,
                    TauxDefaut         = x.TauxDefaut,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .ToListAsync();
        }

        public async Task<HistoriqueQDCDto?> GetQDCByIdAsync(int id)
        {
            return await _context.HistoriqueQDC
                .Include(x => x.Produit)
                .Include(x => x.Machine)
                .Where(x => x.Id == id)
                .Select(x => new HistoriqueQDCDto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomProduit         = x.Produit != null ? x.Produit.Description : "",
                    NomMachine         = x.Machine != null ? x.Machine.Nom : "",
                    LigneProduction    = x.LigneProduction,
                    TypeControle       = x.TypeControle,
                    QuantiteControlee  = x.QuantiteControlee,
                    QuantiteDefaut     = x.QuantiteDefaut,
                    TauxDefaut         = x.TauxDefaut,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .FirstOrDefaultAsync();
        }

        // ════════════════════════════════════════════════════
        // AGV
        // ════════════════════════════════════════════════════
        public async Task<HistoriquePageResult<HistoriqueAGVDto>> GetAGVAsync(HistoriqueQueryParams p)
        {
            var query = _context.HistoriqueAGV
                .Include(x => x.Produit)
                .AsQueryable();

            if (!string.IsNullOrEmpty(p.Recherche))
                query = query.Where(x =>
                    x.NumeroEntree.Contains(p.Recherche)    ||
                    x.CodeAGV.Contains(p.Recherche)         ||
                    x.NumeroTransfert.Contains(p.Recherche));

            if (!string.IsNullOrEmpty(p.Statut))
                query = query.Where(x => x.Statut == p.Statut);

            if (p.DateDebut.HasValue)
                query = query.Where(x => x.DateEnregistrement >= p.DateDebut.Value);

            if (p.DateFin.HasValue)
                query = query.Where(x => x.DateEnregistrement <= p.DateFin.Value);

            var total = await query.CountAsync();

            var donnees = await query
                .OrderBy(x => x.Id)
                .Skip((p.Page - 1) * p.PageSize)
                .Take(p.PageSize)
                .Select(x => new HistoriqueAGVDto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomProduit         = x.Produit != null ? x.Produit.Description : "",
                    CodeAGV            = x.CodeAGV,
                    NumeroTransfert    = x.NumeroTransfert,
                    QuantiteTransferee = x.QuantiteTransferee,
                    NombreIncidents    = x.NombreIncidents,
                    RunTime            = x.RunTime,
                    StopTime           = x.StopTime,
                    ZoneDepart         = x.ZoneDepart,
                    ZoneArrivee        = x.ZoneArrivee,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .ToListAsync();

            return new HistoriquePageResult<HistoriqueAGVDto>
            {
                Donnees     = donnees,
                TotalLignes = total,
                Page        = p.Page,
                PageSize    = p.PageSize
            };
        }

        public async Task<List<HistoriqueAGVDto>> ExportAGVAsync(HistoriqueQueryParams p)
        {
            var query = _context.HistoriqueAGV
                .Include(x => x.Produit)
                .AsQueryable();

            if (!string.IsNullOrEmpty(p.Recherche))
                query = query.Where(x =>
                    x.NumeroEntree.Contains(p.Recherche)    ||
                    x.CodeAGV.Contains(p.Recherche)         ||
                    x.NumeroTransfert.Contains(p.Recherche));

            if (!string.IsNullOrEmpty(p.Statut))
                query = query.Where(x => x.Statut == p.Statut);

            if (p.DateDebut.HasValue)
                query = query.Where(x => x.DateEnregistrement >= p.DateDebut.Value);

            if (p.DateFin.HasValue)
                query = query.Where(x => x.DateEnregistrement <= p.DateFin.Value);

            return await query
                .OrderBy(x => x.Id)
                .Select(x => new HistoriqueAGVDto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomProduit         = x.Produit != null ? x.Produit.Description : "",
                    CodeAGV            = x.CodeAGV,
                    NumeroTransfert    = x.NumeroTransfert,
                    QuantiteTransferee = x.QuantiteTransferee,
                    NombreIncidents    = x.NombreIncidents,
                    RunTime            = x.RunTime,
                    StopTime           = x.StopTime,
                    ZoneDepart         = x.ZoneDepart,
                    ZoneArrivee        = x.ZoneArrivee,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .ToListAsync();
        }

        public async Task<HistoriqueAGVDto?> GetAGVByIdAsync(int id)
        {
            return await _context.HistoriqueAGV
                .Include(x => x.Produit)
                .Where(x => x.Id == id)
                .Select(x => new HistoriqueAGVDto
                {
                    Id                 = x.Id,
                    NumeroEntree       = x.NumeroEntree,
                    NomProduit         = x.Produit != null ? x.Produit.Description : "",
                    CodeAGV            = x.CodeAGV,
                    NumeroTransfert    = x.NumeroTransfert,
                    QuantiteTransferee = x.QuantiteTransferee,
                    NombreIncidents    = x.NombreIncidents,
                    RunTime            = x.RunTime,
                    StopTime           = x.StopTime,
                    ZoneDepart         = x.ZoneDepart,
                    ZoneArrivee        = x.ZoneArrivee,
                    Statut             = x.Statut,
                    DateEnregistrement = x.DateEnregistrement
                })
                .FirstOrDefaultAsync();
        }
    }
}