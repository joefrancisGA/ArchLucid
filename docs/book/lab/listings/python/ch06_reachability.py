"""Chapters 6 and 7 listings: storage exposure, NSG evaluation, and private reachability.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch06_reachability.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations

from ch05_paths import Edge, UnmodeledControl


# region storage_public_exposure
def storage_public_exposure(account: dict) -> tuple[str, list[str]]:
    """Classify a storage account's public data-plane exposure from its ARM properties."""
    props = account.get("properties") or {}
    # Older accounts may not have the property set; the effective behavior is "Enabled".
    public = (props.get("publicNetworkAccess") or "Enabled").lower()
    acls = props.get("networkAcls") or {}

    if public == "disabled":
        reasons = ["publicNetworkAccess is Disabled"]

        # Trusted-service exceptions stay in effect even when public access is disabled.
        bypass = acls.get("bypass")
        if bypass and bypass.lower() != "none":
            return "restricted", reasons + [f"bypass {bypass} still admits trusted Azure services"]

        return "private only", reasons

    if public != "enabled":
        setting = props.get("publicNetworkAccess")
        return "unknown", [f"publicNetworkAccess is '{setting}'; evaluate it explicitly"]

    if (acls.get("defaultAction") or "Allow").lower() == "allow":
        return "internet", ["publicNetworkAccess is Enabled", "networkAcls.defaultAction is Allow"]

    reasons = ["networkAcls.defaultAction is Deny"]
    reasons += [f"IP rule {rule.get('value')}" for rule in acls.get("ipRules") or []]
    reasons += [f"subnet rule {rule.get('id')}" for rule in acls.get("virtualNetworkRules") or []]
    reasons += [
        f"resource instance rule {rule.get('resourceId')}"
        for rule in acls.get("resourceAccessRules") or []
    ]

    if acls.get("bypass") and acls["bypass"].lower() != "none":
        reasons.append(f"bypass {acls['bypass']}")

    return "restricted", reasons
# endregion storage_public_exposure


# region nsg_inbound
import ipaddress
from dataclasses import dataclass


@dataclass(frozen=True)
class NsgRule:
    name: str
    priority: int
    access: str       # "Allow" or "Deny"
    protocol: str     # "Tcp", "Udp", "Icmp", or "*"
    source: str       # CIDR, "*", or a service tag such as "VirtualNetwork" or "Internet"
    ports: str        # destination ports: "443", "1000-2000", "80,443", or "*"


DEFAULT_INBOUND = [
    NsgRule("AllowVnetInBound", 65000, "Allow", "*", "VirtualNetwork", "*"),
    NsgRule("AllowAzureLoadBalancerInBound", 65001, "Allow", "*", "AzureLoadBalancer", "*"),
    NsgRule("DenyAllInBound", 65500, "Deny", "*", "*", "*"),
]


def in_any(address: str, prefixes: list[str]) -> bool:
    ip = ipaddress.ip_address(address)
    return any(ip in ipaddress.ip_network(prefix, strict=False) for prefix in prefixes)


def source_matches(rule_source: str, address: str, tags: dict[str, list[str]]) -> bool | None:
    """True or False when decidable; None when a service tag's prefixes weren't supplied."""
    if rule_source == "*":
        return True

    if "/" in rule_source or rule_source.replace(".", "").isdigit():
        return in_any(address, [rule_source])

    if rule_source == "Internet":
        # Internet means addresses outside the virtual network address space.
        if "VirtualNetwork" not in tags:
            return None

        return not in_any(address, tags["VirtualNetwork"])

    if rule_source not in tags:
        return None

    return in_any(address, tags[rule_source])


def port_matches(rule_ports: str, port: int) -> bool:
    if rule_ports == "*":
        return True

    for part in rule_ports.split(","):
        low, _, high = part.strip().partition("-")

        if int(low) <= port <= int(high or low):
            return True

    return False


def evaluate_inbound(
    rules: list[NsgRule], address: str, port: int, protocol: str, tags: dict[str, list[str]]
) -> tuple[str, str]:
    """Return ("Allow" | "Deny" | "Unknown", deciding rule name) for one inbound flow."""
    for rule in sorted(rules + DEFAULT_INBOUND, key=lambda r: r.priority):
        if rule.protocol not in ("*", protocol) or not port_matches(rule.ports, port):
            continue

        match = source_matches(rule.source, address, tags)

        # An undecidable rule above any decision makes the whole answer undecidable.
        if match is None:
            return "Unknown", rule.name

        if match:
            return rule.access, rule.name

    return "Deny", "(no rule matched)"
# endregion nsg_inbound


# region private_reachability
REACHABLE = "reachable"
NOT_REACHABLE = "notReachable"
INDETERMINATE = "indeterminate"

# Next hops that deliver straight to the destination network. Effective routes and
# Network Watcher's next hop tool name the same types differently, so accept both.
DIRECT_NEXT_HOPS = frozenset({
    "VnetLocal", "VNetPeering", "VNetGlobalPeering",
    "VirtualNetwork", "VirtualNetworkPeering",
})


