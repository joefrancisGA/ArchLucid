using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Findings.Payloads;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Finding Payload Converter.
/// </summary>
[Trait("Category", "Unit")]
public sealed class FindingPayloadConverterTests
{
    [Fact]
    public void ToRequirementPayload_FromStronglyTypedObject()
    {
        Finding f = new()
        {
            PayloadType = nameof(RequirementFindingPayload),
            Payload = new RequirementFindingPayload
            {
                RequirementName = "A",
                RequirementText = "B",
                IsMandatory = true
            }
        };

        RequirementFindingPayload? p = FindingPayloadConverter.ToRequirementPayload(f);
        p!.RequirementName.Should().Be("A");
        p.RequirementText.Should().Be("B");
    }
}
