using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Wordprocessing;

using WpBottomBorder = DocumentFormat.OpenXml.Wordprocessing.BottomBorder;
using WpInsideHorizontalBorder = DocumentFormat.OpenXml.Wordprocessing.InsideHorizontalBorder;
using WpInsideVerticalBorder = DocumentFormat.OpenXml.Wordprocessing.InsideVerticalBorder;
using WpLeftBorder = DocumentFormat.OpenXml.Wordprocessing.LeftBorder;
using WpParagraph = DocumentFormat.OpenXml.Wordprocessing.Paragraph;
using WpParagraphProperties = DocumentFormat.OpenXml.Wordprocessing.ParagraphProperties;
using WpRightBorder = DocumentFormat.OpenXml.Wordprocessing.RightBorder;
using WpRun = DocumentFormat.OpenXml.Wordprocessing.Run;
using WpRunProperties = DocumentFormat.OpenXml.Wordprocessing.RunProperties;
using WpSpacingBetweenLines = DocumentFormat.OpenXml.Wordprocessing.SpacingBetweenLines;
using WpTable = DocumentFormat.OpenXml.Wordprocessing.Table;
using WpTableCell = DocumentFormat.OpenXml.Wordprocessing.TableCell;
using WpTableCellProperties = DocumentFormat.OpenXml.Wordprocessing.TableCellProperties;
using WpTableCellWidth = DocumentFormat.OpenXml.Wordprocessing.TableCellWidth;
using WpTableProperties = DocumentFormat.OpenXml.Wordprocessing.TableProperties;
using WpTableRow = DocumentFormat.OpenXml.Wordprocessing.TableRow;
using WpText = DocumentFormat.OpenXml.Wordprocessing.Text;
using WpTopBorder = DocumentFormat.OpenXml.Wordprocessing.TopBorder;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

internal static partial class ArchitectureReviewDocxOpenXmlPrimitives
{
    internal static void AddKeyValueTable(Body body, IEnumerable<(string Key, string Value)> rows)
    {
        WpTable table = new();

        WpTableProperties props = new(
            new TableBorders(
                new WpTopBorder { Val = BorderValues.Single, Size = 8 },
                new WpBottomBorder { Val = BorderValues.Single, Size = 8 },
                new WpLeftBorder { Val = BorderValues.Single, Size = 8 },
                new WpRightBorder { Val = BorderValues.Single, Size = 8 },
                new WpInsideHorizontalBorder { Val = BorderValues.Single, Size = 6 },
                new WpInsideVerticalBorder { Val = BorderValues.Single, Size = 6 }),
            new TableWidth { Width = "9000", Type = TableWidthUnitValues.Dxa });

        table.AppendChild(props);

        foreach ((string key, string value) in rows)
        {
            WpTableRow tr = new();

            tr.Append(
                BuildCell(key, true, "2800"),
                BuildCell(value, false, "6200"));

            table.Append(tr);
        }

        body.AppendChild(table);
        AddSpacer(body);
    }

    private static WpTableCell BuildCell(string text, bool bold, string width)
    {
        WpRun run = new(new WpText(text) { Space = SpaceProcessingModeValues.Preserve });

        if (bold)
            run.RunProperties = new WpRunProperties(new Bold());

        return new WpTableCell(
            new WpTableCellProperties(
                new WpTableCellWidth { Type = TableWidthUnitValues.Dxa, Width = width }),
            new WpParagraph(
                new WpParagraphProperties(
                    new WpSpacingBetweenLines { Before = "80", After = "80" }),
                run));
    }
}
