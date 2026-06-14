"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { createClient } from "genlayer-js";
import { testnetBradbury as glTestnetBradbury } from "genlayer-js/chains";
import type { Address } from "viem";
import { Check, Loader2, AlertTriangle, Info, ArrowLeft, ArrowRight, Send, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import { GENATIO_CONTRACT } from "@/lib/genatio";

type Step = 1 | 2 | 3;
type Duration = "7" | "14" | "30";

interface FormData {
  title: string;
  about: string;
  goalGen: string;
  durationDays: Duration;
  githubUrl: string;
  liveUrl: string;
  fundingPurpose: string;
}

const EMPTY_FORM: FormData = {
  title: "",
  about: "",
  goalGen: "",
  durationDays: "30",
  githubUrl: "",
  liveUrl: "",
  fundingPurpose: "",
};

function validateStep1(d: FormData): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.title.trim()) e.title = "Title is required";
  if (!d.about.trim()) e.about = "Project description is required";
  if (!d.goalGen) e.goalGen = "Funding goal is required";
  else if (isNaN(Number(d.goalGen)) || Number(d.goalGen) <= 0)
    e.goalGen = "Goal must be a positive number";
  return e;
}

function validateStep2(d: FormData): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.githubUrl.trim()) e.githubUrl = "GitHub URL is required";
  else if (!d.githubUrl.startsWith("https://github.com/"))
    e.githubUrl = "Must start with https://github.com/";
  if (!d.liveUrl.trim()) e.liveUrl = "Live URL is required";
  else if (!d.liveUrl.startsWith("https://"))
    e.liveUrl = "Must start with https://";
  if (!d.fundingPurpose.trim())
    e.fundingPurpose = "Please describe how you will use the funds";
  return e;
}

const inputBase: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.75rem 1rem",
  backgroundColor: "var(--color-elevated)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: "8px",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
  fontSize: "0.9rem",
  outline: "none",
  transition: "border-color 0.2s ease",
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        display: "block",
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        fontSize: "0.6875rem",
        fontWeight: 700,
        color: "var(--color-text-secondary)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "0.5rem",
      }}
    >
      {children}
      {required && (
        <span style={{ color: "var(--color-accent-blue)", marginLeft: "0.25rem" }}>*</span>
      )}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p
      style={{
        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
        fontSize: "0.8125rem",
        color: "var(--color-danger)",
        margin: "0.375rem 0 0",
      }}
    >
      {msg}
    </p>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { num: 1, label: "Project Info" },
    { num: 2, label: "Links & Purpose" },
    { num: 3, label: "Review & Submit" },
  ];

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {steps.map((s, i) => (
          <div key={s.num} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : undefined }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  step > s.num
                    ? "var(--color-accent-blue)"
                    : step === s.num
                    ? "var(--color-accent-blue)"
                    : "var(--color-elevated)",
                border:
                  step >= s.num
                    ? "none"
                    : "1px solid var(--color-border-subtle)",
                transition: "background-color 0.3s ease",
              }}
            >
              {step > s.num ? (
                <Check size={15} color="var(--color-background)" strokeWidth={2.5} />
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: step === s.num ? "var(--color-background)" : "var(--color-text-muted)",
                  }}
                >
                  {s.num}
                </span>
              )}
            </div>
            {i < 2 && (
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor:
                    step > s.num
                      ? "var(--color-accent-blue)"
                      : "var(--color-border-subtle)",
                  transition: "background-color 0.3s ease",
                  margin: "0 0.75rem",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.625rem" }}>
        {steps.map((s) => (
          <span
            key={s.num}
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.75rem",
              fontWeight: step === s.num ? 600 : 400,
              color:
                step === s.num
                  ? "var(--color-accent-blue)"
                  : step > s.num
                  ? "var(--color-text-secondary)"
                  : "var(--color-text-muted)",
              transition: "color 0.2s ease",
            }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Next",
  nextIcon,
  loading,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextIcon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: onBack ? "space-between" : "flex-end",
        marginTop: "2rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid var(--color-border-subtle)",
        gap: "0.75rem",
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            backgroundColor: "transparent",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "8px",
            padding: "0.625rem 1.25rem",
            cursor: "pointer",
            transition: "border-color 0.2s ease, color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent-blue)";
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-subtle)";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
        >
          <ArrowLeft size={15} />
          Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--color-background)",
          backgroundColor: "var(--color-accent-blue)",
          border: "none",
          borderRadius: "8px",
          padding: "0.625rem 1.5rem",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : nextIcon}
        {nextLabel}
      </button>
    </div>
  );
}

