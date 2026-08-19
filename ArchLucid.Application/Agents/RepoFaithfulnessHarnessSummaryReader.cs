using System.Text.Json;

using Microsoft.Extensions.Hosting;

namespace ArchLucid.Application.Agents;

/// <summary>Reads <c>docs/quality/faithfulness-summary.json</c> from the repo content root (TB-2105).</summary>
public sealed class RepoFaithfulnessHarnessSummaryReader(IHostEnvironment hostEnvironment) : IFaithfulnessHarnessSummaryReader
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    public async Task<FaithfulnessHarnessSummary?> TryReadLatestAsync(CancellationToken cancellationToken)
    {
        string path = Path.Combine(_hostEnvironment.ContentRootPath, "docs", "quality", "faithfulness-summary.json");

        if (!File.Exists(path))
        {
            return null;
        }

        await using FileStream stream = File.OpenRead(path);

        FaithfulnessHarnessSummaryDto? dto = await JsonSerializer
            .DeserializeAsync<FaithfulnessHarnessSummaryDto>(stream, SerializerOptions, cancellationToken)
            .ConfigureAwait(false);

        if (dto is null)
        {
            return null;
        }

        return new FaithfulnessHarnessSummary(
            dto.FormatVersion ?? "1.0",
            dto.CasesEvaluated,
            dto.PositiveReadinessSupportRatio,
            dto.NegativeControlSupportRatio,
            dto.CombinedDiagnosticSupportRatio,
            dto.FloorMinSupportRatio);
    }

    private sealed class FaithfulnessHarnessSummaryDto
    {
        public string? FormatVersion
        {
            get;
            set;
        }

        public int CasesEvaluated
        {
            get;
            set;
        }

        public double PositiveReadinessSupportRatio
        {
            get;
            set;
        }

        public double NegativeControlSupportRatio
        {
            get;
            set;
        }

        public double CombinedDiagnosticSupportRatio
        {
            get;
            set;
        }

        public double FloorMinSupportRatio
        {
            get;
            set;
        }
    }
}
