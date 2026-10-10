> **Scope:** Chapter 5 first draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Chapter 5 — Network reachability

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: first draft. Target 7,000 words. Facts about Azure networking behavior, property names, and defaults must be re-verified against Microsoft documentation before submission.*

---

## The private endpoint that didn't make anything private

In this fictional scenario, Contoso's platform team ran a quarter-long network hardening project. One line item read: "Move `custdata` to private networking." An engineer created a **private endpoint** for the storage account's blob service in the payments spoke network, linked the private DNS zone, confirmed that the payments Function App could still read and write, and closed the ticket. The quarterly report said customer data storage was now private.

A month later, the security team's reachability review flagged `custdata` as reachable from the internet. The platform team disputed it: there was a private endpoint, and the Function App's traffic was going through it. Both statements were true. Neither made the account private.

The storage account's networking setting still read **Enabled from all networks**. Creating a private endpoint adds a private path to a resource. It doesn't remove the public one. Every client that could reach `custdata.blob.core.windows.net` over the internet before the project could still reach it afterward, and anyone holding a valid credential could use it from anywhere.

That mattered because of Chapter 4. Contributor on the payments resource group can list the storage account keys, and shared key access was enabled. The identity path ended at "holds a key". The network was the only thing that could have made a key useless outside Contoso's networks, and the network wasn't doing that.

The review found three more things in the same afternoon:

- A test run of a laptop "through the private endpoint" had actually gone over the public internet, because the laptop's DNS resolver had no link to the private DNS zone and resolved the public address. The test succeeded, and proved nothing about the private path.
- The hub firewall had a network rule allowing `10.0.0.0/8` to `10.0.0.0/8` on any port, added during a migration "temporarily". Every spoke could reach every other spoke, including the development spoke and the payments spoke.
- Nobody had ever looked at whether traffic to `custdata` arrived from public addresses. The storage account's resource logs were off (the same gap, G1, that Chapters 2 and 7 kept running into).

The team had **intended** reachability ("only the payments app reaches customer data"), **configured** reachability (open to the internet, plus a private path), and no **observed** reachability at all. They had reported the first as if it were the second.

This chapter is about network hops: how to compute what can reach what from configuration, how to collect evidence of what actually does, and how to keep those apart.

---

## 5.1 What network hops add to a path

Chapter 4 argued that identity is the perimeter in Azure: most control-plane operations go through Azure Resource Manager (ARM), which is reachable from anywhere, so the token decides. Network controls don't change that for the control plane. You can't put ARM behind your firewall, and listing a storage account's keys works from any network.

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

A path that requires "inside the payments subnet" is a very different risk from the same path that works "from the internet". Chapter 9's ranking uses exactly that difference. Getting the position right is this chapter's job.

---

## 5.2 Four kinds of reachability

Chapter 2 introduced five evidence categories. Reachability needs four of them, and the failures in the opening story come from mixing them up:

| Kind | Question | Evidence category | Source |
|------|----------|-------------------|--------|
| **Intended** | What should be able to reach this? | Human assertion | Design documents, architecture decision records, owners |
| **Configured** | What does the configuration allow? | Derived fact or deterministic inference | Resource properties, NSGs, routes, firewall rules, DNS |
| **Observed** | What actually connected? | Observed fact | Flow logs, resource logs, firewall logs |
| **Confirmed** | Did a person test it and see it work, or fail? | Human assertion, with a record | Penetration tests, connectivity tests with recorded results |

Each pair of kinds disagreeing is a different kind of finding:

- **Intended but not configured to match.** The design says "private only"; configuration says "internet". This is the opening story, and the most common serious network finding in Azure.
- **Configured but never observed.** A firewall rule allows traffic nobody uses. That's exposure with no business value, and a strong candidate for removal. Be careful with the inference, though: "not observed" requires logging that would have seen it. Absence of logs isn't absence of traffic (Chapter 2).
- **Observed but not configured.** Traffic your model says can't happen did happen. Your model is wrong, or your collection missed something: a route, a peering, a rule. Treat this as a defect in your reachability computation, not as a curiosity.
- **Confirmed, but against the wrong path.** The laptop test in the opening story. A recorded test result is only as good as the record of how it was run.

Most tools report configured reachability and call it reachability. Being explicit about which kind you're stating is the network version of Chapter 2's rule about "can" versus "did".

---

## 5.3 PaaS public exposure

