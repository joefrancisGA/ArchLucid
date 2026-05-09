using QuestPDF;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Rendering;

/// <summary>
///     Centralizes QuestPDF community license configuration and the MemoryStream PDF emit pattern so
///     document builders do not duplicate setup/teardown.
/// </summary>
internal static class QuestPdfDocumentBytes
{
    static QuestPdfDocumentBytes()
    {
        Settings.License = LicenseType.Community;
    }

    internal static byte[] Generate(Action<IDocumentContainer> composeDocument)
    {
        ArgumentNullException.ThrowIfNull(composeDocument);

        Document document = Document.Create(composeDocument);

        using MemoryStream stream = new MemoryStream();
        document.GeneratePdf(stream);

        return stream.ToArray();
    }
}
