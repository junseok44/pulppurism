import { Check } from "lucide-react";

interface TimelineStep {
  label: string;
  status: "completed" | "current" | "upcoming";
  date?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export default function Timeline({ steps }: TimelineProps) {
  return (
    <div className="space-y-4" data-testid="timeline">
      <h3 className="font-semibold text-lg">진행상황</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4" data-testid={`timeline-step-${index}`}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step.status === "completed"
                    ? "bg-primary border-primary text-primary-foreground"
                    : step.status === "current"
                    ? "border-primary bg-background"
                    : "border-muted bg-background"
                }`}
              >
                {step.status === "completed" && <Check className="w-4 h-4" />}
                {step.status === "current" && (
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-12 ${
                    step.status === "completed" ? "bg-primary" : "bg-muted"
                  }`}
                ></div>
              )}
            </div>
            <div className="flex-1 pb-8">
              <p
                className={`font-medium ${
                  step.status === "upcoming" ? "text-muted-foreground" : ""
                }`}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-sm text-muted-foreground">{step.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
