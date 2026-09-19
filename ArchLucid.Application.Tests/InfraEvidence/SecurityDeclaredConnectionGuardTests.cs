using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.InfraEvidence.SecurityDeclaredConnections;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityDeclaredConnectionGuardTests
{
    private static readonly Guid FromCloudResourceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ToCloudResourceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public void TryValidateCreateRequest_rejects_same_from_and_to()
    {
        DateTime utcNow = DateTime.UtcNow;
        string rationale = new('x', FindingDispositionValidation.MinimumRationaleLength);

        bool valid = SecurityDeclaredConnectionGuard.TryValidateCreateRequest(
            new SecurityDeclaredConnectionCreateRequest
            {
                FromCloudResourceId = FromCloudResourceId,
                ToCloudResourceId = FromCloudResourceId,
                RelationshipType = SecurityDeclaredConnectionRelationshipType.ConnectsTo,
                Rationale = rationale,
                ExpirationUtc = utcNow.AddDays(30),
                RequestedByActorKey = "requester",
                ApprovedByActorKey = "approver",
            },
            utcNow,
            out string? error);

        valid.Should().BeFalse();
        error.Should().Contain("differ");
    }

    [Fact]
    public void TryValidateCreateRequest_rejects_same_requester_and_approver()
    {
        DateTime utcNow = DateTime.UtcNow;
        string rationale = new('x', FindingDispositionValidation.MinimumRationaleLength);

        bool valid = SecurityDeclaredConnectionGuard.TryValidateCreateRequest(
            new SecurityDeclaredConnectionCreateRequest
            {
                FromCloudResourceId = FromCloudResourceId,
                ToCloudResourceId = ToCloudResourceId,
                RelationshipType = SecurityDeclaredConnectionRelationshipType.DependsOn,
                Rationale = rationale,
                ExpirationUtc = utcNow.AddDays(30),
                RequestedByActorKey = "same-actor",
                ApprovedByActorKey = "same-actor",
            },
            utcNow,
            out string? error);

        valid.Should().BeFalse();
        error.Should().Contain("Approver cannot be the same actor");
    }
}
