> **Scope:** Chapter 6 revised draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft — revised (revision pass 1, 2026-10-10; split 2026-10-12)

# Chapter 6 — Network exposure

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: revised (revision pass 1, 2026-10-10; split 2026-10-12). Target 4,000 words. Facts about Azure networking behavior, property names, and defaults were checked against Microsoft documentation in October 2026; re-check them before submission.*

**Builds on:** Chapter 2 (evidence categories and can versus did, sections 2.2 and 2.7), Chapter 3 (the collector and snapshots, sections 3.3 and 3.5), Chapter 4 (identity as the perimeter and control-to-data conversions, sections 4.1 and 4.5).

---

## The private endpoint that didn't make anything private

In this fictional scenario, Contoso's platform team ran a quarter-long network hardening project. One line item read: "Move `custdata` to private networking." An engineer created a **private endpoint** for the storage account's blob service in the payments spoke network, linked the private DNS zone, confirmed that the payments Function App could still read and write, and closed the ticket. The quarterly report said customer data storage was now private.

A month later, the security team's reachability review flagged `custdata` as reachable from the internet. The platform team disputed it: there was a private endpoint, and the Function App's traffic was going through it. Both statements were true. Neither made the account private.

The storage account's networking setting still read **Enabled from all networks**. Creating a private endpoint adds a private path to a resource [S1]. It doesn't remove the public one [S1]. Every client that could reach `custdata.blob.core.windows.net` over the internet before the project could still reach it afterward, and anyone holding a valid credential could use it from anywhere.

That mattered because of Chapter 4. Contributor on the payments resource group can list the storage account keys, and shared key access was enabled. The identity path ended at "holds a key". The network was the only thing that could have made a key useless outside Contoso's networks, and the network wasn't doing that.

The review found three more things in the same afternoon:

- A test run of a laptop "through the private endpoint" had actually gone over the public internet, because the laptop's DNS resolver had no link to the private DNS zone and resolved the public address. The test succeeded, and proved nothing about the private path.
- The hub firewall had a network rule allowing `10.0.0.0/8` to `10.0.0.0/8` on any port, added during a migration "temporarily". Every spoke could reach every other spoke, including the development spoke and the payments spoke.
- Nobody had ever looked at whether traffic to `custdata` arrived from public addresses. The storage account's resource logs were off (gap G1).

The team had **intended** reachability ("only the payments app reaches customer data"), **configured** reachability (open to the internet, plus a private path), and no **observed** reachability at all. They had reported the first as if it were the second.

This chapter and the next are about network hops. This one covers what each layer of configuration allows: PaaS public endpoints, network security groups, routes, peering, and DNS. Chapter 7 puts the layers together, compares the result with what logs show and what owners intended, and runs the lab that reproduces this story.

---

## 6.1 What network hops add to a path

Identity is the perimeter in Azure (section 4.1): most control-plane operations go through Azure Resource Manager (ARM), whose endpoint is public [S2], so the token decides. Network controls don't change that for the control plane. You can't put ARM behind your own virtual network firewall, and listing a storage account's keys works from any network that can reach that endpoint [S2].

Network controls matter for **data planes**: the endpoints where you read blobs, query databases, fetch secrets, and call application APIs. There, network configuration decides whether a request reaches the service at all, before the service looks at who you are.

That gives network hops a specific role in a path. They're usually **conditions on other hops** rather than hops in their own right:

- "Holds the storage account key" becomes "can read customer data" only if the holder can reach the blob endpoint.
- "Has a valid token for the key vault" becomes "can read secrets" only if the vault accepts traffic from where the token holder is.
- "Can deploy code to the Function App" (Chapter 4) needs no network condition, because deployment goes through ARM. But the deployed code then reaches whatever the Function App's network position allows.

So the question this chapter answers is: **from where** can each data-plane hop be used? The answer turns one identity path into several, depending on where the attacker sits:

| Position | Example |
|----------|---------|
| Internet | Anyone, from anywhere |
| Azure, any tenant | Traffic from any Azure public address, including other customers' resources |
| Your virtual networks | Code running in your workloads |
| A specific subnet | Only the payments application tier |
| On-premises | Office and data center networks connected by VPN or ExpressRoute |
| Nowhere | The data plane accepts no network traffic, or only from a closed set of private endpoints |

A path that requires "inside the payments subnet" is a very different risk from the same path that works "from the internet". The ranking in section 11.2 uses exactly that difference. Getting the position right is this chapter's job.

---

## 6.2 Four kinds of reachability

Reachability needs four of the five evidence categories (section 2.2), and the failures in the opening story come from mixing them up:

| Kind | Question | Evidence category | Source |
|------|----------|-------------------|--------|
| **Intended** | What should be able to reach this? | Human assertion | Design documents, architecture decision records, owners |
| **Configured** | What does the configuration allow? | Derived fact or deterministic inference | Resource properties, NSGs, routes, firewall rules, DNS |
| **Observed** | What actually connected? | Observed fact | Flow logs, resource logs, firewall logs |
| **Confirmed** | Did a person test it and see it work, or fail? | Human assertion, with a record | Penetration tests, connectivity tests with recorded results |

Each pair of kinds disagreeing is a different kind of finding:

- **Intended but not configured to match.** The design says "private only"; configuration says "internet". This is the opening story, and the most common serious network finding in Azure.
- **Configured but never observed.** A firewall rule allows traffic nobody uses. That's exposure with no business value, and a strong candidate for removal. Be careful with the inference, though: "not observed" requires logging that would have seen it. Absence of logs isn't absence of traffic (section 2.6).
- **Observed but not configured.** Traffic your model says can't happen did happen. Your model is wrong, or your collection missed something: a route, a peering, a rule. Treat this as a defect in your reachability computation, not as a curiosity.
- **Confirmed, but against the wrong path.** The laptop test in the opening story. A recorded test result is only as good as the record of how it was run.

Most tools report configured reachability and call it reachability. Being explicit about which kind you're stating is the network version of "can" versus "did" (section 2.7).

Configured reachability is the easiest result in this book to overstate, so each kind gets fixed wording. Section 7.1 adds a fifth result, for when the model can't tell:

| Result | Meaning | Safe wording |
|--------|---------|--------------|
| Intended | An owner says this should connect | "Is intended to connect, according to …" |
| Configured reachable | The modeled configuration permits the route | "May be reachable under the modeled configuration" |
| Observed | Logs show a connection in a window | "Was observed connecting between … and …" |
| Confirmed | An authorized test succeeded | "Was confirmed reachable as tested on …" |
| Indeterminate | An unmodeled control or missing input sits on the route | "Reachability could not be determined because …" |

"Is reachable", with no qualifier, isn't on the list. It claims all four kinds at once.

---

## 6.3 PaaS public exposure

For platform services (storage, Key Vault, SQL Database, Cosmos DB, App Service, and many others), the first question is whether the service's **public endpoint** accepts traffic, and from where.

### Storage accounts

A storage account's public exposure comes from two settings that work together:

- **`publicNetworkAccess`**: `Enabled`, `Disabled`, or `SecuredByPerimeter` [S3]. When disabled, public endpoint traffic is blocked and access is intended through private endpoints, while configured trusted-service bypass exceptions can still admit selected Azure services [S4, S5]. `SecuredByPerimeter` hands the decision to a network security perimeter, which is a separate resource with its own rules [S3].
- **`networkAcls`**: the storage firewall [S6]. Its **`defaultAction`** is `Allow` or `Deny` [S3]. With `Deny`, traffic is accepted only from listed **IP rules** (public address ranges), **virtual network rules** (subnets with a storage service endpoint), **resource instance rules** (specific Azure resources), and the **bypass** list, which can let trusted Azure services through [S6, S4].

The portal presents these as three choices, which map roughly as follows:

