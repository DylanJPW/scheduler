import { EXPECTED_SOLVE_MS } from "../../constants";
import type { Problem } from "../../validation";

interface SolvePanelProps {
  problems: Problem[];
  onShowMe: (problem: Problem) => void;
  onSolve: () => void;
  isSolving: boolean;
  elapsedMs: number;
  error: string | null;
}

const ProblemRow = ({
  problem,
  onShowMe,
}: {
  problem: Problem;
  onShowMe: (problem: Problem) => void;
}) => (
  <li className="flex flex-wrap items-baseline gap-2">
    <span
      aria-hidden="true"
      className={problem.severity === "error" ? "text-red-300" : "text-amber-200"}
    >
      {problem.severity === "error" ? "✕" : "!"}
    </span>
    <span className="sr-only">
      {problem.severity === "error" ? "Error:" : "Warning:"}
    </span>
    <span>{problem.message}</span>
    {problem.entityIds && problem.entityIds.length > 0 && (
      <button
        type="button"
        className="underline cursor-pointer opacity-90 hover:opacity-100"
        onClick={() => onShowMe(problem)}
      >
        show me
      </button>
    )}
  </li>
);

export const SolvePanel = ({
  problems,
  onShowMe,
  onSolve,
  isSolving,
  elapsedMs,
  error,
}: SolvePanelProps) => {
  const errors = problems.filter((p) => p.severity === "error");
  const warnings = problems.filter((p) => p.severity === "warning");
  const blocked = errors.length > 0;

  const progress = Math.min(0.97, elapsedMs / EXPECTED_SOLVE_MS);
  const seconds = Math.floor(elapsedMs / 1000);

  return (
    <div className="w-full border border-slate-600 rounded-lg">
      <h2 className="text-2xl font-semibold text-left p-3 pb-0">
        <span className="opacity-70">4.</span> Solve
      </h2>

      {(errors.length > 0 || warnings.length > 0) && (
        <div className="p-3 flex flex-col gap-3 text-left">
          {errors.length > 0 && (
            <div>
              <p className="font-semibold text-red-200">
                {errors.length} thing{errors.length === 1 ? "" : "s"} to fix before
                solving
              </p>
              <ul className="pt-2 flex flex-col gap-1">
                {errors.map((problem) => (
                  <ProblemRow
                    key={problem.id}
                    problem={problem}
                    onShowMe={onShowMe}
                  />
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <p className="font-semibold text-amber-200">
                {warnings.length} thing{warnings.length === 1 ? "" : "s"} worth a
                look
              </p>
              <ul className="pt-2 flex flex-col gap-1">
                {warnings.map((problem) => (
                  <ProblemRow
                    key={problem.id}
                    problem={problem}
                    onShowMe={onShowMe}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isSolving && (
        <div className="px-3 pb-3" role="status" aria-live="polite">
          <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-[width] duration-200 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-sm opacity-80 pt-2 text-left">
            Working out the timetable — this takes about{" "}
            {Math.round(EXPECTED_SOLVE_MS / 1000)} seconds. {seconds}s so far.
          </p>
        </div>
      )}

      <div className="flex flex-row flex-wrap items-center justify-end gap-4 p-3 border-t border-slate-700">
        {error && (
          <p className="text-red-300 text-sm text-right grow" role="alert">
            {error}
          </p>
        )}
        {blocked && !isSolving && (
          <p className="text-sm opacity-80">
            Fix the {errors.length} problem{errors.length === 1 ? "" : "s"} above
            to solve.
          </p>
        )}
        <button
          type="button"
          className="bg-blue-800 rounded-lg px-4 py-2 min-w-32 hover:cursor-pointer hover:bg-blue-700 transition-[background-color] duration-250 disabled:bg-slate-600 disabled:cursor-not-allowed"
          onClick={onSolve}
          disabled={isSolving || blocked}
        >
          {isSolving ? "Solving…" : "Solve"}
        </button>
      </div>
    </div>
  );
};