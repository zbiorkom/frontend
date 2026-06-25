import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./SupportSection.module.less";

const PRESETS = [10, 25, 50, 100] as const;
const POPULAR = 25;

type FieldKey = "amount" | "firstName" | "lastName" | "email";
type Errors = Partial<Record<FieldKey, string>>;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const impactKey = (amount: number): string => {
    if (amount <= 10) return "coffee";
    if (amount <= 25) return "day";
    if (amount <= 75) return "city";
    return "patron";
};

/** MD3 outlined text field with a floating label. */
const TextField = ({
    label,
    value,
    onChange,
    type = "text",
    autoComplete,
    error,
    multiline,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    autoComplete?: string;
    error?: string;
    multiline?: boolean;
}) => (
    <label className={`${styles.field} ${error ? styles.fieldError : ""}`}>
        {multiline ? (
            <textarea
                className={styles.control}
                rows={2}
                placeholder=" "
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        ) : (
            <input
                className={styles.control}
                type={type}
                placeholder=" "
                value={value}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
            />
        )}
        <span className={styles.fieldLabel}>{label}</span>
        {error && <span className={styles.errorText}>{error}</span>}
    </label>
);

export default () => {
    const { t } = useTranslation();

    const [preset, setPreset] = useState<number | "custom">(POPULAR);
    const [custom, setCustom] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

    const ticketRef = useRef<HTMLDivElement>(null);

    const amount = preset === "custom" ? parseFloat(custom.replace(",", ".")) : preset;
    const amountValid = Number.isFinite(amount) && amount > 0;
    const displayAmount = amountValid ? amount : 0;

    const clearError = (key: FieldKey) => setErrors((p) => ({ ...p, [key]: undefined }));

    const validate = (): boolean => {
        const next: Errors = {};
        if (!amountValid) next.amount = t("about.support.errors.amount");
        if (!firstName.trim()) next.firstName = t("about.support.errors.firstName");
        if (!lastName.trim()) next.lastName = t("about.support.errors.lastName");
        if (!isEmail(email)) next.email = t("about.support.errors.email");
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setStatus("submitting");
        // Simulated payment round-trip — wire to a real provider later.
        window.setTimeout(() => {
            setStatus("success");
            ticketRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 1400);
    };

    const reset = () => {
        setStatus("idle");
        setPreset(POPULAR);
        setCustom("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setMessage("");
        setErrors({});
    };

    const impact = amountValid ? t(`about.support.impacts.${impactKey(amount)}`) : null;

    return (
        <section className={styles.support} id="support">
            <div ref={ticketRef} className={styles.ticket}>
                {status === "success" ? (
                    <div className={styles.success}>
                        <div className={styles.successBadge} aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="44" height="44">
                                <path
                                    fill="currentColor"
                                    d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
                                />
                            </svg>
                        </div>
                        <h3 className={styles.successTitle}>
                            {t("about.support.successTitle")}
                        </h3>
                        <p className={styles.successDetail}>
                            {t("about.support.successDetail", { amount: displayAmount })}
                        </p>
                        <button type="button" className={styles.primary} onClick={reset}>
                            {t("about.support.donateAgain")}
                        </button>
                    </div>
                ) : (
                    <form className={styles.form} onSubmit={submit} noValidate>
                        {/* ---- Fare stub (amount) ---- */}
                        <div className={styles.stub}>
                            <div className={styles.stubHead}>
                                <span className={styles.kicker}>
                                    {t("about.support.ticketKicker")}
                                </span>
                                <svg
                                    className={styles.route}
                                    viewBox="0 0 64 12"
                                    aria-hidden="true"
                                >
                                    <line
                                        x1="6"
                                        y1="6"
                                        x2="58"
                                        y2="6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeDasharray="2 4"
                                        strokeLinecap="round"
                                    />
                                    <circle cx="6" cy="6" r="4" fill="currentColor" />
                                    <circle
                                        cx="58"
                                        cy="6"
                                        r="4"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                </svg>
                            </div>

                            <h2 className={styles.title}>{t("about.support.title")}</h2>
                            <p className={styles.subtitle}>{t("about.support.subtitle")}</p>

                            <span className={styles.sectionLabel}>
                                {t("about.support.amountLabel")}
                            </span>
                            <div className={styles.amounts}>
                                {PRESETS.map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`${styles.chip} ${
                                            preset === value ? styles.chipActive : ""
                                        }`}
                                        onClick={() => {
                                            setPreset(value);
                                            clearError("amount");
                                        }}
                                    >
                                        {value === POPULAR && (
                                            <span className={styles.popular}>
                                                {t("about.support.popular")}
                                            </span>
                                        )}
                                        <span className={styles.chipValue}>
                                            {value}
                                            <span className={styles.chipCur}>
                                                {t("about.support.currency")}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <label
                                className={`${styles.field} ${styles.customField} ${
                                    preset === "custom" ? styles.customActive : ""
                                } ${errors.amount ? styles.fieldError : ""}`}
                            >
                                <input
                                    className={styles.control}
                                    inputMode="decimal"
                                    placeholder=" "
                                    value={custom}
                                    onChange={(e) => {
                                        setCustom(e.target.value);
                                        setPreset("custom");
                                        clearError("amount");
                                    }}
                                    onFocus={() => setPreset("custom")}
                                />
                                <span className={styles.fieldLabel}>
                                    {t("about.support.customPlaceholder")}
                                </span>
                                <span className={styles.suffix}>
                                    {t("about.support.currency")}
                                </span>
                            </label>
                            {errors.amount && (
                                <span className={styles.errorText}>{errors.amount}</span>
                            )}

                            <div className={styles.fare}>
                                <span className={styles.fareLabel}>
                                    {t("about.support.fareLabel")}
                                </span>
                                <span className={styles.fareValue}>
                                    {displayAmount}
                                    <span className={styles.fareCur}>
                                        {t("about.support.currency")}
                                    </span>
                                </span>
                            </div>

                            {impact && (
                                <p key={impactKey(amount)} className={styles.impact}>
                                    {impact}
                                </p>
                            )}
                        </div>

                        {/* ---- Perforation divider ---- */}
                        <div className={styles.perf} aria-hidden="true" />

                        {/* ---- Passenger details (form) ---- */}
                        <div className={styles.detail}>
                            <span className={styles.sectionLabel}>
                                {t("about.support.detailLabel")}
                            </span>

                            <div className={styles.row}>
                                <TextField
                                    label={t("about.support.firstName")}
                                    value={firstName}
                                    onChange={(v) => {
                                        setFirstName(v);
                                        clearError("firstName");
                                    }}
                                    autoComplete="given-name"
                                    error={errors.firstName}
                                />
                                <TextField
                                    label={t("about.support.lastName")}
                                    value={lastName}
                                    onChange={(v) => {
                                        setLastName(v);
                                        clearError("lastName");
                                    }}
                                    autoComplete="family-name"
                                    error={errors.lastName}
                                />
                            </div>

                            <TextField
                                label={t("about.support.email")}
                                value={email}
                                onChange={(v) => {
                                    setEmail(v);
                                    clearError("email");
                                }}
                                type="email"
                                autoComplete="email"
                                error={errors.email}
                            />

                            <TextField
                                label={t("about.support.message")}
                                value={message}
                                onChange={setMessage}
                                multiline
                            />

                            <button
                                type="submit"
                                className={styles.primary}
                                disabled={status === "submitting"}
                            >
                                {status === "submitting" ? (
                                    <>
                                        <span className={styles.spinner} aria-hidden="true" />
                                        {t("about.support.submitting")}
                                    </>
                                ) : (
                                    <>
                                        <span className={styles.btnHeart} aria-hidden="true">
                                            💚
                                        </span>
                                        {amountValid
                                            ? t("about.support.submit", {
                                                  amount: displayAmount,
                                              })
                                            : t("about.support.submitGeneric")}
                                    </>
                                )}
                            </button>

                            <p className={styles.secure}>
                                <svg
                                    viewBox="0 0 24 24"
                                    width="15"
                                    height="15"
                                    aria-hidden="true"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z"
                                    />
                                </svg>
                                {t("about.support.secure")}
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
};
