using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Pure, ledger-driven technology consistency checks (assessment D.4). No I/O or LLM calls.
/// </summary>
public sealed class TechnologyConsistencyFindingEngine : ITechnologyConsistencyFindingEngine
{
    private static readonly TechnologyLedgerRole[] CrossFamilyRoles =
    [
        TechnologyLedgerRole.IdentityProvider,
        TechnologyLedgerRole.PrimaryDatastore,
        TechnologyLedgerRole.Messaging,
        TechnologyLedgerRole.ComputeRuntime,
    ];

    private static readonly TechnologyLedgerRole[] PlatformDependentRoles =
    [
        TechnologyLedgerRole.IdentityProvider,
        TechnologyLedgerRole.PrimaryDatastore,
        TechnologyLedgerRole.Messaging,
        TechnologyLedgerRole.ComputeRuntime,
        TechnologyLedgerRole.Region,
        TechnologyLedgerRole.IacTarget,
    ];

    public IReadOnlyList<Finding> Evaluate(
        string runId,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        TechnologyConsistencyFindingEngineOptions options)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(ledgerEntries);
        ArgumentNullException.ThrowIfNull(options);

        if (ledgerEntries.Count == 0)
            return [];

        options.Normalize();
        FindingSeverity severity = ResolveSeverity(options.Mode);
        List<Finding> findings = [];

        AppendDuplicateChosenRoleFindings(runId, ledgerEntries, severity, findings);
        AppendCrossFamilyFindings(runId, ledgerEntries, severity, findings);
        AppendMissingChosenCloudPlatformFindings(runId, ledgerEntries, severity, findings);
        AppendLockedChosenOverriddenFindings(runId, ledgerEntries, severity, findings);

