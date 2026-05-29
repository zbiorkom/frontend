import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import PlaceField from "~/components/PlaceField/PlaceField";
import TimePickerDialog, {
    type TimeChoice,
    type TimeMode,
} from "~/components/TimePickerDialog/TimePickerDialog";
import type {
    Itinerary,
    PlanEta,
    PlanResponse,
    PlannerEndpoint,
    PlanTransitLeg,
    PlanNonTransitLeg,
    Route as RouteTuple,
} from "~/typings";
import { ERoute, EStop, VehicleType } from "~/typings";
import { typeIcons } from "~/constants";
import {
    decodePlannerEndpoint,
    encodePlannerEndpoint,
    getCities,
    getPlanEtas,
    plan,
} from "~/util";
import i18n from "~/i18n";
import styles from "./Planner.module.less";

const PlannerMap = lazy(() => import("./PlannerMap"));

const MAP_STYLE = "https://zbiorkom.live/style.json";
const MAP_BREAKPOINT_PX = 768;

type AgencyIcons = Record<string, Record<string, string>>;

type LoaderData = {
    cityId: string;
    agencyIcons: AgencyIcons;
};

export const meta = () => [
    { title: i18n.t("home.planner.meta.title") },
    { name: "description", content: i18n.t("home.planner.meta.description") },
];

export const loader = async (): Promise<LoaderData> => {
    const cities = await getCities();
    const agencyIcons: AgencyIcons = {};
    for (const city of cities) {
        const entries: Record<string, string> = {};
        for (const [id, agency] of Object.entries(city.agencies ?? {})) {
            if (agency.icon) entries[id] = agency.icon;
        }
        if (Object.keys(entries).length) agencyIcons[city.id] = entries;
    }
    return { cityId: cities[0]?.id ?? "", agencyIcons };
};

const getRouteIcon = (route: RouteTuple, agencyIcons: AgencyIcons): string => {
    const cityId = route[ERoute.city];
    const agencyId = route[ERoute.agency];
    const agencyIcon = agencyIcons[cityId]?.[agencyId];
    if (agencyIcon) return agencyIcon;
    return typeIcons[route[ERoute.type]] ?? typeIcons[VehicleType.Bus];
};

const MAX_ROUTES_PER_LEG = 3;

const positionClass = (index: number, total: number) => {
    if (total === 1) return "";
    if (index === 0) return styles.chipFirst;
    if (index === total - 1) return styles.chipLast;
    return styles.chipMiddle;
};

type RouteChipsProps = {
    routes: RouteTuple[];
    agencyIcons: AgencyIcons;
    variant: "small" | "large";
};

const RouteChips = ({ routes, agencyIcons, variant }: RouteChipsProps) => {
    const visible = routes.slice(0, MAX_ROUTES_PER_LEG);
    const overflow = routes.length > MAX_ROUTES_PER_LEG;
    const total = visible.length + (overflow ? 1 : 0);

    const chipClass = variant === "large" ? styles.transitBadge : styles.legTransit;
    const iconClass = variant === "large" ? styles.transitBadgeIcon : styles.legTransitIcon;

    let prevIcon: string | null = null;

    return (
        <span className={styles.routeGroup}>
            {visible.map((route, i) => {
                const name = route[ERoute.name];
                const color = route[ERoute.color];
                const iconSvg = getRouteIcon(route, agencyIcons);
                const showIcon = iconSvg !== prevIcon;
                prevIcon = iconSvg;
                return (
                    <span
                        key={i}
                        className={`${chipClass} ${positionClass(i, total)}`}
                        style={color ? { backgroundColor: color, color: "#fff" } : undefined}
                    >
                        {showIcon && (
                            <svg
                                className={iconClass}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden
                                dangerouslySetInnerHTML={{ __html: iconSvg }}
                            />
                        )}
                        {name}
                    </span>
                );
            })}
            {overflow && (
                <span
                    className={`${chipClass} ${styles.chipOverflow} ${positionClass(total - 1, total)}`}
                >
                    …
                </span>
            )}
        </span>
    );
};

