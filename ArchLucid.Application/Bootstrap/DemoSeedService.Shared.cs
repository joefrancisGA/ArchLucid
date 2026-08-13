using System.Text.Json;
using System.Threading;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Helpers shared by more than one seed scenario: seed-depth gating, mojibake repair on reseed,
///     tenant-specific demo naming, and agent dispatch keys for seeded tasks.
/// </summary>
public sealed partial class DemoSeedService
{
    private static bool IsVerticalDemoSeedDepth(string? seedDepth)
    {
        if (string.IsNullOrWhiteSpace(seedDepth))
            return false;
        return string.Equals(seedDepth.Trim(), "vertical", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(seedDepth.Trim(), "full", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(seedDepth.Trim(), "production-realistic", StringComparison.OrdinalIgnoreCase);
    }


    private async Task TryRepairSeededRunDescriptionAsync(RunRecord run, CancellationToken cancellationToken)
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

        await _runRepository.UpdateAsync(run, cancellationToken);
    }

    private static string ProductTourDemoSuffix(Guid tenantId)
    {
        if (tenantId == ScopeIds.DefaultTenant)
            return "canonical";

        string t = tenantId.ToString("N");

        return t.Length >= 12 ? t[..12] : t;
    }

    /// <summary>
    ///     Trusted-baseline Retail Checkout fixtures on the canonical default tenant stay durable; guest-tenant demo seeds are
    ///     sample data eligible for OS-1b auto-purge.
    /// </summary>
    private static bool ShouldMarkSeededRunAsSample(Guid tenantId) => tenantId != ScopeIds.DefaultTenant;


    /// <summary>
    ///     Seeded tasks must list the agent dispatch key explicitly (TB-950) — empty AllowedTools is deny on
    ///     production-like hosts.
    /// </summary>
    private static List<string> SeedAllowedTools(AgentType agentType)
    {
        return [AgentTypeKeys.FromEnum(agentType)];
    }
}
