using System.Security.Cryptography;

using ArchLucid.Application.Scim.Tokens;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Scim;

[Trait("Suite", "Core")]
public sealed class ScimArgonSecretHasherTests
{
    [SkippableFact]
    public void Hash_then_verify_round_trips()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        byte[] secret = RandomNumberGenerator.GetBytes(32);
        byte[] hash = ScimArgonSecretHasher.HashSecret(secret, tenantId);

        ScimArgonSecretHasher.VerifySecret(secret, tenantId, hash).Should().BeTrue();
        CryptographicOperations.ZeroMemory(secret);
    }

    [SkippableFact]
    public void VerifySecret_wrong_secret_returns_false()
    {
        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        byte[] secret = RandomNumberGenerator.GetBytes(32);
        byte[] wrong = RandomNumberGenerator.GetBytes(32);
        byte[] hash = ScimArgonSecretHasher.HashSecret(secret, tenantId);

        ScimArgonSecretHasher.VerifySecret(wrong, tenantId, hash).Should().BeFalse();

        CryptographicOperations.ZeroMemory(secret);
        CryptographicOperations.ZeroMemory(wrong);
    }

    [SkippableFact]
    public void VerifySecret_wrong_tenant_salt_returns_false()
    {
        Guid t1 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid t2 = Guid.Parse("44444444-4444-4444-4444-444444444444");
        byte[] secret = RandomNumberGenerator.GetBytes(32);
        byte[] hash = ScimArgonSecretHasher.HashSecret(secret, t1);

        ScimArgonSecretHasher.VerifySecret(secret, t2, hash).Should().BeFalse();
        CryptographicOperations.ZeroMemory(secret);
    }
}