For platform services (storage, Key Vault, SQL Database, Cosmos DB, App Service, and many others), the first question is whether the service's **public endpoint** accepts traffic, and from where.

### Storage accounts

A storage account's public exposure comes from two settings that work together:

- **`publicNetworkAccess`**: `Enabled` or `Disabled`. When disabled, the public endpoint refuses traffic and only private endpoints work.
- **`networkAcls`**: the storage firewall. Its **`defaultAction`** is `Allow` or `Deny`. With `Deny`, traffic is accepted only from listed **IP rules** (public address ranges), **virtual network rules** (subnets with a storage service endpoint), **resource instance rules** (specific Azure resources), and the **bypass** list, which can let trusted Azure services through.

The portal presents these as three choices, which map roughly as follows:

| Portal choice | `publicNetworkAccess` | `defaultAction` |
|---------------|----------------------|-----------------|
| Enabled from all networks | Enabled | Allow |
| Enabled from selected virtual networks and IP addresses | Enabled | Deny, with rules |
| Disabled | Disabled | (not used for public traffic) |

A deterministic classifier over the collected properties is short:

```python
def storage_public_exposure(account: dict) -> tuple[str, list[str]]:
    """Classify a storage account's public data-plane exposure from its ARM properties."""
    props = account.get("properties") or {}
    # Older accounts may not have the property set; the effective behavior is "Enabled".
    public = (props.get("publicNetworkAccess") or "Enabled").lower()
    acls = props.get("networkAcls") or {}

    if public == "disabled":
        return "private only", ["publicNetworkAccess is Disabled"]

    if public != "enabled":
        return "unknown", [f"publicNetworkAccess is '{props.get('publicNetworkAccess')}'; evaluate it explicitly"]

    if (acls.get("defaultAction") or "Allow").lower() == "allow":
        return "internet", ["publicNetworkAccess is Enabled", "networkAcls.defaultAction is Allow"]

    reasons = ["networkAcls.defaultAction is Deny"]
    reasons += [f"IP rule {rule.get('value')}" for rule in acls.get("ipRules") or []]
    reasons += [f"subnet rule {rule.get('id')}" for rule in acls.get("virtualNetworkRules") or []]
    reasons += [f"resource instance rule {rule.get('resourceId')}" for rule in acls.get("resourceAccessRules") or []]

    if acls.get("bypass") and acls["bypass"].lower() != "none":
        reasons.append(f"bypass {acls['bypass']}")

    return "restricted", reasons
```

Three details in that code matter more than they look:

- **An unset value isn't "secure".** Older accounts may not carry `publicNetworkAccess` at all, and their behavior is governed by the firewall alone. Treating a missing value as disabled would mark the oldest, least-reviewed accounts as the safest.
- **Unknown values return "unknown".** Azure adds options over time. A value your code doesn't recognize is a reason to stop and evaluate, not to guess.
- **Every result carries reasons.** "Restricted" is useless without the list of what it's restricted to. An IP rule for a partner's whole address range, or a subnet rule for a development subnet, is often the actual finding.

> **As of 2026-10:** Verify the current `publicNetworkAccess` values for storage (including any value tied to network security perimeters), the behavior when the property is unset, and how the trusted-services bypass interacts with `Disabled`.

### The same pattern elsewhere

Most PaaS services follow the same shape, with service-specific twists worth knowing:

- **Key Vault** has `publicNetworkAccess` and a `networkAcls` firewall with a trusted-services bypass, much like storage.
- **Azure SQL Database** has `publicNetworkAccess` on the logical server and server-level firewall rules. One rule deserves special attention: **Allow Azure services and resources to access this server**, which appears as a firewall rule from `0.0.0.0` to `0.0.0.0`. It admits traffic from any Azure public address, including resources in other customers' subscriptions. It's not "our Azure resources". It's "anyone's".
- **App Service and Function Apps** have `publicNetworkAccess`, inbound **access restrictions**, and a separate set of restrictions for the advanced tools (Kudu, or "SCM") site, which can be configured to follow the main site's rules or not. A locked-down app whose SCM site is open is not locked down.
- **Cosmos DB, Event Hubs, Service Bus, Azure AI services** and many others carry their own variants of public access flags, IP rules, and virtual network rules.

> **As of 2026-10:** Verify the SQL "Allow Azure services" rule representation, the App Service SCM restriction inheritance setting name, and the public access property names for each service listed.

