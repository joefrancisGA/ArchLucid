import argparse
import sys

def parse_prometheus_metrics(metrics_file):
    metrics = []
    with open(metrics_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if 'archlucid_llm_completion_tokens' in line or 'archlucid_llm_prompt_tokens' in line:
                metrics.append(line)
    return metrics

def main():
    parser = argparse.ArgumentParser(description="Aggregate LLM token metrics from Prometheus text format")
    parser.add_argument("--metrics", required=True, help="Path to Prometheus metrics file")
    parser.add_argument("--output", required=True, help="Path to output markdown report file")
    args = parser.parse_args()

    metrics = parse_prometheus_metrics(args.metrics)

    with open(args.output, 'w') as f:
        f.write("# LLM Token Metrics Report\n\n")
        f.write("## Token Dimensions\n\n")
        f.write("```text\n")
        for m in metrics:
            f.write(m + "\n")
        f.write("```\n")

if __name__ == "__main__":
    main()