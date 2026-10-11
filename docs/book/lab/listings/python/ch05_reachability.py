"""Chapter 5 listings: storage exposure and NSG evaluation.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch05_reachability.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations


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
