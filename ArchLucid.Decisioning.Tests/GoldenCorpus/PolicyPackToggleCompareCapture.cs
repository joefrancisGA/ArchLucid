using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.Governance;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Runs the fixed declaration graph under pack-toggle postures for the quality artifact.</summary>
internal static class PolicyPackToggleCompareCapture
{
    private const string Soc2TransportRuleId = "soc2-004";
    private const string CisAzurePublicAccessRuleId = "cis-az-006";
    private const string Soc2BundledContentFile = "soc2-tsc-architecture.json";
    private const string CisAzureBundledContentFile = "cis-azure-foundations.json";

    internal static async Task<PolicyPackToggleCompareSnapshot> CaptureAsync(CancellationToken cancellationToken)
    {
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<PolicyPackToggleCompareFindingRow> filteredRows =
            await CaptureFilteredRuleKeyRowsAsync(graph, cancellationToken);

        IReadOnlyList<PolicyPackToggleCompareFindingRow> bundledRows =
            await CaptureBundledP1RowsAsync(graph, cancellationToken);

        return new PolicyPackToggleCompareSnapshot
        {
            FilteredRuleKeyRows = filteredRows,
            BundledP1Rows = bundledRows,
        };
    }

    private static async Task<IReadOnlyList<PolicyPackToggleCompareFindingRow>> CaptureFilteredRuleKeyRowsAsync(
        GraphSnapshot graph,
        CancellationToken cancellationToken)
    {
        ComplianceRulePack soc2TransportPack = CreateFilteredPack(Soc2TransportRuleId);
        ComplianceRulePack cisPublicAccessPack = CreateFilteredPack(CisAzurePublicAccessRuleId);

        IReadOnlyList<Finding> transportFindings =
            await RunDeclarationSecurityEngineAsync(soc2TransportPack, graph, cancellationToken);
        IReadOnlyList<Finding> publicAccessFindings =
            await RunDeclarationSecurityEngineAsync(cisPublicAccessPack, graph, cancellationToken);

        return
        [
            ToRow(
                posture: "SOC 2 transport",
                packOrRuleKey: Soc2TransportRuleId,
                priorityFloor: null,
                finding: transportFindings.Single()),
            ToRow(
                posture: "CIS Azure public access",
                packOrRuleKey: CisAzurePublicAccessRuleId,
                priorityFloor: null,
                finding: publicAccessFindings.Single()),
        ];
    }

    private static async Task<IReadOnlyList<PolicyPackToggleCompareFindingRow>> CaptureBundledP1RowsAsync(
        GraphSnapshot graph,
        CancellationToken cancellationToken)
    {
        PolicyPackContentDocument soc2Content = BundledPolicyPackTestCatalog.WithPriorityFloor(
            BundledPolicyPackTestCatalog.ReadContent(Soc2BundledContentFile),
            PolicyPackRulePriority.P1);
        PolicyPackContentDocument cisContent = BundledPolicyPackTestCatalog.WithPriorityFloor(
            BundledPolicyPackTestCatalog.ReadContent(CisAzureBundledContentFile),
            PolicyPackRulePriority.P1);

        ComplianceRulePack soc2Pack =
            await BundledPolicyPackTestCatalog.LoadFilteredFilePackAsync(soc2Content, cancellationToken);
        ComplianceRulePack cisPack =
            await BundledPolicyPackTestCatalog.LoadFilteredFilePackAsync(cisContent, cancellationToken);

        IReadOnlyList<Finding> soc2Findings =
            await RunDeclarationSecurityEngineAsync(soc2Pack, graph, cancellationToken);
        IReadOnlyList<Finding> cisFindings =
            await RunDeclarationSecurityEngineAsync(cisPack, graph, cancellationToken);

        List<PolicyPackToggleCompareFindingRow> rows = [];

        rows.AddRange(
            ToSortedRows(
                posture: "SOC 2 TSC architecture",
                packContentFile: Soc2BundledContentFile,
                priorityFloor: PolicyPackRulePriority.P1,
                findings: soc2Findings));

        rows.AddRange(
            ToSortedRows(
                posture: "CIS Azure foundations",
                packContentFile: CisAzureBundledContentFile,
                priorityFloor: PolicyPackRulePriority.P1,
                findings: cisFindings));

        return rows;
    }

    private static IEnumerable<PolicyPackToggleCompareFindingRow> ToSortedRows(
        string posture,
        string packContentFile,
        string priorityFloor,
        IReadOnlyList<Finding> findings)
    {
        return findings
            .OrderBy(static finding => finding.PolicyRuleId, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static finding => finding.Title, StringComparer.OrdinalIgnoreCase)
            .Select(finding => ToRow(posture, packContentFile, priorityFloor, finding));
    }

    private static PolicyPackToggleCompareFindingRow ToRow(
        string posture,
        string packOrRuleKey,
        string? priorityFloor,
        Finding finding)
    {
        return new PolicyPackToggleCompareFindingRow
        {
            Posture = posture,
            PackOrRuleKey = packOrRuleKey,
            PriorityFloor = priorityFloor,
            FindingTitle = finding.Title,
            PolicyRuleId = finding.PolicyRuleId ?? string.Empty,
        };
    }

    private static async Task<IReadOnlyList<Finding>> RunDeclarationSecurityEngineAsync(
        ComplianceRulePack filteredPack,
        GraphSnapshot graph,
        CancellationToken cancellationToken)
    {
        FixedComplianceRulePackProvider provider = new(filteredPack);
        DeclarationSecurityBaselineFindingEngine engine = new(provider);

        return await engine.AnalyzeAsync(graph, null, cancellationToken);
    }

    private static ComplianceRulePack CreateFilteredPack(params string[] ruleIds) =>
        new()
        {
            RulePackId = "declaration-policy-test",
            Name = "Declaration policy test",
            Version = "1",
            Rules = ruleIds
                .Select(
                    static ruleId => new ComplianceRule
                    {
                        RuleId = ruleId,
                        ControlId = "c",
                        ControlName = "n",
                        AppliesToCategory = "cat",
                        RequiredNodeType = "t",
                        RequiredEdgeType = "e",
                        Description = "d",
                    })
                .ToList(),
        };
}
