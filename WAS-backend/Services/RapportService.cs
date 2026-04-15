using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text.Json;
using WAS_backend.DTOs;
using WAS_backend.Models;
using WAS_backend.Repositories;

namespace WAS_backend.Services;

public class RapportService : IRapportService
{
    private readonly IRapportRepository _repo;
    private readonly IEmailService      _email;
    private readonly ILogger<RapportService> _logger;

    public RapportService(IRapportRepository repo, IEmailService email, ILogger<RapportService> logger)
    {
        _repo   = repo;
        _email  = email;
        _logger = logger;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public Task<List<Rapport>> GetAllAsync(string? search, string? type, string? statut, string? format) =>
        _repo.GetAllAsync(search, type, statut, format);

    public Task<Rapport?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

    public async Task<Rapport> CreateAsync(CreateRapportDTO dto)
    {
        var rapport = new Rapport
        {
            Titre            = dto.Titre,
            Type             = dto.Type,
            Format           = dto.Format,
            Contenu          = dto.Contenu,
            OptionsData      = dto.OptionsData,
            Responsable      = dto.Responsable,
            DateRapport      = string.IsNullOrEmpty(dto.DateRapport) ? null : DateTime.Parse(dto.DateRapport),
            Statut           = "Créé",
            DateCreation     = DateTime.Now,
            AdministrateurId = dto.AdministrateurId,
        };
        return await _repo.CreateAsync(rapport);
    }

    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);

    // ✅ CORRIGÉ — accepte seq
    public async Task<byte[]> GeneratePdfAsync(int id, int seq = 0)
    {
        var rapport = await _repo.GetByIdAsync(id);
        if (rapport == null) throw new KeyNotFoundException($"Rapport {id} introuvable.");
        return GeneratePdfBytes(new List<Rapport> { rapport }, rapport.Titre, seq);
    }

    public async Task<byte[]> GenerateCsvAsync(int id)
    {
        var rapport = await _repo.GetByIdAsync(id);
        if (rapport == null) throw new KeyNotFoundException($"Rapport {id} introuvable.");
        return GenerateCsvSpécifiqueBytes(rapport);
    }

    // ✅ CORRIGÉ — accepte seq
    public async Task<byte[]> GenerateExcelAsync(int id, int seq = 0)
    {
        var rapport = await _repo.GetByIdAsync(id);
        if (rapport == null) throw new KeyNotFoundException($"Rapport {id} introuvable.");
        return GenerateExcelSpécifiqueBytes(rapport, seq);
    }

    public async Task<byte[]> ExportAllPdfAsync()
    {
        var rapports = await _repo.GetAllAsync(null, null, null, null);
        return GeneratePdfBytes(rapports, "Liste des rapports");
    }

    public async Task<byte[]> ExportAllExcelAsync()
    {
        var rapports = await _repo.GetAllAsync(null, null, null, null);
        return GenerateExcelTableauBytes(rapports);
    }

    public async Task EnvoyerAsync(int id, EnvoyerRapportDTO dto)
    {
        var rapport = await _repo.GetByIdAsync(id);
        if (rapport == null) throw new KeyNotFoundException($"Rapport {id} introuvable.");

        var fileBytes  = GeneratePdfBytes(new List<Rapport> { rapport }, rapport.Titre);
        var fileName   = $"rapport_{id}.pdf";
        var corpsEmail = BuildEmailBody(rapport, dto.Message);

        using var ms = new MemoryStream(fileBytes);
        await _email.SendAsync(dto.Destinataires, dto.Sujet, corpsEmail, ms, fileName);

        if (dto.PieceJointe != null)
        {
            using var extra = dto.PieceJointe.OpenReadStream();
            await _email.SendAsync(dto.Destinataires, dto.Sujet + " (pièce jointe)", corpsEmail, extra, dto.PieceJointe.FileName);
        }

        rapport.Statut = "Envoyé";
        await _repo.UpdateAsync(rapport);

        foreach (var dest in dto.Destinataires)
        {
            await _repo.AddEnvoiAsync(new RapportEnvoi
            {
                RapportId    = id,
                Destinataire = dest,
                Sujet        = dto.Sujet,
                Message      = dto.Message,
                DateEnvoi    = DateTime.Now,
                Succes       = true,
            });
        }
    }