| Portal choice | `publicNetworkAccess` | `defaultAction` |
|---------------|----------------------|-----------------|
| Enabled from all networks | Enabled | Allow [S7] |
| Enabled from selected virtual networks and IP addresses | Enabled | Deny, with rules [S7] |
| Disabled | Disabled | (not used for public traffic) [S7] |

A deterministic classifier over the collected properties is short:

<!-- listing: lab/listings/python/ch06_reachability.py#storage_public_exposure -->

```python
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
```

Three details in that code matter more than they look:

- **An unset value isn't "secure".** Older accounts may not carry `publicNetworkAccess` at all; new storage accounts default to accepting public connections unless you restrict them [S7, S3]. Treating a missing value as disabled would mark the oldest, least-reviewed accounts as the safest.
- **Unknown values return "unknown".** Azure adds options over time. `SecuredByPerimeter` is a recent example: the answer depends on the perimeter's rules, which this function doesn't read. A value your code doesn't recognize is a reason to stop and evaluate, not to guess.
- **Every result carries reasons.** "Restricted" is useless without the list of what it's restricted to. An IP rule for a partner's whole address range, or a subnet rule for a development subnet, is often the actual finding. Disabling public access doesn't earn "private only" by itself: a bypass that still admits trusted Azure services makes the result "restricted", because trusted-service exceptions can remain in effect when public network access is disabled [S4, S5].

### The same pattern elsewhere

Most PaaS services follow the same shape, with service-specific twists worth knowing:

- **Key Vault** has `publicNetworkAccess` and firewall rules with a trusted-services bypass, much like storage [S5].
- **Azure SQL Database** has `publicNetworkAccess` on the logical server and server-level firewall rules [S8]. One rule deserves special attention: **Allow Azure services and resources to access this server**, which appears as a firewall rule named `AllowAllWindowsAzureIps` from `0.0.0.0` to `0.0.0.0` [S9]. It admits traffic from any Azure public address, including resources in other customers' subscriptions [S8, S9]. It's not "our Azure resources". It's "anyone's".
- **App Service and Function Apps** have `publicNetworkAccess`, inbound **access restrictions**, and a separate set of restrictions for the advanced tools (Kudu, or "SCM") site, which can be configured to follow the main site's rules or not ("Use main site rules" in the portal, `scmIpSecurityRestrictionsUseMain` in ARM) [S10, S11]. A locked-down app whose SCM site is open is not locked down [S10].
- **Cosmos DB, Event Hubs, Service Bus, Azure AI services** and many others carry their own variants of public access flags, IP rules, and virtual network rules.

### Private endpoints don't close public endpoints

A **private endpoint** is a network interface in your virtual network with a private IP address, connected to one sub-resource of a PaaS service (for storage: `blob`, `file`, `queue`, `table`, `dfs`, or `web`) [S1]. Traffic from inside your network can reach the service on that private address [S1].

It doesn't remove or disable the service's public endpoint by itself [S1]. The opening story's mistake is common enough to deserve its own query. Step 2 of this chapter's lab runs it, and Chapter 7 Step 1 runs it again before computing reachability:

<!-- listing: lab/listings/kql/appb-resources-with-a-private-endpoint-and.kql -->

```kusto
resources
| where isnotnull(properties.privateEndpointConnections)
| where array_length(properties.privateEndpointConnections) > 0
| extend publicNetworkAccess = tostring(properties.publicNetworkAccess)
| where publicNetworkAccess !~ 'Disabled'
| project id, type, name, resourceGroup, subscriptionId,
    publicNetworkAccess = iff(isempty(publicNetworkAccess), '(unset)', publicNetworkAccess),
    defaultAction = tostring(properties.networkAcls.defaultAction),
    privateEndpoints = array_length(properties.privateEndpointConnections)
```

