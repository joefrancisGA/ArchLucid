# Capture-recapture defect estimation

`scripts/assurance/capture_recapture.py` implements the Chapman two-sample estimator over defect IDs found by two inspectors/hunt methods.

The output is an **exploratory residual-risk signal**, never a probability that the product is correct.

## Assumption warnings

Classical capture-recapture assumes roughly independent capture mechanisms and roughly equal catchability. Software defects violate both assumptions:

- two AI systems may share training/model biases;
- obvious defects are much easier to find than subtle semantic defects;
- one inspector can change the code before another samples it;
- zone selection changes the population.

Use the estimate to ask whether another independent hunt is economically justified, not to publish “99.9% defect free.”
