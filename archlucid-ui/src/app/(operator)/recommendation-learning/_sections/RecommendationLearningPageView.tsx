"use client";
import { cn } from "@/lib/utils";

import { Sparkles } from "lucide-react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EmptyState } from "@/components/EmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { RecommendationLearningPageViewModel } from "./recommendation-learning-page-view-model";
import {
  buildTopLearnedSignals,
  countRecordsAnalyzed,
  formatProfileGeneratedUtc,
  listTunedCategories,
  profileHasInsufficientHistory,
} from "./recommendation-learning-display";

type Props = {
  readonly model: RecommendationLearningPageViewModel;
};

const WHAT_THIS_AFFECTS = [
  "Recommendation priority in advisory views",
  "Urgency scoring",
  "Category weighting",
  "Inferred signal type weighting",
] as const;

export function RecommendationLearningPageView(props: Props) {
  const m = props.model;
  const hasProfile = m.profile !== null;
  const insufficientHistory = hasProfile && profileHasInsufficientHistory(m.profile);
  const hasMeaningfulProfile = hasProfile && !insufficientHistory;
  const learnedSignals = hasMeaningfulProfile ? buildTopLearnedSignals(m.profile) : [];
  const tunedCategories = hasMeaningfulProfile ? listTunedCategories(m.profile) : [];

  return (
    <div className={`max-w-4xl ${OPERATOR_LAYOUT.sectionStack}`}>
      <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Recommendation tuning</h2>
        <p className={cn("leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Tune how ArchLucid ranks advisory recommendations based on accepted, deferred, rejected, and implemented
          outcomes. This is an advanced admin tool for improving advisory ranking from historical outcomes.
        </p>
      </div>

      <Card className="border-neutral-200 dark:border-neutral-700">
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>What this affects</CardTitle>
        </CardHeader>
        <CardContent className={OPERATOR_CARD.content}>
          <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {WHAT_THIS_AFFECTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => void m.loadLatest()} disabled={m.loading}>
          Load current tuning profile
        </Button>
        <Button type="button" variant="outline" onClick={() => void m.rebuild()} disabled={m.loading}>
          Rebuild tuning profile
        </Button>
      </div>

      {m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}

      {m.loading ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
          Loading tuning profile…
        </p>
      ) : null}

      {!m.loading && m.failure === null && !hasProfile ? (
        <EmptyState
          icon={Sparkles}
          title="No tuning profile available"
          description="A tuning profile is created after ArchLucid has enough recommendation outcome history. Load the current profile or rebuild once outcomes exist."
          gettingStarted={{
            heading: "How to build history",
            steps: [
              "Generate recommendations from completed review packages.",
              "Mark each recommendation accepted, deferred, rejected, or implemented.",
              "Return here to load or rebuild the tuning profile.",
            ],
          }}
        />
      ) : null}

      {!m.loading && m.failure === null && insufficientHistory ? (
        <EmptyState
          icon={Sparkles}
          title="Not enough recommendation history yet"
          description="ArchLucid needs completed recommendation outcomes before it can build a meaningful tuning profile."
          gettingStarted={{
            heading: "Next steps",
            steps: [
              "Generate recommendations from advisory or review workflows.",
              "Mark them accepted, deferred, rejected, or implemented.",
              "Rebuild the tuning profile when history is available.",
            ],
          }}
        />
      ) : null}

      {hasMeaningfulProfile ? (
        <>
          <Card className="border-neutral-200 dark:border-neutral-700">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Current tuning profile</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              <dl className="m-0 grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className={OPERATOR_NAV_GROUP_LABEL}>Last rebuilt</dt>
                  <dd className="m-0 text-al-text-primary">{formatProfileGeneratedUtc(m.profile.generatedUtc)}</dd>
                </div>
                <div>
                  <dt className={OPERATOR_NAV_GROUP_LABEL}>Records analyzed</dt>
                  <dd className="m-0 text-al-text-primary">{countRecordsAnalyzed(m.profile).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className={OPERATOR_NAV_GROUP_LABEL}>Categories tuned</dt>
                  <dd className="m-0 text-al-text-primary">
                    {tunedCategories.length > 0 ? tunedCategories.join(", ") : "None yet"}
                  </dd>
                </div>
                <div>
                  <dt className={OPERATOR_NAV_GROUP_LABEL}>Mode</dt>
                  <dd className="m-0 text-al-text-primary">Advisory ranking only</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {learnedSignals.length > 0 ? (
            <section aria-labelledby="recommendation-tuning-signals-heading">
              <h3 id="recommendation-tuning-signals-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                Top learned signals
              </h3>
              <ul className={cn("mt-2 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {learnedSignals.map((signal) => (
                  <li key={signal.label}>{signal.label}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <CollapsibleSection
            title="Weight details"
            defaultOpen={false}
            sectionTestId="recommendation-tuning-weight-details"
          >
            <div className={cn("space-y-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <h4 className={cn("mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Category weights</h4>
                <ul className="m-0 list-disc pl-5">
                  {Object.entries(m.profile.categoryWeights).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className={cn("mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Urgency weights</h4>
                <ul className="m-0 list-disc pl-5">
                  {Object.entries(m.profile.urgencyWeights).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className={cn("mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Signal type weights</h4>
                <ul className="m-0 list-disc pl-5">
                  {Object.entries(m.profile.signalTypeWeights).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CollapsibleSection>
        </>
      ) : null}
    </div>
  );
}