The query works across resource types, but its columns don't mean the same thing everywhere. `publicNetworkAccess` exists on most PaaS types. `networkAcls.defaultAction` is meaningful for storage and Key Vault; SQL keeps its rules in server firewall rules instead, so that column is empty for SQL rows. Use the query to find candidates, then classify each type with its own logic, as `storage_public_exposure` does for storage.

Every row is a resource where someone did the work of adding a private path and the public path is still open, or at least not explicitly closed. Some rows are deliberate: a storage account serving public static content through one endpoint and private traffic through another. Most, in my experience, are unfinished projects. The query can't tell which. The intended reachability, from the owner, can.

Also note what a private endpoint *does* open. Every network that can reach the private endpoint's IP address can now reach the service. If the endpoint sits in a hub network peered to forty spokes, with a permissive firewall in between, "private" may mean "reachable from every workload in the company". Private is a statement about the internet, not about least privilege.

### Service endpoints are different

A **service endpoint** is a setting on a subnet that sends traffic to a service (such as storage) over the Azure backbone and tags it with the subnet's identity [S12]. The service's firewall can then allow that subnet with a virtual network rule [S12].

Service endpoints don't give the service a private address. The client still uses the service's public endpoint name and address, and DNS for the service still resolves to public addresses [S12]. What changes is that the service firewall can recognize traffic from the subnet [S12]. They're a reasonable control, and they behave differently from private endpoints. Your reachability model should treat "allowed by subnet rule via service endpoint" as its own edge, not as "private".

### Outbound integration is not inbound protection

App Service and Function Apps have **virtual network integration**, which lets the app make **outbound** calls into your virtual network [S13]. It does not grant inbound private access to the app by itself [S13]. An app with virtual network integration and no private endpoint or access restrictions is still reachable from the internet [S13]. The names are close enough that teams confuse them regularly, so check for both when you classify an app.

---

## 6.4 Inside the network: NSGs, routes, and peering

For workloads in virtual networks, such as VMs, container hosts, and private endpoints, reachability depends on three layers of configuration: whether a route exists, whether network security groups allow the traffic, and whether anything in the path, such as a firewall, filters it.

### Network security groups

A **network security group** (NSG) is a list of rules applied to a subnet, a network interface, or both [S14]. Each rule has a priority (100 to 4096, lower numbers evaluated first) [S14], a direction, an action (allow or deny), a protocol, source and destination address prefixes, and ports. Evaluation stops at the first matching rule [S14].

Every NSG also has **default rules** at the bottom (priorities 65000 and above) that you can't delete [S14]. Inbound:

| Priority | Name | Effect |
|----------|------|--------|
| 65000 | AllowVnetInBound | Allow from the `VirtualNetwork` service tag [S14] |
| 65001 | AllowAzureLoadBalancerInBound | Allow from the Azure load balancer [S14] |
| 65500 | DenyAllInBound | Deny everything else [S14] |

The first default rule is where many surprises live. The `VirtualNetwork` service tag covers the virtual network's own address space, **peered virtual networks**, and on-premises address space connected through a virtual network gateway [S15]. An NSG with no custom rules therefore allows inbound traffic from every peered network and every connected office [S14, S15]. "We have an NSG on the subnet" says much less than it sounds.

When NSGs are attached at both the subnet and the network interface, traffic must be allowed by both [S16]. Inbound traffic is evaluated against the subnet's NSG first, then the interface's; outbound, the reverse [S16].

A minimal evaluator for inbound traffic, with service tags resolved from data you supply:

<!-- listing: lab/listings/python/ch06_reachability.py#nsg_inbound -->

```python
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
```

This leaves out destination prefixes and application security groups to stay short, and it handles one NSG. For a subnet and interface pair, run it on both and require both to allow. The important behavior is the `Unknown` result. If a rule references a service tag whose address prefixes you didn't collect, the evaluator can't decide, and it says so rather than skipping the rule. Skipping it would silently change the answer. Microsoft publishes service tag prefixes as a downloadable JSON file and through an API [S15]. Collect them with the snapshot and record their version.

