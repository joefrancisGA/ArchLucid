using System.Net;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>One concrete private endpoint traffic flow. Evidence must be scoped to the same tenant and snapshot.</summary>
public sealed record AzurePrivateFlow(
    Guid TenantId, Guid SnapshotId, string SourceArmId, string EndpointArmId, string TargetArmId,
    string Hostname, string SourceIp, int SourcePort, string DestinationIp, int DestinationPort, string Protocol);

public sealed record AzurePrivateFlowMeasurement(
    AzurePrivateFlow Flow, DateTimeOffset ObservedAt, bool Succeeded);

/// <summary>Resolver configuration for a source network. Rules are effective rules after precedence resolution.
/// The caller must establish the completeness and provenance of the supplied rules.</summary>
public sealed record AzurePrivateDnsForwardingRule(
    string DomainSuffix, bool Enabled, IReadOnlyList<string> ResolverAddresses);

public sealed record AzurePrivateFlowNsgRules(string Direction, bool Complete, IReadOnlyList<AzureInventoryNsgSecurityRule> Rules);

public static class AzurePrivateFlowVerification
{
    public static AzurePrivateConnectivityCheck EvaluateForwarding(
        string hostname, bool customDns, bool complete, IReadOnlyList<AzurePrivateDnsForwardingRule>? rules,
        IReadOnlyList<string>? trustedPrivateResolvers)
    {
        if (!complete || !ValidHost(hostname))
            return AzurePrivateConnectivityCheck.Unknown;
        if (!customDns)
            return AzurePrivateConnectivityCheck.Supported;
        if (rules is null || trustedPrivateResolvers is null || trustedPrivateResolvers.Count == 0)
            return AzurePrivateConnectivityCheck.Unknown;
        string host = hostname.TrimEnd('.');
        var matches = new List<(int Length, AzurePrivateDnsForwardingRule Rule)>();
        foreach (var rule in rules)
        {
            if (!ValidHost(rule.DomainSuffix))
                return AzurePrivateConnectivityCheck.Unknown;
            string suffix = rule.DomainSuffix.TrimEnd('.');
            if (rule.Enabled && (Equal(host, suffix) || host.EndsWith("." + suffix, StringComparison.OrdinalIgnoreCase)))
                matches.Add((suffix.Length, rule));
        }
        if (matches.Count == 0)
            return AzurePrivateConnectivityCheck.Unknown;
        var best = matches.Where(item => item.Length == matches.Max(x => x.Length)).ToArray();
        if (best.Length != 1)
            return AzurePrivateConnectivityCheck.Unknown;
        return AzurePrivateConnectivityEvidence.MatchDnsAddresses(trustedPrivateResolvers, best[0].Rule.ResolverAddresses)
            == AzurePrivateConnectivityCheck.Supported ? AzurePrivateConnectivityCheck.Supported : AzurePrivateConnectivityCheck.Unknown;
    }

    /// <summary>Only use an independently authenticated measurement supplied by a trusted evidence boundary.</summary>
    public static bool MatchesSuccessfulMeasurement(AzurePrivateFlow flow, AzurePrivateFlowMeasurement? measurement,
        DateTimeOffset evaluationTime, TimeSpan maximumAge)
    {
        if (measurement is null || !measurement.Succeeded || maximumAge <= TimeSpan.Zero
            || measurement.ObservedAt > evaluationTime || evaluationTime - measurement.ObservedAt > maximumAge
            || !ValidFlow(flow) || !ValidFlow(measurement.Flow))
            return false;
        var measured = measurement.Flow;
        return flow.TenantId == measured.TenantId && flow.SnapshotId == measured.SnapshotId
            && SameArmId(flow.SourceArmId, measured.SourceArmId)
            && SameArmId(flow.EndpointArmId, measured.EndpointArmId)
            && SameArmId(flow.TargetArmId, measured.TargetArmId)
            && Equal(flow.Hostname.TrimEnd('.'), measured.Hostname.TrimEnd('.'))
            && SameIp(flow.SourceIp, measured.SourceIp) && SameIp(flow.DestinationIp, measured.DestinationIp)
            && flow.SourcePort == measured.SourcePort && flow.DestinationPort == measured.DestinationPort
            && Equal(flow.Protocol, measured.Protocol);
    }

