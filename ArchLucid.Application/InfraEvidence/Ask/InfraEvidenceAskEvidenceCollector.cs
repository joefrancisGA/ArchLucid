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

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.CloudResourceId,
            cloudResourceId.ToString("D"),
            hub.ExternalResourceId,
            $"cloudResourceId={cloudResourceId:D} externalResourceId={hub.ExternalResourceId}");

        if (hub.CurrentConfiguration is not null)
        {
            bundle.AddCitation(
                InfraEvidenceAskCitationKinds.SnapshotId,
                hub.CurrentConfiguration.SnapshotId.ToString("D"),
                hub.CurrentConfiguration.AzureResourceId,
                $"snapshotId={hub.CurrentConfiguration.SnapshotId:D} resourceType={hub.CurrentConfiguration.ResourceType}");
        }

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

            bundle.AddCitation(
                InfraEvidenceAskCitationKinds.ChangeId,
                change.ChangeId.ToString("D"),
                change.ChangeType,
                $"changeId={change.ChangeId:D} diffId={change.DiffId:D} type={change.ChangeType} property={change.Property}");
        }

        foreach (CloudResourceEvidenceFindingHubItem finding in hub.OperationalSecurityFindings.Items)
        {
            bundle.AddCitation(
                InfraEvidenceAskCitationKinds.FindingId,
                finding.Id,
                finding.Title,
                $"operationalFinding id={finding.Id} title={finding.Title} stream={finding.StreamKind}");
        }

        foreach (CloudResourceEvidenceFindingHubItem finding in hub.ArchitectureReviewFindings.Items)
        {
            bundle.AddCitation(
                InfraEvidenceAskCitationKinds.FindingId,
                finding.Id,
                finding.Title,
                $"architectureFinding id={finding.Id} title={finding.Title} stream={finding.StreamKind}");
        }

        foreach (CloudResourceRemediationHubItem remediation in hub.RemediationInstances.Items)
        {
            bundle.AddCitation(
                InfraEvidenceAskCitationKinds.RemediationInstanceId,
                remediation.InstanceId.ToString("D"),
                remediation.PatternKey,
                $"remediation instanceId={remediation.InstanceId:D} patternKey={remediation.PatternKey} status={remediation.Status}");
        }

        if (hub.DiagramCorrespondence is not null)
            AddDiagramCorrespondence(bundle, hub.DiagramCorrespondence);

        if (topicKind == InfraEvidenceAskTopicKinds.PatternCoverage)
        {
            foreach (CloudResourceRemediationHubItem remediation in hub.RemediationInstances.Items)
            {
                bundle.AddCitation(
                    InfraEvidenceAskCitationKinds.PatternKey,
                    remediation.PatternKey,
                    remediation.Status,
                    $"patternKey={remediation.PatternKey} status={remediation.Status}");
            }
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

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.DiffId,
            diffId.ToString("D"),
            $"{report.Summary.TotalChanges} changes",
            $"diffId={diffId:D} totalChanges={report.Summary.TotalChanges}");

        foreach (AzureInventoryClassifiedChangeRecord classified in report.Changes.Take(50))
        {
            AzureInventoryChangeRecord change = classified.Change;

            bundle.AddCitation(
                InfraEvidenceAskCitationKinds.ChangeId,
                change.ChangeId.ToString("D"),
                change.ChangeType.ToString(),
                $"changeId={change.ChangeId:D} type={change.ChangeType} classification={classified.Classification}");
        }

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

        foreach (DiagramInfrastructureCorrespondenceRow row in rows.Take(50))
        {
            AddDiagramCorrespondence(bundle, row);
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

        bundle.AddCitation(
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

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.AuditLineageControlId,
            request.ControlId.Value.ToString("D"),
            lineageResult.Lineage.ControlTitle,
            $"controlId={request.ControlId.Value:D} chainComplete={lineageResult.Lineage.ChainComplete}");

        foreach (AuditEvidenceLineageRequirementChain chain in lineageResult.Lineage.RequirementChains.Take(25))
        {
            foreach (AuditEvidenceLineageEvidenceNode evidence in chain.Evidence.Take(10))
            {
                if (!evidence.CloudResourceId.HasValue)
                    continue;

                bundle.AddCitation(
                    InfraEvidenceAskCitationKinds.CloudResourceId,
                    evidence.CloudResourceId.Value.ToString("D"),
                    chain.RequirementName,
                    $"requirement={chain.RequirementName} cloudResourceId={evidence.CloudResourceId.Value:D}");
            }
        }

        return bundle;
    }

    private static void AddDiagramCorrespondence(
        InfraEvidenceAskEvidenceBundle bundle,
        DiagramInfrastructureCorrespondenceRow row)
    {
        string correspondenceId = string.IsNullOrWhiteSpace(row.CorrespondenceId)
            ? Guid.NewGuid().ToString("D")
            : row.CorrespondenceId;

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.DiagramCorrespondenceId,
            correspondenceId,
            row.DiagramNodeLabel ?? row.AzureResourceId,
            $"correspondenceId={correspondenceId} matchKind={row.MatchKind} azureResourceId={row.AzureResourceId}");
    }
}
