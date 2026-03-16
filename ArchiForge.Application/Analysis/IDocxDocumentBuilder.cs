using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchiForge.Application.Analysis;

public interface IDocxDocumentBuilder
{
    Body Body { get; }
    MainDocumentPart MainPart { get; }

    void AddHeading(string text, int level);
    void AddParagraph(string text, bool bold = false);
    void AddBullet(string text);
    void AddSpacer(int lines = 1);
    void AddMultilineParagraphs(string text);
    void AddCodeBlock(string text, string language);
    void AddDiffSection(string title, IReadOnlyCollection<string> items);
    void AddImage(byte[] imageBytes, string imageName, long widthEmus, long heightEmus);
}

