using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

/// <summary>
///     Maps ingest requests onto the <see cref="ArchitectureRequest" /> slice used for create-time pins.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ContextIngestionCreateTimePinRequestFactoryTests
{
    [Fact]
    public void FromIngest_uses_architecture_request_id_when_present()
    {
        ContextIngestionRequest ingest = new()
        {
            ArchitectureRequestId = "  ingest-req  ",
            ProjectId = "billing",
            Description = "Pin mapping",
            PolicyReferences = ["focused-pilot"],
        };

        ArchitectureRequest mapped = ContextIngestionCreateTimePinRequestFactory.FromIngest(ingest, Guid.NewGuid());

        mapped.RequestId.Should().Be("ingest-req");
        mapped.SystemName.Should().Be("billing");
        mapped.Description.Should().Be("Pin mapping");
        mapped.PolicyReferences.Should().Equal("focused-pilot");
    }

    [Fact]
    public void FromIngest_falls_back_to_run_id_when_architecture_request_id_missing()
    {
        Guid runId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        ContextIngestionRequest ingest = new()
        {
            ProjectId = "sys",
        };

        ArchitectureRequest mapped = ContextIngestionCreateTimePinRequestFactory.FromIngest(ingest, runId);

        mapped.RequestId.Should().Be(runId.ToString("N"));
        mapped.SystemName.Should().Be("sys");
        mapped.Description.Should().BeEmpty();
        mapped.PolicyReferences.Should().BeEmpty();
    }

    [Fact]
    public void FromIngest_throws_when_ingest_is_null()
    {
        Action act = () => ContextIngestionCreateTimePinRequestFactory.FromIngest(null!, Guid.NewGuid());

        act.Should().Throw<ArgumentNullException>().WithParameterName("ingest");
    }
}
