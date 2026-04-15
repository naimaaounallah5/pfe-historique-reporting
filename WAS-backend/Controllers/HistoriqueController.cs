using Microsoft.AspNetCore.Mvc;
using WAS_backend.DTOs;
using WAS_backend.Services;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/historique")]
    public class HistoriqueController : ControllerBase
    {
        private readonly IHistoriqueService _service;

        public HistoriqueController(IHistoriqueService service)
        {
            _service = service;
        }

        // ════════════════════════════════════════════════════
        // SCADA
        // ════════════════════════════════════════════════════
        [HttpGet("scada")]
        public async Task<IActionResult> GetSCADA([FromQuery] HistoriqueQueryParams p)
        {
            var result = await _service.GetSCADAAsync(p);
            return Ok(result);
        }

        [HttpGet("scada/{id}")]
        public async Task<IActionResult> GetSCADAById(int id)
        {
            var result = await _service.GetSCADAByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("scada/export/excel")]
        public async Task<IActionResult> ExportSCADAExcel([FromQuery] HistoriqueQueryParams p)
        {
            var data = await _service.ExportSCADAAsync(p);

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("SCADA");

            // En-têtes
            ws.Cell(1, 1).Value  = "N° Entrée";
            ws.Cell(1, 2).Value  = "Machine";
            ws.Cell(1, 3).Value  = "Produit";
            ws.Cell(1, 4).Value  = "N° Opération";
            ws.Cell(1, 5).Value  = "N° Ordre";
            ws.Cell(1, 6).Value  = "Qté Produite";
            ws.Cell(1, 7).Value  = "Qté Rebut";
            ws.Cell(1, 8).Value  = "Run Time";
            ws.Cell(1, 9).Value  = "Stop Time";
            ws.Cell(1, 10).Value = "Setup Time";
            ws.Cell(1, 11).Value = "Heure Début";
            ws.Cell(1, 12).Value = "Heure Fin";
            ws.Cell(1, 13).Value = "Statut";
            ws.Cell(1, 14).Value = "Date Enregistrement";

            // Style en-têtes
            var headerRow = ws.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
            headerRow.Style.Font.FontColor = XLColor.White;

            for (int i = 0; i < data.Count; i++)
            {
                var d   = data[i];
                int row = i + 2;
                ws.Cell(row, 1).Value  = d.NumeroEntree;
                ws.Cell(row, 2).Value  = d.NomMachine;
                ws.Cell(row, 3).Value  = d.NomProduit;
                ws.Cell(row, 4).Value  = d.NumeroOperation;
                ws.Cell(row, 5).Value  = d.NumeroOrdre;
                ws.Cell(row, 6).Value  = d.QuantiteProduite;
                ws.Cell(row, 7).Value  = d.QuantiteRebut;
                ws.Cell(row, 8).Value  = d.RunTime;
                ws.Cell(row, 9).Value  = d.StopTime;
                ws.Cell(row, 10).Value = d.SetupTime;
                // ✅ CORRECTION : HeureDebut est DateTime, HeureFin est DateTime?
                ws.Cell(row, 11).Value = d.HeureDebut.ToString("HH:mm");
                ws.Cell(row, 12).Value = d.HeureFin?.ToString("HH:mm") ?? "";
                ws.Cell(row, 13).Value = d.Statut;
                ws.Cell(row, 14).Value = d.DateEnregistrement.ToString("dd/MM/yyyy HH:mm");
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            wb.SaveAs(stream);
            stream.Seek(0, SeekOrigin.Begin);

            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Historique_SCADA_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }

        [HttpGet("scada/export/pdf")]
        public async Task<IActionResult> ExportSCADAPdf([FromQuery] HistoriqueQueryParams p)
        {
            var data = await _service.ExportSCADAAsync(p);

            QuestPDF.Settings.License = LicenseType.Community;

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(20);
                    page.DefaultTextStyle(x => x.FontSize(8));

                    page.Header().Text($"Historique SCADA — {data.Count} enregistrement(s)")
                        .Bold().FontSize(13).FontColor(Colors.Blue.Medium);

                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(2);
                        });

                        static IContainer HeaderCell(IContainer c) =>
                            c.Background(Colors.Blue.Medium).Padding(4).AlignCenter();

                        table.Header(h =>
                        {
                            h.Cell().Element(HeaderCell).Text("N° Entrée").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Machine").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Produit").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Qté Produite").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Qté Rebut").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Statut").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Date").FontColor(Colors.White).Bold();
                        });

                        bool alt = false;
                        foreach (var d in data)
                        {
                            var bg = alt ? Colors.Grey.Lighten3 : Colors.White;
                            alt = !alt;

                            IContainer Cell(IContainer c) =>
                                c.Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(3);

                            table.Cell().Element(Cell).Text(d.NumeroEntree);
                            table.Cell().Element(Cell).Text(d.NomMachine);
                            table.Cell().Element(Cell).Text(d.NomProduit);
                            table.Cell().Element(Cell).Text(d.QuantiteProduite.ToString());
                            table.Cell().Element(Cell).Text(d.QuantiteRebut.ToString());
                            table.Cell().Element(Cell).Text(d.Statut);
                            table.Cell().Element(Cell).Text(d.DateEnregistrement.ToString("dd/MM/yyyy HH:mm"));
                        }
                    });

                    page.Footer().AlignCenter()
                        .Text(t =>
                        {
                            t.Span("Page ");
                            t.CurrentPageNumber();
                            t.Span(" / ");
                            t.TotalPages();
                        });
                });
            });

            var bytes = pdf.GeneratePdf();
            return File(bytes, "application/pdf",
                $"Historique_SCADA_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
        }

        // ════════════════════════════════════════════════════
        // WMS
        // ════════════════════════════════════════════════════
        [HttpGet("wms")]
        public async Task<IActionResult> GetWMS([FromQuery] HistoriqueQueryParams p)
        {
            var result = await _service.GetWMSAsync(p);
            return Ok(result);
        }

        [HttpGet("wms/{id}")]
        public async Task<IActionResult> GetWMSById(int id)
        {
            var result = await _service.GetWMSByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("wms/export/excel")]
        public async Task<IActionResult> ExportWMSExcel([FromQuery] HistoriqueQueryParams p)
        {
            var data = await _service.ExportWMSAsync(p);

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("WMS");

            ws.Cell(1, 1).Value  = "N° Entrée";
            ws.Cell(1, 2).Value  = "Produit";
            ws.Cell(1, 3).Value  = "N° Lot";
            ws.Cell(1, 4).Value  = "Zone";
            ws.Cell(1, 5).Value  = "Type Mouvement";
            ws.Cell(1, 6).Value  = "Qté Traitée";
            ws.Cell(1, 7).Value  = "Qté Rejetée";
            ws.Cell(1, 8).Value  = "Durée Traitement";
            ws.Cell(1, 9).Value  = "Durée Arrêt";
            ws.Cell(1, 10).Value = "Statut";
            ws.Cell(1, 11).Value = "Date Enregistrement";

            var headerRow = ws.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
            headerRow.Style.Font.FontColor = XLColor.White;

            for (int i = 0; i < data.Count; i++)
            {
                var d   = data[i];
                int row = i + 2;
                ws.Cell(row, 1).Value  = d.NumeroEntree;
                ws.Cell(row, 2).Value  = d.NomProduit;
                ws.Cell(row, 3).Value  = d.NumeroLot;
                ws.Cell(row, 4).Value  = d.Zone;
                ws.Cell(row, 5).Value  = d.TypeMouvement;
                ws.Cell(row, 6).Value  = d.QuantiteTraitee;
                ws.Cell(row, 7).Value  = d.QuantiteRejetee;
                ws.Cell(row, 8).Value  = d.DureeTraitement;
                ws.Cell(row, 9).Value  = d.DureeArret;
                ws.Cell(row, 10).Value = d.Statut;
                ws.Cell(row, 11).Value = d.DateEnregistrement.ToString("dd/MM/yyyy HH:mm");
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            wb.SaveAs(stream);
            stream.Seek(0, SeekOrigin.Begin);

            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Historique_WMS_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }

        [HttpGet("wms/export/pdf")]
        public async Task<IActionResult> ExportWMSPdf([FromQuery] HistoriqueQueryParams p)
        {
            var data = await _service.ExportWMSAsync(p);

            QuestPDF.Settings.License = LicenseType.Community;

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(20);
                    page.DefaultTextStyle(x => x.FontSize(8));

                    page.Header().Text($"Historique WMS — {data.Count} enregistrement(s)")
                        .Bold().FontSize(13).FontColor(Colors.Blue.Medium);

                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                            c.RelativeColumn(1);
                            c.RelativeColumn(2);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(2);
                        });

                        static IContainer HeaderCell(IContainer c) =>
                            c.Background(Colors.Blue.Medium).Padding(4).AlignCenter();

                        table.Header(h =>
                        {
                            h.Cell().Element(HeaderCell).Text("N° Entrée").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Produit").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("N° Lot").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Type Mouvement").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Qté Traitée").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Statut").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Date").FontColor(Colors.White).Bold();
                        });

                        bool alt = false;
                        foreach (var d in data)
                        {
                            var bg = alt ? Colors.Grey.Lighten3 : Colors.White;
                            alt = !alt;

                            IContainer Cell(IContainer c) =>
                                c.Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(3);

                            table.Cell().Element(Cell).Text(d.NumeroEntree);
                            table.Cell().Element(Cell).Text(d.NomProduit);
                            table.Cell().Element(Cell).Text(d.NumeroLot);
                            table.Cell().Element(Cell).Text(d.TypeMouvement);
                            table.Cell().Element(Cell).Text(d.QuantiteTraitee.ToString());
                            table.Cell().Element(Cell).Text(d.Statut);
                            table.Cell().Element(Cell).Text(d.DateEnregistrement.ToString("dd/MM/yyyy HH:mm"));
                        }
                    });

                    page.Footer().AlignCenter().Text(t =>
                    {
                        t.Span("Page "); t.CurrentPageNumber(); t.Span(" / "); t.TotalPages();
                    });
                });
            });

            return File(pdf.GeneratePdf(), "application/pdf",
                $"Historique_WMS_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
        }

        // ════════════════════════════════════════════════════
        // QDC
        // ════════════════════════════════════════════════════
        [HttpGet("qdc")]
        public async Task<IActionResult> GetQDC([FromQuery] HistoriqueQueryParams p)
        {
            var result = await _service.GetQDCAsync(p);
            return Ok(result);
        }

        [HttpGet("qdc/{id}")]
        public async Task<IActionResult> GetQDCById(int id)
        {
            var result = await _service.GetQDCByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("qdc/export/excel")]
        public async Task<IActionResult> ExportQDCExcel([FromQuery] HistoriqueQueryParams p)
        {
            var data = await _service.ExportQDCAsync(p);

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("QDC");

            ws.Cell(1, 1).Value  = "N° Entrée";
            ws.Cell(1, 2).Value  = "Produit";
            ws.Cell(1, 3).Value  = "Machine";
            ws.Cell(1, 4).Value  = "Ligne Production";
            ws.Cell(1, 5).Value  = "Type Contrôle";
            ws.Cell(1, 6).Value  = "Qté Contrôlée";
            ws.Cell(1, 7).Value  = "Qté Défaut";
            ws.Cell(1, 8).Value  = "Taux Défaut";
            ws.Cell(1, 9).Value  = "Statut";
            ws.Cell(1, 10).Value = "Date Enregistrement";

            var headerRow = ws.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
            headerRow.Style.Font.FontColor = XLColor.White;

            for (int i = 0; i < data.Count; i++)
            {
                var d   = data[i];
                int row = i + 2;
                ws.Cell(row, 1).Value  = d.NumeroEntree;
                ws.Cell(row, 2).Value  = d.NomProduit;
                ws.Cell(row, 3).Value  = d.NomMachine;
                ws.Cell(row, 4).Value  = d.LigneProduction;
                ws.Cell(row, 5).Value  = d.TypeControle;
                ws.Cell(row, 6).Value  = d.QuantiteControlee;
                ws.Cell(row, 7).Value  = d.QuantiteDefaut;
                ws.Cell(row, 8).Value  = d.TauxDefaut;
                ws.Cell(row, 9).Value  = d.Statut;
                ws.Cell(row, 10).Value = d.DateEnregistrement.ToString("dd/MM/yyyy HH:mm");
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            wb.SaveAs(stream);
            stream.Seek(0, SeekOrigin.Begin);

            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Historique_QDC_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }

        [HttpGet("qdc/export/pdf")]
        public async Task<IActionResult> ExportQDCPdf([FromQuery] HistoriqueQueryParams p)
        {
            var data = await _service.ExportQDCAsync(p);

            QuestPDF.Settings.License = LicenseType.Community;

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(20);
                    page.DefaultTextStyle(x => x.FontSize(8));

                    page.Header().Text($"Historique QDC — {data.Count} enregistrement(s)")
                        .Bold().FontSize(13).FontColor(Colors.Blue.Medium);

                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(2);
                        });

                        static IContainer HeaderCell(IContainer c) =>
                            c.Background(Colors.Blue.Medium).Padding(4).AlignCenter();

                        table.Header(h =>
                        {
                            h.Cell().Element(HeaderCell).Text("N° Entrée").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Produit").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Machine").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Qté Contrôlée").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Qté Défaut").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Statut").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Date").FontColor(Colors.White).Bold();
                        });

                        bool alt = false;
                        foreach (var d in data)
                        {
                            var bg = alt ? Colors.Grey.Lighten3 : Colors.White;
                            alt = !alt;

                            IContainer Cell(IContainer c) =>
                                c.Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(3);

                            table.Cell().Element(Cell).Text(d.NumeroEntree);
                            table.Cell().Element(Cell).Text(d.NomProduit);
                            table.Cell().Element(Cell).Text(d.NomMachine);
                            table.Cell().Element(Cell).Text(d.QuantiteControlee.ToString());
                            table.Cell().Element(Cell).Text(d.QuantiteDefaut.ToString());
                            table.Cell().Element(Cell).Text(d.Statut);
                            table.Cell().Element(Cell).Text(d.DateEnregistrement.ToString("dd/MM/yyyy HH:mm"));
                        }
                    });

                    page.Footer().AlignCenter().Text(t =>
                    {
                        t.Span("Page "); t.CurrentPageNumber(); t.Span(" / "); t.TotalPages();
                    });
                });
            });

            return File(pdf.GeneratePdf(), "application/pdf",
                $"Historique_QDC_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
        }

        // ════════════════════════════════════════════════════
        // AGV
        // ════════════════════════════════════════════════════
        [HttpGet("agv")]
        public async Task<IActionResult> GetAGV([FromQuery] HistoriqueQueryParams p)
        {
            var result = await _service.GetAGVAsync(p);
            return Ok(result);
        }

        [HttpGet("agv/{id}")]
        public async Task<IActionResult> GetAGVById(int id)
        {
            var result = await _service.GetAGVByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("agv/export/excel")]
        public async Task<IActionResult> ExportAGVExcel([FromQuery] HistoriqueQueryParams p)
        {
            var data = await _service.ExportAGVAsync(p);

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("AGV");

            ws.Cell(1, 1).Value  = "N° Entrée";
            ws.Cell(1, 2).Value  = "Produit";
            ws.Cell(1, 3).Value  = "Code AGV";
            ws.Cell(1, 4).Value  = "N° Transfert";
            ws.Cell(1, 5).Value  = "Qté Transférée";
            ws.Cell(1, 6).Value  = "Nb Incidents";
            ws.Cell(1, 7).Value  = "Run Time";
            ws.Cell(1, 8).Value  = "Stop Time";
            ws.Cell(1, 9).Value  = "Zone Départ";
            ws.Cell(1, 10).Value = "Zone Arrivée";
            ws.Cell(1, 11).Value = "Statut";
            ws.Cell(1, 12).Value = "Date Enregistrement";

            var headerRow = ws.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
            headerRow.Style.Font.FontColor = XLColor.White;

            for (int i = 0; i < data.Count; i++)
            {
                var d   = data[i];
                int row = i + 2;
                ws.Cell(row, 1).Value  = d.NumeroEntree;
                ws.Cell(row, 2).Value  = d.NomProduit;
                ws.Cell(row, 3).Value  = d.CodeAGV;
                ws.Cell(row, 4).Value  = d.NumeroTransfert;
                ws.Cell(row, 5).Value  = d.QuantiteTransferee;
                ws.Cell(row, 6).Value  = d.NombreIncidents;
                ws.Cell(row, 7).Value  = d.RunTime;
                ws.Cell(row, 8).Value  = d.StopTime;
                ws.Cell(row, 9).Value  = d.ZoneDepart;
                ws.Cell(row, 10).Value = d.ZoneArrivee;
                ws.Cell(row, 11).Value = d.Statut;
                ws.Cell(row, 12).Value = d.DateEnregistrement.ToString("dd/MM/yyyy HH:mm");
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            wb.SaveAs(stream);
            stream.Seek(0, SeekOrigin.Begin);

            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Historique_AGV_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }

        [HttpGet("agv/export/pdf")]
        public async Task<IActionResult> ExportAGVPdf([FromQuery] HistoriqueQueryParams p)
        {
            var data = await _service.ExportAGVAsync(p);

            QuestPDF.Settings.License = LicenseType.Community;

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(20);
                    page.DefaultTextStyle(x => x.FontSize(8));

                    page.Header().Text($"Historique AGV — {data.Count} enregistrement(s)")
                        .Bold().FontSize(13).FontColor(Colors.Blue.Medium);

                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(2);
                        });

                        static IContainer HeaderCell(IContainer c) =>
                            c.Background(Colors.Blue.Medium).Padding(4).AlignCenter();

                        table.Header(h =>
                        {
                            h.Cell().Element(HeaderCell).Text("N° Entrée").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Produit").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Code AGV").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Qté Transférée").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Nb Incidents").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Statut").FontColor(Colors.White).Bold();
                            h.Cell().Element(HeaderCell).Text("Date").FontColor(Colors.White).Bold();
                        });

                        bool alt = false;
                        foreach (var d in data)
                        {
                            var bg = alt ? Colors.Grey.Lighten3 : Colors.White;
                            alt = !alt;

                            IContainer Cell(IContainer c) =>
                                c.Background(bg).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(3);

                            table.Cell().Element(Cell).Text(d.NumeroEntree);
                            table.Cell().Element(Cell).Text(d.NomProduit);
                            table.Cell().Element(Cell).Text(d.CodeAGV);
                            table.Cell().Element(Cell).Text(d.QuantiteTransferee.ToString());
                            table.Cell().Element(Cell).Text(d.NombreIncidents.ToString());
                            table.Cell().Element(Cell).Text(d.Statut);
                            table.Cell().Element(Cell).Text(d.DateEnregistrement.ToString("dd/MM/yyyy HH:mm"));
                        }
                    });

                    page.Footer().AlignCenter().Text(t =>
                    {
                        t.Span("Page "); t.CurrentPageNumber(); t.Span(" / "); t.TotalPages();
                    });
                });
            });

            return File(pdf.GeneratePdf(), "application/pdf",
                $"Historique_AGV_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
        }
    }
}