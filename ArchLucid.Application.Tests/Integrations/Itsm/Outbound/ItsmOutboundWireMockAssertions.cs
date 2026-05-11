using System.Text;
using System.Text.Json.Nodes;

using FluentAssertions;

using WireMock;
using WireMock.Server;
using WireMock.Types;
using WireMock.Util;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

/// <summary>Helpers for asserting WireMock-captured outbound ITSM HTTP exchanges.</summary>
internal static class ItsmOutboundWireMockAssertions
{
    internal static IRequestMessage RequireSingleOutbound(WireMockServer server, Func<IRequestMessage, bool> predicate)
    {
        ArgumentNullException.ThrowIfNull(predicate);

        IRequestMessage[] matches =
            server.LogEntries.Select(static entry => entry.RequestMessage).Where(predicate).ToArray();

        matches.Should().ContainSingle();

        return matches.Single();
    }

    internal static void AssertJsonEquivalent(string expectedJson, string? actualJson, string reason)
    {
        actualJson.Should().NotBeNullOrWhiteSpace(reason);

        JsonNode? expectedNode = JsonNode.Parse(expectedJson);
        JsonNode? actualNode = JsonNode.Parse(actualJson!);

        JsonNode.DeepEquals(expectedNode, actualNode).Should().BeTrue("{0}{1}expected:{2}{1}actual:{3}", reason,
            Environment.NewLine, expectedJson, actualJson);
    }

    internal static void AssertContentTypeLooksLikeJson(string? contentType)
    {
        contentType.Should().NotBeNull();

        contentType!.Contains("application/json", StringComparison.OrdinalIgnoreCase)
            .Should()
            .BeTrue("Content-Type header should advertise JSON; actual: {0}", contentType);
    }

    internal static void AssertBasicAuthMatches(IRequestMessage request, string username, string password)
    {
        request.Headers.Should().NotBeNull();

        string? authorization = TryReadFirstHeaderValue(request.Headers, "Authorization");
        authorization.Should().NotBeNull();

        authorization = authorization!.Trim();
        string[] segments = authorization.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);

        segments.Length.Should().Be(2);
        segments[0].Should().BeEquivalentTo("basic");

        string encoded = segments[1].Trim();
        string decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));

        decoded.Should().Be($"{username}:{password}");
    }

    internal static string? TryReadFirstHeaderValue(IDictionary<string, WireMockList<string>>? headers, string name)
    {
        if (headers is null)
            return null;

        foreach (KeyValuePair<string, WireMockList<string>> pair in headers)
        {
            if (!string.Equals(pair.Key, name, StringComparison.OrdinalIgnoreCase))
                continue;

            WireMockList<string> list = pair.Value;

            foreach (string value in list)
                return value;
        }

        return null;
    }
}