@dataclass(frozen=True)
class Reach:
    result: str   # REACHABLE, NOT_REACHABLE, or INDETERMINATE
    reason: str


@dataclass(frozen=True)
class FirewallRule:
    name: str
    priority: int
    action: str
    protocol: str
    source: str
    destination: str
    ports: str


@dataclass(frozen=True)
class Firewall:
    address: str                       # the private IP that routes send traffic to
    network_rules: list[FirewallRule]
    has_application_rules: bool        # application rules aren't evaluated here


@dataclass(frozen=True)
class Position:
    address: str
    next_hop: dict | None              # effective route for the target; None if not collected
    resolves_private: bool | None      # the source's DNS answer; None if not collected


@dataclass(frozen=True)
class PrivateTarget:
    address: str                       # the private endpoint's IP address
    nsg_applies: bool | None           # subnet's private endpoint network policies
    nsg_rules: list[NsgRule] | None    # None if not collected


def firewall_decision(
    firewall: Firewall, source: str, target: str, port: int, protocol: str,
    tags: dict[str, list[str]],
) -> Reach:
    """Network rules only. A flow no network rule decides may still match an application rule."""
    for rule in sorted(firewall.network_rules, key=lambda r: r.priority):
        if rule.protocol not in ("*", protocol) or not port_matches(rule.ports, port):
            continue

        matches = (source_matches(rule.source, source, tags),
                   source_matches(rule.destination, target, tags))

        if None in matches:
            return Reach(INDETERMINATE, f"firewall rule {rule.name} uses an uncollected tag")

        if all(matches):
            result = REACHABLE if rule.action == "Allow" else NOT_REACHABLE
            return Reach(result, f"firewall network rule {rule.name}")

    if firewall.has_application_rules:
        return Reach(INDETERMINATE, "no network rule matched; application rules not evaluated")

    return Reach(NOT_REACHABLE, "the firewall denies what no rule allows")


def private_reachability(
    source: Position, target: PrivateTarget, port: int, protocol: str,
    firewalls: dict[str, Firewall], tags: dict[str, list[str]],
) -> Reach:
    """Configured reachability of a private endpoint from one position, or why it can't be told."""
    if source.resolves_private is None:
        return Reach(INDETERMINATE, "the source's DNS answer for the service name wasn't collected")

    if not source.resolves_private:
        return Reach(NOT_REACHABLE, "the source resolves the public address; evaluate that instead")

    if source.next_hop is None:
        return Reach(INDETERMINATE, "the source's effective routes weren't collected")

    hop = source.next_hop["nextHopType"]
    reasons = [f"next hop {hop}"]

    if hop == "None":
        return Reach(NOT_REACHABLE, "the effective route drops the traffic")

    if hop == "VirtualAppliance":
        firewall = firewalls.get(source.next_hop["nextHopIpAddress"])

        # A third-party appliance, or a firewall whose policy wasn't collected.
        if firewall is None:
            return Reach(INDETERMINATE, f"next hop {source.next_hop['nextHopIpAddress']} "
                                        "is an appliance whose rules weren't collected")

        decision = firewall_decision(firewall, source.address, target.address, port, protocol, tags)

        if decision.result != REACHABLE:
            return decision

        reasons.append(decision.reason)
    elif hop not in DIRECT_NEXT_HOPS:
        # VirtualNetworkGateway (on-premises or forced tunnel), Internet, and anything newer.
        return Reach(INDETERMINATE, f"next hop {hop} leads somewhere the model doesn't follow")

    if target.nsg_applies is None or (target.nsg_applies and target.nsg_rules is None):
        return Reach(INDETERMINATE, "the endpoint subnet's NSG settings weren't collected")

    if target.nsg_applies:
        access, rule = evaluate_inbound(target.nsg_rules, source.address, port, protocol, tags)

        if access == "Unknown":
            return Reach(INDETERMINATE, f"NSG rule {rule} uses an uncollected tag")

        if access == "Deny":
            return Reach(NOT_REACHABLE, f"NSG rule {rule}")

        reasons.append(f"NSG rule {rule}")
    else:
        reasons.append("NSG not applied to the private endpoint")

    return Reach(REACHABLE, "; ".join(reasons))


def reach_edge(position: str, endpoint: str, reach: Reach, citation: str) -> Edge | None:
    """A canReach edge for search. Indeterminate carries an unmodeled control (Chapter 5)."""
    if reach.result == NOT_REACHABLE:
        return None

    if reach.result == REACHABLE:
        return Edge(position, endpoint, "canReach", "derived", f"{citation}; {reach.reason}")

    control = UnmodeledControl("networkIndeterminate", position, endpoint, "network path",
                               reach.reason, citation)

    return Edge(position, endpoint, "canReach", "derived", citation, control)
# endregion private_reachability