    // ─── HELPERS ─────────────────────────────────────────────

    private class OptionItem
    {
        [System.Text.Json.Serialization.JsonPropertyName("label")]
        public string Label { get; set; } = "";
        [System.Text.Json.Serialization.JsonPropertyName("value")]
        public string Value { get; set; } = "";
    }

    private static List<(string label, string value)> ParseOptions(string? json)
    {
        var result = new List<(string, string)>();
        if (string.IsNullOrEmpty(json)) return result;
        try
        {
            var opts = JsonSerializer.Deserialize<List<OptionItem>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (opts == null) return result;
            foreach (var o in opts)
                result.Add((o.Label, string.IsNullOrEmpty(o.Value) ? "—" : o.Value));
        }
        catch { }
        return result;
    }

    private static string Escape(string val) => val.Replace("\"", "\"\"");

    private static void AppliquerBordures(IXLRange range, XLColor couleur)
    {
        range.Style.Border.OutsideBorder      = XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor = couleur;
        range.Style.Border.InsideBorder       = XLBorderStyleValues.Thin;
        range.Style.Border.InsideBorderColor  = couleur;
    }

    private static string BuildEmailBody(Rapport r, string? messagePersonnel)
    {
        var options = ParseOptions(r.OptionsData);
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Bonjour,");
        sb.AppendLine();
        if (!string.IsNullOrEmpty(messagePersonnel)) { sb.AppendLine(messagePersonnel); sb.AppendLine(); }
        sb.AppendLine("═══════════════════════════════════════════");
        sb.AppendLine($"  RAPPORT : {r.Titre}");
        sb.AppendLine("═══════════════════════════════════════════");
        sb.AppendLine($"  Type          : {r.Type}");
        sb.AppendLine($"  Format        : {r.Format}");
        sb.AppendLine($"  Statut        : {r.Statut}");
        sb.AppendLine($"  Créé le       : {r.DateCreation:dd/MM/yyyy HH:mm}");
        sb.AppendLine($"  Responsable   : {r.Responsable ?? "—"}");
        sb.AppendLine($"  Date rapport  : {(r.DateRapport.HasValue ? r.DateRapport.Value.ToString("dd/MM/yyyy") : "—")}");
        if (!string.IsNullOrEmpty(r.Contenu))
        {
            sb.AppendLine("═══════════════════════════════════════════");
            sb.AppendLine("DESCRIPTION :"); sb.AppendLine($"  {r.Contenu}");
        }
        if (options.Count > 0)
        {
            sb.AppendLine("═══════════════════════════════════════════");
            sb.AppendLine($"DÉTAILS — {r.Type} ({options.Count} champs) :");
            sb.AppendLine("───────────────────────────────────────────");
            foreach (var (label, value) in options)
                sb.AppendLine($"  • {label,-35} : {value}");
        }
        sb.AppendLine("═══════════════════════════════════════════");
        sb.AppendLine(); sb.AppendLine("Cordialement,"); sb.AppendLine("I-mobile WAS v2.4");
        return sb.ToString();
    }

    // ══════════════════════════════════════════════════════════
    // PDF ✅ accepte seq
    // ══════════════════════════════════════════════════════════