Network Watcher can also evaluate this for you. **IP flow verify** tells you whether a specific flow to or from a VM would be allowed and which rule decided it [S17]. **Effective security rules** shows the combined rules applied to an interface [S18]. Both are Azure's own evaluation of configuration, which makes them good derived facts and a good way to test your evaluator. They're per-flow and per-interface, so they don't replace computing reachability across an estate [S17, S18].
### NSGs and private endpoints

NSG rules don't apply to private endpoints unless the subnet's **private endpoint network policies** setting enables them [S19]. The default is disabled [S19], so many private endpoint subnets ignore their NSGs entirely. In ARM the setting is the subnet's `privateEndpointNetworkPolicies` property [S19]. If your model applies NSG rules to private endpoint traffic without checking that setting, it will report restrictions that don't exist.

### Routes

Traffic follows the **effective routes** of the source network interface: system routes (within the virtual network, to peered networks, to the internet), routes learned from gateways through BGP, and **user-defined routes** (UDRs) in route tables attached to subnets [S20, S21]. The most specific matching prefix wins [S20, S21].

In a hub-and-spoke design, a UDR typically sends `0.0.0.0/0`, and often the other spokes' ranges, to a firewall in the hub as the next hop. That route is what makes the firewall's rules matter. If a subnet lacks the route table, its traffic skips the firewall, and the firewall's rules say nothing about it.

Network Watcher can show the effective routes for a network interface [S21], which again is Azure's own evaluation and a useful check on your model.

### Peering

**Virtual network peering** connects two virtual networks. Peering is **not transitive**: if spoke A and spoke B both peer with the hub, A and B can't reach each other through the hub unless something in the hub forwards traffic between them, usually a firewall, with routes sending traffic to it [S22]. Peering settings such as **allow forwarded traffic** and **use remote gateways** decide whether forwarded and on-premises traffic can cross [S22].

Peering also expands the `VirtualNetwork` service tag [S15, S22]. When a new spoke is peered to a network, every NSG relying on the default `AllowVnetInBound` rule starts allowing it [S14, S15]. Nothing in the NSG changed. Its meaning did.

### Firewalls

Azure Firewall, or a third-party network virtual appliance, filters traffic routed through it. Azure Firewall processes rule collections in a defined order (destination NAT rules, then network rules, then application rules) and denies traffic that no rule allows [S23].

For reachability, the firewall is a filter applied to edges that routing sends through it. Model the rules the same way as NSG rules: priority, match, action, with `Unknown` for anything your evaluator can't decide, such as fully qualified domain name (FQDN) rules whose targets resolve differently over time. And treat broad rules as findings. The opening story's `10.0.0.0/8` to `10.0.0.0/8` rule turns a hub-and-spoke design into a flat network, regardless of how carefully the spokes were separated.
### Public IP addresses

Finally, the direct exposures: VMs with public IP addresses, load balancers and application gateways with public frontends, and NAT rules on firewalls. For each, the question is the same: what's listening behind it, and what do the NSGs and firewall rules allow from `Internet`? A management port such as SSH (22) or RDP (3389) open to the internet is the classic finding. Azure Bastion and just-in-time VM access exist to remove it.

---

## 6.5 DNS decides which path is used

Private endpoints rely on DNS. The service's public name, such as `custdata.blob.core.windows.net`, resolves through a `privatelink` alias [S24]. Clients whose resolver can see the linked **private DNS zone** (`privatelink.blob.core.windows.net`) get the private IP address [S24]. Everyone else gets the public address [S24].

That has two consequences for reachability:

- **A client that resolves the public address uses the public path.** If public access is disabled, its requests fail. If public access is enabled, as in the opening story, they succeed, over the internet, and look exactly like a working private connection to the person testing.
- **DNS is configuration you must collect.** Which private DNS zones exist, which virtual networks they're linked to, and how on-premises resolvers forward queries are all part of the network evidence. Without them, you can say a private endpoint exists. You can't say which clients use it.