### Private endpoints don't close public endpoints

A **private endpoint** is a network interface in your virtual network with a private IP address, connected to one sub-resource of a PaaS service (for storage: `blob`, `file`, `queue`, `table`, `dfs`, or `web`). Traffic from inside your network can reach the service on that private address.

It doesn't change the public endpoint. The opening story's mistake is common enough to deserve its own query, and it's the first step of this chapter's lab:

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

Every row is a resource where someone did the work of adding a private path and the public path is still open, or at least not explicitly closed. Some rows are deliberate: a storage account serving public static content through one endpoint and private traffic through another. Most, in my experience, are unfinished projects. The query can't tell which. The intended reachability, from the owner, can.

Also note what a private endpoint *does* open. Every network that can reach the private endpoint's IP address can now reach the service. If the endpoint sits in a hub network peered to forty spokes, with a permissive firewall in between, "private" may mean "reachable from every workload in the company". Private is a statement about the internet, not about least privilege.

### Service endpoints are different

A **service endpoint** is a setting on a subnet that sends traffic to a service (such as storage) over the Azure backbone and tags it with the subnet's identity. The service's firewall can then allow that subnet with a virtual network rule.

Service endpoints don't give the service a private address. The client still talks to the public endpoint, and the service still has public network access enabled. What changes is that the storage firewall can recognize the subnet. They're a reasonable control, and they behave differently from private endpoints. Your reachability model should treat "allowed by subnet rule via service endpoint" as its own edge, not as "private".

### Outbound integration is not inbound protection

App Service and Function Apps have **virtual network integration**, which lets the app make **outbound** calls into your virtual network. It does nothing for **inbound** traffic. An app with virtual network integration and no private endpoint or access restrictions is still reachable from the internet. The names are close enough that teams confuse them regularly, so check for both when you classify an app.

---

## 5.4 Inside the network: NSGs, routes, and peering

For workloads in virtual networks, such as VMs, container hosts, and private endpoints, reachability depends on three layers of configuration: whether a route exists, whether network security groups allow the traffic, and whether anything in the path, such as a firewall, filters it.

### Network security groups

A **network security group** (NSG) is a list of rules applied to a subnet, a network interface, or both. Each rule has a priority (100 to 4096, lower numbers evaluated first), a direction, an action (allow or deny), a protocol, source and destination address prefixes, and ports. Evaluation stops at the first matching rule.

Every NSG also has **default rules** at the bottom (priorities 65000 and above) that you can't delete. Inbound:

| Priority | Name | Effect |
|----------|------|--------|
| 65000 | AllowVnetInBound | Allow from the `VirtualNetwork` service tag |
| 65001 | AllowAzureLoadBalancerInBound | Allow from the Azure load balancer |
| 65500 | DenyAllInBound | Deny everything else |

The first default rule is where many surprises live. The `VirtualNetwork` service tag covers the virtual network's own address space, **peered virtual networks**, and on-premises address space connected through a virtual network gateway. An NSG with no custom rules therefore allows inbound traffic from every peered network and every connected office. "We have an NSG on the subnet" says much less than it sounds.

When NSGs are attached at both the subnet and the network interface, traffic must be allowed by both. Inbound traffic is evaluated against the subnet's NSG first, then the interface's; outbound, the reverse.

A minimal evaluator for inbound traffic, with service tags resolved from data you supply:

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

This leaves out destination prefixes and application security groups to stay short, and it handles one NSG. For a subnet and interface pair, run it on both and require both to allow. The important behavior is the `Unknown` result. If a rule references a service tag whose address prefixes you didn't collect, the evaluator can't decide, and it says so rather than skipping the rule. Skipping it would silently change the answer. Microsoft publishes service tag prefixes as a downloadable file and through an API. Collect them with the snapshot and record their version.

Network Watcher can also evaluate this for you. **IP flow verify** tells you whether a specific flow to or from a VM would be allowed and which rule decided it. **Effective security rules** shows the combined rules applied to an interface. Both are Azure's own evaluation of configuration, which makes them good derived facts and a good way to test your evaluator. They're per-flow and per-interface, so they don't replace computing reachability across an estate.

> **As of 2026-10:** Verify NSG priority range, default rule names and priorities, the scope of the `VirtualNetwork` service tag, subnet-then-interface evaluation order, and Network Watcher feature names.

