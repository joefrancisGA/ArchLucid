"""Chapter 5: storage public exposure and inbound NSG evaluation."""

from __future__ import annotations

import unittest
from unittest import mock

import support  # noqa: F401
import ch05_reachability
from ch05_reachability import NsgRule, evaluate_inbound, port_matches, source_matches, storage_public_exposure

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
        with mock.patch.object(ch05_reachability, "DEFAULT_INBOUND", []):
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


if __name__ == "__main__":
    unittest.main()