So a "private connectivity test" proves something only if it records what the name resolved to. Make that part of every recorded confirmation: the resolved address, the source address, and the result.

---

## 6.6 Lab: which kind of reachability is this?

Chapter 7 computes reachability and confirms it. This lab stops earlier. You name which kind of reachability a statement is, and you run the two classifiers this chapter already gave you.

**Setup.** The companion lab with `deploy_network = true` (Appendix A). Steps 1 and 4 need only this chapter. Steps 2 and 3 need the lab tenant, or a snapshot that includes the network properties from section 6.3.

**Step 1 — Sort the opening story.** Take each thing the team reported or missed that afternoon and name its reachability kind from section 6.2: intended, configured, observed, or confirmed. Where two kinds were treated as the same kind, say which two.

**Step 2 — Find the unfinished private endpoint.** Run the query in section 6.3 against the lab tenant. Record every row, and for `custdata` record `publicNetworkAccess` exactly as the query prints it, including `(unset)` if that's the value.

**Step 3 — Classify two accounts.** Run `storage_public_exposure` (section 6.3) on `custdata` and on one `sbx` account. Write each result in the safe wording from section 6.2. Keep the reasons with the classification.

**Step 4 — One NSG, two sources.** `nsg-dev` allows TCP 3389 from `corporate_ip_range`, which defaults to `203.0.113.0/24`, at priority 100 (Appendix A). Call `evaluate_inbound` (section 6.4) twice, for port 3389 and protocol `Tcp`, with `tags` set to `{"VirtualNetwork": ["10.0.0.0/16", "10.1.0.0/16", "10.2.0.0/16"], "AzureLoadBalancer": []}`. Those prefixes are the lab's networks; the empty list means you are not treating any address as the load balancer. The two sources are `203.0.113.10` and `198.51.100.10`. The second is a documentation address, not a host in the lab. Say which rule decided each result. If you omit `VirtualNetwork` or `AzureLoadBalancer`, the function returns `Unknown` instead of denying, because an undecidable default rule sits above `DenyAllInBound`.

**What you should see.**

- The closed ticket stated an intention ("customer data storage is now private") as if it were the configuration. The laptop test confirmed a connection, and the connection was the public one, because the name resolved to the public address (section 6.5). The hub rule allowing `10.0.0.0/8` to `10.0.0.0/8` is configured reachability. Nobody had observed reachability at all, because the resource logs were off.
- `custdata` is a row, and its public access is not `Disabled`. Other rows, if any, are part of the answer; write down whether you think each is deliberate. That note is an intended-reachability assertion, and it should say that you made it.
- `custdata` classifies as internet: public network access is enabled, or unset, which the function treats as enabled, and the storage firewall's default action is Allow. The safe sentence is "may be reachable under the modeled configuration," not "is reachable." A sandbox account that allows anonymous blob access is a different finding; don't fold it into this classification.
- `203.0.113.10` matches `allow-rdp-corporate` and is allowed. `198.51.100.10` matches neither that rule nor the `VirtualNetwork` service tag, so `DenyAllInBound` denies it (section 6.4). "The subnet has an NSG" is not one of these results.

Chapter 7 Step 1 repeats Step 2, then asks where the endpoint is reachable from. If Step 2 and Step 3 disagree with the list above, fix the snapshot before you start that lab.

---

## Sources

