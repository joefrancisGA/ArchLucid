using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecureNowQuestionDispositionResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_audit_entries_yields_empty_list_not_null()
    {
        Guid dispositionId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid snapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string json = $$"""
            {
              "dispositionId": "{{dispositionId}}",
              "snapshotId": "{{snapshotId}}",
              "subscriptionId": "sub",
              "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa",
              "questionKey": "q1",
              "source": "securenow",
              "scopeKind": "resource",
              "status": "answered",
              "reason": "ok",
              "expirationUtc": "2026-12-01T00:00:00Z",
              "isExpired": false,
              "evidenceFingerprint": "fp",
              "actorKey": "actor",
              "updatedUtc": "2026-10-01T00:00:00Z",
              "auditEntries": null
            }
            """;

        SecureNowQuestionDispositionResponse? response =
            JsonSerializer.Deserialize<SecureNowQuestionDispositionResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.AuditEntries.Should().NotBeNull();
        response.AuditEntries.Should().BeEmpty();
    }
}
