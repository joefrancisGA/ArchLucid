using ArchLucid.Core.Runs.Finalization;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Finalization;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ManifestFinalizationFaultMapperTests
{
    [Fact]
    public void ToApplicationException_50001_maps_to_RunNotFoundException()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = ManifestFinalizationFaultMapper.ToApplicationException(
            new ManifestFinalizationFaultException(
                ManifestFinalizationFaultKind.RunNotFoundOrScope,
                runId,
                "missing"));

        mapped.Should().BeOfType<RunNotFoundException>();
    }

    [Fact]
    public void ToApplicationException_50002_maps_to_ConflictException()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = ManifestFinalizationFaultMapper.ToApplicationException(
            new ManifestFinalizationFaultException(
                ManifestFinalizationFaultKind.CommittedDifferentManifest,
                runId,
                "conflict"));

        mapped.Should().BeOfType<ConflictException>();
    }

    [Fact]
    public void ToApplicationException_50004_maps_to_InvalidOperationException()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = ManifestFinalizationFaultMapper.ToApplicationException(
            new ManifestFinalizationFaultException(
                ManifestFinalizationFaultKind.FindingsMismatch,
                runId,
                "findings mismatch"));

        mapped.Should().BeOfType<InvalidOperationException>();
    }
}