- **[S1]** What is a private endpoint? Microsoft Learn. <https://learn.microsoft.com/azure/private-link/private-endpoint-overview> Checked 2026-10-12. Kind: documented.
- **[S2]** Control plane and data plane operations - Azure Resource Manager. Microsoft Learn. <https://learn.microsoft.com/azure/azure-resource-manager/management/control-plane-and-data-plane> Checked 2026-10-12. Kind: documented.
- **[S3]** Microsoft.Storage/storageAccounts. Microsoft Learn. <https://learn.microsoft.com/azure/templates/microsoft.storage/storageaccounts> Checked 2026-10-12. Kind: documented.
- **[S4]** Manage network security exceptions for Azure Storage. Microsoft Learn. <https://learn.microsoft.com/azure/storage/common/storage-network-security-manage-exceptions> Checked 2026-10-12. Kind: documented.
- **[S5]** Configure network security for Azure Key Vault. Microsoft Learn. <https://learn.microsoft.com/azure/key-vault/general/network-security> Checked 2026-10-12. Kind: documented.
- **[S6]** Azure Storage firewall rules and network access. Microsoft Learn. <https://learn.microsoft.com/azure/storage/common/storage-network-security> Checked 2026-10-12. Kind: documented.
- **[S7]** Set the default public network access rule: Azure Storage. Microsoft Learn. <https://learn.microsoft.com/azure/storage/common/storage-network-security-set-default-access> Checked 2026-10-12. Kind: documented.
- **[S8]** Network Access Controls - Azure SQL Database. Microsoft Learn. <https://learn.microsoft.com/azure/azure-sql/database/network-access-controls-overview> Checked 2026-10-12. Kind: documented.
- **[S9]** IP Firewall Rules - Azure SQL Database. Microsoft Learn. <https://learn.microsoft.com/azure/azure-sql/database/firewall-configure> Checked 2026-10-12. Kind: documented.
- **[S10]** App Service Access restrictions. Microsoft Learn. <https://learn.microsoft.com/azure/app-service/overview-access-restrictions> Checked 2026-10-12. Kind: documented.
- **[S11]** Microsoft.Web/sites/config-web. Microsoft Learn. <https://learn.microsoft.com/azure/templates/microsoft.web/sites/config-web> Checked 2026-10-12. Kind: documented.
- **[S12]** Azure virtual network service endpoints. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/virtual-network-service-endpoints-overview> Checked 2026-10-12. Kind: documented.
- **[S13]** Virtual network integration with an Azure virtual network. Microsoft Learn. <https://learn.microsoft.com/azure/app-service/overview-vnet-integration> Checked 2026-10-12. Kind: documented.
- **[S14]** Azure network security groups overview. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview> Checked 2026-10-12. Kind: documented.
- **[S15]** Azure service tags overview. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/service-tags-overview> Checked 2026-10-12. Kind: documented.
- **[S16]** How Network Security Groups Filter Network Traffic in Azure. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/network-security-group-how-it-works> Checked 2026-10-12. Kind: documented.
- **[S17]** IP Flow Verify Overview. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/ip-flow-verify-overview> Checked 2026-10-12. Kind: documented.
- **[S18]** Effective Security Rules Overview. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/effective-security-rules-overview> Checked 2026-10-12. Kind: documented.
- **[S19]** Manage network policies for private endpoints. Microsoft Learn. <https://learn.microsoft.com/azure/private-link/disable-private-endpoint-network-policy> Checked 2026-10-12. Kind: documented.
- **[S20]** Azure virtual network traffic routing. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview> Checked 2026-10-12. Kind: documented.
- **[S21]** Diagnose an Azure virtual machine routing problem. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/diagnose-network-routing-problem> Checked 2026-10-12. Kind: documented.
- **[S22]** Create, change, or delete an Azure virtual network peering. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/virtual-network-manage-peering> Checked 2026-10-12. Kind: documented.
- **[S23]** Azure Firewall rule processing logic. Microsoft Learn. <https://learn.microsoft.com/azure/firewall/rule-processing> Checked 2026-10-12. Kind: documented.
- **[S24]** Azure Private Endpoint private DNS zone values. Microsoft Learn. <https://learn.microsoft.com/azure/private-link/private-endpoint-dns> Checked 2026-10-12. Kind: documented.

---

## Summary

