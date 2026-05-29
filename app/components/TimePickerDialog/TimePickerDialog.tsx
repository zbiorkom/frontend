import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./TimePickerDialog.module.less";

export type TimeMode = "now" | "leave" | "arrive";

export type TimeChoice = {
    mode: TimeMode;
    datetime: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    value: TimeChoice;
    onApply: (value: TimeChoice) => void;
};

const MINUTE_STEP = 5;
const DAYS_AHEAD = 7;

const pad = (n: number) => String(n).padStart(2, "0");

const formatLocalDate = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatLocalTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const roundUpToStep = (minute: number) => Math.ceil(minute / MINUTE_STEP) * MINUTE_STEP;

export default ({ open, onClose, value, onApply }: Props) => {
    const { t, i18n } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [draft, setDraft] = useState<TimeChoice>(value);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open) {
            setDraft(value);
            if (!dialog.open) dialog.showModal();
        } else if (dialog.open) {
            dialog.close();
        }
    }, [open]);

    const dayOptions = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(i18n.language, {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Array.from({ length: DAYS_AHEAD }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const value = formatLocalDate(d);
            const label =
                i === 0
                    ? t("common.today")
                    : i === 1
                      ? t("common.tomorrow")
                      : formatter.format(d);
            return { value, label };
        });
    }, [i18n.language, t]);

    const setMode = (mode: TimeMode) => {
        if (mode !== "now" && !draft.datetime) {
            const now = new Date();
            now.setMinutes(roundUpToStep(now.getMinutes()), 0, 0);
            setDraft({
                mode,
                datetime: `${formatLocalDate(now)}T${formatLocalTime(now)}`,
            });
        } else {
            setDraft({ ...draft, mode });
        }
    };

    const [date, time] = draft.datetime
        ? draft.datetime.split("T")
        : (() => {
              const now = new Date();
              return [formatLocalDate(now), formatLocalTime(now)];
          })();
    const [hour, minute] = time.split(":").map(Number);

    const setDatePart = (next: string) => {
        setDraft({ ...draft, datetime: `${next}T${time}` });
    };
    const setTimePart = (h: number, m: number) => {
        setDraft({ ...draft, datetime: `${date}T${pad(h)}:${pad(m)}` });
    };

    const setHour = (h: number) => setTimePart(h, minute);
    const setMinute = (m: number) => setTimePart(hour, m);

    const addMinutes = (minutes: number) => {
        const base = minutes === 0 ? new Date() : new Date(Date.now() + minutes * 60_000);
        const rounded = roundUpToStep(base.getMinutes());
        if (rounded === 60) {
            base.setHours(base.getHours() + 1);
            base.setMinutes(0, 0, 0);
        } else {
            base.setMinutes(rounded, 0, 0);
        }
        setDraft({
            mode: draft.mode === "now" ? "leave" : draft.mode,
            datetime: `${formatLocalDate(base)}T${formatLocalTime(base)}`,
        });
    };

    const apply = () => {
        onApply(draft);
        onClose();
    };

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            onClose={onClose}
            onClick={(e) => {
                if (e.target === dialogRef.current) onClose();
            }}
        >
            <div className={styles.surface} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{t("home.planner.timeTitle")}</h2>
                    <button
                        type="button"
                        className={styles.close}
                        onClick={onClose}
                        aria-label={t("common.close")}
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className={styles.modes} role="tablist">
                    {(["now", "leave", "arrive"] as TimeMode[]).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            role="tab"
                            aria-selected={draft.mode === mode}
                            className={`${styles.modeBtn} ${draft.mode === mode ? styles.modeActive : ""}`}
                            onClick={() => setMode(mode)}
                        >
                            {mode === "now"
                                ? t("home.planner.departureNow")
                                : mode === "leave"
                                  ? t("home.planner.departureAt")
                                  : t("home.planner.arrivalAt")}
                        </button>
                    ))}
                </div>

                {draft.mode !== "now" && (
                    <>
                        <DateDropdown
                            hint={t("home.planner.datePart")}
                            options={dayOptions}
                            value={date}
                            onChange={setDatePart}
                        />

                        <div className={styles.timePicker}>
                            <span className={styles.dtLabel}>
                                {t("home.planner.timePart")}
                            </span>
                            <div className={styles.spinners}>
                                <Spinner
                                    value={hour}
                                    max={23}
                                    step={1}
                                    onChange={setHour}
                                    incrementLabel={t("home.planner.incrementHour")}
                                    decrementLabel={t("home.planner.decrementHour")}
                                />
                                <span className={styles.colon}>:</span>
                                <Spinner
                                    value={minute}
                                    max={59}
                                    step={MINUTE_STEP}
                                    onChange={setMinute}
                                    incrementLabel={t("home.planner.incrementMinute")}
                                    decrementLabel={t("home.planner.decrementMinute")}
                                />
                            </div>
                        </div>

                        <div className={styles.quick}>
                            <button type="button" onClick={() => addMinutes(0)}>
                                {t("home.planner.quickNow")}
                            </button>
                            <button type="button" onClick={() => addMinutes(15)}>
                                {t("home.planner.quickPlus15")}
                            </button>
                            <button type="button" onClick={() => addMinutes(30)}>
                                {t("home.planner.quickPlus30")}
                            </button>
                            <button type="button" onClick={() => addMinutes(60)}>
                                {t("home.planner.quickPlus60")}
                            </button>
                        </div>
                    </>
                )}

                <div className={styles.actions}>
                    <button type="button" className={styles.cancel} onClick={onClose}>
                        {t("common.cancel")}
                    </button>
                    <button type="button" className={styles.apply} onClick={apply}>
                        {t("common.apply")}
                    </button>
                </div>
            </div>
        </dialog>
    );
};

