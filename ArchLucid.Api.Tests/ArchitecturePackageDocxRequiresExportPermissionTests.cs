using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Verifies <see cref="ArchLucid.Core.Authorization.ArchLucidPolicies.CanExportConsultingDocx" /> on architecture
///     package DOCX (Reader satisfies read policy only).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ArchitecturePackageDocxRequiresExportPermissionTests(ReaderRoleArchLucidApiFactory factory)
    : IClassFixture<ReaderRoleArchLucidApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [SkippableFact]
    public async Task ExportRunDocx_returns_403_when_export_consulting_docx_claim_missing()
    {
        HttpResponseMessage response = await _client.GetAsync(
            $"/v1/docx/reviews/{Guid.Empty:D}/architecture-package");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