- Network controls mostly don't affect the **control plane**, which goes through ARM. They decide **data-plane** reachability: **from where** each data-plane hop can be used.
- Keep four kinds of reachability separate: **intended** (human assertion), **configured** (derived from configuration), **observed** (logs), and **confirmed** (recorded tests). Disagreements between them are findings.
- For PaaS services, check **public network access** and the **service firewall** together. Treat unset and unrecognized values explicitly, and keep the reasons with every classification.
- **Private endpoints add a private path. They don't close the public one [S1].** Query for resources with both.
- **Service endpoints** and **virtual network integration** are different controls from private endpoints [S12, S13], and the latter is outbound only [S13].
- Inside networks, reachability depends on **routes, NSGs, and firewalls**. The default `AllowVnetInBound` rule admits **peered and connected networks** [S14, S15], and NSGs apply to private endpoints only when the subnet enables it [S19].
- **DNS decides which path a client uses.** Record resolved addresses in every connectivity test.

## Key terms

- **Data plane** — the endpoints where a service's data is read and written, as opposed to ARM management operations.
- **Public network access** — a service setting that decides whether its public endpoint accepts traffic at all.
- **Service firewall** — a PaaS service's own network rules (default action, IP rules, virtual network rules, bypass).
- **Private endpoint** — a network interface with a private IP address connected to one sub-resource of a PaaS service.
- **Service endpoint** — a subnet setting that lets a service's firewall recognize traffic from that subnet over its public endpoint.
- **Network security group (NSG)** — prioritized allow and deny rules applied to subnets and network interfaces.
- **Service tag** — a named group of address prefixes maintained by Microsoft, such as `VirtualNetwork` or `Internet`.
- **User-defined route (UDR)** — a custom route in a route table, often sending traffic to a firewall.
- **Intended, configured, observed, and confirmed reachability** — what should connect, what configuration allows, what logs show did connect, and what a recorded test showed.
- **Position** — where a request originates (internet, a subnet, on-premises), which decides which data-plane hops it can use.

---

## Author notes (remove before submission)

- 2026-10-12 (chapter split): this chapter keeps the opening story and sections 1 to 5 of the old Chapter 5 ("Network reachability"), renamed "Network exposure". Computing, observing, and confirming reachability, where AI fits, and the full lab moved to Chapter 7. The section 7.6 lab still does the computation. The listings this chapter shows come from `ch06_reachability.py`.
- 2026-10-12 (labs): added section 6.6. Steps 1 and 4 are desk checks against this chapter and Appendix A. Steps 2 and 3 need a tenant and are on the live-validation runbook as N1 and N2. Fixed the offline-fixture note to `test_ch06_reachability.py`.
- 2026-10-12 (BR-10, repetition edit): recap and signpost references to other chapters were cut or turned into section pointers, and the **Builds on** line now carries the dependencies. No technical content, code, labs, or evidence categories changed. `tools/check_cross_refs.py` checks every reference.
- Verified 2026-10-10 (revision pass 1): storage `publicNetworkAccess` values and bypass precedence; SQL `AllowAllWindowsAzureIps`; `scmIpSecurityRestrictionsUseMain`; NSG priorities, default rules, `VirtualNetwork` scope and evaluation order; private endpoint network policies default; Azure Firewall processing order; flow log retirement dates; Network Watcher feature names.
- `storage_public_exposure` and `evaluate_inbound` pass offline fixtures (`lab/listings/python/tests/test_ch06_reachability.py`). Testing showed the bullet on "private only" contradicted the code, which returns "restricted" whenever a bypass is set; the bullet now matches the code (2026-10-11). Still to do: run the Resource Graph query against a live tenant with mixed resource types.
- 2026-10-12 (sources): added 31 sources. Changed: ARM control-plane wording; storage disabled/bypass phrasing; diagnostic RBAC sentence names actions. Softened: (none). Unverified: (none).
- "Most, in my experience, are unfinished projects" is an author-experience claim; keep it attributed.
- Consider a figure showing the payments hub-and-spoke with the four positions.
- Add the Chapter 6 fact checks to GTM **M-306** when it is picked up.