### NSGs and private endpoints

NSG rules don't apply to private endpoints unless the subnet's **private endpoint network policies** setting enables them. For a long time the default was disabled, so many existing private endpoint subnets ignore their NSGs entirely. If your model applies NSG rules to private endpoint traffic without checking that setting, it will report restrictions that don't exist.

> **As of 2026-10:** Verify the `privateEndpointNetworkPolicies` property values and the current default for new subnets.

### Routes

Traffic follows the **effective routes** of the source network interface: system routes (within the virtual network, to peered networks, to the internet), routes learned from gateways through BGP, and **user-defined routes** (UDRs) in route tables attached to subnets. The most specific matching prefix wins.

In a hub-and-spoke design, a UDR typically sends `0.0.0.0/0`, and often the other spokes' ranges, to a firewall in the hub as the next hop. That route is what makes the firewall's rules matter. If a subnet lacks the route table, its traffic skips the firewall, and the firewall's rules say nothing about it.

Network Watcher can show the effective routes for a network interface, which again is Azure's own evaluation and a useful check on your model.

### Peering

**Virtual network peering** connects two virtual networks. Peering is **not transitive**: if spoke A and spoke B both peer with the hub, A and B can't reach each other through the hub unless something in the hub forwards traffic between them, usually a firewall, with routes sending traffic to it. Peering settings such as **allow forwarded traffic** and **use remote gateways** decide whether forwarded and on-premises traffic can cross.

Peering also expands the `VirtualNetwork` service tag. When a new spoke is peered to a network, every NSG relying on the default `AllowVnetInBound` rule starts allowing it. Nothing in the NSG changed. Its meaning did.

### Firewalls

Azure Firewall, or a third-party network virtual appliance, filters traffic routed through it. Azure Firewall processes rule collections in a defined order (destination NAT rules, then network rules, then application rules) and denies traffic that no rule allows.

For reachability, the firewall is a filter applied to edges that routing sends through it. Model the rules the same way as NSG rules: priority, match, action, with `Unknown` for anything your evaluator can't decide, such as fully qualified domain name (FQDN) rules whose targets resolve differently over time. And treat broad rules as findings. The opening story's `10.0.0.0/8` to `10.0.0.0/8` rule turns a hub-and-spoke design into a flat network, regardless of how carefully the spokes were separated.

> **As of 2026-10:** Verify Azure Firewall rule processing order with firewall policy, including rule collection group priorities.

### Public IP addresses

Finally, the direct exposures: VMs with public IP addresses, load balancers and application gateways with public frontends, and NAT rules on firewalls. For each, the question is the same: what's listening behind it, and what do the NSGs and firewall rules allow from `Internet`? A management port such as SSH (22) or RDP (3389) open to the internet is the classic finding. Azure Bastion and just-in-time VM access exist to remove it.

---

## 5.5 DNS decides which path is used

Private endpoints rely on DNS. The service's public name, such as `custdata.blob.core.windows.net`, resolves through a `privatelink` alias. Clients whose resolver can see the linked **private DNS zone** (`privatelink.blob.core.windows.net`) get the private IP address. Everyone else gets the public address.

That has two consequences for reachability:

- **A client that resolves the public address uses the public path.** If public access is disabled, its requests fail. If public access is enabled, as in the opening story, they succeed, over the internet, and look exactly like a working private connection to the person testing.
- **DNS is configuration you must collect.** Which private DNS zones exist, which virtual networks they're linked to, and how on-premises resolvers forward queries are all part of the network evidence. Without them, you can say a private endpoint exists. You can't say which clients use it.

So a "private connectivity test" proves something only if it records what the name resolved to. Make that part of every recorded confirmation: the resolved address, the source address, and the result.

---

## 5.6 Computing configured reachability

Putting the layers together, the configured reachability of a data-plane endpoint from a source position comes down to a short list of questions:

**For a public endpoint:**

1. Is public network access enabled?
2. Does the service firewall admit the source (default action, IP rules, subnet rules with service endpoints, resource instance rules, trusted services)?

**For a private endpoint:**

1. Does a route exist from the source to the endpoint's private address (same network, peering, gateway, or forwarded through a firewall)?
2. If routed through a firewall, do its rules allow the flow?
3. If the subnet enforces NSGs on private endpoints, do they allow it?
4. Does the source's DNS resolve the service name to the private address? If not, the source uses the public endpoint instead, and the public questions apply.

