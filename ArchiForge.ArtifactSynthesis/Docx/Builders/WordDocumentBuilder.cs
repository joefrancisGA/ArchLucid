using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchiForge.ArtifactSynthesis.Docx.Builders;

public static class WordDocumentBuilder
{
    private static string Sanitize(string? text) =>
        text?.Replace("\r\n", " ", StringComparison.Ordinal)
            .Replace('\n', ' ')
            .Replace('\r', ' ')
        ?? string.Empty;

    public static void AddParagraph(Body body, string text) =>
        body.AppendChild(new Paragraph(new Run(new Text(Sanitize(text)))));

    public static void AddHeading(Body body, string text, string styleId = "Heading1")
    {
        var p = new Paragraph(
            new ParagraphProperties(
                new ParagraphStyleId { Val = styleId }),
            new Run(new Text(Sanitize(text))));
        body.AppendChild(p);
    }

    /// <summary>Simple bullets without a numbering part (always renders in Word).</summary>
    public static void AddBulletList(Body body, IEnumerable<string> items)
    {
        foreach (var item in items)
            AddParagraph(body, "\u2022 " + item);
    }

    public static void AddSimpleTable(Body body, IEnumerable<(string, string)> rows)
    {
        var table = new Table();

        var props = new TableProperties(
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 4 },
                new BottomBorder { Val = BorderValues.Single, Size = 4 },
                new LeftBorder { Val = BorderValues.Single, Size = 4 },
                new RightBorder { Val = BorderValues.Single, Size = 4 },
                new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4 },
                new InsideVerticalBorder { Val = BorderValues.Single, Size = 4 }
            )
        );

        table.AppendChild(props);

        foreach (var row in rows)
        {
            var tr = new TableRow(
                new TableCell(new Paragraph(new Run(new Text(Sanitize(row.Item1))))),
                new TableCell(new Paragraph(new Run(new Text(Sanitize(row.Item2))))));

            table.AppendChild(tr);
        }

        body.AppendChild(table);
    }
}