    private static byte[] GeneratePdfBytes(List<Rapport> rapports, string titre, int seq = 0)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Background("#4F46E5").Padding(12).Column(col =>
                {
                    col.Item().Text("I-mobile WAS — Historical Data & Reporting").FontSize(14).Bold().FontColor(Colors.White);
                    col.Item().Text($"{titre}  ·  Généré le {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Grey.Lighten3);
                });

                page.Content().PaddingTop(16).Column(content =>
                {
                    content.Item().Table(table =>
                    {
                        table.ColumnsDefinition(col =>
                        {
                            col.ConstantColumn(55); col.RelativeColumn(3); col.RelativeColumn(1.5f);
                            col.RelativeColumn(1.2f); col.ConstantColumn(48); col.RelativeColumn(1.2f);
                        });
                        table.Header(header =>
                        {
                            foreach (var h in new[] { "ID", "Titre", "Type", "Date", "Format", "Statut" })
                                header.Cell().Background("#111827").Padding(6).Text(h).FontSize(9).Bold().FontColor(Colors.White);
                        });
                        foreach (var (r2, i) in rapports.Select((r2, i) => (r2, i)))
                        {
                            var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;

                            // ✅ Si seq fourni utiliser seq, sinon numérotation séquentielle
                            var displayId = seq > 0
                                ? $"#RPT-{seq:D3}"
                                : $"#RPT-{(i + 1):D3}";

                            table.Cell().Background(bg).Padding(6).Text(displayId).FontColor(Colors.Grey.Medium);
                            table.Cell().Background(bg).Padding(6).Text(r2.Titre);
                            table.Cell().Background(bg).Padding(6).Text(r2.Type).FontColor("#4F46E5");
                            table.Cell().Background(bg).Padding(6).Text(r2.DateCreation.ToString("dd/MM/yyyy"));
                            table.Cell().Background(bg).Padding(6).Text(r2.Format);
                            table.Cell().Background(bg).Padding(6).Text(r2.Statut).FontColor(r2.Statut switch
                            {
                                "Envoyé" => "#059669", "En attente" => "#D97706",
                                "Brouillon" => "#6B7280", _ => "#4F46E5",
                            });
                        }
                    });

                    if (rapports.Count == 1)
                    {
                        var r = rapports[0];
                        var options = ParseOptions(r.OptionsData);

                        content.Item().PaddingTop(14).Table(meta =>
                        {
                            meta.ColumnsDefinition(col => { col.RelativeColumn(); col.RelativeColumn(); });
                            meta.Cell().Background("#F9FAFB").Border(1).BorderColor("#E5E7EB").Padding(10).Column(c => {
                                c.Item().Text("RESPONSABLE").FontSize(8).Bold().FontColor(Colors.Grey.Medium);
                                c.Item().PaddingTop(3).Text(r.Responsable ?? "—").FontSize(11).Bold().FontColor("#111827");
                            });
                            meta.Cell().Background("#F9FAFB").Border(1).BorderColor("#E5E7EB").Padding(10).Column(c => {
                                c.Item().Text("DATE DU RAPPORT").FontSize(8).Bold().FontColor(Colors.Grey.Medium);
                                c.Item().PaddingTop(3).Text(r.DateRapport.HasValue ? r.DateRapport.Value.ToString("dd/MM/yyyy") : "—").FontSize(11).Bold().FontColor("#111827");
                            });
                        });

                        if (!string.IsNullOrEmpty(r.Contenu))
                        {
                            content.Item().PaddingTop(14).Text("Description").FontSize(11).Bold().FontColor("#111827");
                            content.Item().PaddingTop(4).Background("#F9FAFB").Border(1).BorderColor("#E5E7EB").Padding(10)
                                   .Text(r.Contenu).FontSize(10).FontColor("#374151");
                        }

                        if (options.Count > 0)
                        {
                            content.Item().PaddingTop(16).Background("#4F46E5").Padding(10).Row(row =>
                            {
                                row.RelativeItem().Text($"Détails du rapport — {r.Type}").FontSize(12).Bold().FontColor(Colors.White);
                                row.AutoItem().Background("#6D63F5").Padding(4).PaddingLeft(10).PaddingRight(10)
                                   .Text($"{options.Count} champs").FontSize(10).FontColor(Colors.White).Bold();
                            });
                            content.Item().Table(table =>
                            {
                                table.ColumnsDefinition(col => { col.RelativeColumn(1); col.RelativeColumn(2); });
                                table.Header(header =>
                                {
                                    header.Cell().Background("#111827").Padding(7).Text("Champ").FontSize(9).Bold().FontColor(Colors.White);
                                    header.Cell().Background("#111827").Padding(7).Text("Valeur").FontSize(9).Bold().FontColor(Colors.White);
                                });
                                foreach (var (label, value) in options)
                                {
                                    table.Cell().Background("#EEF2FF").BorderBottom(1).BorderColor("#E5E7EB").Padding(9)
                                         .Text(label).FontSize(10).Bold().FontColor("#4F46E5");
                                    table.Cell().Background(Colors.White).BorderBottom(1).BorderColor("#E5E7EB").Padding(9)
                                         .Text(value).FontSize(10).FontColor("#111827");
                                }
                            });
                        }
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("I-mobile WAS — Page ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    text.Span(" / ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        });
        return doc.GeneratePdf();
    }

    // ══════════════════════════════════════════════════════════
    // EXCEL RAPPORT SPÉCIFIQUE ✅ accepte seq
    // ══════════════════════════════════════════════════════════

    private static byte[] GenerateExcelSpécifiqueBytes(Rapport r, int seq = 0)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Rapport");

        var options      = ParseOptions(r.OptionsData);
        var borderColor  = XLColor.FromHtml("#C7D2FE");
        var headerBorder = XLColor.FromHtml("#4F46E5");

        // ✅ ID cohérent avec le tableau
        var displayId = seq > 0 ? $"#RPT-{seq:D3}" : $"#RPT-{r.Id:D3}";

        // ── Titre principal ──
        ws.Cell("A1").Value = $"I-mobile WAS — Rapport : {r.Titre}";
        var titre1 = ws.Range("A1:C1");
        titre1.Merge().Style
            .Font.SetBold(true).Font.SetFontSize(15)
            .Fill.SetBackgroundColor(XLColor.FromHtml("#4F46E5"))
            .Font.SetFontColor(XLColor.White)
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
            .Alignment.SetVertical(XLAlignmentVerticalValues.Center);
        ws.Row(1).Height = 30;
        AppliquerBordures(titre1, headerBorder);

        // ── Sous-titre ──
        ws.Cell("A2").Value = $"Généré le {DateTime.Now:dd/MM/yyyy HH:mm}  ·  {displayId}  ·  {r.Type}";
        var sousTitre = ws.Range("A2:C2");
        sousTitre.Merge().Style
            .Font.SetItalic(true).Font.SetFontSize(10)
            .Font.SetFontColor(XLColor.FromHtml("#6B7280"))
            .Fill.SetBackgroundColor(XLColor.FromHtml("#EEF2FF"))
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        ws.Row(2).Height = 20;
        AppliquerBordures(sousTitre, borderColor);

        ws.Row(3).Height = 8;

        // ── Section : Informations générales ──
        int row = 4;
        var sectionHeader1 = ws.Range($"A{row}:C{row}");
        ws.Cell(row, 1).Value = "  INFORMATIONS GÉNÉRALES";
        sectionHeader1.Merge().Style
            .Font.SetBold(true).Font.SetFontSize(11)
            .Font.SetFontColor(XLColor.White)
            .Fill.SetBackgroundColor(XLColor.FromHtml("#111827"))
            .Alignment.SetVertical(XLAlignmentVerticalValues.Center);
        ws.Row(row).Height = 22;
        AppliquerBordures(sectionHeader1, XLColor.FromHtml("#111827"));
        row++;

        var statutColor = r.Statut switch
        {
            "Envoyé"     => XLColor.FromHtml("#059669"),
            "En attente" => XLColor.FromHtml("#D97706"),
            "Brouillon"  => XLColor.FromHtml("#6B7280"),
            _            => XLColor.FromHtml("#4F46E5"),
        };

        var infos = new[]
        {
            // ✅ utiliser displayId ici
            ("ID",            displayId,                                                                       false),
            ("Titre",          r.Titre,                                                                        false),
            ("Type",           r.Type,                                                                         false),
            ("Format",         r.Format,                                                                       false),
            ("Statut",         r.Statut,                                                                       true),
            ("Responsable",    r.Responsable ?? "—",                                                           false),
            ("Date création",  r.DateCreation.ToString("dd/MM/yyyy HH:mm"),                                    false),
            ("Date rapport",   r.DateRapport.HasValue ? r.DateRapport.Value.ToString("dd/MM/yyyy") : "—",      false),
            ("Description",    r.Contenu ?? "—",                                                               false),
        };

        foreach (var (label, value, isStatut) in infos)
        {
            var bgRow = row % 2 == 0 ? XLColor.White : XLColor.FromHtml("#EEF2FF");

            ws.Cell(row, 1).Value = label;
            ws.Cell(row, 1).Style
                .Font.SetBold(true).Font.SetFontSize(10)
                .Font.SetFontColor(XLColor.FromHtml("#4F46E5"))
                .Fill.SetBackgroundColor(bgRow)
                .Alignment.SetVertical(XLAlignmentVerticalValues.Center);

            ws.Cell(row, 2).Value = value;
            ws.Range(row, 2, row, 3).Merge();
            ws.Cell(row, 2).Style
                .Font.SetFontSize(10)
                .Font.SetFontColor(isStatut ? statutColor : XLColor.FromHtml("#111827"))
                .Font.SetBold(isStatut)
                .Fill.SetBackgroundColor(bgRow)
                .Alignment.SetVertical(XLAlignmentVerticalValues.Center)
                .Alignment.SetWrapText(true);

            ws.Row(row).Height = label == "Description" ? 40 : 18;
            AppliquerBordures(ws.Range(row, 1, row, 3), borderColor);
            row++;
        }

        // ── Section : Détails du rapport ──
        if (options.Count > 0)
        {
            row += 1;

            var sectionHeader2 = ws.Range($"A{row}:C{row}");
            ws.Cell(row, 1).Value = $"  DÉTAILS DU RAPPORT — {r.Type}  ({options.Count} champs)";
            sectionHeader2.Merge().Style
                .Font.SetBold(true).Font.SetFontSize(11)
                .Font.SetFontColor(XLColor.White)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#4F46E5"))
                .Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            ws.Row(row).Height = 22;
            AppliquerBordures(sectionHeader2, headerBorder);
            row++;

            ws.Cell(row, 1).Value = "Champ";
            ws.Cell(row, 2).Value = "Valeur";
            ws.Range(row, 2, row, 3).Merge();
            var headerRange = ws.Range(row, 1, row, 3);
            headerRange.Style
                .Font.SetBold(true).Font.SetFontSize(10)
                .Font.SetFontColor(XLColor.White)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#374151"))
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            ws.Row(row).Height = 18;
            AppliquerBordures(headerRange, XLColor.FromHtml("#374151"));
            row++;

            for (int i = 0; i < options.Count; i++)
            {
                var bg = i % 2 == 0 ? XLColor.FromHtml("#EEF2FF") : XLColor.White;

                ws.Cell(row + i, 1).Value = options[i].label;
                ws.Cell(row + i, 1).Style
                    .Font.SetBold(true).Font.SetFontSize(10)
                    .Font.SetFontColor(XLColor.FromHtml("#4F46E5"))
                    .Fill.SetBackgroundColor(bg)
                    .Alignment.SetVertical(XLAlignmentVerticalValues.Center);

                ws.Cell(row + i, 2).Value = options[i].value;
                ws.Range(row + i, 2, row + i, 3).Merge();
                ws.Cell(row + i, 2).Style
                    .Font.SetFontSize(10)
                    .Font.SetFontColor(XLColor.FromHtml("#111827"))
                    .Fill.SetBackgroundColor(bg)
                    .Alignment.SetVertical(XLAlignmentVerticalValues.Center)
                    .Alignment.SetWrapText(true);

                ws.Row(row + i).Height = 18;
                AppliquerBordures(ws.Range(row + i, 1, row + i, 3), borderColor);
            }
        }

        ws.Column(1).Width = 25;
        ws.Column(2).Width = 55;
        ws.Column(3).Width = 15;

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    // ══════════════════════════════════════════════════════════
    // EXCEL TABLEAU COMPLET ✅
    // ══════════════════════════════════════════════════════════

    private static byte[] GenerateExcelTableauBytes(List<Rapport> rapports)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Rapports");

        var borderColor  = XLColor.FromHtml("#C7D2FE");
        var headerBorder = XLColor.FromHtml("#4F46E5");

        ws.Cell("A1").Value = "I-mobile WAS — Historical Data & Reporting";
        var titre1 = ws.Range("A1:I1");
        titre1.Merge().Style
            .Font.SetBold(true).Font.SetFontSize(15)
            .Fill.SetBackgroundColor(XLColor.FromHtml("#4F46E5"))
            .Font.SetFontColor(XLColor.White)
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
            .Alignment.SetVertical(XLAlignmentVerticalValues.Center);
        ws.Row(1).Height = 30;
        AppliquerBordures(titre1, headerBorder);

        ws.Cell("A2").Value = $"Liste des rapports  ·  Généré le {DateTime.Now:dd/MM/yyyy HH:mm}  ·  {rapports.Count} rapport(s)";
        var sousTitre = ws.Range("A2:I2");
        sousTitre.Merge().Style
            .Font.SetItalic(true).Font.SetFontSize(10)
            .Font.SetFontColor(XLColor.FromHtml("#6B7280"))
            .Fill.SetBackgroundColor(XLColor.FromHtml("#EEF2FF"))
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        ws.Row(2).Height = 20;
        AppliquerBordures(sousTitre, borderColor);

        ws.Row(3).Height = 8;

        var headers = new[]
        {
            "ID", "Titre", "Type", "Date création",
            "Format", "Statut", "Responsable",
            "Date rapport", "Description"
        };

        for (int c = 0; c < headers.Length; c++)
        {
            var cell = ws.Cell(4, c + 1);
            cell.Value = headers[c];
            cell.Style
                .Font.SetBold(true).Font.SetFontSize(10)
                .Font.SetFontColor(XLColor.White)
                .Fill.SetBackgroundColor(XLColor.FromHtml("#111827"))
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Alignment.SetVertical(XLAlignmentVerticalValues.Center);
        }
        ws.Row(4).Height = 22;
        AppliquerBordures(ws.Range("A4:I4"), XLColor.FromHtml("#111827"));

        for (int i = 0; i < rapports.Count; i++)
        {
            var r    = rapports[i];
            var row  = i + 5;
            var bg   = i % 2 == 0 ? XLColor.White : XLColor.FromHtml("#EEF2FF");

            var statutColor = r.Statut switch
            {
                "Envoyé"     => XLColor.FromHtml("#059669"),
                "En attente" => XLColor.FromHtml("#D97706"),
                "Brouillon"  => XLColor.FromHtml("#6B7280"),
                _            => XLColor.FromHtml("#4F46E5"),
            };

            ws.Cell(row, 1).Value = $"#RPT-{(i + 1):D3}";
            ws.Cell(row, 1).Style.Font.SetFontColor(XLColor.FromHtml("#4F46E5")).Font.SetBold(true).Font.SetFontSize(10);

            ws.Cell(row, 2).Value = r.Titre;
            ws.Cell(row, 2).Style.Font.SetFontSize(10);

            ws.Cell(row, 3).Value = r.Type;
            ws.Cell(row, 3).Style.Font.SetFontColor(XLColor.FromHtml("#4F46E5")).Font.SetFontSize(10);

            ws.Cell(row, 4).Value = r.DateCreation.ToString("dd/MM/yyyy");
            ws.Cell(row, 4).Style.Font.SetFontSize(10);

            ws.Cell(row, 5).Value = r.Format;
            ws.Cell(row, 5).Style.Font.SetFontSize(10);

            ws.Cell(row, 6).Value = r.Statut;
            ws.Cell(row, 6).Style.Font.SetFontColor(statutColor).Font.SetBold(true).Font.SetFontSize(10);

            ws.Cell(row, 7).Value = r.Responsable ?? "—";
            ws.Cell(row, 7).Style.Font.SetFontSize(10);

            ws.Cell(row, 8).Value = r.DateRapport.HasValue
                ? r.DateRapport.Value.ToString("dd/MM/yyyy") : "—";
            ws.Cell(row, 8).Style.Font.SetFontSize(10);

            ws.Cell(row, 9).Value = r.Contenu ?? "—";
            ws.Cell(row, 9).Style
                .Font.SetFontSize(10)
                .Alignment.SetWrapText(true)
                .Alignment.SetVertical(XLAlignmentVerticalValues.Top);

            ws.Range(row, 1, row, 9).Style
                .Fill.SetBackgroundColor(bg)
                .Alignment.SetVertical(XLAlignmentVerticalValues.Center);

            ws.Row(row).Height = 35;
            AppliquerBordures(ws.Range(row, 1, row, 9), borderColor);
        }

        ws.Column(1).Width = 12;
        ws.Column(2).Width = 35;
        ws.Column(3).Width = 14;
        ws.Column(4).Width = 15;
        ws.Column(5).Width = 10;
        ws.Column(6).Width = 12;
        ws.Column(7).Width = 25;
        ws.Column(8).Width = 14;
        ws.Column(9).Width = 60;

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    // ══════════════════════════════════════════════════════════
    // CSV RAPPORT SPÉCIFIQUE ✅
    // ══════════════════════════════════════════════════════════

    private static byte[] GenerateCsvSpécifiqueBytes(Rapport r)
    {
        var options = ParseOptions(r.OptionsData);
        var sb = new System.Text.StringBuilder();
        sb.Append('\uFEFF');

        sb.AppendLine($"\"I-mobile WAS — Rapport : {Escape(r.Titre)}\"");
        sb.AppendLine($"\"Généré le {DateTime.Now:dd/MM/yyyy HH:mm}\"");
        sb.AppendLine();

        sb.AppendLine("\"INFORMATIONS GÉNÉRALES\"");
        sb.AppendLine("\"Champ\",\"Valeur\"");
        sb.AppendLine($"\"ID\",\"#RPT-{r.Id:D3}\"");
        sb.AppendLine($"\"Titre\",\"{Escape(r.Titre)}\"");
        sb.AppendLine($"\"Type\",\"{r.Type}\"");
        sb.AppendLine($"\"Format\",\"{r.Format}\"");
        sb.AppendLine($"\"Statut\",\"{r.Statut}\"");
        sb.AppendLine($"\"Responsable\",\"{Escape(r.Responsable ?? "—")}\"");
        sb.AppendLine($"\"Date création\",\"{r.DateCreation:dd/MM/yyyy HH:mm}\"");
        sb.AppendLine($"\"Date rapport\",\"{(r.DateRapport.HasValue ? r.DateRapport.Value.ToString("dd/MM/yyyy") : "—")}\"");
        sb.AppendLine($"\"Description\",\"{Escape(r.Contenu ?? "—")}\"");

        if (options.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine($"\"DÉTAILS DU RAPPORT — {r.Type} ({options.Count} champs)\"");
            sb.AppendLine("\"Champ\",\"Valeur\"");
            foreach (var (label, value) in options)
                sb.AppendLine($"\"{Escape(label)}\",\"{Escape(value)}\"");
        }

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }

    // ══════════════════════════════════════════════════════════
    // CSV TABLEAU COMPLET ✅
    // ══════════════════════════════════════════════════════════

    private static byte[] GenerateCsvBytes(List<Rapport> rapports)
    {
        var sb = new System.Text.StringBuilder();
        sb.Append('\uFEFF');

        sb.AppendLine("\"I-mobile WAS — Historical Data & Reporting\"");
        sb.AppendLine($"\"Liste des rapports  ·  Généré le {DateTime.Now:dd/MM/yyyy HH:mm}  ·  {rapports.Count} rapport(s)\"");
        sb.AppendLine();

        var allLabels = rapports
            .SelectMany(r => ParseOptions(r.OptionsData).Select(o => o.label))
            .Distinct().ToList();

        var headers = new List<string>
        {
            "ID", "Titre", "Type", "Date création", "Format",
            "Statut", "Responsable", "Date rapport", "Description"
        };
        headers.AddRange(allLabels);
        sb.AppendLine(string.Join(",", headers.Select(h => $"\"{Escape(h)}\"")));

        foreach (var (r, idx) in rapports.Select((r, i) => (r, i)))
        {
            var options = ParseOptions(r.OptionsData);
            var dict    = options.ToDictionary(o => o.label, o => o.value);

            var row = new List<string>
            {
                $"\"#RPT-{(idx + 1):D3}\"",
                $"\"{Escape(r.Titre)}\"",
                $"\"{r.Type}\"",
                $"\"{r.DateCreation:dd/MM/yyyy}\"",
                $"\"{r.Format}\"",
                $"\"{r.Statut}\"",
                $"\"{Escape(r.Responsable ?? "—")}\"",
                $"\"{(r.DateRapport.HasValue ? r.DateRapport.Value.ToString("dd/MM/yyyy") : "—")}\"",
                $"\"{Escape(r.Contenu ?? "—")}\"",
            };

            foreach (var label in allLabels)
                row.Add(dict.TryGetValue(label, out var val) ? $"\"{Escape(val)}\"" : "\"—\"");

            sb.AppendLine(string.Join(",", row));
        }

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }
}