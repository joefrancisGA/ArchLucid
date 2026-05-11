import json

qualities = {
    "COMMERCIAL": {
        "Marketability": {"weight": 8, "score": 80},
        "Time-to-Value": {"weight": 7, "score": 85},
        "Adoption Friction": {"weight": 6, "score": 75},
        "Proof-of-ROI Readiness": {"weight": 5, "score": 70},
        "Executive Value Visibility": {"weight": 4, "score": 65},
        "Differentiability": {"weight": 4, "score": 85},
        "Decision Velocity": {"weight": 2, "score": 60},
        "Commercial Packaging Readiness": {"weight": 2, "score": 80},
        "Stickiness": {"weight": 1, "score": 85},
        "Template and Accelerator Richness": {"weight": 1, "score": 50}
    },
    "ENTERPRISE": {
        "Traceability": {"weight": 3, "score": 90},
        "Usability": {"weight": 3, "score": 75},
        "Workflow Embeddedness": {"weight": 3, "score": 85},
        "Trustworthiness": {"weight": 3, "score": 80},
        "Auditability": {"weight": 2, "score": 85},
        "Policy and Governance Alignment": {"weight": 2, "score": 75},
        "Compliance Readiness": {"weight": 2, "score": 70},
        "Procurement Readiness": {"weight": 2, "score": 75},
        "Interoperability": {"weight": 2, "score": 85},
        "Accessibility": {"weight": 1, "score": 40},
        "Customer Self-Sufficiency": {"weight": 1, "score": 65},
        "Change Impact Clarity": {"weight": 1, "score": 80}
    },
    "ENGINEERING": {
        "Correctness": {"weight": 8, "score": 85},
        "AI/Agent Readiness": {"weight": 8, "score": 90},
        "Architectural Integrity": {"weight": 3, "score": 95},
        "Security": {"weight": 3, "score": 85},
        "Reliability": {"weight": 2, "score": 80},
        "Data Consistency": {"weight": 2, "score": 90},
        "Maintainability": {"weight": 2, "score": 85},
        "Explainability": {"weight": 2, "score": 80},
        "Azure Compatibility and SaaS Deployment Readiness": {"weight": 2, "score": 95},
        "Availability": {"weight": 1, "score": 80},
        "Performance": {"weight": 1, "score": 85},
        "Scalability": {"weight": 1, "score": 85},
        "Supportability": {"weight": 1, "score": 75},
        "Manageability": {"weight": 1, "score": 80},
        "Deployability": {"weight": 1, "score": 90},
        "Observability": {"weight": 1, "score": 85},
        "Testability": {"weight": 1, "score": 85},
        "Modularity": {"weight": 1, "score": 90},
        "Extensibility": {"weight": 1, "score": 80},
        "Evolvability": {"weight": 1, "score": 85},
        "Documentation": {"weight": 1, "score": 80},
        "Azure Ecosystem Fit": {"weight": 1, "score": 95},
        "Cognitive Load": {"weight": 1, "score": 70},
        "Cost-Effectiveness": {"weight": 1, "score": 85}
    }
}

total_weight = 0
total_weighted_score = 0
results = []

for category, items in qualities.items():
    for name, data in items.items():
        weight = data["weight"]
        score = data["score"]
        weighted_score = weight * score
        deficiency = 100 - score
        weighted_deficiency = weight * deficiency
        
        total_weight += weight
        total_weighted_score += weighted_score
        
        results.append({
            "category": category,
            "name": name,
            "score": score,
            "weight": weight,
            "weighted_deficiency": weighted_deficiency
        })

overall_readiness = total_weighted_score / total_weight

results.sort(key=lambda x: x["weighted_deficiency"], reverse=True)

print(f"Overall Readiness: {overall_readiness:.2f}%")
print("\nRanked by Weighted Deficiency:")
for r in results:
    print(f"{r['name']} ({r['category']}): Score {r['score']}, Weight {r['weight']}, Weighted Deficiency {r['weighted_deficiency']}")

