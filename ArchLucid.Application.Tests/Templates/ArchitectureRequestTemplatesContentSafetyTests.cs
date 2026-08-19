using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Templates;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Templates;

/// <summary>
///     Catalog template bodies must pass the same create-run content precheck as operator-authored requests.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ArchitectureRequestTemplatesContentSafetyTests
{
    public static TheoryData<Func<string?, ArchitectureRequest>> TemplateFactories =>
    [
        ArchitectureRequestTemplates.MicroservicesWebPlatform,
        ArchitectureRequestTemplates.MonolithMigrationAssessment,
        ArchitectureRequestTemplates.EventDrivenProcessingPipeline,
        ArchitectureRequestTemplates.CloudNativeMigration,
        ArchitectureRequestTemplates.RegulatedHealthcareSystem,
        ArchitectureRequestTemplates.RetailBankingAndPaymentsPlatform,
        ArchitectureRequestTemplates.SmartManufacturingOtItReference
    ];

    private readonly DefaultRequestContentSafetyPrecheck _precheck = new();

    [Theory]
    [MemberData(nameof(TemplateFactories))]
    public async Task Each_catalog_template_passes_request_content_safety_precheck(
        Func<string?, ArchitectureRequest> factory)
    {
        ArchitectureRequest request = factory($"tpl-safety-{Guid.NewGuid():N}");

        RequestContentSafetyResult result = await _precheck.EvaluateAsync(request, CancellationToken.None);

        result.IsAllowed.Should().BeTrue(string.Join("; ", result.Reasons));
    }
}