**For a workload in a virtual network**, such as a VM or a container: the private endpoint questions, with the destination workload's NSGs in place of question 3.

Each answer is an observed fact (a property), a derived fact (an NSG evaluation), or a deterministic inference (a route through a firewall whose rules you evaluated, assuming nothing outside your collection interferes). Each `Unknown` is a gap.

### Network edges in the path graph

Chapter 4 built an identity graph with typed, cited edges, and searched only edges that mean "can". Network reachability fits the same model in two ways.

**As a derived edge.** `canReach` from a position node (Internet, a subnet, on-premises) to an endpoint node (a resource's public or private endpoint), with the port and the evidence that decided it. Like Chapter 4's `canControlCode`, it's derived from evidence-only facts: properties, rules, routes. The search never walks raw NSG rules.

**As a condition on data-plane edges.** Chapter 4's hop H7 was "Contributor can list `custdata`'s keys, and shared key access is enabled, so the holder can read its blob data." With network evidence, that becomes a set of `grants` edges, one per position from which the blob endpoint is reachable:

| Position | Reachable? | Evidence |
|----------|-----------|----------|
| Internet | Yes | `publicNetworkAccess` Enabled, `defaultAction` Allow (observed) |
| Payments spoke | Yes | Private endpoint, same network, NSG policies off (derived) |
| Development spoke | Yes | Peered to hub; firewall rule `10.0.0.0/8` → `10.0.0.0/8` allows any port (deterministic inference) |
| On-premises | Unknown | On-premises DNS forwarding not collected (gap) |

The identity path didn't change. Its **reach** did: the holder of the key can use it from anywhere. Disabling public network access on `custdata` would remove the first row, so a key leaked outside Contoso's networks would stop working, without touching a single role assignment. That's a network cut point, and Chapter 9 compares it with the identity cut points from Chapter 4.

### Collecting the inputs

Chapter 3's collector already reads storage accounts. Reachability needs more, all available to Reader through Azure Resource Graph or ARM:

- PaaS resources with their `publicNetworkAccess`, firewall rules, and private endpoint connections,
- virtual networks, subnets (with route table, NSG, service endpoints, and private endpoint network policies), and peerings,
- NSGs with their rules, route tables with their routes,
- private endpoints, private DNS zones, and their virtual network links,
- firewalls and firewall policies with rule collections,
- public IP addresses and what they're attached to,
- service tag prefixes, from Microsoft's published list, with its version.

Treat anything you can't read, such as a firewall policy in a subscription the collector can't see, as a gap that makes dependent edges `Unknown`. A hub you can't read makes every spoke-to-spoke answer unknown, and the report should say so.

---

## 5.7 Observed reachability

Configuration says what can happen. To say what did, you need logs that record connections. Azure has several, at different layers:

- **Virtual network flow logs** record flows through a virtual network, with source and destination addresses, ports, and whether the flow was allowed. They replace the older **NSG flow logs**, which Microsoft is retiring.
- **Azure Firewall logs** record flows the firewall allowed or denied, and which rule decided.
- **Resource logs on PaaS services** record requests to the service itself. For storage, the blob logs include the caller's IP address, the operation, and the authentication type. That's the most direct evidence of who reached `custdata` and from where.
- **Traffic Analytics** summarizes flow logs into a queryable workspace.

> **As of 2026-10:** Verify the NSG flow log retirement timeline, virtual network flow log availability and schema, storage blob resource log fields (`CallerIpAddress`, `AuthenticationType`), and Traffic Analytics positioning.

Observed reachability answers questions configuration can't:

- **Is the public path in use?** If `custdata`'s blob logs show requests from public addresses, someone relies on the public endpoint. Disabling it will break them, and you need to find out who first. If the logs show only private addresses over a representative period, disabling public access is low-risk. This is the precondition check Chapter 7 asked remediation drafts to list.
- **Is a firewall rule used?** If the broad `10.0.0.0/8` rule has matched only a handful of specific flows in ninety days, you can replace it with rules for those flows.
- **Does the model match reality?** Any observed flow your configured model says is impossible is a defect to investigate.

Two cautions, both from Chapter 2:

- **No log is not no traffic.** "We saw no public requests" means something only if logging was enabled for the whole period, on every relevant sub-resource, and the logs were retained. Record that as part of the observation, and treat missing logging as a gap.
- **Observed is not authorized.** A flow in the logs shows that a connection happened. It doesn't show that it was legitimate. Which flows should happen is intended reachability, and it comes from people.

Observation costs money. Flow logs and resource logs generate storage and ingestion charges, sometimes large ones. Start with the resources at the ends of your most important paths: the customer data stores, the key vaults, the management ports. Then expand. Logging everything everywhere before you know which questions you're asking is a common way to spend a budget without answering them.

---

## 5.8 Intended reachability

Intended reachability is a human assertion: "`custdata` should be reached only by the payments application, through its private endpoint." It's the baseline every configured and observed fact is compared against, and it's usually the hardest to obtain, because nobody wrote it down.

Some practical ways to collect it:

- **Ask owners for a short statement per sensitive resource**, in the same form Chapter 2 used for data classification: who asserted it, when, and when it expires. "Reached only from `snet-payments-app`, private endpoint only, asserted by the payments platform lead, 2026-10-01, expires 2027-04-01."
- **Encode common intents as policy.** Azure Policy can audit or deny public network access on storage, Key Vault, SQL, and many other services. A policy assignment is a machine-readable statement of intent, and its compliance results are a ready-made comparison between intended and configured reachability.
- **Use tags carefully.** A tag such as `network-intent=private` is convenient and easy to query. It's also a human assertion anyone with tag write can change, and, as Chapter 8 showed, text a pipeline reads. Record who set it, and never let a tag override configuration evidence.

Without intended reachability, the best you can report is configured reachability ranked by consequence. That's still useful. But the most valuable finding in this chapter, "this was meant to be private and isn't", needs the intent.

---

## 5.9 Where AI fits

Network configuration is dense, repetitive, and full of numbers. That makes it a natural place to try a language model, and a dangerous one.

**Explanation works well.** Given an evaluated result with citations, a model can turn it into prose people can act on:

> `custdata` can be reached from the internet, because public network access is enabled and its firewall allows all networks [N1]. The private endpoint added in the hardening project gives the payments app a private path [N2], but doesn't close the public one. Disabling public network access would remove internet reachability [C2]. Blob logs aren't enabled, so we can't tell whether anyone currently uses the public endpoint [G1].

That's Chapter 7's grounding pattern, and it works for the same reasons. The model is narrating results computed elsewhere.

**Translating rules into intent works, with review.** A model can read a long NSG or firewall rule set and suggest what each rule is for ("rules 200 to 240 appear to allow the monitoring agents"). Treat those suggestions as AI inferences, label them, and confirm them with owners before they become intended reachability.

**Evaluation fails.** Don't ask a model whether `10.20.4.7` falls inside `10.20.0.0/20`, which rule wins between priorities 300 and 310, or which route applies to a given prefix. These are exact computations on numbers. Models get them wrong often enough to matter, and confidently. The code in section 5.4 is short and always right on the cases it handles, and it reports the ones it can't.

**Reachability search fails** for the same reasons graph search failed in Chapter 4: it must be exhaustive and repeatable. A model asked "what can reach `custdata`?" from a pile of NSG exports will find some routes and invent others.

The rule from earlier chapters holds: compute reachability deterministically, label every result with its evidence category, and use the model to explain.

---

## 5.10 Lab: what can reach `custdata`?

This lab reproduces the opening story and separates its four kinds of reachability. It uses the companion lab tenant (Appendix A), which includes `custdata` with a private endpoint in the payments spoke, public network access enabled, a hub firewall with a broad spoke-to-spoke rule, and a development spoke.

**Step 1 — Find unfinished private endpoints.** Run the query from section 5.3 against the lab tenant. Confirm that `custdata` appears, with public access enabled. Note any other rows, and for each, write down whether you think it's deliberate. That's an AI-free intended-reachability exercise: you're the human making the assertion.

**Step 2 — Classify public exposure.** Extend the Chapter 3 collector to save PaaS network properties, then run `storage_public_exposure` over every storage account in the snapshot. List each account's classification with its reasons. Confirm `custdata` comes back as "internet".

**Step 3 — Collect the network.** Add virtual networks, subnets, peerings, NSGs, route tables, private endpoints, private DNS zones and links, the firewall policy, and the current service tag file to the collector. Record any you can't read as gaps. Rewrite the manifest (Chapter 3).

**Step 4 — Compute configured reachability.** For `custdata`'s blob endpoint, answer section 5.6's questions from four positions: internet, payments spoke, development spoke, and on-premises. Use `evaluate_inbound` for NSG rules and the same pattern for the firewall's network rules. Produce the table from section 5.6, with an evidence category and a citation for every row. Check one answer against Network Watcher's IP flow verify or effective routes.

**Step 5 — Check DNS.** From a VM in the development spoke and from your own machine, resolve `custdata.blob.core.windows.net` and record the address. Explain each result using the private DNS zone links you collected.

**Step 6 — Observe.** Enable blob resource logs on `custdata`, sending them to a Log Analytics workspace. Generate traffic from the payments Function App and from your own machine. Query the logs for caller IP addresses and authentication types. Confirm you can tell private-path requests from public-path requests.

**Step 7 — Connect to Chapter 4.** Add `canReach` edges to the identity graph from Chapter 4's lab, and make the `grants` edge for reading `custdata` conditional on the position. Re-run `find_paths` from an internet-positioned entry point and from a development-spoke entry point.

**Step 8 — Apply the network fix.** Disable public network access on `custdata`, re-collect, and re-compute. Confirm the internet row disappears, the Function App still works, and your request from Step 6 now fails. Then narrow the firewall rule to the flows the payments spoke actually needs, and confirm the development spoke row changes from "Yes" to "No".

**What you should see.** Before the fix, the identity path ends at "holds a key", and the key works from anywhere. After disabling public access, the same identity path still exists, but only from inside Contoso's networks. That shrinks who can use it, without changing any role. The DNS step usually produces at least one surprise. The observation step turns "we think nobody uses the public endpoint" into a fact with a time window, which is what makes the fix safe to apply.

---

## Summary

- Network controls mostly don't affect the **control plane**, which goes through ARM. They decide **data-plane** reachability: **from where** each data-plane hop can be used.
- Keep four kinds of reachability separate: **intended** (human assertion), **configured** (derived from configuration), **observed** (logs), and **confirmed** (recorded tests). Disagreements between them are findings.
- For PaaS services, check **public network access** and the **service firewall** together. Treat unset and unrecognized values explicitly, and keep the reasons with every classification.
- **Private endpoints add a private path. They don't close the public one.** Query for resources with both.
- **Service endpoints** and **virtual network integration** are different controls from private endpoints, and the latter is outbound only.
- Inside networks, reachability depends on **routes, NSGs, and firewalls**. The default `AllowVnetInBound` rule admits **peered and connected networks**, and NSGs apply to private endpoints only when the subnet enables it.
- **DNS decides which path a client uses.** Record resolved addresses in every connectivity test.
- Model reachability as **derived `canReach` edges** and as **conditions on data-plane hops**. A network change can shrink an identity path's reach without touching roles.
- Use **flow logs, firewall logs, and resource logs** for observation, starting at the ends of important paths. No log is not no traffic.
- Use AI to **explain** reachability results. Never to evaluate CIDR ranges, rule priority, or routes, or to search for reachability.

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

- Verify: storage `publicNetworkAccess` values (including perimeter-related values) and unset behavior; `networkAcls` fields (`ipRules`, `virtualNetworkRules`, `resourceAccessRules`, `bypass`); portal label wording; interaction of trusted-services bypass with `Disabled`.
- Verify: SQL "Allow Azure services and resources to access this server" representation as `0.0.0.0`–`0.0.0.0` and its scope; App Service SCM access restriction inheritance setting; App Service `publicNetworkAccess`.
- Verify: NSG priority range, default rules, `VirtualNetwork` tag scope (peered networks, gateway-connected on-premises), subnet/interface evaluation order; private endpoint network policies property and default.
- Verify: Azure Firewall rule processing order under firewall policy; peering settings names.
- Verify: NSG flow log retirement dates, virtual network flow logs, storage blob log fields, Traffic Analytics.
- Verify: Network Watcher IP flow verify, effective security rules, and effective routes feature names and scope.
- Test `storage_public_exposure` and `evaluate_inbound` against lab data, and the Resource Graph query against a tenant with mixed resource types (some types store `publicNetworkAccess` elsewhere or not at all).
- "Most, in my experience, are unfinished projects" is an author-experience claim; keep it attributed.
- Consider a figure showing the payments hub-and-spoke with the four positions.
- Add the Chapter 5 fact checks to GTM **M-306** when it is picked up.
