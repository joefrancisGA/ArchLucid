using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.IntegrationOutbox;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Services;

[Trait("Category", "Unit")]
public sealed class BatchReplayZipPathSanitizerTests
{
    [Theory]
    [InlineData("record-1", "record-1")]
    [InlineData("folder/record", "folder_record")]
    [InlineData("bad:name", "bad_name")]
    public void FolderForComparisonRecordId_sanitizes_invalid_path_characters(string input, string expected)
    {
        BatchReplayZipPathSanitizer.FolderForComparisonRecordId(input).Should().Be(expected);
    }

    [Fact]
    public void FolderForComparisonRecordId_rejects_blank_values()
    {
        Action act = () => BatchReplayZipPathSanitizer.FolderForComparisonRecordId("   ");

        act.Should().Throw<ArgumentException>();
    }
}

[Trait("Category", "Unit")]
public sealed class IdentityClaimRoleMappingResolverTests
{
    [Fact]
    public void ToDocument_trims_entries_and_custom_regex()
    {
        IdentityClaimRoleMappingRequest request = new()
        {
            RoleClaimName = " roles ",
            CustomGroupClaimRegex = " ^group-(?<role>.*)$ ",
            Mappings =
            [
                new IdentityClaimRoleMappingEntryRequest { IdpValue = " admin ", ArchLucidRole = " Admin " },
                new IdentityClaimRoleMappingEntryRequest { IdpValue = " ", ArchLucidRole = "Reader" },
            ],
        };

        IdentityClaimRoleMappingDocument document = IdentityClaimRoleMappingResolver.ToDocument(request);

        document.RoleClaimName.Should().Be("roles");
        document.CustomGroupClaimRegex.Should().Be("^group-(?<role>.*)$");
        document.Mappings.Should().ContainSingle(m => m.IdpValue == "admin" && m.ArchLucidRole == "Admin");
    }

    [Fact]
    public void ResolveRoles_maps_exact_values_and_regex_capture_groups()
    {
        IdentityClaimRoleMappingDocument mapping = new()
        {
            RoleClaimName = "roles",
            CustomGroupClaimRegex = "^group-(Admin|Reader)$",
            Mappings =
            [
                new IdentityClaimRoleMappingEntry { IdpValue = "operators", ArchLucidRole = "Operator" },
            ],
        };

        IReadOnlyList<string> roles = IdentityClaimRoleMappingResolver.ResolveRoles(
            mapping,
            ["operators", "group-Reader", "   ", "group-Admin"]);

        roles.Should().Equal("Admin", "Operator", "Reader");
    }
}

[Trait("Category", "Unit")]
public sealed class IntegrationEventDeadLetterCurlFormatterTests
{
    [Fact]
    public void Format_uses_placeholder_url_when_receiver_is_unset()
    {
        IntegrationEventOutboxEntry entry = new()
        {
            OutboxId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            EventType = "tenant.created",
            PayloadUtf8 = "{\"tenantId\":\"abc\"}"u8.ToArray(),
        };

        string curl = IntegrationEventDeadLetterCurlFormatter.Format(entry, receiverUrl: null);

        curl.Should().Contain("https://YOUR-WEBHOOK-RECEIVER.example/integration-events");
        curl.Should().Contain("tenant.created");
        curl.Should().Contain("{\"tenantId\":\"abc\"}");
    }

    [Fact]
    public void Format_uses_receiver_url_and_escapes_single_quotes()
    {
        IntegrationEventOutboxEntry entry = new()
        {
            OutboxId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            EventType = "finding.updated",
            PayloadUtf8 = "{'id':'1'}"u8.ToArray(),
        };

        string curl = IntegrationEventDeadLetterCurlFormatter.Format(entry, "https://hooks.example.test/replay");

        curl.Should().Contain("https://hooks.example.test/replay");
        curl.Should().Contain("'\\''");
    }
}
