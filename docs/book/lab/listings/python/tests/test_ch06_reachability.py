"""Chapter 6: storage public exposure and inbound NSG evaluation."""

from __future__ import annotations

import unittest
from unittest import mock

import support  # noqa: F401
import ch06_reachability
from ch05_paths import INSUFFICIENT, find_paths, hop_table, path_confidence
from ch06_reachability import (
    INDETERMINATE,
    NOT_REACHABLE,
    REACHABLE,
    Firewall,
    FirewallRule,
    NsgRule,
    Position,
    PrivateTarget,
    Reach,
    evaluate_inbound,
    firewall_decision,
    port_matches,
    private_reachability,
    reach_edge,
    source_matches,
    storage_public_exposure,
)

TAGS = {"VirtualNetwork": ["10.0.0.0/16"], "AzureLoadBalancer": ["168.63.129.16/32"]}


def account(**props: object) -> dict:
    return {"properties": props}


class StorageExposure(unittest.TestCase):
    def test_unset_public_access_is_internet(self) -> None:
        self.assertEqual(storage_public_exposure({})[0], "internet")

    def test_enabled_with_allow(self) -> None:
        self.assertEqual(storage_public_exposure(account(publicNetworkAccess="Enabled")),
                         ("internet", ["publicNetworkAccess is Enabled", "networkAcls.defaultAction is Allow"]))

    def test_disabled_without_bypass_is_private(self) -> None:
        result = storage_public_exposure(account(publicNetworkAccess="Disabled", networkAcls={"bypass": "None"}))

        self.assertEqual(result, ("private only", ["publicNetworkAccess is Disabled"]))

    def test_disabled_with_bypass_is_restricted(self) -> None:
        result = storage_public_exposure(
            account(publicNetworkAccess="Disabled", networkAcls={"bypass": "AzureServices"})
        )

        self.assertEqual(result[0], "restricted")
        self.assertIn("bypass AzureServices still admits trusted Azure services", result[1])

    def test_secured_by_perimeter_is_unknown(self) -> None:
        result = storage_public_exposure(account(publicNetworkAccess="SecuredByPerimeter"))

        self.assertEqual(result, ("unknown", ["publicNetworkAccess is 'SecuredByPerimeter'; evaluate it explicitly"]))

    def test_deny_lists_every_exception(self) -> None:
        acls = {
            "defaultAction": "Deny",
            "bypass": "AzureServices",
            "ipRules": [{"value": "203.0.113.0/24"}],
            "virtualNetworkRules": [{"id": "subnet-dev"}],
            "resourceAccessRules": [{"resourceId": "workspace-1"}],
        }
        status, reasons = storage_public_exposure(account(publicNetworkAccess="Enabled", networkAcls=acls))

        self.assertEqual(status, "restricted")
        self.assertEqual(reasons, [
            "networkAcls.defaultAction is Deny",
            "IP rule 203.0.113.0/24",
            "subnet rule subnet-dev",
            "resource instance rule workspace-1",
            "bypass AzureServices",
        ])

    def test_deny_without_bypass(self) -> None:
        acls = {"defaultAction": "Deny", "bypass": "None"}

        self.assertEqual(storage_public_exposure(account(networkAcls=acls)),
                         ("restricted", ["networkAcls.defaultAction is Deny"]))


class NsgEvaluation(unittest.TestCase):
    def test_default_rules_deny_internet(self) -> None:
        self.assertEqual(evaluate_inbound([], "203.0.113.7", 443, "Tcp", TAGS), ("Deny", "DenyAllInBound"))

    def test_default_rules_allow_vnet(self) -> None:
        self.assertEqual(evaluate_inbound([], "10.0.1.4", 443, "Tcp", TAGS), ("Allow", "AllowVnetInBound"))

    def test_lowest_priority_number_wins(self) -> None:
        rules = [
            NsgRule("allow-https", 200, "Allow", "Tcp", "Internet", "443"),
            NsgRule("deny-partner", 100, "Deny", "Tcp", "203.0.113.0/24", "*"),
        ]

        self.assertEqual(evaluate_inbound(rules, "203.0.113.7", 443, "Tcp", TAGS), ("Deny", "deny-partner"))
        self.assertEqual(evaluate_inbound(rules, "198.51.100.1", 443, "Tcp", TAGS), ("Allow", "allow-https"))

    def test_protocol_and_port_must_match(self) -> None:
        rules = [NsgRule("allow-dns", 100, "Allow", "Udp", "*", "53")]

        self.assertEqual(evaluate_inbound(rules, "198.51.100.1", 53, "Tcp", TAGS)[1], "DenyAllInBound")
        self.assertEqual(evaluate_inbound(rules, "198.51.100.1", 54, "Udp", TAGS)[1], "DenyAllInBound")

    def test_unsupplied_tag_makes_answer_unknown(self) -> None:
        rules = [NsgRule("allow-frontdoor", 100, "Allow", "Tcp", "AzureFrontDoor.Backend", "443")]

        self.assertEqual(evaluate_inbound(rules, "198.51.100.1", 443, "Tcp", TAGS), ("Unknown", "allow-frontdoor"))

    def test_no_rule_matched_without_azure_defaults(self) -> None:
        # Azure always appends DenyAllInBound; this fallback only shows if the defaults are removed.
        with mock.patch.object(ch06_reachability, "DEFAULT_INBOUND", []):
            self.assertEqual(evaluate_inbound([], "10.0.0.4", 22, "Tcp", TAGS), ("Deny", "(no rule matched)"))

    def test_internet_without_vnet_prefixes_is_unknown(self) -> None:
        rules = [NsgRule("allow-internet", 100, "Allow", "*", "Internet", "*")]

        self.assertEqual(evaluate_inbound(rules, "198.51.100.1", 22, "Tcp", {}), ("Unknown", "allow-internet"))


