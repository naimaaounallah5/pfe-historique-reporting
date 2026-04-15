using Microsoft.EntityFrameworkCore;
using WAS_backend.Models;

namespace WAS_backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        // ── Tables Historique ────────────────────────────────
        public DbSet<HistoriqueSCADA> HistoriqueSCADA { get; set; }
        public DbSet<HistoriqueWMS>   HistoriqueWMS   { get; set; }
        public DbSet<HistoriqueQDC>   HistoriqueQDC   { get; set; }
        public DbSet<HistoriqueAGV>   HistoriqueAGV   { get; set; }

        // ── Tables existantes ────────────────────────────────
        public DbSet<User>                 Users                 { get; set; }
        public DbSet<Rapport>              Rapports              { get; set; }
        public DbSet<RapportEnvoi>         RapportEnvois         { get; set; }
        public DbSet<OrdreProduction>      OrdresProduction      { get; set; }
        public DbSet<LigneOrdreProduction> LignesOrdreProduction { get; set; }
        public DbSet<ComposantOrdre>       ComposantsOrdre       { get; set; }
        public DbSet<OperationGamme>       OperationsGamme       { get; set; }

        // ── Tables DIM ───────────────────────────────────────
        public DbSet<DimClient>      DimClients      { get; set; }
        public DbSet<DimFournisseur> DimFournisseurs { get; set; }
        public DbSet<DimTemps>       DimTemps        { get; set; }
        public DbSet<DimProduit>     DimProduits     { get; set; }
        public DbSet<DimMachine>     DimMachines     { get; set; }

        // ── Tables FAIT ──────────────────────────────────────
        public DbSet<FaitAchats>     FaitAchats     { get; set; }
        public DbSet<FaitVentes>     FaitVentes     { get; set; }
        public DbSet<FaitProduction> FaitProduction { get; set; }
        public DbSet<FaitQualite>    FaitQualite    { get; set; }
        public DbSet<FaitStock>      FaitStock      { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ✅ TABLE UTILISATEURS ← correction principale
            modelBuilder.Entity<User>(entity =>
            {
                  
                entity.ToTable("Utilisateurs");   // ← vrai nom dans SQL Server
                entity.HasKey(e => e.Id);
            });

            // ── LigneOrdreProduction ─────────────────────────
            modelBuilder.Entity<LigneOrdreProduction>(entity =>
            {
                entity.ToTable("LignesOrdreProduction");
                entity.HasKey(e => e.Id);
                entity.HasOne<OrdreProduction>()
                      .WithMany(o => o.Lignes)
                      .HasForeignKey(e => e.NumeroOrdreProduction)
                      .HasPrincipalKey(o => o.Numero)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ── ComposantOrdre ───────────────────────────────
            modelBuilder.Entity<ComposantOrdre>(entity =>
            {
                entity.ToTable("ComposantsOrdre");
                entity.HasKey(e => e.Id);
                entity.HasOne<OrdreProduction>()
                      .WithMany(o => o.Composants)
                      .HasForeignKey(e => e.NumeroOrdreProduction)
                      .HasPrincipalKey(o => o.Numero)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ── OperationGamme ───────────────────────────────
            modelBuilder.Entity<OperationGamme>(entity =>
            {
                entity.ToTable("OperationsGamme");
                entity.HasKey(e => e.Id);
                entity.HasOne<OrdreProduction>()
                      .WithMany(o => o.Operations)
                      .HasForeignKey(e => e.NumeroOrdreProduction)
                      .HasPrincipalKey(o => o.Numero)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ── FaitAchats ───────────────────────────────────
            modelBuilder.Entity<FaitAchats>(entity =>
            {
                entity.ToTable("FAIT_Achats");
                entity.HasKey(e => e.IdAchat);
                entity.HasOne(e => e.DimTemps)
                      .WithMany(d => d.FaitAchats)
                      .HasForeignKey(e => e.IdTemps)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.DimProduit)
                      .WithMany(d => d.FaitAchats)
                      .HasForeignKey(e => e.IdProduit)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.DimFournisseur)
                      .WithMany(d => d.FaitAchats)
                      .HasForeignKey(e => e.IdFournisseur)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── FaitVentes ───────────────────────────────────
            modelBuilder.Entity<FaitVentes>(entity =>
            {
                entity.ToTable("FAIT_Ventes");
                entity.HasKey(e => e.IdVente);
                entity.HasOne(e => e.DimTemps)
                      .WithMany(d => d.FaitVentes)
                      .HasForeignKey(e => e.IdTemps)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.DimProduit)
                      .WithMany(d => d.FaitVentes)
                      .HasForeignKey(e => e.IdProduit)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.DimClient)
                      .WithMany(d => d.FaitVentes)
                      .HasForeignKey(e => e.IdClient)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── FaitProduction ───────────────────────────────
            modelBuilder.Entity<FaitProduction>(entity =>
            {
                entity.ToTable("FAIT_Production");
                entity.HasKey(e => e.IdProduction);
                entity.HasOne(e => e.DimTemps)
                      .WithMany(d => d.FaitProduction)
                      .HasForeignKey(e => e.IdTemps)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.DimProduit)
                      .WithMany(d => d.FaitProduction)
                      .HasForeignKey(e => e.IdProduit)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.DimMachine)
                      .WithMany(d => d.FaitProduction)
                      .HasForeignKey(e => e.IdMachine)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── FaitQualite ──────────────────────────────────
            modelBuilder.Entity<FaitQualite>(entity =>
            {
                entity.ToTable("FAIT_Qualite");
                entity.HasKey(e => e.IdQualite);
                entity.HasOne(e => e.DimTemps)
                      .WithMany(d => d.FaitQualite)
                      .HasForeignKey(e => e.IdTemps)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.DimProduit)
                      .WithMany(d => d.FaitQualite)
                      .HasForeignKey(e => e.IdProduit)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.DimMachine)
                      .WithMany(d => d.FaitQualite)
                      .HasForeignKey(e => e.IdMachine)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── FaitStock ────────────────────────────────────
            modelBuilder.Entity<FaitStock>(entity =>
            {
                entity.ToTable("FAIT_Stock");
                entity.HasKey(e => e.IdStock);
                entity.HasOne(e => e.DimTemps)
                      .WithMany(d => d.FaitStock)
                      .HasForeignKey(e => e.IdTemps)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.DimProduit)
                      .WithMany(d => d.FaitStock)
                      .HasForeignKey(e => e.IdProduit)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── DIM ──────────────────────────────────────────
            modelBuilder.Entity<DimTemps>(entity =>
            {
                entity.ToTable("DIM_Temps");
                entity.HasKey(e => e.IdTemps);
            });
            modelBuilder.Entity<DimFournisseur>(entity =>
            {
                entity.ToTable("DIM_Fournisseur");
                entity.HasKey(e => e.IdFournisseur);
            });
            modelBuilder.Entity<DimProduit>(entity =>
            {
                entity.ToTable("DIM_Produit");
                entity.HasKey(e => e.IdProduit);
            });
            modelBuilder.Entity<DimClient>(entity =>
            {
                entity.ToTable("DIM_Client");
                entity.HasKey(e => e.IdClient);
            });
            modelBuilder.Entity<DimMachine>(entity =>
            {
                entity.ToTable("DIM_Machine");
                entity.HasKey(e => e.IdMachine);
            });
        }
    }
}