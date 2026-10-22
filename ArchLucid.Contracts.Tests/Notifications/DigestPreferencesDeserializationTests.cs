using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Notifications;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Notifications;

[Trait("Category", "Unit")]
public sealed class DigestPreferencesDeserializationTests
{
    [Fact]
    public void Deserialize_null_sponsor_recipient_emails_yields_empty_list_not_null()
    {
        const string json = """
            {
              "schemaVersion": 1,
              "tenantId": "00000000-0000-0000-0000-000000000001",
              "isConfigured": false,
              "emailEnabled": false,
              "recipientEmails": null
            }
            """;

        SponsorDigestPreferencesResponse response =
            JsonSerializer.Deserialize<SponsorDigestPreferencesResponse>(json, ContractJson.CamelCaseCompact)!;

        response.RecipientEmails.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_exec_recipient_emails_yields_empty_list_not_null()
    {
        const string json = """
            {
              "schemaVersion": 1,
              "tenantId": "00000000-0000-0000-0000-000000000001",
              "isConfigured": false,
              "emailEnabled": false,
              "recipientEmails": null
            }
            """;

        ExecDigestPreferencesResponse response =
            JsonSerializer.Deserialize<ExecDigestPreferencesResponse>(json, ContractJson.CamelCaseCompact)!;

        response.RecipientEmails.Should().NotBeNull().And.BeEmpty();
    }
}
