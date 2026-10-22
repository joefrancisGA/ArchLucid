using ArchLucid.Contracts.Drafts;
using ArchLucid.Persistence.Drafts;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestSnapshotSerializerTests
{
    [Fact]
    public void RoundTrip_preserves_draft_response_fields()
    {
        DraftRequestResponse original = new()
        {
            DraftId = Guid.Parse("cf9ddef7-3a8b-4e10-aebb-79302e7c691c"),
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Status = DraftRequestStatus.Drafting,
            Document = new DraftRequestDocument { FreeTextIntent = "Migrate billing to Azure", SystemName = "Billing" },
            CreatedUtc = new DateTime(2026, 8, 25, 12, 0, 0, DateTimeKind.Utc),
            UpdatedUtc = new DateTime(2026, 8, 25, 12, 5, 0, DateTimeKind.Utc),
        };

        string json = DraftRequestSnapshotSerializer.Serialize(original);
        DraftRequestResponse restored = DraftRequestSnapshotSerializer.Deserialize(json);

        restored.Should().BeEquivalentTo(original);
    }
}
