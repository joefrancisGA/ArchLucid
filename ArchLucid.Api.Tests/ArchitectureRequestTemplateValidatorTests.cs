using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Validators;
using ArchLucid.Application.Templates;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ArchitectureRequestTemplateValidatorTests
{
    private static readonly JsonSerializerOptions ControllerJsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        DictionaryKeyPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(null) }
    };

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

    [Theory]
    [MemberData(nameof(TemplateFactories))]
    public async Task Each_catalog_template_passes_ArchitectureRequestValidator(Func<string?, ArchitectureRequest> factory)
    {
        ArchitectureRequest request = factory($"tpl-val-{Guid.NewGuid():N}");
        ArchitectureRequestValidator validator = new();

        ValidationResult result = await validator.ValidateAsync(request);

        result.IsValid.Should().BeTrue(string.Join("; ", result.Errors.Select(e => e.ErrorMessage)));
    }

    [Theory]
    [MemberData(nameof(TemplateFactories))]
    public async Task Each_catalog_template_passes_validator_after_controller_json_round_trip(
        Func<string?, ArchitectureRequest> factory)
    {
        ArchitectureRequest request = factory($"tpl-val-rt-{Guid.NewGuid():N}");
        string json = JsonSerializer.Serialize(request, ControllerJsonOptions);
        ArchitectureRequest? restored = JsonSerializer.Deserialize<ArchitectureRequest>(json, ControllerJsonOptions);
        restored.Should().NotBeNull();

        ArchitectureRequestValidator validator = new();
        ValidationResult result = await validator.ValidateAsync(restored!);

        result.IsValid.Should().BeTrue(string.Join("; ", result.Errors.Select(e => e.ErrorMessage)));
    }

    /// <summary>
    ///     Mirrors <c>tests/load/ci-smoke.js</c> create-run body — must bind and pass FluentValidation under API JSON options.
    /// </summary>
    [Fact]
    public async Task K6_ci_smoke_payload_passes_validator_after_controller_json_deserialize()
    {
        const string json = """
                            {
                              "requestId": "k6-ci-2-0-1718384009123",
                              "description": "k6 CI smoke architecture write-path test",
                              "systemName": "K6CiSmokeSystem",
                              "environment": "prod",
                              "cloudProvider": 1,
                              "constraints": [],
                              "requiredCapabilities": ["SQL"],
                              "assumptions": [],
                              "priorManifestVersion": null
                            }
                            """;

        ArchitectureRequest? restored = JsonSerializer.Deserialize<ArchitectureRequest>(json, ControllerJsonOptions);
        restored.Should().NotBeNull();
        restored!.CloudProvider.Should().Be(CloudProvider.Azure);

        ArchitectureRequestValidator validator = new();
        ValidationResult result = await validator.ValidateAsync(restored);

        result.IsValid.Should().BeTrue(string.Join("; ", result.Errors.Select(e => e.ErrorMessage)));
    }
}
