namespace WAS_backend.DTOs
{
    public class RetardParFournisseurDTO
    {
        public string NomFournisseur    { get; set; } = string.Empty;
        public string Pays              { get; set; } = string.Empty;
        public int    NombreRetards     { get; set; }
        public int    NombreCommandes   { get; set; }
        public double TauxRetard        { get; set; }
        public double DelaiMoyenRetard  { get; set; }
    }

    public class RetardParTempsDTO
    {
        public string Label            { get; set; } = string.Empty;
        public int    Mois             { get; set; }
        public int    Trimestre        { get; set; }
        public int    Annee            { get; set; }
        public int    NombreRetards    { get; set; }
        public int    NombreCommandes  { get; set; }
        public double TauxRetard       { get; set; }
        public double DelaiMoyenRetard { get; set; } // ← ajouté
    }

    public class RetardParProduitDTO
    {
        public string Description      { get; set; } = string.Empty;
        public string Categorie        { get; set; } = string.Empty;
        public int    NombreRetards    { get; set; }
        public int    NombreCommandes  { get; set; }
        public double TauxRetard       { get; set; }
        public double DelaiMoyenRetard { get; set; }
    }

    public class RetardResponseDTO
    {
        public List<RetardParFournisseurDTO> ParFournisseur { get; set; } = new();
        public List<RetardParTempsDTO>       ParTemps       { get; set; } = new();
        public List<RetardParProduitDTO>     ParProduit     { get; set; } = new();
    }
}