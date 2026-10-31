using System.Text;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Ask;

internal sealed class InfraEvidenceAskEvidenceCollector(
    ICloudResourceEvidenceHubService hubService,
    IAzureInventoryDriftClassificationService driftClassificationService,
    IDiagramInfrastructureReconciliationService diagramReconciliationService,
    IAzureInventorySnapshotRepository snapshotRepository,
    IAuditEvidenceLineageService auditLineageService) : IInfraEvidenceAskEvidenceCollector
{
    private const int AskEvidenceRowCap = 50;

    public async Task<InfraEvidenceAskEvidenceBundle> CollectAsync(
        ScopeContext scope,
        InfraEvidenceAskRequest request,
        string topicKind,
        CancellationToken cancellationToken)
    {
        InfraEvidenceAskEvidenceBundle bundle = new() { TopicKind = topicKind };

        if (topicKind == InfraEvidenceAskTopicKinds.AuditControlEvidence)
            return await CollectAuditControlEvidenceAsync(scope, request, bundle, cancellationToken);

        if (topicKind == InfraEvidenceAskTopicKinds.DiagramGap)
            return await CollectDiagramGapEvidenceAsync(scope, request, bundle, cancellationToken);

        if (topicKind == InfraEvidenceAskTopicKinds.DiagramView)
            return await CollectDiagramViewEvidenceAsync(scope, request, bundle, cancellationToken);

        if (topicKind == InfraEvidenceAskTopicKinds.Drift && request.DiffId.HasValue)
            return await CollectDriftEvidenceAsync(scope, request.DiffId.Value, bundle, cancellationToken);

        if (topicKind == InfraEvidenceAskTopicKinds.ArchitectureAsOfDate)
            return await CollectArchitectureAsOfDateEvidenceAsync(scope, request, bundle, cancellationToken);

        if (request.CloudResourceId.HasValue && request.CloudResourceId.Value != Guid.Empty)
            return await CollectHubEvidenceAsync(scope, request, topicKind, bundle, cancellationToken);

        if (request.DiffId.HasValue && request.DiffId.Value != Guid.Empty)
            return await CollectDriftEvidenceAsync(scope, request.DiffId.Value, bundle, cancellationToken);

        return bundle;
    }

    private async Task<InfraEvidenceAskEvidenceBundle> CollectHubEvidenceAsync(
        ScopeContext scope,
        InfraEvidenceAskRequest request,
        string topicKind,
        InfraEvidenceAskEvidenceBundle bundle,
        CancellationToken cancellationToken)
    {
        Guid cloudResourceId = request.CloudResourceId!.Value;

        CloudResourceEvidenceHubQuery hubQuery = new()
        {
            RunId = request.RunId,
            SnapshotId = request.SnapshotId,
            AssessmentId = request.AssessmentId,
            AuditEvidenceSnapshotId = request.AuditEvidenceSnapshotId,
            ControlId = request.ControlId,
            Page = 1,
            PageSize = 50,
        };

        CloudResourceEvidenceHubQueryResult hubResult = await hubService.TryGetHubAsync(
            scope,
            cloudResourceId,
            hubQuery,
            cancellationToken);

        if (!hubResult.Succeeded || hubResult.Hub is null)
            return bundle;

        CloudResourceEvidenceHubResponse hub = hubResult.Hub;

        TryAddCitation(
            bundle,
            InfraEvidenceAskCitationKinds.CloudResourceId,
            cloudResourceId.ToString("D"),
            hub.ExternalResourceId,
            $"cloudResourceId={cloudResourceId:D} externalResourceId={hub.ExternalResourceId}");

        if (hub.CurrentConfiguration is not null)
        {
            TryAddCitation(
                bundle,
                InfraEvidenceAskCitationKinds.SnapshotId,
                hub.CurrentConfiguration.SnapshotId.ToString("D"),
                hub.CurrentConfiguration.AzureResourceId,
                $"snapshotId={hub.CurrentConfiguration.SnapshotId:D} resourceType={hub.CurrentConfiguration.ResourceType}");
        }

        int omittedHubChanges = 0;

        foreach (CloudResourceInventoryChangeSummary change in hub.RecentChanges)
        {
            if (request.SinceUtc.HasValue)
            {
                AzureInventorySnapshotRecord? snapshotHeader =
                    await snapshotRepository.TryGetBySnapshotIdAsync(scope, change.SnapshotBId, cancellationToken);

                if (snapshotHeader?.CapturedUtc is null
                    || snapshotHeader.CapturedUtc < request.SinceUtc.Value.UtcDateTime)
                {
                    continue;
                }
            }

            if (!TryAddCitation(
                    bundle,
                    InfraEvidenceAskCitationKinds.ChangeId,
                    change.ChangeId.ToString("D"),
                    ResolveChangeTypeLabel(change.ChangeType),
                    $"changeId={change.ChangeId:D} diffId={change.DiffId:D} type={change.ChangeType} property={change.Property}"))
            {
                omittedHubChanges++;
            }
        }

        AppendOmittedRowLine(bundle, omittedHubChanges, "recent hub change row(s)");

        int omittedOperationalFindings = 0;

        foreach (CloudResourceEvidenceFindingHubItem finding in hub.OperationalSecurityFindings.Items)
        {
            if (!TryAddCitation(
                    bundle,
                    InfraEvidenceAskCitationKinds.FindingId,
                    finding.Id,
                    ResolveFindingTitleLabel(finding.Title),
                    $"operationalFinding id={finding.Id} title={finding.Title} stream={finding.StreamKind}"))
            {
                omittedOperationalFindings++;
            }
        }

        AppendOmittedRowLine(bundle, omittedOperationalFindings, "operational security finding row(s)");

        int omittedArchitectureFindings = 0;

        foreach (CloudResourceEvidenceFindingHubItem finding in hub.ArchitectureReviewFindings.Items)
        {
            if (!TryAddCitation(
                    bundle,
                    InfraEvidenceAskCitationKinds.FindingId,
                    finding.Id,
                    ResolveFindingTitleLabel(finding.Title),
                    $"architectureFinding id={finding.Id} title={finding.Title} stream={finding.StreamKind}"))
            {
                omittedArchitectureFindings++;
            }
        }

        AppendOmittedRowLine(bundle, omittedArchitectureFindings, "architecture review finding row(s)");

        int omittedRemediations = 0;

        foreach (CloudResourceRemediationHubItem remediation in hub.RemediationInstances.Items)
        {
            if (!TryAddCitation(
                    bundle,
                    InfraEvidenceAskCitationKinds.RemediationInstanceId,
                    remediation.InstanceId.ToString("D"),
                    ResolveRemediationPatternLabel(remediation.PatternKey),
                    $"remediation instanceId={remediation.InstanceId:D} patternKey={remediation.PatternKey} status={remediation.Status}"))
            {
                omittedRemediations++;
            }
        }

        AppendOmittedRowLine(bundle, omittedRemediations, "remediation instance row(s)");

        if (hub.DiagramCorrespondence is not null)
            AddDiagramCorrespondence(bundle, hub.DiagramCorrespondence);

        if (topicKind == InfraEvidenceAskTopicKinds.PatternCoverage)
        {
            int omittedPatternKeys = 0;

            foreach (CloudResourceRemediationHubItem remediation in hub.RemediationInstances.Items)
            {
                if (!TryAddCitation(
                        bundle,
                        InfraEvidenceAskCitationKinds.PatternKey,
                        remediation.PatternKey,
                        remediation.Status,
                        $"patternKey={remediation.PatternKey} status={remediation.Status}"))
                {
                    omittedPatternKeys++;
                }
            }

            AppendOmittedRowLine(bundle, omittedPatternKeys, "pattern coverage row(s)");
        }

        return bundle;
    }

    private async Task<InfraEvidenceAskEvidenceBundle> CollectDriftEvidenceAsync(
        ScopeContext scope,
        Guid diffId,
        InfraEvidenceAskEvidenceBundle bundle,
        CancellationToken cancellationToken)
    {
        AzureInventoryDriftReportRecord? report =
            await driftClassificationService.TryGetDriftReportAsync(scope, diffId, cancellationToken);

        if (report is null)
            return bundle;

        TryAddCitation(
            bundle,
            InfraEvidenceAskCitationKinds.DiffId,
            diffId.ToString("D"),
            $"{report.Summary.TotalChanges} changes",
            $"diffId={diffId:D} totalChanges={report.Summary.TotalChanges}");

        int omittedDriftRows = 0;

        foreach (AzureInventoryClassifiedChangeRecord classified in report.Changes)
        {
            if (bundle.Citations.Count >= AskEvidenceRowCap)
            {
                omittedDriftRows++;
                continue;
            }

            AzureInventoryChangeRecord change = classified.Change;

            bundle.AddCitation(
                InfraEvidenceAskCitationKinds.ChangeId,
                change.ChangeId.ToString("D"),
                ResolveChangeTypeLabel(change.ChangeType.ToString()),
                $"changeId={change.ChangeId:D} type={change.ChangeType} classification={classified.Classification}");
        }

        AppendOmittedRowLine(bundle, omittedDriftRows, "drift change row(s)");

        return bundle;
    }

    private async Task<InfraEvidenceAskEvidenceBundle> CollectDiagramGapEvidenceAsync(
        ScopeContext scope,
        InfraEvidenceAskRequest request,
        InfraEvidenceAskEvidenceBundle bundle,
        CancellationToken cancellationToken)
    {
        if (!request.RunId.HasValue || !request.SnapshotId.HasValue)
            return bundle;

        DiagramInfrastructureReconciliationResult? reconciliation =
            await diagramReconciliationService.TryGetReconciliationAsync(
                scope,
                request.RunId.Value,
                request.SnapshotId.Value,
                cancellationToken);

        if (reconciliation is null)
            return bundle;

        IEnumerable<DiagramInfrastructureCorrespondenceRow> rows = reconciliation.Rows;

        if (request.CloudResourceId.HasValue)
        {
            rows = rows.Where(row => row.CloudResourceId == request.CloudResourceId.Value);
        }
        else
        {
            rows = rows.Where(row =>
                string.Equals(row.MatchKind, DiagramInfrastructureMatchKinds.InfrastructureOnly, StringComparison.Ordinal));
        }

        List<DiagramInfrastructureCorrespondenceRow> rowList = rows.ToList();
        int omittedRows = 0;

        foreach (DiagramInfrastructureCorrespondenceRow row in rowList)
        {
            if (bundle.Citations.Count >= AskEvidenceRowCap)
            {
                omittedRows++;
                continue;
            }

            AddDiagramCorrespondence(bundle, row);
        }

        AppendOmittedRowLine(bundle, omittedRows, "diagram correspondence row(s)");

        return bundle;
    }

    private async Task<InfraEvidenceAskEvidenceBundle> CollectDiagramViewEvidenceAsync(
        ScopeContext scope,
        InfraEvidenceAskRequest request,
        InfraEvidenceAskEvidenceBundle bundle,
        CancellationToken cancellationToken)
    {
        if (!request.SnapshotId.HasValue || request.SnapshotId.Value == Guid.Empty)
            return bundle;

        AzureInventorySnapshotRecord? snapshot =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, request.SnapshotId.Value, cancellationToken);

        if (snapshot is null)
            return bundle;

        TryAddCitation(
            bundle,
            InfraEvidenceAskCitationKinds.SnapshotId,
            snapshot.SnapshotId.ToString("D"),
            snapshot.SubscriptionId,
            $"snapshotId={snapshot.SnapshotId:D} capturedUtc={snapshot.CapturedUtc:O} resourceCount={snapshot.ResourceCount}");

        foreach (string mode in DiagramViewPlanValidator.AllowedMermaidModes)
        {
            if (!TryAddCitation(
                    bundle,
                    InfraEvidenceAskCitationKinds.DiagramViewPlan,
                    mode,
                    mode,
                    $"allowedMode={mode}"))
            {
                break;
            }
        }

        if (request.CloudResourceId.HasValue && request.CloudResourceId.Value != Guid.Empty)
        {
            CloudResourceEvidenceHubQuery hubQuery = new()
            {
                RunId = request.RunId,
                SnapshotId = request.SnapshotId,
                AssessmentId = request.AssessmentId,
                AuditEvidenceSnapshotId = request.AuditEvidenceSnapshotId,
                ControlId = request.ControlId,
                Page = 1,
                PageSize = 50,
            };

            CloudResourceEvidenceHubQueryResult hubResult = await hubService.TryGetHubAsync(
                scope,
                request.CloudResourceId.Value,
                hubQuery,
                cancellationToken);

            if (hubResult.Succeeded && hubResult.Hub is not null)
            {
                string externalResourceId = hubResult.Hub.ExternalResourceId;

                if (!string.IsNullOrWhiteSpace(externalResourceId))
                {
                    bundle.EvidenceLines.Add($"outlineSeed={externalResourceId}");
                    TryAddCitation(
                        bundle,
                        InfraEvidenceAskCitationKinds.CloudResourceId,
                        request.CloudResourceId.Value.ToString("D"),
                        externalResourceId,
                        $"cloudResourceId={request.CloudResourceId.Value:D} externalResourceId={externalResourceId}");
                }
            }
        }

        return bundle;
    }

    private async Task<InfraEvidenceAskEvidenceBundle> CollectArchitectureAsOfDateEvidenceAsync(
        ScopeContext scope,
        InfraEvidenceAskRequest request,
        InfraEvidenceAskEvidenceBundle bundle,
        CancellationToken cancellationToken)
    {
        if (!request.SnapshotId.HasValue || request.SnapshotId.Value == Guid.Empty)
            return bundle;

        AzureInventorySnapshotRecord? snapshot =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, request.SnapshotId.Value, cancellationToken);

        if (snapshot is null)
            return bundle;

        if (request.SinceUtc.HasValue
            && snapshot.CapturedUtc.HasValue
            && snapshot.CapturedUtc.Value < request.SinceUtc.Value.UtcDateTime)
        {
            return bundle;
        }

        TryAddCitation(
            bundle,
            InfraEvidenceAskCitationKinds.SnapshotId,
            snapshot.SnapshotId.ToString("D"),
            snapshot.SubscriptionId,
            $"snapshotId={snapshot.SnapshotId:D} capturedUtc={snapshot.CapturedUtc:O} resourceCount={snapshot.ResourceCount}");

        return bundle;
    }

    private async Task<InfraEvidenceAskEvidenceBundle> CollectAuditControlEvidenceAsync(
        ScopeContext scope,
        InfraEvidenceAskRequest request,
        InfraEvidenceAskEvidenceBundle bundle,
        CancellationToken cancellationToken)
    {
        if (!request.AssessmentId.HasValue
            || !request.AuditEvidenceSnapshotId.HasValue
            || !request.ControlId.HasValue)
        {
            return bundle;
        }

        AuditEvidenceLineageQueryResult lineageResult = await auditLineageService.TryGetControlLineageAsync(
            scope,
            request.AssessmentId.Value,
            request.AuditEvidenceSnapshotId.Value,
            request.ControlId.Value,
            cancellationToken);

        if (!lineageResult.Succeeded || lineageResult.Lineage is null)
            return bundle;

        TryAddCitation(
            bundle,
            InfraEvidenceAskCitationKinds.AuditLineageControlId,
            request.ControlId.Value.ToString("D"),
            lineageResult.Lineage.ControlTitle,
            $"controlId={request.ControlId.Value:D} chainComplete={lineageResult.Lineage.ChainComplete}");

        int omittedAuditRows = 0;

        foreach (AuditEvidenceLineageRequirementChain chain in lineageResult.Lineage.RequirementChains)
        {
            foreach (AuditEvidenceLineageEvidenceNode evidence in chain.Evidence)
            {
                if (!evidence.CloudResourceId.HasValue)
                    continue;

                if (!TryAddCitation(
                        bundle,
                        InfraEvidenceAskCitationKinds.CloudResourceId,
                        evidence.CloudResourceId.Value.ToString("D"),
                        chain.RequirementName,
                        $"requirement={chain.RequirementName} cloudResourceId={evidence.CloudResourceId.Value:D}"))
                {
                    omittedAuditRows++;
                }
            }
        }

        AppendOmittedRowLine(bundle, omittedAuditRows, "audit lineage evidence row(s)");

        return bundle;
    }

    private static void AddDiagramCorrespondence(
        InfraEvidenceAskEvidenceBundle bundle,
        DiagramInfrastructureCorrespondenceRow row)
    {
        string correspondenceId = string.IsNullOrWhiteSpace(row.CorrespondenceId)
            ? InfraEvidenceAskCitationHonestyCopy.CorrespondenceIdNotStored
            : row.CorrespondenceId;

        string citationTitle = string.IsNullOrWhiteSpace(row.DiagramNodeLabel)
            ? InfraEvidenceAskCitationHonestyCopy.DiagramNodeLabelNotStored
            : row.DiagramNodeLabel;

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.DiagramCorrespondenceId,
            correspondenceId,
            citationTitle,
            $"correspondenceId={correspondenceId} matchKind={row.MatchKind} azureResourceId={row.AzureResourceId}");
    }

    private static bool TryAddCitation(
        InfraEvidenceAskEvidenceBundle bundle,
        string kind,
        string id,
        string? label,
        string evidenceLine)
    {
        if (bundle.Citations.Count >= AskEvidenceRowCap)
            return false;

        bundle.AddCitation(kind, id, label, evidenceLine);
        return true;
    }

    private static void AppendOmittedRowLine(InfraEvidenceAskEvidenceBundle bundle, int omittedCount, string rowKind)
    {
        if (omittedCount <= 0)
            return;

        bundle.EvidenceLines.Add(
            $"{omittedCount} more {rowKind} were not listed in this ask bundle.");
    }

    private static string ResolveFindingTitleLabel(string? title)
    {
        return string.IsNullOrWhiteSpace(title)
            ? InfraEvidenceAskCitationHonestyCopy.FindingTitleNotStored
            : title.Trim();
    }

    private static string ResolveRemediationPatternLabel(string? patternKey)
    {
        return string.IsNullOrWhiteSpace(patternKey)
            ? InfraEvidenceAskCitationHonestyCopy.RemediationPatternKeyNotStored
            : patternKey.Trim();
    }

    private static string ResolveChangeTypeLabel(string? changeType)
    {
        return string.IsNullOrWhiteSpace(changeType)
            ? InfraEvidenceAskCitationHonestyCopy.ChangeTypeNotStored
            : changeType.Trim();
    }
}
