using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

internal static class AuditEvidenceSelectionServiceTestsSupport
{
    public static AuditEvidenceSelectorRegistry BuildRegistry() =>
        new(
            new InventoryAuditEvidenceSelector(),
            new IdentityAuditEvidenceSelector(),
            new RbacAuditEvidenceSelector(),
            new NetworkAuditEvidenceSelector(),
            new DataAuditEvidenceSelector(),
            new LoggingAuditEvidenceSelector(),
            new GovernanceAuditEvidenceSelector(),
            new PostureAuditEvidenceSelector(),
            new ResilienceAuditEvidenceSelector(),
            new DefenderAuditEvidenceSelector());
}