export default function SubmitPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: "" }));
  };

  const goToStep2 = () => {
    const e = validateStep1(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep3 = () => {
    const e = validateStep2(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!address) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const glClient = createClient({
        chain: glTestnetBradbury,
        account: address,
      });

      const contractArgs = [
        form.title,
        form.about,
        BigInt(form.goalGen) * 1_000_000_000_000_000_000n,
        BigInt(form.durationDays),
        form.githubUrl,
        form.liveUrl,
        form.fundingPurpose,
      ];

      // Submit the transaction
      const hash = await glClient.writeContract({
        address: GENATIO_CONTRACT as Address,
        functionName: "submit_project",
        args: contractArgs,
        value: 0n,
      });

      // Wait for GenLayer consensus to accept and capture receipt
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const receipt = await (glClient as any).waitForTransactionReceipt({ hash, status: "ACCEPTED", timeout: 300000 });

      console.log("Full receipt:", JSON.stringify(receipt, null, 2));

      // Parse the return value from the receipt
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultRaw = (receipt as any)?.consensus_data?.leader_receipt?.[0]?.result;
      let status = "rejected";
      let score = 0;
      let projectId: string | undefined;

      try {
        const parsed = JSON.parse(resultRaw as string);
        status = String(parsed.status ?? "rejected");
        score = Number(parsed.score) || 0;
        projectId = parsed.project_id != null ? String(parsed.project_id) : undefined;
      } catch {
        console.error("Failed to parse receipt result:", resultRaw);
      }

      // Redirect to verify page
      const params = new URLSearchParams({ status, score: String(score) });
      if (projectId) params.set("project_id", projectId);
      router.push(`/verify?${params}`);
    } catch (err: unknown) {
      setSubmitting(false);
      const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (errMsg.includes("timed out") || errMsg.includes("timeout")) {
        setSubmitError("Verification is taking longer than expected. Please check back in a few minutes — your project may still be processing.");
      } else if (errMsg.includes("user rejected") || errMsg.includes("rejected the request")) {
        setSubmitError("Transaction cancelled.");
      } else if (errMsg.includes("insufficient funds") || errMsg.includes("insufficient balance")) {
        setSubmitError("Insufficient GEN balance. Please add funds to your wallet.");
      } else if (errMsg.includes("reverted") || errMsg.includes("execution failed")) {
        setSubmitError("Transaction failed. Please try again.");
      } else if (errMsg.includes("failed to fetch") || errMsg.includes("networkerror") || errMsg.includes("network error")) {
        setSubmitError("Unable to connect. Please check your internet connection and try again.");
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  };

  const goBack = (to: Step) => {
    setErrors({});
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Submitting state ──────────────────────────────────────────────────────
  if (submitting) {
    return (
      <>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div style={{ minHeight: "100vh" }}>
          <Navbar />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "calc(100vh - 64px)",
              paddingTop: "64px",
              gap: "1.5rem",
              textAlign: "center",
              padding: "64px 1.5rem 4rem",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-accent-blue) 30%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent-blue)",
              }}
            >
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: "0 0 0.5rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Submitting to GenLayer Intelligent Contracts...
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.9375rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  maxWidth: "400px",
                }}
              >
                This may take 2–5 minutes
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-accent-blue)",
                    animation: `pulse-live 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Wallet gate ───────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <Navbar />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.5rem",
              textAlign: "center",
              padding: "64px 1.5rem 4rem",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-accent-blue) 20%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent-blue)",
              }}
            >
              <Wallet size={26} strokeWidth={1.5} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: "0 0 0.5rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Connect Wallet to Submit
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.9375rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  maxWidth: "360px",
                }}
              >
                A wallet is required to submit your project to the GenLayer Bradbury network.
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .submit-input::placeholder { color: var(--color-text-muted); }
        .submit-input:focus { border-color: var(--color-accent-blue) !important; outline: none; }
        .submit-textarea::placeholder { color: var(--color-text-muted); }
        .submit-textarea:focus { border-color: var(--color-accent-blue) !important; outline: none; }
        .submit-select:focus { border-color: var(--color-accent-blue) !important; outline: none; }
        .form-split {
          display: flex;
          flex-direction: column;
          gap: 1.375rem;
        }
        @media (min-width: 480px) {
          .form-split { flex-direction: row; gap: 1rem; }
          .form-split > div { flex: 1; }
        }
        .submit-main {
          flex: 1;
          padding-top: 88px;
          padding-bottom: 5rem;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }
        @media (min-width: 768px) {
          .submit-main { padding-top: 120px; }
        }
        .footer-submit-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 640px) {
          .footer-submit-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />

        <main className="submit-main">
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "var(--color-accent-blue)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: "0 0 0.75rem",
              }}
            >
              Submit Project
            </p>
            <h1
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "clamp(1.625rem, 4vw, 2.25rem)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: "0 0 0.625rem",
              }}
            >
              Submit Your Project
            </h1>
            <p
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9375rem",
                color: "var(--color-text-secondary)",
                margin: "0 0 2.5rem",
              }}
            >
              Verified by GenLayer Intelligent Contracts through Optimistic Democracy.
            </p>

            <StepIndicator step={step} />

            <div
              style={{
                backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "16px",
                padding: "2rem",
              }}
            >

              {/* ── STEP 1 ─────────────────────────────────────── */}
              {step === 1 && (
                <>
                  <h2
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      margin: "0 0 1.75rem",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Project Info
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.375rem" }}>
                    <div>
                      <Label required>Project Name</Label>
                      <input
                        className="submit-input"
                        type="text"
                        value={form.title}
                        onChange={set("title")}
                        placeholder="e.g. genazo"
                        style={{
                          ...inputBase,
                          borderColor: errors.title ? "var(--color-danger)" : "var(--color-border-subtle)",
                        }}
                      />
                      <FieldError msg={errors.title} />
                    </div>

                    <div>
                      <Label required>About your project</Label>
                      <textarea
                        className="submit-textarea"
                        value={form.about}
                        onChange={set("about")}
                        placeholder="Describe what your project does..."
                        rows={4}
                        style={{
                          ...inputBase,
                          resize: "vertical",
                          lineHeight: 1.6,
                          borderColor: errors.about ? "var(--color-danger)" : "var(--color-border-subtle)",
                        }}
                      />
                      <FieldError msg={errors.about} />
                    </div>

                    <div className="form-split">
                      <div>
                        <Label required>Funding goal (GEN)</Label>
                        <input
                          className="submit-input"
                          type="number"
                          min="1"
                          value={form.goalGen}
                          onChange={set("goalGen")}
                          placeholder="e.g. 100"
                          style={{
                            ...inputBase,
                            borderColor: errors.goalGen ? "var(--color-danger)" : "var(--color-border-subtle)",
                          }}
                        />
                        <FieldError msg={errors.goalGen} />
                      </div>
                      <div>
                        <Label required>Campaign duration</Label>
                        <div style={{ position: "relative" }}>
                          <select
                            className="submit-select"
                            value={form.durationDays}
                            onChange={set("durationDays")}
                            style={{
                              ...inputBase,
                              appearance: "none",
                              WebkitAppearance: "none",
                              paddingRight: "2.25rem",
                              cursor: "pointer",
                            }}
                          >
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                          </select>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            style={{
                              position: "absolute",
                              right: "0.875rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                              fill: "var(--color-text-muted)",
                            }}
                          >
                            <path d="M2 4l4 4 4-4" stroke="var(--color-text-muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <NavButtons
                    onNext={goToStep2}
                    nextLabel="Next"
                    nextIcon={<ArrowRight size={15} />}
                  />
                </>
              )}

              {/* ── STEP 2 ─────────────────────────────────────── */}
              {step === 2 && (
                <>
                  <h2
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      margin: "0 0 1.75rem",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Links & Purpose
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.375rem" }}>
                    <div>
                      <Label required>GitHub repository URL</Label>
                      <input
                        className="submit-input"
                        type="url"
                        value={form.githubUrl}
                        onChange={set("githubUrl")}
                        placeholder="https://github.com/username/repo"
                        style={{
                          ...inputBase,
                          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                          fontSize: "0.85rem",
                          borderColor: errors.githubUrl ? "var(--color-danger)" : "var(--color-border-subtle)",
                        }}
                      />
                      <FieldError msg={errors.githubUrl} />
                    </div>

                    <div>
                      <Label required>Live project URL</Label>
                      <input
                        className="submit-input"
                        type="url"
                        value={form.liveUrl}
                        onChange={set("liveUrl")}
                        placeholder="https://yourproject.xyz"
                        style={{
                          ...inputBase,
                          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                          fontSize: "0.85rem",
                          borderColor: errors.liveUrl ? "var(--color-danger)" : "var(--color-border-subtle)",
                        }}
                      />
                      <FieldError msg={errors.liveUrl} />
                    </div>

                    <div>
                      <Label required>How will you use the funds?</Label>
                      <textarea
                        className="submit-textarea"
                        value={form.fundingPurpose}
                        onChange={set("fundingPurpose")}
                        placeholder="Be specific about deliverables and milestones..."
                        rows={5}
                        style={{
                          ...inputBase,
                          resize: "vertical",
                          lineHeight: 1.6,
                          borderColor: errors.fundingPurpose ? "var(--color-danger)" : "var(--color-border-subtle)",
                        }}
                      />
                      <FieldError msg={errors.fundingPurpose} />
                    </div>
                  </div>

                  <NavButtons
                    onBack={() => goBack(1)}
                    onNext={goToStep3}
                    nextLabel="Review"
                    nextIcon={<ArrowRight size={15} />}
                  />
                </>
              )}

              {/* ── STEP 3 ─────────────────────────────────────── */}
              {step === 3 && (
                <>
                  <h2
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      margin: "0 0 1.75rem",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Review & Submit
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "10px",
                      overflow: "hidden",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.625rem 1rem",
                        backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 5%, transparent)",
                        borderBottom: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          color: "var(--color-accent-blue)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Project Info
                      </span>
                    </div>
                    {[
                      { label: "Name", value: form.title },
                      { label: "About", value: form.about },
                      { label: "Goal", value: `${form.goalGen} GEN` },
                      { label: "Duration", value: `${form.durationDays} days` },
                    ].map((row, i, arr) => (
                      <div
                        key={row.label}
                        style={{
                          display: "flex",
                          gap: "1rem",
                          padding: "0.75rem 1rem",
                          borderBottom: i < arr.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                            minWidth: "80px",
                            flexShrink: 0,
                          }}
                        >
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                            fontSize: "0.875rem",
                            color: "var(--color-text-primary)",
                            wordBreak: "break-word",
                          }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}

                    <div
                      style={{
                        padding: "0.625rem 1rem",
                        backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 5%, transparent)",
                        borderTop: "1px solid var(--color-border-subtle)",
                        borderBottom: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          color: "var(--color-accent-blue)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Links & Purpose
                      </span>
                    </div>
                    {[
                      { label: "GitHub", value: form.githubUrl },
                      { label: "Live URL", value: form.liveUrl },
                      { label: "Fund use", value: form.fundingPurpose },
                    ].map((row, i, arr) => (
                      <div
                        key={row.label}
                        style={{
                          display: "flex",
                          gap: "1rem",
                          padding: "0.75rem 1rem",
                          borderBottom: i < arr.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                            minWidth: "80px",
                            flexShrink: 0,
                          }}
                        >
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                            fontSize: "0.8125rem",
                            color: "var(--color-text-primary)",
                            wordBreak: "break-all",
                          }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.875rem 1rem",
                      backgroundColor: "color-mix(in srgb, var(--color-danger) 6%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)",
                      borderRadius: "8px",
                      marginBottom: "0.75rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <AlertTriangle
                      size={16}
                      style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: "1px" }}
                    />
                    <p
                      style={{
                        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                        fontSize: "0.875rem",
                        color: "var(--color-text-secondary)",
                        margin: 0,
                        lineHeight: 1.55,
                      }}
                    >
                      Your project will be verified by GenLayer Intelligent Contracts through Optimistic Democracy. This may take 2–5 minutes.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.875rem 1rem",
                      backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 5%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--color-accent-blue) 18%, transparent)",
                      borderRadius: "8px",
                      marginBottom: submitError ? "0.75rem" : "0.25rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <Info
                      size={16}
                      style={{ color: "var(--color-accent-blue)", flexShrink: 0, marginTop: "1px" }}
                    />
                    <p
                      style={{
                        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                        fontSize: "0.875rem",
                        color: "var(--color-text-secondary)",
                        margin: 0,
                        lineHeight: 1.55,
                      }}
                    >
                      Projects scoring below{" "}
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                          color: "var(--color-text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        40/100
                      </span>{" "}
                      will not be listed on Genatio.
                    </p>
                  </div>

                  {submitError && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        padding: "0.875rem 1rem",
                        backgroundColor: "color-mix(in srgb, var(--color-danger) 6%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)",
                        borderRadius: "8px",
                        marginBottom: "0.25rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <AlertTriangle
                        size={16}
                        style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: "1px" }}
                      />
                      <p
                        style={{
                          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                          fontSize: "0.8125rem",
                          color: "var(--color-danger)",
                          margin: 0,
                          lineHeight: 1.55,
                          wordBreak: "break-word",
                        }}
                      >
                        {submitError}
                      </p>
                    </div>
                  )}

                  <NavButtons
                    onBack={() => goBack(2)}
                    onNext={handleSubmit}
                    nextLabel="Submit Project"
                    nextIcon={<Send size={14} />}
                  />
                </>
              )}
            </div>
          </div>
        </main>

        <footer
          style={{
            backgroundColor: "var(--color-background)",
            borderTop: "1px solid var(--color-border-subtle)",
            padding: "3.5rem 1.5rem 2rem",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div className="footer-submit-grid" style={{ marginBottom: "3rem", alignItems: "start" }}>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    margin: "0 0 0.5rem",
                    letterSpacing: "-0.03em",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "1px",
                  }}
                >
                  <span style={{ color: "var(--color-accent-blue)" }}>G</span>
                  <span>enatio</span>
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-accent-blue)",
                      display: "inline-block",
                      marginLeft: "2px",
                      marginBottom: "1px",
                    }}
                  />
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                    lineHeight: 1.6,
                    maxWidth: "220px",
                  }}
                >
                  Trustless grants for open source builders.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  { label: "Browse", href: "/browse" },
                  { label: "Submit Project", href: "/submit" },
                  { label: "GitHub", href: "#" },
                  { label: "Twitter / X", href: "#" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 0.375rem" }}>
                  Built on
                </p>
                <p style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-accent-blue)", margin: 0, letterSpacing: "0.02em" }}>
                  GenLayer Bradbury
                </p>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>
                  AI-native blockchain
                </p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "1.5rem", display: "flex", justifyContent: "center" }}>
              <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, textAlign: "center" }}>
                Genatio is a testnet application. Not for real funds.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
