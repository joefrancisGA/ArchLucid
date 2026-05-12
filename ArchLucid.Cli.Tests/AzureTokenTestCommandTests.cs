using System.Globalization;
using System.Text;
using System.Text.Json.Nodes;

using ArchLucid.Cli.Commands;

using Azure.Core;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureTokenTestCommandTests
{
    [Fact]
    public async Task RunCoreAsync_emits_claims_without_raw_token_when_credential_returns_jwt()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut,
            out TextWriter prevErr);
        try
        {
            string secretJwt = JwtBuilder.BuildJwt(
                "{\"oid\":\"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\",\"tid\":\"ffffffff-eeee-dddd-ccbb-aaaaaaaaaaaa\"}");

            SeededJwtCredential credential = new(secretJwt);

            string scope = AzureTokenTestCommand.DefaultManagementScope;

            int code = await AzureTokenTestCommand.RunCoreAsync(credential, scope, CancellationToken.None);

            code.Should().Be(CliExitCode.Success);

            JsonNode doc = JsonNode.Parse(outWriter.ToString()) ?? throw new InvalidOperationException();

            doc["ok"]!.GetValue<bool>().Should().BeTrue();

            JsonNode jwtPayload = doc["jwtPayload"] ?? throw new InvalidOperationException();

            jwtPayload["oid"]!.GetValue<string>().Should().Be("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

            jwtPayload["tid"]!.GetValue<string>().Should().Be("ffffffff-eeee-dddd-ccbb-aaaaaaaaaaaa");

            string printed = outWriter.ToString();

            printed.Should().NotContain(secretJwt);

            errWriter.ToString().Should().BeNullOrWhiteSpace();
        }
        finally
        {
            Console.SetOut(prevOut);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task Program_az_token_test_emits_json_document()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter _, out TextWriter prevOut, out TextWriter prevErr);

        try
        {
            int exit = await Program.RunAsync(["az-token-test"]);

            JsonObject root = JsonNode.Parse(outWriter.ToString().Trim())!.AsObject();

            root.TryGetPropertyValue("ok", out _).Should().BeTrue();

            root.TryGetPropertyValue("scope", out JsonNode? scopeNode).Should().BeTrue();

            scopeNode!.GetValue<string>().Should().Be(AzureTokenTestCommand.DefaultManagementScope);

            root.TryGetPropertyValue("credentialEnvironment", out _).Should().BeTrue();

            (exit == CliExitCode.Success || exit == CliExitCode.OperationFailed).Should().BeTrue();
        }
        finally
        {
            Console.SetOut(prevOut);
            Console.SetError(prevErr);
        }
    }

    private static void RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut,
        out TextWriter prevErr)
    {
        outWriter = new StringWriter();
        errWriter = new StringWriter();
        prevOut = Console.Out;
        prevErr = Console.Error;

        Console.SetOut(outWriter);
        Console.SetError(errWriter);
    }

    private static class JwtBuilder
    {
        internal static string BuildJwt(string payloadJson)
        {
            static string B64Url(string utf8Text) =>
                Convert.ToBase64String(Encoding.UTF8.GetBytes(utf8Text)).TrimEnd('=')
                    .Replace('+', '-')
                    .Replace('/', '_');

            return $"{B64Url(@"{""alg"":""none"",""typ"":""JWT""}")}.{B64Url(payloadJson)}.signature";
        }
    }

    private sealed class SeededJwtCredential : TokenCredential
    {
        private readonly AccessToken _token;

        internal SeededJwtCredential(string jwt)
        {
            _token = new AccessToken(jwt,
                DateTimeOffset.Parse("2030-06-01T00:00:00Z",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal));
        }

        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            return _token;
        }

        public override ValueTask<AccessToken> GetTokenAsync(
            TokenRequestContext requestContext,
            CancellationToken cancellationToken)
        {
            return new ValueTask<AccessToken>(_token);
        }
    }
}
