import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { geocode } from "~/util";
import type { GeocodeMatch, PlannerEndpoint } from "~/typings";
import styles from "./PlaceField.module.less";

const GEOCODE_DEBOUNCE_MS = 200;

type Props = {
    kind: "from" | "to";
    value: PlannerEndpoint | null;
    onChange: (value: PlannerEndpoint | null) => void;
    city?: string;
    placeholder: string;
    label: string;
    autoFocus?: boolean;
};

export default ({ kind, value, onChange, city, placeholder, label, autoFocus }: Props) => {
    const { t } = useTranslation();
    const inputId = useId();
    const listboxId = useId();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeocodeMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const displayValue = useMemo(() => {
        if (value && !query) return value.name;
        return query;
    }, [value, query]);

    useEffect(() => {
        if (!city) return;
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        const handle = setTimeout(() => {
            geocode(city, trimmed, controller.signal).then((matches) => {
                if (controller.signal.aborted) return;
                setResults(matches);
                setActive(0);
                setLoading(false);
            });
        }, GEOCODE_DEBOUNCE_MS);
        return () => {
            controller.abort();
            clearTimeout(handle);
        };
    }, [city, query]);

    useEffect(() => {
        return () => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
        };
    }, []);

    const select = (match: GeocodeMatch) => {
        onChange({
            name: match.name,
            description: match.description,
            location: match.location,
        });
        setQuery("");
        setResults([]);
        setOpen(false);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (results.length) {
                setOpen(true);
                setActive((i) => (i + 1) % results.length);
            }
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (results.length) {
                setOpen(true);
                setActive((i) => (i - 1 + results.length) % results.length);
            }
        } else if (event.key === "Enter") {
            if (open && results[active]) {
                event.preventDefault();
                select(results[active]);
            }
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    };

    const showList = open && (loading || results.length > 0);

    return (
        <div className={styles.field}>
            <label htmlFor={inputId} className={styles.fieldLabel}>
                <span aria-hidden className={`${styles.dot} ${styles[`dot_${kind}`]}`} />
                <span className={styles.srOnly}>{label}</span>
            </label>
            <input
                id={inputId}
                type="text"
                className={styles.input}
                value={displayValue}
                placeholder={placeholder}
                autoComplete="off"
                autoFocus={autoFocus}
                role="combobox"
                aria-expanded={showList}
                aria-controls={listboxId}
                aria-autocomplete="list"
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (value) onChange(null);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                    blurTimer.current = setTimeout(() => setOpen(false), 120);
                }}
                onKeyDown={onKeyDown}
            />
            {(value || query) && (
                <button
                    type="button"
                    className={styles.clear}
                    aria-label={t("common.clear")}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        onChange(null);
                        setQuery("");
                        setResults([]);
                    }}
                >
                    <CloseIcon />
                </button>
            )}
            {showList && (
                <ul id={listboxId} role="listbox" className={styles.listbox}>
                    {loading && results.length === 0 && (
                        <li className={styles.listEmpty}>{t("common.loading")}</li>
                    )}
                    {results.map((match, i) => (
                        <li
                            key={`${match.name}-${match.location[0]}-${match.location[1]}`}
                            role="option"
                            aria-selected={i === active}
                            className={`${styles.listItem} ${i === active ? styles.listItemActive : ""}`}
                            onMouseEnter={() => setActive(i)}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                select(match);
                            }}
                        >
                            <span className={styles.listItemIcon} aria-hidden>
                                {match.type === "STOP" ? (
                                    <StopIcon />
                                ) : match.type === "PLACE" ? (
                                    <PinIcon />
                                ) : (
                                    <HomeIcon />
                                )}
                            </span>
                            <span className={styles.listItemBody}>
                                <span className={styles.listItemName}>{match.name}</span>
                                {match.description && (
                                    <span className={styles.listItemDesc}>{match.description}</span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
        <path
            fill="currentColor"
            d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        />
    </svg>
);

const PinIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path
            fill="currentColor"
            d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7m0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6"
        />
    </svg>
);

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
);

const StopIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path
            fill="currentColor"
            d="M16 2H8C5.79 2 4 3.79 4 6v10c0 1.86 1.27 3.4 3 3.86V21a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h4v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.14c1.73-.46 3-2 3-3.86V6c0-2.21-1.79-4-4-4M8 17c-.83 0-1.5-.67-1.5-1.5S7.17 14 8 14s1.5.67 1.5 1.5S8.83 17 8 17m8 0c-.83 0-1.5-.67-1.5-1.5S15.17 14 16 14s1.5.67 1.5 1.5S16.83 17 16 17m2-6H6V6h12z"
        />
    </svg>
);
