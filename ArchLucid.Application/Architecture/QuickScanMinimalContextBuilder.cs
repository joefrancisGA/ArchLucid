using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Architecture;

/// <summary>Builds a single synthetic file payload for <see cref="IQuickScanService" /> from minimal API input.</summary>
public static class QuickScanMinimalContextBuilder
{
    /// <summary>Produces path → text entries consumed by the quick-scan LLM prompt.</summary>
    public static Dictionary<string, string> BuildFiles(QuickScanRequestValidator.ValidatedQuickScanRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        string environmentLabel = QuickScanPrimaryEnvironment.ToContextLabel(
            request.PrimaryEnvironment,
            request.PrimaryEnvironmentOther);

        string concernsLine = request.ArchitectureConcerns.Count == 0
            ? "None specified"
            : string.Join(", ", request.ArchitectureConcerns);

        string body =
            "SystemName: "
            + request.SystemName
            + "\nPrimaryEnvironment: "
            + environmentLabel
            + "\nArchitectureConcerns: "
            + concernsLine
            + "\nDescription:\n"
            + request.Description;

        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["quick-scan-context.txt"] = body
        };
    }

    /// <summary>Legacy overload for callers still passing the HTTP contract directly.</summary>
    public static Dictionary<string, string> BuildFiles(ArchitectureQuickScanRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!QuickScanRequestValidator.TryValidate(
                request,
                new Core.Configuration.QuickScanOptions(),
                out QuickScanRequestValidator.ValidatedQuickScanRequest? validated,
                out string? _))
        {
            throw new ArgumentException("Quick scan request failed validation.", nameof(request));
        }

        return BuildFiles(validated!);
    }
}