    public static AzurePrivateConnectivityState Evaluate(
        AzurePrivateFlow flow,
        IReadOnlyDictionary<string, string>? endpointProperties,
        IReadOnlyList<string>? endpointIps, IReadOnlyList<string>? dnsAnswers,
        bool customDns, bool forwardingComplete, IReadOnlyList<AzurePrivateDnsForwardingRule>? forwardingRules,
        IReadOnlyList<string>? trustedPrivateResolvers,
        IReadOnlyList<AzureInventoryRouteTableRoute>? effectiveRoutes, bool routesComplete,
        IReadOnlyDictionary<string, AzureInventoryReachabilityResourceProperties> networkResources,
        IReadOnlyList<AzurePrivateFlowNsgRules>? nsgs, bool nsgScopeComplete,
        AzurePrivateFlowMeasurement? authenticatedMeasurement, DateTimeOffset evaluationTime, TimeSpan maximumAge)
    {
        if (!ValidFlow(flow))
            return AzurePrivateConnectivityState.Indeterminate;
        var approval = AzurePrivateConnectivityEvidence.ResolveApproval(flow.TargetArmId, endpointProperties);
        var dns = AzurePrivateConnectivityEvidence.MatchDnsAddresses(endpointIps, dnsAnswers);
        if (dns == AzurePrivateConnectivityCheck.Supported
            && !dnsAnswers!.Any(ip => SameIp(ip, flow.DestinationIp)))
            dns = AzurePrivateConnectivityCheck.Blocked;
        var forwarding = EvaluateForwarding(flow.Hostname, customDns, forwardingComplete, forwardingRules, trustedPrivateResolvers);
        var routing = AzureInventoryReachabilityEdgeControlEvaluator.EvaluatePrivateFlowRoute(
            effectiveRoutes, routesComplete, flow.SourceIp, flow.DestinationIp, flow.DestinationPort, flow.Protocol, networkResources);
        var security = EvaluateNsgs(flow, nsgs, nsgScopeComplete);
        return AzurePrivateConnectivityEvidence.Evaluate(approval, dns, forwarding, routing, security,
            MatchesSuccessfulMeasurement(flow, authenticatedMeasurement, evaluationTime, maximumAge));
    }

    public static AzurePrivateConnectivityCheck EvaluateNsgs(AzurePrivateFlow flow,
        IReadOnlyList<AzurePrivateFlowNsgRules>? nsgs, bool complete)
    {
        if (!ValidFlow(flow) || nsgs is null)
            return AzurePrivateConnectivityCheck.Unknown;
        var decisions = nsgs.Select(nsg => AzurePrivateFlowNsgEvaluator.Evaluate(nsg.Rules, nsg.Complete,
            nsg.Direction, flow.SourceIp, flow.SourcePort, flow.DestinationIp, flow.DestinationPort, flow.Protocol)).ToArray();
        if (decisions.Contains(AzurePrivateConnectivityCheck.Blocked))
            return AzurePrivateConnectivityCheck.Blocked;
        return complete && decisions.All(decision => decision == AzurePrivateConnectivityCheck.Supported)
            ? AzurePrivateConnectivityCheck.Supported : AzurePrivateConnectivityCheck.Unknown;
    }

    private static bool ValidFlow(AzurePrivateFlow flow) =>
        flow.TenantId != Guid.Empty && flow.SnapshotId != Guid.Empty
        && ValidArmId(flow.SourceArmId) && ValidArmId(flow.EndpointArmId) && ValidArmId(flow.TargetArmId)
        && ValidHost(flow.Hostname) && IPAddress.TryParse(flow.SourceIp, out var source)
        && IPAddress.TryParse(flow.DestinationIp, out var destination) && source.AddressFamily == destination.AddressFamily
        && flow.SourcePort is >= 1 and <= 65535 && flow.DestinationPort is >= 1 and <= 65535
        && (Equal(flow.Protocol, "Tcp") || Equal(flow.Protocol, "Udp"));

    private static bool ValidArmId(string value) => !string.IsNullOrWhiteSpace(value)
        && value.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
        && value.Contains("/providers/", StringComparison.OrdinalIgnoreCase)
        && !value.Any(char.IsWhiteSpace) && !value.Contains('?') && !value.Contains('#');

    private static bool ValidHost(string value) => !string.IsNullOrWhiteSpace(value)
        && Uri.CheckHostName(value.TrimEnd('.')) == UriHostNameType.Dns;

    private static bool SameArmId(string left, string right) => Equal(ArmResourceIdNormalizer.Normalize(left), ArmResourceIdNormalizer.Normalize(right));
    private static bool SameIp(string left, string right) => IPAddress.TryParse(left, out var a) && IPAddress.TryParse(right, out var b) && a.Equals(b);
    private static bool Equal(string left, string right) => string.Equals(left, right, StringComparison.OrdinalIgnoreCase);
}