class Matching(unittest.TestCase):
    def test_single_address_source(self) -> None:
        self.assertTrue(source_matches("10.0.0.5", "10.0.0.5", {}))
        self.assertFalse(source_matches("10.0.0.5", "10.0.0.6", {}))

    def test_supplied_tag(self) -> None:
        self.assertTrue(source_matches("AzureLoadBalancer", "168.63.129.16", TAGS))

    def test_port_forms(self) -> None:
        self.assertTrue(port_matches("*", 1))
        self.assertTrue(port_matches("1000-2000", 1500))
        self.assertTrue(port_matches("80, 443", 443))
        self.assertFalse(port_matches("80,443", 8080))


FIREWALL_IP = "10.0.0.4"      # first usable address in the lab's AzureFirewallSubnet (10.0.0.0/26)
ENDPOINT_IP = "10.1.2.4"      # custdata's blob private endpoint in snet-payments-endpoints
DEV_VM_IP = "10.2.1.4"
BROAD_RULE = FirewallRule("spoke-to-spoke", 100, "Allow", "*", "10.0.0.0/8", "10.0.0.0/8", "*")
LAB_FIREWALL = Firewall(FIREWALL_IP, [BROAD_RULE], has_application_rules=False)
TO_FIREWALL = {"nextHopType": "VirtualAppliance", "nextHopIpAddress": FIREWALL_IP}
ENDPOINT = PrivateTarget(ENDPOINT_IP, nsg_applies=False, nsg_rules=None)


def dev_vm(next_hop: dict | None = TO_FIREWALL, resolves_private: bool | None = True) -> Position:
    """The dev spoke at the IP level: Chapter 7 Step 5 shows its DNS answer separately."""
    return Position(DEV_VM_IP, next_hop, resolves_private)


def reach(source: Position, target: PrivateTarget = ENDPOINT,
          firewalls: dict[str, Firewall] | None = None, tags: dict[str, list[str]] = TAGS) -> Reach:
    chosen = {FIREWALL_IP: LAB_FIREWALL} if firewalls is None else firewalls

    return private_reachability(source, target, 443, "Tcp", chosen, tags)


class PrivateReachability(unittest.TestCase):
    def test_broad_firewall_rule_reaches_from_the_dev_spoke(self) -> None:
        self.assertEqual(reach(dev_vm()), Reach(REACHABLE, "next hop VirtualAppliance; "
                         "firewall network rule spoke-to-spoke; NSG not applied to the private endpoint"))

    def test_third_party_appliance_is_indeterminate(self) -> None:
        nva = {"nextHopType": "VirtualAppliance", "nextHopIpAddress": "10.0.3.10"}
        result = reach(dev_vm(next_hop=nva))

        self.assertEqual(result.result, INDETERMINATE)
        self.assertEqual(result.reason, "next hop 10.0.3.10 is an appliance whose rules weren't collected")

    def test_gateway_next_hop_is_indeterminate(self) -> None:
        result = reach(dev_vm(next_hop={"nextHopType": "VirtualNetworkGateway"}))

        self.assertEqual(result, Reach(INDETERMINATE,
                                       "next hop VirtualNetworkGateway leads somewhere the model doesn't follow"))

    def test_missing_inputs_are_indeterminate(self) -> None:
        cases = {
            "dns": (dev_vm(resolves_private=None), ENDPOINT),
            "routes": (dev_vm(next_hop=None), ENDPOINT),
            "subnet setting": (dev_vm(), PrivateTarget(ENDPOINT_IP, None, None)),
            "nsg rules": (dev_vm(), PrivateTarget(ENDPOINT_IP, True, None)),
        }

        for name, (source, target) in cases.items():
            with self.subTest(name):
                self.assertEqual(reach(source, target).result, INDETERMINATE)

    def test_public_dns_answer_sends_the_reader_to_the_public_endpoint(self) -> None:
        self.assertEqual(reach(dev_vm(resolves_private=False)).result, NOT_REACHABLE)

    def test_next_hop_tool_names_are_accepted(self) -> None:
        peered = Position("10.0.1.4", {"nextHopType": "VirtualNetworkPeering"}, True)

        self.assertEqual(reach(peered).result, REACHABLE)

    def test_dropped_route(self) -> None:
        self.assertEqual(reach(dev_vm(next_hop={"nextHopType": "None"})).result, NOT_REACHABLE)

    def test_payments_spoke_direct_with_nsg_enforced(self) -> None:
        local = Position("10.1.1.4", {"nextHopType": "VnetLocal"}, True)
        enforced = PrivateTarget(ENDPOINT_IP, True, [])
        # In the payments spoke, VirtualNetwork means its own range plus the peered hub.
        payments_tags = {"VirtualNetwork": ["10.1.0.0/16", "10.0.0.0/16"]}

        self.assertEqual(reach(local, enforced, tags=payments_tags),
                         Reach(REACHABLE, "next hop VnetLocal; NSG rule AllowVnetInBound"))

    def test_enforced_nsg_can_deny_or_be_undecidable(self) -> None:
        deny = PrivateTarget(ENDPOINT_IP, True, [NsgRule("deny-dev", 100, "Deny", "*", "10.2.0.0/16", "*")])
        tagged = PrivateTarget(ENDPOINT_IP, True, [NsgRule("fd", 100, "Allow", "*", "AzureFrontDoor.Backend", "*")])

        self.assertEqual(reach(dev_vm(), deny), Reach(NOT_REACHABLE, "NSG rule deny-dev"))
        self.assertEqual(reach(dev_vm(), tagged).result, INDETERMINATE)