        return findings;
    }

    private static FindingSeverity ResolveSeverity(TechnologyConsistencyFindingEngineMode mode)
    {
        return mode switch
        {
            TechnologyConsistencyFindingEngineMode.WarnOnly => FindingSeverity.Warning,
            TechnologyConsistencyFindingEngineMode.Enforcing => FindingSeverity.Error,
            _ => throw new ArgumentOutOfRangeException(nameof(mode), mode, "Unsupported technology consistency mode."),
        };
    }

    private static void AppendDuplicateChosenRoleFindings(
        string runId,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        FindingSeverity severity,
        List<Finding> findings)
    {
        foreach (IGrouping<TechnologyLedgerRole, TechnologyLedgerEntry> group in ledgerEntries
                     .Where(static entry => entry.Status == TechnologyLedgerStatus.Chosen)
                     .GroupBy(static entry => entry.Role))
        {
            List<TechnologyLedgerEntry> chosen = group.ToList();

            if (chosen.Count <= 1)
                continue;

            string entryIds = string.Join(", ", chosen.Select(static entry => entry.EntryId));
            string names = string.Join(", ", chosen.Select(static entry => entry.TechnologyName));

            findings.Add(CreateFinding(
                runId,
                severity,
                "DuplicateChosenLedgerRole",
                $"Multiple Chosen Technology Ledger rows exist for role {group.Key}.",
                group.Key,
                chosen[0].ProviderFamily,
                entryIds,
                $"Conflicting technologies: {names}."));
        }
    }

    private static void AppendCrossFamilyFindings(
        string runId,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        FindingSeverity severity,
        List<Finding> findings)
    {
        TechnologyLedgerEntry? cloudPlatform = ledgerEntries
            .FirstOrDefault(entry =>
                entry.Role == TechnologyLedgerRole.CloudPlatform
                && entry.Status == TechnologyLedgerStatus.Chosen);

        if (cloudPlatform is null)
            return;

        CloudProvider cloud = cloudPlatform.ProviderFamily;

        foreach (TechnologyLedgerRole role in CrossFamilyRoles)
        {
            foreach (TechnologyLedgerEntry entry in ledgerEntries.Where(candidate =>
                         candidate.Role == role && candidate.Status == TechnologyLedgerStatus.Chosen))
            {
                if (cloud == CloudProvider.None)
                {
                    if (IsHyperscalerFamily(entry.ProviderFamily))
                    {
                        findings.Add(CreateFinding(
                            runId,
                            severity,
                            "CloudNeutralProviderLeak",
                            $"Cloud-neutral posture conflicts with hyperscaler-specific Chosen row for {role}.",
                            role,
                            entry.ProviderFamily,
                            entry.EntryId,
                            $"Chosen CloudPlatform is cloud-neutral but {role} is {entry.ProviderFamily} ({entry.TechnologyName})."));
                    }

                    continue;
                }

                if (!IsHyperscalerFamily(cloud))
                    continue;

                if (IsHyperscalerFamily(entry.ProviderFamily) && entry.ProviderFamily != cloud)
                {
                    findings.Add(CreateFinding(
                        runId,
                        severity,
                        "ConflictingChosenProviderFamily",
                        $"Chosen {role} provider family conflicts with Chosen CloudPlatform.",
                        role,
                        entry.ProviderFamily,
                        entry.EntryId,
                        $"CloudPlatform is {cloud} but {role} is {entry.ProviderFamily} ({entry.TechnologyName})."));
                }
            }
        }
    }

    private static void AppendMissingChosenCloudPlatformFindings(
        string runId,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        FindingSeverity severity,
        List<Finding> findings)
    {
        bool hasChosenCloudPlatform = ledgerEntries.Any(entry =>
            entry.Role == TechnologyLedgerRole.CloudPlatform
            && entry.Status == TechnologyLedgerStatus.Chosen);

        if (hasChosenCloudPlatform)
            return;

        bool hasDependentChosen = ledgerEntries.Any(entry =>
            entry.Status == TechnologyLedgerStatus.Chosen
            && PlatformDependentRoles.Contains(entry.Role));

        if (!hasDependentChosen)
            return;

        findings.Add(CreateFinding(
            runId,
            severity,
            "MissingChosenCloudPlatform",
            "Chosen Technology Ledger rows exist without a Chosen CloudPlatform row.",
            TechnologyLedgerRole.CloudPlatform,
            CloudProvider.None,
            string.Empty,
            "Intake or evidence seeding should establish CloudPlatform before other Chosen roles."));
    }

    private static void AppendLockedChosenOverriddenFindings(
        string runId,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        FindingSeverity severity,
        List<Finding> findings)
    {
        foreach (TechnologyLedgerEntry chosen in ledgerEntries.Where(entry =>
                     entry.Status == TechnologyLedgerStatus.Chosen && entry.IsLocked))
        {
            foreach (TechnologyLedgerEntry assumed in ledgerEntries.Where(entry =>
                         entry.Role == chosen.Role
                         && entry.Status == TechnologyLedgerStatus.Assumed
                         && (!string.Equals(entry.TechnologyName, chosen.TechnologyName, StringComparison.Ordinal)
                             || entry.ProviderFamily != chosen.ProviderFamily)))
            {
                findings.Add(CreateFinding(
                    runId,
                    severity,
                    "LockedChosenOverriddenByAssumed",
                    $"Locked Chosen row for {chosen.Role} is contradicted by an Assumed proposal.",
                    chosen.Role,
                    assumed.ProviderFamily,
                    $"{chosen.EntryId},{assumed.EntryId}",
                    $"Locked Chosen: {chosen.TechnologyName} ({chosen.ProviderFamily}); Assumed: {assumed.TechnologyName} ({assumed.ProviderFamily})."));
            }
        }
    }

    private static bool IsHyperscalerFamily(CloudProvider providerFamily)
    {
        return providerFamily is CloudProvider.Azure or CloudProvider.Aws or CloudProvider.Gcp;
    }

    private static Finding CreateFinding(
        string runId,
        FindingSeverity severity,
        string title,
        string rationale,
        TechnologyLedgerRole role,
        CloudProvider providerFamily,
        string entryIds,
        string detail)
    {
        string roleKey = role.ToString();
        Finding finding = new()
        {
            FindingId = $"tech-consistency-{title}-{roleKey}-{runId}",
            FindingType = "TechnologyConsistency",
            Category = "TechnologyLedger",
            EngineType = "TechnologyConsistencyFindingEngine",
            Severity = severity,
            Title = title,
            Rationale = $"{rationale} {detail}".Trim(),
            RunIdRef = runId,
            EnforcementTier = FindingEnforcementTier.PolicyViolation,
        };

        finding.Properties[FindingPropertyKeys.TechnologyLedgerRole] = roleKey;
        finding.Properties[FindingPropertyKeys.ProviderFamily] = providerFamily.ToString();

        if (!string.IsNullOrWhiteSpace(entryIds))
            finding.Properties[FindingPropertyKeys.TechnologyLedgerEntryIds] = entryIds;

        return finding;
    }
}
