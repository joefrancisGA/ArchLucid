using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.InfraEvidence.OperationalSecurityFindings;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuditEvaluationFindingHandoffServiceTests
{
    [Fact]
    public async Task TryHandoffAsync_does_not_invent_medium_severity_when_audit_evaluation_omits_it_P10()
    {
        var scope = new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
        var ingest = new CapturingIngestService();
        var service = new AuditEvaluationFindingHandoffService(
            new FixedScopeContextProvider(scope),
            ingest,
            NullLogger<AuditEvaluationFindingHandoffService>.Instance);

        bool handedOff = await service.TryHandoffAsync(
            new AuditEvaluationFindingHandoffRequest
            {
                TenantId = scope.TenantId,
                AssessmentId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                ControlId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                InventoryDiffId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                AuditEvidenceSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Summary = "Control drift requires attention.",
            });

        handedOff.Should().BeTrue();
        ingest.LastItem?.Severity.Should().BeEmpty();
    }

    private sealed class FixedScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }

    private sealed class CapturingIngestService : IOperationalSecurityFindingIngestService
    {
        public OperationalSecurityFindingIngestItem? LastItem { get; private set; }

        public Task<OperationalSecurityFindingBatchIngestResult> IngestBatchAsync(
            ScopeContext scope,
            IReadOnlyList<OperationalSecurityFindingIngestItem> items,
            string sourceSystem,
            CancellationToken cancellationToken = default)
        {
            LastItem = items.FirstOrDefault();

            return Task.FromResult(
                new OperationalSecurityFindingBatchIngestResult
                {
                    Items =
                    [
                        new OperationalSecurityFindingIngestItemResult { Succeeded = true },
                    ],
                });
        }

        public Task<OperationalSecurityFindingDetailResult> TryGetDetailAsync(
            ScopeContext scope,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
