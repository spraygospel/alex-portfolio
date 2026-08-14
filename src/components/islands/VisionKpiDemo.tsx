import { useEffect, useRef, useState } from "react";
import results from "../../data/vision-kpi-results.json";

type Phase = "idle" | "processing" | "done";
type View = "sku" | "compartment";

const STATUS_MESSAGES = ["Loading model weights...", "Running YOLOv11 inference...", "Calculating shelf KPI..."];
const PROCESSING_MS = 2700;

const STEPS = ["Choose a photo", "Run detection model", "Result"];

function bandFor(pct: number) {
  if (pct >= 80) return { label: "Excellent", dot: "bg-accent", text: "text-accent" };
  if (pct >= 60) return { label: "Good", dot: "bg-ink-muted", text: "text-ink-muted" };
  if (pct >= 40) return { label: "Fair", dot: "bg-warn", text: "text-warn" };
  return { label: "Poor", dot: "bg-danger", text: "text-danger" };
}

function formatSlotStatus(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function stepIndexFor(phase: Phase) {
  if (phase === "idle") return 0;
  if (phase === "processing") return 1;
  return 2;
}

function Stepper({ phase }: { phase: Phase }) {
  const active = stepIndexFor(phase);
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {STEPS.map((title, i) => (
          <div key={title} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-mono shrink-0 transition-colors ${
                  i < active
                    ? "bg-accent text-white"
                    : i === active
                      ? "border-2 border-accent text-accent bg-accent-soft"
                      : "border border-border text-ink-faint"
                }`}
              >
                {i < active ? "✓" : i + 1}
              </span>
              <span
                className={`hidden sm:inline text-xs font-mono whitespace-nowrap ${
                  i <= active ? "text-ink" : "text-ink-faint"
                }`}
              >
                {title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`flex-1 h-px mx-2 sm:mx-3 min-w-3 ${i < active ? "bg-accent" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>
      <p className="sm:hidden text-xs font-mono text-ink-muted mt-2">
        Step {active + 1} of {STEPS.length} — {STEPS[active]}
      </p>
    </div>
  );
}

function MetricBar({ label, pct }: { label: string; pct: number }) {
  const band = bandFor(pct);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="label-mono">{label}</p>
        <p className={`text-xs font-mono flex items-center gap-1.5 ${band.text}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${band.dot}`} />
          {pct.toFixed(1)}% · {band.label}
        </p>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${band.dot}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ZoomButton({ onClick, className = "" }: { onClick: (e: React.MouseEvent) => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Zoom in on this photo"
      onClick={onClick}
      className={`flex items-center justify-center w-8 h-8 rounded-full bg-ink/60 text-white backdrop-blur-sm hover:bg-ink/80 transition-colors ${className}`}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    </button>
  );
}

export default function VisionKpiDemo() {
  const [selectedId, setSelectedId] = useState<string>(results[0].id);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusIndex, setStatusIndex] = useState(0);
  const [view, setView] = useState<View>("sku");
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const selected = results.find((r) => r.id === selectedId)!;
  const overallBand = bandFor(selected.overallScore);
  const slotEntries = Object.entries(selected.caseSlotBreakdown);
  const resultSrc =
    phase === "done" ? `/demo/vision-kpi/annotated/${selectedId}-${view}.jpg` : `/demo/vision-kpi/raw/${selectedId}.jpg`;

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (interval.current) clearInterval(interval.current);
  }

  function runDetection() {
    clearTimers();
    setStatusIndex(0);
    setView("sku");
    setPhase("processing");

    interval.current = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 900);

    timers.current.push(
      setTimeout(() => {
        if (interval.current) clearInterval(interval.current);
        setPhase("done");
      }, PROCESSING_MS)
    );
  }

  function reset() {
    clearTimers();
    setPhase("idle");
  }

  function scrollTrack(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.7, behavior: "smooth" });
  }

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (!zoomSrc) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomSrc(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomSrc]);

  return (
    <div>
      <Stepper phase={phase} />

      {/* Step 1 */}
      <p className="label-mono mb-3">1 · Choose a freezer photo</p>
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll photos left"
          onClick={() => scrollTrack(-1)}
          className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-8 h-8 rounded-full border border-border bg-surface text-ink-muted hover:border-accent hover:text-accent shadow-sm"
        >
          ‹
        </button>

        <div
          ref={trackRef}
          role="radiogroup"
          aria-label="Choose a freezer photo"
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar px-1 py-1"
        >
          {results.map((r) => (
            <div key={r.id} className="relative shrink-0 w-44 sm:w-56 snap-start">
              <button
                type="button"
                role="radio"
                aria-checked={selectedId === r.id}
                disabled={phase === "processing"}
                onClick={() => {
                  setSelectedId(r.id);
                  if (phase === "done") setPhase("idle");
                }}
                className={`block w-full rounded-xl overflow-hidden border-2 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedId === r.id ? "border-accent" : "border-border hover:border-border-strong"
                }`}
              >
                <img
                  src={`/demo/vision-kpi/thumbs/${r.id}.jpg`}
                  alt={r.label}
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <p className="text-xs font-mono px-2 py-1.5 text-ink-muted truncate">{r.label}</p>
              </button>
              <ZoomButton
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomSrc(`/demo/vision-kpi/raw/${r.id}.jpg`);
                }}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Scroll photos right"
          onClick={() => scrollTrack(1)}
          className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-8 h-8 rounded-full border border-border bg-surface text-ink-muted hover:border-accent hover:text-accent shadow-sm"
        >
          ›
        </button>
      </div>
      <p className="text-xs text-ink-faint mt-3">
        The shelves are packed with small items — tap the magnifier on any photo to zoom in before choosing.
      </p>

      {/* Step 2 */}
      <p className="label-mono mt-10 mb-3">2 · Run detection model</p>
      <div className="flex items-center gap-3">
        {phase !== "done" ? (
          <button
            type="button"
            onClick={runDetection}
            disabled={phase === "processing"}
            className="inline-flex items-center gap-2 rounded-lg font-medium transition-colors text-sm px-5 py-2.5 bg-accent text-white hover:bg-accent-strong disabled:opacity-60 disabled:cursor-wait"
          >
            {phase === "processing" ? "Running…" : "Run Detection"}
          </button>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg font-medium transition-colors text-sm px-5 py-2.5 border border-border bg-surface text-ink hover:border-accent hover:text-accent"
          >
            ← Try another image
          </button>
        )}
        {phase === "processing" && (
          <p className="font-mono text-sm text-ink-muted animate-pulse">{STATUS_MESSAGES[statusIndex]}</p>
        )}
      </div>

      {/* Step 3 */}
      <p className="label-mono mt-10 mb-3">3 · Result</p>
      {phase === "idle" ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-ink-muted">
          Choose a photo and run detection above to see the compliance score here.
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            <button
              type="button"
              aria-label="Zoom in on this photo"
              onClick={() => setZoomSrc(resultSrc)}
              className="relative rounded-2xl overflow-hidden border border-border bg-surface w-full block text-left cursor-zoom-in"
            >
              <img
                src={resultSrc}
                alt={phase === "done" ? `Detection result for ${selected.label}` : selected.label}
                className="w-full h-auto block"
              />
              {phase === "processing" && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-x-0 h-1 bg-accent/70 shadow-[0_0_20px_4px] shadow-accent/50 scan-line" />
                  <div className="absolute inset-0 bg-paper/10" />
                </div>
              )}
              <ZoomButton className="absolute bottom-3 right-3" onClick={() => setZoomSrc(resultSrc)} />
            </button>
            {phase === "done" && (
              <div className="flex gap-1.5 mt-3">
                {(["sku", "compartment"] as View[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`text-xs font-mono px-3 py-1.5 rounded-md border transition-colors ${
                      view === v
                        ? "border-accent text-accent bg-accent-soft"
                        : "border-border text-ink-muted hover:border-border-strong"
                    }`}
                  >
                    {v === "sku" ? "SKU detection" : "Compartment detection"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {phase === "done" ? (
              <>
                <div className="p-4 rounded-xl border border-border bg-surface">
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono text-2xl font-medium text-ink">{selected.overallScore.toFixed(1)}</p>
                    <p className={`text-xs font-mono flex items-center gap-1.5 ${overallBand.text}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${overallBand.dot}`} />
                      {overallBand.label}
                    </p>
                  </div>
                  <p className="label-mono mt-1">Overall score / 100</p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
                  <MetricBar label="Fullness" pct={selected.fullnessPct} />
                  <MetricBar label="Tidiness" pct={selected.tidinessPct} />
                  <MetricBar label="Completeness" pct={selected.completenessPct} />
                </div>

                <div className="p-4 rounded-xl border border-border bg-surface">
                  <p className="font-mono text-lg font-medium text-ink">
                    {selected.uniqueSkuCount}/{selected.totalSkuCatalog}
                  </p>
                  <p className="label-mono mt-1">Unique SKUs detected</p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-surface">
                  <p className="label-mono mb-2">Case slot breakdown</p>
                  <ul className="text-sm text-ink-muted space-y-1">
                    {slotEntries.map(([key, count]) => (
                      <li key={key} className="flex items-center justify-between">
                        <span>{formatSlotStatus(key)}</span>
                        <span className="font-mono text-ink">{count as number}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-border text-sm text-ink-muted leading-relaxed">
                Scoring fullness, tidiness, completeness, and per-slot detection…
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-ink-faint mt-6 max-w-2xl">
        These are real photos from real store visits, run through the actual model — SKU labels are censored in the
        annotated images to keep individual product identities confidential. Results are precomputed for consistent
        demo performance; the loading step above simulates inference time rather than running the model live in
        your browser.
      </p>

      {zoomSrc && (
        <div
          className="fixed inset-0 z-50 bg-ink/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10"
          onClick={() => setZoomSrc(null)}
        >
          <button
            type="button"
            aria-label="Close zoom"
            onClick={() => setZoomSrc(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center justify-center w-10 h-10 rounded-full bg-surface text-ink text-xl hover:bg-paper"
          >
            ×
          </button>
          <img
            src={zoomSrc}
            alt="Zoomed freezer photo"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
