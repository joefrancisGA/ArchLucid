using System.Net;
using System.Net.Http.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Contracts.Trust;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Admin publication of <see cref="ArchLucid.Core.Audit.AuditEventTypes.SecurityAssessmentPublished" /> (trust UI +
///     SIEM signal).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class SecurityTrustPublicationControllerIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Post_publications_returns_204_and_audit_search_finds_event()
    {
        SecurityAssessmentPublicationRequest body = new()
        {
            AssessmentCode = "2026-Q2",
            SummaryReference = "docs/security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md",
            AssessorDisplayName = "ArchLucid internal",
            PublishedOn = "2026-07-29"
        };

        HttpResponseMessage post =
            await Client.PostAsJsonAsync("/v1/admin/security-trust/publications", body, JsonOptions);

        post.StatusCode.Should().Be(HttpStatusCode.NoContent);

        HttpResponseMessage search = await Client.GetAsync(
            "/v1/audit/search?eventType=SecurityAssessmentPublished&take=5&includeDataJson=true");

        search.StatusCode.Should().Be(HttpStatusCode.OK);

        CursorPagedResponse<AuditEvent> page =
            await search.ReadJsonForTestAsync<CursorPagedResponse<AuditEvent>>(JsonOptions);

        page.Items.Should().NotBeEmpty();

        AuditEvent first = page.Items[0];
        first.EventType.Should().Be("SecurityAssessmentPublished");
        first.DataJson.Should().Contain("2026-Q2");
        first.DataJson.Should().Contain("2026-07-29");
    }

    [SkippableFact]
    public async Task Post_publications_returns_400_when_published_on_is_not_a_date()
    {
        SecurityAssessmentPublicationRequest body = new()
        {
            AssessmentCode = "2026-Q2",
            SummaryReference = "docs/security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md",
            PublishedOn = "not-a-date"
        };

        HttpResponseMessage post =
            await Client.PostAsJsonAsync("/v1/admin/security-trust/publications", body, JsonOptions);

        post.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