type DateDropdownProps = {
    hint: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (next: string) => void;
};

const DateDropdown = ({ hint, options, value, onChange }: DateDropdownProps) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey, true);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey, true);
        };
    }, [open]);

    const current = options.find((o) => o.value === value);

    return (
        <div className={styles.dropdown} ref={wrapRef}>
            <button
                type="button"
                className={styles.dropdownTrigger}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={styles.dropdownHint}>{hint}</span>
                <span className={styles.dropdownLabel}>{current?.label ?? value}</span>
                <span
                    className={`${styles.dropdownChevron} ${open ? styles.dropdownChevronOpen : ""}`}
                    aria-hidden
                >
                    <CaretDownIcon />
                </span>
            </button>
            {open && (
                <ul className={styles.dropdownMenu} role="listbox">
                    {options.map((opt) => {
                        const active = opt.value === value;
                        return (
                            <li key={opt.value} role="presentation">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    className={`${styles.dropdownOption} ${
                                        active ? styles.dropdownOptionActive : ""
                                    }`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

type SpinnerProps = {
    value: number;
    max: number;
    step: number;
    onChange: (next: number) => void;
    incrementLabel: string;
    decrementLabel: string;
};

const Spinner = ({ value, max, step, onChange, incrementLabel, decrementLabel }: SpinnerProps) => {
    const [text, setText] = useState(pad(value));

    useEffect(() => {
        setText(pad(value));
    }, [value]);

    const cycle = (delta: number) => {
        const span = max + 1;
        const next = ((value + delta * step) % span + span) % span;
        onChange(next);
    };

    const commit = () => {
        const parsed = parseInt(text, 10);
        if (!Number.isFinite(parsed)) {
            setText(pad(value));
            return;
        }
        const clamped = Math.max(0, Math.min(max, parsed));
        onChange(clamped);
        setText(pad(clamped));
    };

    return (
        <div className={styles.spinner}>
            <button
                type="button"
                className={styles.spinnerBtn}
                onClick={() => cycle(1)}
                aria-label={incrementLabel}
            >
                <CaretUpIcon />
            </button>
            <input
                type="text"
                inputMode="numeric"
                className={styles.spinnerValue}
                value={text}
                onChange={(e) => setText(e.target.value.replace(/\D/g, "").slice(0, 2))}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        (e.target as HTMLInputElement).blur();
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        cycle(1);
                    } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        cycle(-1);
                    }
                }}
            />
            <button
                type="button"
                className={styles.spinnerBtn}
                onClick={() => cycle(-1)}
                aria-label={decrementLabel}
            >
                <CaretDownIcon />
            </button>
        </div>
    );
};

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path
            fill="currentColor"
            d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        />
    </svg>
);

const ChevronIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </svg>
);

const CaretUpIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path fill="currentColor" d="m7 14 5-5 5 5z" />
    </svg>
);

const CaretDownIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path fill="currentColor" d="m7 10 5 5 5-5z" />
    </svg>
);
