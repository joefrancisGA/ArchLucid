using System.Net;
using System.Text;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Verifies <see cref="ArchLucid.Core.Authorization.ArchLucidPolicies.CanExportConsultingDocx" /> on analysis
///     consulting DOCX routes.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ConsultingDocxRequiresExportPermissionTests(OperatorWithoutConsultingDocxPermissionApiFactory factory)
    : IClassFixture<OperatorWithoutConsultingDocxPermissionApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [SkippableFact]
    public async Task DownloadConsultingDocx_returns_403_when_export_consulting_docx_claim_missing()
    {
        using StringContent body = new("{}", Encoding.UTF8, "application/json");
        HttpResponseMessage response = await _client.PostAsync(
            $"/v1/architecture/review/{Guid.NewGuid():D}/analysis-report/export/docx/consulting",
            body);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task DownloadConsultingDocxAsync_returns_403_when_export_consulting_docx_claim_missing()
    {
        using StringContent body = new("{}", Encoding.UTF8, "application/json");
        HttpResponseMessage response = await _client.PostAsync(
            $"/v1/architecture/review/{Guid.NewGuid():D}/analysis-report/export/docx/consulting/async",
            body);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