type Props = {
    loaderData: LoaderData;
};

export default ({ loaderData }: Props) => {
    const { t, i18n: i18nInst } = useTranslation();
    const { cityId, agencyIcons } = loaderData;
    const [searchParams, setSearchParams] = useSearchParams();

    const [from, setFrom] = useState<PlannerEndpoint | null>(() => {
        const raw = searchParams.get("from");
        return raw ? decodePlannerEndpoint(raw) : null;
    });
    const [to, setTo] = useState<PlannerEndpoint | null>(() => {
        const raw = searchParams.get("to");
        return raw ? decodePlannerEndpoint(raw) : null;
    });

    const [time, setTime] = useState<TimeChoice>({ mode: "now", datetime: "" });
    const [timeDialogOpen, setTimeDialogOpen] = useState(false);

    const [result, setResult] = useState<PlanResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [etas, setEtas] = useState<(PlanEta | null)[]>([]);
    const [view, setView] = useState<"list" | "detail">("list");

    const [shouldRenderMap, setShouldRenderMap] = useState(false);

    useEffect(() => {
        const check = () => {
            if (window.innerWidth >= MAP_BREAKPOINT_PX) setShouldRenderMap(true);
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        const header = document.querySelector("header");
        const setHeight = () => {
            const h = header?.getBoundingClientRect().height ?? 64;
            document.documentElement.style.setProperty(
                "--planner-header-h",
                `${h}px`,
            );
        };
        setHeight();
        const ro = header ? new ResizeObserver(setHeight) : null;
        if (header && ro) ro.observe(header);
        window.addEventListener("resize", setHeight);
        return () => {
            ro?.disconnect();
            window.removeEventListener("resize", setHeight);
            document.documentElement.style.removeProperty("--planner-header-h");
        };
    }, []);

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        if (from) next.set("from", encodePlannerEndpoint(from));
        else next.delete("from");
        if (to) next.set("to", encodePlannerEndpoint(to));
        else next.delete("to");
        if (next.toString() !== searchParams.toString()) {
            setSearchParams(next, { replace: true });
        }
    }, [from, to]);

    useEffect(() => {
        if (!from || !to || !cityId) {
            setResult(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        const iso =
            time.mode === "now" || !time.datetime
                ? undefined
                : new Date(time.datetime).toISOString();
        plan(cityId, from.location, to.location, {
            time: iso,
            isArrivalTime: time.mode === "arrive",
        }).then((res) => {
            if (cancelled) return;
            setResult(res);
            setSelectedIdx(0);
            setEtas([]);
            setView("list");
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [from, to, cityId, time]);

    useEffect(() => {
        const keys = result?.itineraries.map((it) => it.key) ?? [];
        if (!cityId || !keys.length) {
            setEtas([]);
            return;
        }
        let cancelled = false;
        const fetchEtas = () => {
            getPlanEtas(cityId, keys).then((res) => {
                if (cancelled) return;
                setEtas(res);
            });
        };
        fetchEtas();
        const interval = setInterval(fetchEtas, 20_000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [cityId, result]);

    const swap = () => {
        setFrom(to);
        setTo(from);
    };

    const itineraries = result?.itineraries ?? [];
    const selected = itineraries[selectedIdx] ?? null;

    const timeLabel = formatTimeChoice(time, t, i18nInst.language);

    return (
        <div className={styles.page}>
            <aside className={styles.sidebar}>
                {view === "list" ? (
                    <>
                        <div className={styles.fields}>
                            <PlaceField
                                kind="from"
                                value={from}
                                onChange={setFrom}
                                city={cityId}
                                placeholder={t("home.planner.fromPlaceholder")}
                                label={t("home.planner.fromLabel")}
                                autoFocus={!from}
                            />
                            <button
                                type="button"
                                className={styles.swap}
                                onClick={swap}
                                aria-label={t("home.planner.swap")}
                            >
                                <SwapIcon />
                            </button>
                            <PlaceField
                                kind="to"
                                value={to}
                                onChange={setTo}
                                city={cityId}
                                placeholder={t("home.planner.toPlaceholder")}
                                label={t("home.planner.toLabel")}
                            />
                        </div>

                        <button
                            type="button"
                            className={styles.timeBtn}
                            onClick={() => setTimeDialogOpen(true)}
                        >
                            <ClockIcon />
                            <span className={styles.timeBtnText}>{timeLabel}</span>
                            <ChevronIcon />
                        </button>

                        <div className={styles.results}>
                            {!from || !to ? (
                                <p className={styles.empty}>{t("home.planner.missing")}</p>
                            ) : loading ? (
                                <p className={styles.empty}>{t("home.planner.loading")}</p>
                            ) : itineraries.length === 0 ? (
                                <p className={styles.empty}>
                                    {t("home.planner.noResults")}
                                </p>
                            ) : (
                                <ul className={styles.itineraries}>
                                    {itineraries.map((it, i) => (
                                        <ItineraryCard
                                            key={it.key}
                                            itinerary={it}
                                            eta={etas[i] ?? null}
                                            agencyIcons={agencyIcons}
                                            onClick={() => {
                                                setSelectedIdx(i);
                                                setView("detail");
                                            }}
                                            lang={i18nInst.language}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                ) : (
                    selected && (
                        <DetailView
                            itinerary={selected}
                            eta={etas[selectedIdx] ?? null}
                            agencyIcons={agencyIcons}
                            from={from}
                            to={to}
                            lang={i18nInst.language}
                            onBack={() => setView("list")}
                        />
                    )
                )}
            </aside>

            <div className={styles.mapWrap}>
                {shouldRenderMap && (
                    <Suspense fallback={null}>
                        <PlannerMap
                            mapStyle={MAP_STYLE}
                            from={from}
                            to={to}
                            selected={selected}
                        />
                    </Suspense>
                )}
            </div>

            <TimePickerDialog
                open={timeDialogOpen}
                onClose={() => setTimeDialogOpen(false)}
                value={time}
                onApply={setTime}
            />
        </div>
    );
};

const formatTimeChoice = (choice: TimeChoice, t: (k: string, o?: any) => string, lang: string) => {
    if (choice.mode === "now" || !choice.datetime) {
        return t("home.planner.departureNow");
    }
    const date = new Date(choice.datetime);
    const formatter = new Intl.DateTimeFormat(lang, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
    const formatted = formatter.format(date);
    const key: "departureAtFormatted" | "arrivalAtFormatted" =
        choice.mode === "arrive" ? "arrivalAtFormatted" : "departureAtFormatted";
    return t(`home.planner.${key}`, { datetime: formatted });
};

const formatDuration = (totalMinutes: number) => {
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
};

const distanceLabel = (meters: number) =>
    meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;

const modeI18nKey = (mode: string) =>
    mode === "BIKE" ? "legBike" : mode === "CAR" ? "legCar" : "legWalk";

type ItineraryCardProps = {
    itinerary: Itinerary;
    eta: PlanEta | null;
    agencyIcons: AgencyIcons;
    onClick: () => void;
    lang: string;
};

const ItineraryCard = ({ itinerary, eta, agencyIcons, onClick, lang }: ItineraryCardProps) => {
    const { t } = useTranslation();

    const minutes = eta
        ? Math.max(0, Math.round((eta.arrivalTime - eta.leaveTime) / 60_000))
        : Math.round(itinerary.legs.reduce((acc, leg) => acc + leg.duration, 0) / 60);
    const durationLabel = formatDuration(minutes);

    const timeFormatter = new Intl.DateTimeFormat(lang, {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <li>
            <button type="button" onClick={onClick} className={styles.itinerary}>
                <div className={styles.itineraryHead}>
                    {eta ? (
                        <span className={styles.itineraryTimes}>
                            {t("home.planner.timeRange", {
                                from: timeFormatter.format(new Date(eta.leaveTime)),
                                to: timeFormatter.format(new Date(eta.arrivalTime)),
                            })}
                        </span>
                    ) : (
                        <span className={styles.itineraryTimes}>—</span>
                    )}
                    <span className={styles.itineraryMeta}>
                        <span className={styles.itineraryDuration}>{durationLabel}</span>
                        {eta && eta.realtimeCoverage > 0 && (
                            <span
                                className={styles.liveIcon}
                                title={`${t("home.planner.live")} · ${eta.realtimeCoverage}%`}
                                aria-label={t("home.planner.live")}
                            >
                                <LiveSignalIcon />
                            </span>
                        )}
                    </span>
                </div>
                <div className={styles.legs}>
                    {itinerary.legs.map((leg, i) => {
                        if ("stops" in leg) {
                            return (
                                <RouteChips
                                    key={i}
                                    routes={leg.routes}
                                    agencyIcons={agencyIcons}
                                    variant="small"
                                />
                            );
                        }
                        if (leg.duration < 300) return null;
                        return (
                            <span key={i} className={styles.legWalk} title={leg.mode}>
                                <WalkIcon />
                            </span>
                        );
                    })}
                </div>
            </button>
        </li>
    );
};

type DetailViewProps = {
    itinerary: Itinerary;
    eta: PlanEta | null;
    agencyIcons: AgencyIcons;
    from: PlannerEndpoint | null;
    to: PlannerEndpoint | null;
    lang: string;
    onBack: () => void;
};

const DetailView = ({ itinerary, eta, agencyIcons, from, to, lang, onBack }: DetailViewProps) => {
    const { t } = useTranslation();

    const totalMinutes = eta
        ? Math.max(0, Math.round((eta.arrivalTime - eta.leaveTime) / 60_000))
        : Math.round(itinerary.legs.reduce((acc, leg) => acc + leg.duration, 0) / 60);

    const timeFormatter = new Intl.DateTimeFormat(lang, {
        hour: "2-digit",
        minute: "2-digit",
    });

    const baseMs = eta?.leaveTime ?? 0;
    let cursor = baseMs;
    const legsWithTimes = itinerary.legs.map((leg) => {
        const startMs = cursor;
        cursor += leg.duration * 1000;
        return { leg, startMs, endMs: cursor };
    });

    return (
        <div className={styles.detail}>
            <div className={styles.detailHead}>
                <button
                    type="button"
                    className={styles.detailBack}
                    onClick={onBack}
                    aria-label={t("common.back")}
                >
                    <BackIcon />
                </button>
                <div className={styles.detailTitle}>
                    <span className={styles.detailTimes}>
                        {eta
                            ? t("home.planner.timeRange", {
                                  from: timeFormatter.format(new Date(eta.leaveTime)),
                                  to: timeFormatter.format(new Date(eta.arrivalTime)),
                              })
                            : "—"}
                    </span>
                    <span className={styles.detailSubtitle}>
                        {formatDuration(totalMinutes)}
                        {eta && eta.realtimeCoverage > 0 && (
                            <span
                                className={styles.liveIcon}
                                title={`${t("home.planner.live")} · ${eta.realtimeCoverage}%`}
                            >
                                <LiveSignalIcon />
                            </span>
                        )}
                    </span>
                </div>
            </div>

            <ol className={styles.timeline}>
                {legsWithTimes.map(({ leg, startMs, endMs }, i) => (
                    <li key={i} className={styles.timelineItem}>
                        {"stops" in leg ? (
                            <TransitLegCard
                                leg={leg}
                                startMs={startMs}
                                endMs={endMs}
                                hasTimes={!!eta}
                                timeFormatter={timeFormatter}
                                agencyIcons={agencyIcons}
                                t={t}
                            />
                        ) : (
                            <WalkLegRow
                                leg={leg}
                                isFirst={i === 0}
                                isLast={i === legsWithTimes.length - 1}
                                from={from}
                                to={to}
                                t={t}
                            />
                        )}
                    </li>
                ))}
            </ol>
        </div>
    );
};

type TransitLegCardProps = {
    leg: PlanTransitLeg;
    startMs: number;
    endMs: number;
    hasTimes: boolean;
    timeFormatter: Intl.DateTimeFormat;
    agencyIcons: AgencyIcons;
    t: (k: string, o?: any) => string;
};

const TransitLegCard = ({
    leg,
    startMs,
    endMs,
    hasTimes,
    timeFormatter,
    agencyIcons,
    t,
}: TransitLegCardProps) => {
    const longName = leg.routes.length === 1 ? leg.routes[0]?.[ERoute.longName] : undefined;
    const firstStop = leg.stops[0]?.[EStop.name] ?? "";
    const lastStop = leg.stops[leg.stops.length - 1]?.[EStop.name] ?? "";
    const minutes = Math.max(1, Math.round(leg.duration / 60));
    const stopCount = Math.max(1, leg.stops.length - 1);

    return (
        <div className={styles.transitCard}>
            <div className={styles.transitHead}>
                <RouteChips
                    routes={leg.routes}
                    agencyIcons={agencyIcons}
                    variant="large"
                />
                {longName && (
                    <span className={styles.transitLongName}>{longName}</span>
                )}
            </div>
            <div className={styles.transitStop}>
                {hasTimes && (
                    <span className={styles.transitTime}>
                        {timeFormatter.format(new Date(startMs))}
                    </span>
                )}
                <span className={styles.transitStopDot} aria-hidden />
                <span className={styles.transitStopName}>{firstStop}</span>
            </div>
            <div className={styles.transitMeta}>
                {minutes} min · {t("home.planner.stopCount", { count: stopCount })}
            </div>
            <div className={styles.transitStop}>
                {hasTimes && (
                    <span className={styles.transitTime}>
                        {timeFormatter.format(new Date(endMs))}
                    </span>
                )}
                <span className={styles.transitStopDot} aria-hidden />
                <span className={styles.transitStopName}>{lastStop}</span>
            </div>
        </div>
    );
};

type WalkLegRowProps = {
    leg: PlanNonTransitLeg;
    isFirst: boolean;
    isLast: boolean;
    from: PlannerEndpoint | null;
    to: PlannerEndpoint | null;
    t: (k: string, o?: any) => string;
};

const WalkLegRow = ({ leg, isFirst, isLast, from, to, t }: WalkLegRowProps) => {
    const minutes = Math.max(1, Math.round(leg.duration / 60));
    const endpointLabel = isFirst ? from?.name : isLast ? to?.name : null;

    return (
        <div className={styles.walkRow}>
            <div className={styles.walkDots} aria-hidden>
                <span />
                <span />
                <span />
                <span />
            </div>
            <div className={styles.walkBody}>
                <span className={styles.walkPrimary}>
                    {t(`home.planner.${modeI18nKey(leg.mode)}`)}
                    {endpointLabel && (
                        <>
                            {" · "}
                            <span className={styles.walkEndpoint}>{endpointLabel}</span>
                        </>
                    )}
                </span>
                <span className={styles.walkSecondary}>
                    {minutes} min · {distanceLabel(leg.distance)}
                </span>
            </div>
        </div>
    );
};

const SwapIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path
            fill="currentColor"
            d="M6.99 11 3 15l3.99 4v-3H14v-2H6.99zM21 9l-3.99-4v3H10v2h7.01v3z"
        />
    </svg>
);

const WalkIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path
            fill="currentColor"
            d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2M9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"
        />
    </svg>
);

const ClockIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path
            fill="currentColor"
            d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16m.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
        />
    </svg>
);

const ChevronIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </svg>
);

const BackIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path
            fill="currentColor"
            d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"
        />
    </svg>
);

const LiveSignalIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path
            fill="currentColor"
            d="M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56m0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9"
        />
    </svg>
);
