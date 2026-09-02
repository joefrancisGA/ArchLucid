using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Bootstrap.Seeders;

/// <summary>Helpers shared by more than one demo seed scenario.</summary>
internal static class DemoSeedSeederSupport
{
    internal static readonly DateTime DemoUtc = new(2025, 3, 1, 12, 0, 0, DateTimeKind.Utc);

    internal static readonly DateTime TrialWelcomeSeedUtc = new(2025, 6, 15, 14, 30, 0, DateTimeKind.Utc);

    internal static readonly JsonSerializerOptions DemoExportPersistJsonOptions = new(JsonSerializerDefaults.Web);

    internal static bool IsVerticalDemoSeedDepth(string? seedDepth)
    {
        if (string.IsNullOrWhiteSpace(seedDepth))
            return false;

        return string.Equals(seedDepth.Trim(), "vertical", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(seedDepth.Trim(), "full", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(seedDepth.Trim(), "production-realistic", StringComparison.OrdinalIgnoreCase);
    }

    internal static async Task TryRepairSeededRunDescriptionAsync(
        DemoSeedSeederDependencies deps,
        RunRecord run,
        CancellationToken cancellationToken)
    {
        string? repairedDescription = Utf8MojibakeRepair.RepairOptional(run.Description);
        repairedDescription = RetiredDemoOrgBranding.Strip(repairedDescription);
        string repairedProjectId = RetiredDemoOrgBranding.Strip(run.ProjectId) ?? run.ProjectId;

        bool descriptionChanged = !string.Equals(repairedDescription, run.Description, StringComparison.Ordinal);
        bool projectChanged = !string.Equals(repairedProjectId, run.ProjectId, StringComparison.Ordinal);

        if (!descriptionChanged && !projectChanged)
            return;

        if (descriptionChanged)
            run.Description = repairedDescription;

        if (projectChanged)
            run.ProjectId = repairedProjectId;

        await deps.RunRepository.UpdateAsync(run, cancellationToken);
    }

    internal static string ProductTourDemoSuffix(Guid tenantId)
    {
        if (tenantId == ScopeIds.DefaultTenant)
            return "canonical";

        string t = tenantId.ToString("N");

        return t.Length >= 12 ? t[..12] : t;
    }

    internal static bool ShouldMarkSeededRunAsSample(Guid tenantId) => tenantId != ScopeIds.DefaultTenant;

    internal static List<string> SeedAllowedTools(AgentType agentType) => [AgentTypeKeys.FromEnum(agentType)];
}