class FirewallDecision(unittest.TestCase):
    def decide(self, firewall: Firewall, source: str = DEV_VM_IP) -> Reach:
        return firewall_decision(firewall, source, ENDPOINT_IP, 443, "Tcp", TAGS)

    def test_narrowed_rule_denies_by_default(self) -> None:
        narrowed = FirewallRule("payments-only", 100, "Allow", "Tcp", "10.1.1.0/24", "10.1.2.0/24", "443")

        self.assertEqual(self.decide(Firewall(FIREWALL_IP, [narrowed], False)),
                         Reach(NOT_REACHABLE, "the firewall denies what no rule allows"))
        self.assertEqual(self.decide(Firewall(FIREWALL_IP, [narrowed], False), "10.1.1.4").result, REACHABLE)

    def test_application_rules_make_an_unmatched_flow_indeterminate(self) -> None:
        self.assertEqual(self.decide(Firewall(FIREWALL_IP, [], True)).result, INDETERMINATE)

    def test_deny_rule_and_rule_order(self) -> None:
        rules = [BROAD_RULE, FirewallRule("block-dev", 50, "Deny", "*", "10.2.0.0/16", "*", "*"),
                 FirewallRule("dns-only", 10, "Allow", "Udp", "*", "*", "53")]

        self.assertEqual(self.decide(Firewall(FIREWALL_IP, rules, False)),
                         Reach(NOT_REACHABLE, "firewall network rule block-dev"))

    def test_uncollected_tag_is_indeterminate(self) -> None:
        tagged = FirewallRule("from-frontdoor", 100, "Allow", "*", "AzureFrontDoor.Backend", "*", "*")

        self.assertEqual(self.decide(Firewall(FIREWALL_IP, [tagged], False)).result, INDETERMINATE)

    def test_firewall_verdicts_flow_through(self) -> None:
        self.assertEqual(reach(dev_vm(), firewalls={FIREWALL_IP: Firewall(FIREWALL_IP, [], False)}).result,
                         NOT_REACHABLE)


class ReachEdges(unittest.TestCase):
    def test_reachable_is_a_plain_edge(self) -> None:
        edge = reach_edge("dev-spoke", "custdata-blob", reach(dev_vm()), "network snapshot")

        self.assertIsNone(edge.control)
        self.assertEqual(edge.kind, "canReach")
        self.assertIn("spoke-to-spoke", edge.detail)

    def test_not_reachable_is_no_edge(self) -> None:
        self.assertIsNone(reach_edge("dev-spoke", "custdata-blob", Reach(NOT_REACHABLE, "x"), "c"))

    def test_indeterminate_hop_makes_the_path_insufficient_evidence(self) -> None:
        nva = {"nextHopType": "VirtualAppliance", "nextHopIpAddress": "10.0.3.10"}
        edge = reach_edge("dev-spoke", "custdata-blob", reach(dev_vm(next_hop=nva)), "routes.json row 4")
        path = find_paths([edge], "dev-spoke", "custdata-blob")[0]

        self.assertEqual(path_confidence(path, "High"), INSUFFICIENT)
        self.assertEqual(hop_table(path, "High")[-1], "Assumption to check: dev-spoke may reach custdata-blob "
                         "(routes.json row 4): next hop 10.0.3.10 is an appliance whose rules weren't collected")


if __name__ == "__main__":
    unittest.main()
