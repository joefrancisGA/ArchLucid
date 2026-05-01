using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunIdempotencyHashingTests
{
    [SkippableFact]
    public void HashIdempotencyKey_same_string_produces_same_digest()
    {
        byte[] a = ArchitectureRunIdempotencyHashing.HashIdempotencyKey("my-key");
        byte[] b = ArchitectureRunIdempotencyHashing.HashIdempotencyKey("my-key");

        a.Should().Equal(b);
    }

    [SkippableFact]
    public void HashIdempotencyKey_when_null_or_whitespace_throws()
    {
        Action actNull = () => ArchitectureRunIdempotencyHashing.HashIdempotencyKey(null!);
        Action actEmpty = () => ArchitectureRunIdempotencyHashing.HashIdempotencyKey("   ");

        actNull.Should().Throw<ArgumentException>();
        actEmpty.Should().Throw<ArgumentException>();
    }

    [SkippableFact]
    public void FingerprintRequest_same_logical_request_produces_same_fingerprint()
    {
        ArchitectureRequest a = NewRequest();
        ArchitectureRequest b = NewRequest();

        byte[] fa = ArchitectureRunIdempotencyHashing.FingerprintRequest(a);
        byte[] fb = ArchitectureRunIdempotencyHashing.FingerprintRequest(b);

        fa.Should().Equal(fb);
    }

    [SkippableFact]
    public void FingerprintRequest_different_description_produces_different_fingerprint()
    {
        ArchitectureRequest a = NewRequest();
        ArchitectureRequest b = NewRequest();
        b.Description = "1234567890other";

        byte[] fa = ArchitectureRunIdempotencyHashing.FingerprintRequest(a);
        byte[] fb = ArchitectureRunIdempotencyHashing.FingerprintRequest(b);

        fa.Should().NotBeEquivalentTo(fb);
    }

    private static ArchitectureRequest NewRequest()
    {
        return new ArchitectureRequest
        {
            RequestId = "fixed-req",
            Description = "1234567890desc",
            SystemName = "Sys",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };
    }
}
