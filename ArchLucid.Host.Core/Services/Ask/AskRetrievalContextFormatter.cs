using ArchLucid.Core.Retrieval;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Formats retrieval hits into Ask prompt context text.</summary>
public static class AskRetrievalContextFormatter
{
    public static string Format(IReadOnlyList<RetrievalHit> hits)
    {
        if (hits.Count == 0)
            return string.Empty;

        return string.Join(
            Environment.NewLine + Environment.NewLine,
            hits.Select((h, i) =>
                $"[{i + 1}] {h.SourceType} / {h.Title}{Environment.NewLine}{h.Text}"));
    }
}
