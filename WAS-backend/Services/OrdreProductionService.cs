using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WAS_backend.DTOs;
using WAS_backend.Models;
using WAS_backend.Repositories;

namespace WAS_backend.Services;

public class OrdreProductionService : IOrdreProductionService
{
    private readonly IOrdreProductionRepository _repo;
    private readonly ILogger<OrdreProductionService> _logger;

    private static readonly Dictionary<int, string[]> STATUTS = new()
    {
        { 0, new[] { "Simulé",   "#6B7280" } },
        { 1, new[] { "Planifié", "#3B82F6" } },
        { 2, new[] { "En cours", "#F59E0B" } },
        { 3, new[] { "Terminé",  "#10B981" } },
    };

    public OrdreProductionService(IOrdreProductionRepository repo, ILogger<OrdreProductionService> logger)
    {
        _repo   = repo;
        _logger = logger;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public Task<List<OrdreProduction>> GetAllAsync(string? search, int? statut, string? codeSite) =>
        _repo.GetAllAsync(search, statut, codeSite);

    public Task<OrdreProductionDetailDTO?> GetDetailAsync(string numero) =>
        _repo.GetDetailAsync(numero);

    // ✅ AJOUT — Créer un nouvel ordre (NumeroAuto généré automatiquement par SQL)
    public async Task<OrdreProduction> CreerAsync(OrdreProduction ordre)
    {
        ordre.DateCreation      = DateTime.Now;
        ordre.DateDerniereModif = DateTime.Now;
        ordre.Horodatage        = DateTime.Now;
        ordre.Numero            = string.Empty; // NumeroAuto généré par SQL
        return await _repo.CreerAsync(ordre);
    }

    public async Task<byte[]> ExportTableauPdfAsync(string? search, int? statut, string? codeSite)
    {
        var ordres = await _repo.GetAllAsync(search, statut, codeSite);
        return GenerateTableauPdf(ordres);
    }

    public async Task<byte[]> ExportTableauExcelAsync(string? search, int? statut, string? codeSite)
    {
        var ordres = await _repo.GetAllAsync(search, statut, codeSite);
        return GenerateTableauExcel(ordres);
    }

    public async Task<byte[]> ExportOrdrePdfAsync(string numero)
    {
        var detail = await _repo.GetDetailAsync(numero);
        if (detail == null) throw new KeyNotFoundException($"Ordre {numero} introuvable.");
        return GenerateOrdrePdf(detail);
    }

    public async Task<byte[]> ExportOrdreExcelAsync(string numero)
    {
        var detail = await _repo.GetDetailAsync(numero);
        if (detail == null) throw new KeyNotFoundException($"Ordre {numero} introuvable.");
        return GenerateOrdreExcel(detail);
    }

    // ── PDF Tableau complet ────────────────────────────────────────
    private byte[] GenerateTableauPdf(List<OrdreProduction> ordres)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Background("#1E3A5F").Padding(12).Column(col =>
                {
                    col.Item().Text("I-mobile WAS — Ordres de Production")
                       .FontSize(14).Bold().FontColor(Colors.White);
                    col.Item().Text($"Exporté le {DateTime.Now:dd/MM/yyyy HH:mm} · {ordres.Count} ordres")
                       .FontSize(9).FontColor(Colors.Grey.Lighten3);
                });

                page.Content().PaddingTop(16).Table(table =>
                {
                    table.ColumnsDefinition(col =>
                    {
                        col.ConstantColumn(70);
                        col.RelativeColumn(3);
                        col.RelativeColumn(1.5f);
                        col.RelativeColumn(1.5f);
                        col.RelativeColumn(1.2f);
                        col.ConstantColumn(60);
                        col.RelativeColumn(1.2f);
                        col.RelativeColumn(1.2f);
                    });

                    table.Header(header =>
                    {
                        foreach (var h in new[] { "N° Ordre", "Description", "Opérateur", "Site", "Statut", "Quantité", "Date début", "Date fin" })
                            header.Cell().Background("#1E3A5F").Padding(6)
                                  .Text(h).FontSize(8).Bold().FontColor(Colors.White);
                    });

                    foreach (var (o, i) in ordres.Select((o, i) => (o, i)))
                    {
                        var bg     = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;
                        var statut = STATUTS.TryGetValue(o.Statut, out var s) ? s : new[] { "Inconnu", "#6B7280" };

                        table.Cell().Background(bg).Padding(6).Text(o.Numero).FontColor("#1E3A5F");
                        table.Cell().Background(bg).Padding(6).Text(o.Description ?? "-");
                        table.Cell().Background(bg).Padding(6).Text(o.OperateurAssigne ?? "-");
                        table.Cell().Background(bg).Padding(6).Text(o.CodeSite ?? "-");
                        table.Cell().Background(bg).Padding(6).Text(statut[0]).FontColor(statut[1]);
                        table.Cell().Background(bg).Padding(6).Text(o.Quantite?.ToString("N0") ?? "-");
                        table.Cell().Background(bg).Padding(6).Text(o.DateDebut?.ToString("dd/MM/yyyy") ?? "-");
                        table.Cell().Background(bg).Padding(6).Text(o.DateFin?.ToString("dd/MM/yyyy") ?? "-");
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("I-mobile — Page ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    text.Span(" / ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        });

        return doc.GeneratePdf();
    }

    // ── Excel Tableau complet ──────────────────────────────────────
    private byte[] GenerateTableauExcel(List<OrdreProduction> ordres)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Ordres de Production");

        ws.Cell("A1").Value = "I-mobile WAS — Ordres de Production";
        ws.Range("A1:H1").Merge().Style
            .Font.SetBold(true).Font.SetFontSize(14)
            .Fill.SetBackgroundColor(XLColor.FromHtml("#1E3A5F"))
            .Font.SetFontColor(XLColor.White)
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        ws.Cell("A2").Value = $"Exporté le {DateTime.Now:dd/MM/yyyy HH:mm} · {ordres.Count} ordres";
        ws.Range("A2:H2").Merge().Style.Font.SetItalic(true).Font.SetFontColor(XLColor.Gray);

        var headers = new[] { "N° Ordre", "Description", "Opérateur", "Site", "Statut", "Quantité", "Date début", "Date fin" };
        for (int c = 0; c < headers.Length; c++)
        {
            var cell = ws.Cell(4, c + 1);
            cell.Value = headers[c];
            cell.Style.Font.SetBold(true).Font.SetFontColor(XLColor.White)
                      .Fill.SetBackgroundColor(XLColor.FromHtml("#1E3A5F"))
                      .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        }

        for (int i = 0; i < ordres.Count; i++)
        {
            var o      = ordres[i];
            var row    = i + 5;
            var bg     = i % 2 == 0 ? XLColor.White : XLColor.FromHtml("#F0F4F8");
            var statut = STATUTS.TryGetValue(o.Statut, out var s) ? s[0] : "Inconnu";

            ws.Cell(row, 1).Value = o.Numero;
            ws.Cell(row, 2).Value = o.Description ?? "-";
            ws.Cell(row, 3).Value = o.OperateurAssigne ?? "-";
            ws.Cell(row, 4).Value = o.CodeSite ?? "-";
            ws.Cell(row, 5).Value = statut;
            ws.Cell(row, 6).Value = o.Quantite?.ToString("N0") ?? "-";
            ws.Cell(row, 7).Value = o.DateDebut?.ToString("dd/MM/yyyy") ?? "-";
            ws.Cell(row, 8).Value = o.DateFin?.ToString("dd/MM/yyyy") ?? "-";

            ws.Range(row, 1, row, 8).Style.Fill.SetBackgroundColor(bg);
        }

        ws.Column(1).Width = 14; ws.Column(2).Width = 40;
        ws.Column(3).Width = 20; ws.Column(4).Width = 12;
        ws.Column(5).Width = 14; ws.Column(6).Width = 12;
        ws.Column(7).Width = 14; ws.Column(8).Width = 14;

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    // ── PDF Ordre spécifique ───────────────────────────────────────
    private byte[] GenerateOrdrePdf(OrdreProductionDetailDTO detail)
    {
        var o      = detail.Ordre!;
        var statut = STATUTS.TryGetValue(o.Statut, out var s) ? s : new[] { "Inconnu", "#6B7280" };

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Background("#1E3A5F").Padding(12).Column(col =>
                {
                    col.Item().Text($"Ordre de Production — {o.Numero}")
                       .FontSize(14).Bold().FontColor(Colors.White);
                    col.Item().Text($"Exporté le {DateTime.Now:dd/MM/yyyy HH:mm}")
                       .FontSize(9).FontColor(Colors.Grey.Lighten3);
                });

                page.Content().PaddingTop(16).Column(col =>
                {
                    // ── Infos générales ──
                    col.Item().Background("#F0F4F8").Padding(12).Column(info =>
                    {
                        info.Item().Text("Informations générales").FontSize(11).Bold().FontColor("#1E3A5F");
                        info.Item().PaddingTop(8).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text($"Numéro : {o.Numero}");
                                c.Item().Text($"Description : {o.Description ?? "-"}");
                                c.Item().Text($"Statut : {statut[0]}").FontColor(statut[1]);
                                c.Item().Text($"Opérateur : {o.OperateurAssigne ?? "-"}");
                            });
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text($"Site : {o.CodeSite ?? "-"}");
                                c.Item().Text($"Quantité : {o.Quantite?.ToString("N0") ?? "-"}");
                                c.Item().Text($"Date début : {o.DateDebut?.ToString("dd/MM/yyyy") ?? "-"}");
                                c.Item().Text($"Date fin : {o.DateFin?.ToString("dd/MM/yyyy") ?? "-"}");
                            });
                        });
                    });

                    // ── Lignes ──
                    if (detail.Lignes.Any())
                    {
                        col.Item().PaddingTop(12).Text("Lignes de l'ordre").FontSize(11).Bold().FontColor("#1E3A5F");
                        col.Item().PaddingTop(6).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(1.5f); c.RelativeColumn(3);
                                c.RelativeColumn(1);    c.RelativeColumn(1); c.RelativeColumn(1);
                            });
                            table.Header(header =>
                            {
                                foreach (var h in new[] { "Réf. Article", "Description", "Quantité", "Terminée", "Restante" })
                                    header.Cell().Background("#1E3A5F").Padding(5)
                                          .Text(h).FontSize(8).Bold().FontColor(Colors.White);
                            });
                            foreach (var (l, i) in detail.Lignes.Select((l, i) => (l, i)))
                            {
                                var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;
                                table.Cell().Background(bg).Padding(5).Text(l.ReferenceArticle ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(l.Description ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(l.Quantite?.ToString("N0") ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(l.QuantiteTerminee?.ToString("N0") ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(l.QuantiteRestante?.ToString("N0") ?? "-");
                            }
                        });
                    }

                    // ── Composants ✅ ──
                    if (detail.Composants.Any())
                    {
                        col.Item().PaddingTop(12).Text("Composants").FontSize(11).Bold().FontColor("#1E3A5F");
                        col.Item().PaddingTop(6).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(1.5f); c.RelativeColumn(3);
                                c.RelativeColumn(1);    c.RelativeColumn(1); c.RelativeColumn(1);
                            });
                            table.Header(header =>
                            {
                                foreach (var h in new[] { "Réf. Article", "Description", "Quantité", "Attendue", "Restante" })
                                    header.Cell().Background("#1E3A5F").Padding(5)
                                          .Text(h).FontSize(8).Bold().FontColor(Colors.White);
                            });
                            foreach (var (c2, i) in detail.Composants.Select((c2, i) => (c2, i)))
                            {
                                var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;
                                table.Cell().Background(bg).Padding(5).Text(c2.ReferenceArticle ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(c2.Description ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(c2.Quantite?.ToString("N0") ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(c2.QuantiteAttendue?.ToString("N0") ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(c2.QuantiteRestante?.ToString("N0") ?? "-");
                            }
                        });
                    }

                    // ── Opérations ──
                    if (detail.Operations.Any())
                    {
                        col.Item().PaddingTop(12).Text("Opérations de gamme").FontSize(11).Bold().FontColor("#1E3A5F");
                        col.Item().PaddingTop(6).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(40); c.RelativeColumn(3);
                                c.RelativeColumn(2);  c.RelativeColumn(1); c.RelativeColumn(1);
                            });
                            table.Header(header =>
                            {
                                foreach (var h in new[] { "N° Op.", "Description", "Centre travail", "T. Réglage", "T. Exécution" })
                                    header.Cell().Background("#1E3A5F").Padding(5)
                                          .Text(h).FontSize(8).Bold().FontColor(Colors.White);
                            });
                            foreach (var (op, i) in detail.Operations.Select((op, i) => (op, i)))
                            {
                                var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;
                                table.Cell().Background(bg).Padding(5).Text(op.NumeroOperation ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(op.Description ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(op.NumeroCentreTravail ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(op.TempsReglage?.ToString("N0") ?? "-");
                                table.Cell().Background(bg).Padding(5).Text(op.TempsExecution?.ToString("N0") ?? "-");
                            }
                        });
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("I-mobile WAS  — Page ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    text.Span(" / ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        });

        return doc.GeneratePdf();
    }

    // ── Excel Ordre spécifique ─────────────────────────────────────
    private byte[] GenerateOrdreExcel(OrdreProductionDetailDTO detail)
    {
        var o      = detail.Ordre!;
        var statut = STATUTS.TryGetValue(o.Statut, out var s) ? s[0] : "Inconnu";

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Ordre");

        ws.Cell("A1").Value = $"Ordre de Production — {o.Numero}";
        ws.Range("A1:F1").Merge().Style
            .Font.SetBold(true).Font.SetFontSize(13)
            .Fill.SetBackgroundColor(XLColor.FromHtml("#1E3A5F"))
            .Font.SetFontColor(XLColor.White)
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        int row = 3;
        var infos = new[]
        {
            ("Numéro",      o.Numero),
            ("Description", o.Description ?? "-"),
            ("Statut",      statut),
            ("Opérateur",   o.OperateurAssigne ?? "-"),
            ("Site",        o.CodeSite ?? "-"),
            ("Quantité",    o.Quantite?.ToString("N0") ?? "-"),
            ("Date début",  o.DateDebut?.ToString("dd/MM/yyyy") ?? "-"),
            ("Date fin",    o.DateFin?.ToString("dd/MM/yyyy") ?? "-"),
        };
        foreach (var (label, value) in infos)
        {
            ws.Cell(row, 1).Value = label;
            ws.Cell(row, 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.FromHtml("#E8EDF2"));
            ws.Cell(row, 2).Value = value;
            row++;
        }

        // ── Lignes ──
        row += 2;
        ws.Cell(row, 1).Value = "LIGNES DE L'ORDRE";
        ws.Range(row, 1, row, 5).Merge().Style
            .Font.SetBold(true).Font.SetFontColor(XLColor.White)
            .Fill.SetBackgroundColor(XLColor.FromHtml("#1E3A5F"));
        row++;

        var ligneHeaders = new[] { "Réf. Article", "Description", "Quantité", "Terminée", "Restante" };
        for (int c = 0; c < ligneHeaders.Length; c++)
        {
            ws.Cell(row, c + 1).Value = ligneHeaders[c];
            ws.Cell(row, c + 1).Style.Font.SetBold(true)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#D1DCE8"));
        }
        row++;

        foreach (var l in detail.Lignes)
        {
            ws.Cell(row, 1).Value = l.ReferenceArticle ?? "-";
            ws.Cell(row, 2).Value = l.Description ?? "-";
            ws.Cell(row, 3).Value = l.Quantite?.ToString("N0") ?? "-";
            ws.Cell(row, 4).Value = l.QuantiteTerminee?.ToString("N0") ?? "-";
            ws.Cell(row, 5).Value = l.QuantiteRestante?.ToString("N0") ?? "-";
            row++;
        }

        // ── Composants ✅ ──
        row += 2;
        ws.Cell(row, 1).Value = "COMPOSANTS";
        ws.Range(row, 1, row, 5).Merge().Style
            .Font.SetBold(true).Font.SetFontColor(XLColor.White)
            .Fill.SetBackgroundColor(XLColor.FromHtml("#1E3A5F"));
        row++;

        var compHeaders = new[] { "Réf. Article", "Description", "Quantité", "Attendue", "Restante" };
        for (int c = 0; c < compHeaders.Length; c++)
        {
            ws.Cell(row, c + 1).Value = compHeaders[c];
            ws.Cell(row, c + 1).Style.Font.SetBold(true)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#D1DCE8"));
        }
        row++;

        foreach (var comp in detail.Composants)
        {
            ws.Cell(row, 1).Value = comp.ReferenceArticle ?? "-";
            ws.Cell(row, 2).Value = comp.Description ?? "-";
            ws.Cell(row, 3).Value = comp.Quantite?.ToString("N0") ?? "-";
            ws.Cell(row, 4).Value = comp.QuantiteAttendue?.ToString("N0") ?? "-";
            ws.Cell(row, 5).Value = comp.QuantiteRestante?.ToString("N0") ?? "-";
            row++;
        }

        // ── Opérations ──
        row += 2;
        ws.Cell(row, 1).Value = "OPÉRATIONS DE GAMME";
        ws.Range(row, 1, row, 5).Merge().Style
            .Font.SetBold(true).Font.SetFontColor(XLColor.White)
            .Fill.SetBackgroundColor(XLColor.FromHtml("#1E3A5F"));
        row++;

        var opHeaders = new[] { "N° Op.", "Description", "Centre travail", "T. Réglage", "T. Exécution" };
        for (int c = 0; c < opHeaders.Length; c++)
        {
            ws.Cell(row, c + 1).Value = opHeaders[c];
            ws.Cell(row, c + 1).Style.Font.SetBold(true)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#D1DCE8"));
        }
        row++;

        foreach (var op in detail.Operations)
        {
            ws.Cell(row, 1).Value = op.NumeroOperation ?? "-";
            ws.Cell(row, 2).Value = op.Description ?? "-";
            ws.Cell(row, 3).Value = op.NumeroCentreTravail ?? "-";
            ws.Cell(row, 4).Value = op.TempsReglage?.ToString("N0") ?? "-";
            ws.Cell(row, 5).Value = op.TempsExecution?.ToString("N0") ?? "-";
            row++;
        }

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }
}