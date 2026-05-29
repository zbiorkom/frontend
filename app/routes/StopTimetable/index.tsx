import { useMemo, useState } from "react";
import { redirect, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { computeRouteTheme, getCity, getRoutes, getStopTimetable } from "~/util";
import { ERoute, EStop, VehicleType, type TimetableEntry } from "~/typings";
import { typeIcons } from "~/constants";
import { ArrowRight } from "~/components/UI/Icons";
import i18n from "~/i18n";
import type { Route } from "./+types";
import styles from "./StopTimetable.module.less";

export const loader = async ({ params }: Route.LoaderArgs) => {
    const city = await getCity(params.city!);
    if (!city) return redirect("/404");

    const routes = await getRoutes(params.city!);
    const route = routes.find((r) => r[ERoute.id] === params.routeId);
    if (!route) return redirect(`/${params.city}`);

    const data = await getStopTimetable(params.city!, params.stopId!, params.routeId!);
    if (!data) return redirect(`/${params.city}`);

    return {
        cityId: city.id,
        cityName: city.name,
        agency: city.agencies[route[ERoute.agency]],
        route,
        stop: data.stop,
        timetable: data.timetable,
        theme: computeRouteTheme(route[ERoute.color]),
    };
};

export const meta: Route.MetaFunction = ({ data }) => {
    if (!data || !("route" in data)) {
        return [{ title: i18n.t("stopTimetable.meta.fallbackTitle") }];
    }
    const stopName = data.stop[EStop.name];
    const routeName = data.route[ERoute.name];
    return [
        { title: i18n.t("stopTimetable.meta.title", { routeName, stopName }) },
        {
            name: "description",
            content: i18n.t("stopTimetable.meta.description", {
                routeName,
                stopName,
                city: data.cityName,
            }),
        },
    ];
};

const getWeekdays = () => i18n.t("stopTimetable.weekdays", { returnObjects: true }) as string[];
const getMonths = () => i18n.t("stopTimetable.months", { returnObjects: true }) as string[];

const DAY_EPOCH_MS = Date.UTC(2020, 0, 1);
const DAY_MS = 86_400_000;

const parseDayKey = (raw: string): Date | null => {
    const days = Number(raw);
    if (!Number.isFinite(days)) return null;
    return new Date(DAY_EPOCH_MS + days * DAY_MS);
};

const formatDateHeader = (raw: string) => {
    const d = parseDayKey(raw);
    if (!d) return raw;
    const weekdays = getWeekdays();
    const months = getMonths();
    return `${weekdays[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
};

const todayDayKey = () => {
    const now = new Date();
    const startOfTodayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return String(Math.floor((startOfTodayUTC - DAY_EPOCH_MS) / DAY_MS));
};

const HM_FORMATTER = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

const extractHM = (ms: number): { hour: number; minute: number } => {
    let hour = 0;
    let minute = 0;
    for (const part of HM_FORMATTER.formatToParts(new Date(ms))) {
        if (part.type === "hour") hour = Number(part.value) % 24;
        else if (part.type === "minute") minute = Number(part.value);
    }
    return { hour, minute };
};

const formatMinute = (m: number) => m.toString().padStart(2, "0");

type HourBucket = { hour: number; minutes: number[] };

const groupByHour = (entries: TimetableEntry[]): HourBucket[] => {
    const map = new Map<number, number[]>();
    for (const [, departure] of entries) {
        const { hour, minute } = extractHM(departure);
        if (!map.has(hour)) map.set(hour, []);
        map.get(hour)!.push(minute);
    }
    const hours = [...map.keys()].sort((a, b) => a - b);
    return hours.map((hour) => ({
        hour,
        minutes: map.get(hour)!.sort((a, b) => a - b),
    }));
};

export default ({ loaderData }: Route.ComponentProps) => {
    const { t } = useTranslation();
    const { cityId, agency, route, stop, timetable, theme } = loaderData;
    const iconSvg = agency?.icon ?? typeIcons[route[ERoute.type]] ?? typeIcons[VehicleType.Bus];

    const dates = useMemo(
        () => Object.keys(timetable).sort((a, b) => Number(a) - Number(b)),
        [timetable],
    );

    const todayKey = useMemo(() => {
        const key = todayDayKey();
        if (timetable[key]) return key;
        return dates[0];
    }, [timetable, dates]);

    const [activeDate, setActiveDate] = useState<string | undefined>(todayKey);
    const currentDate = activeDate && timetable[activeDate] ? activeDate : dates[0];

    const buckets = useMemo(() => {
        if (!currentDate) return [];
        return groupByHour(timetable[currentDate] ?? []);
    }, [timetable, currentDate]);

    const stopCode = stop[EStop.code];
    const stopName = stop[EStop.name];

    return (
        <div className={styles.page}>
            <div className={styles.head}>
                <Link
                    to={`/${cityId}/${route[ERoute.agency]}/${route[ERoute.id]}`}
                    className={styles.back}
                    aria-label={t("stopTimetable.backLabel")}
                >
                    <ArrowRight />
                </Link>
                <div
                    className={styles.badge}
                    style={{
                        backgroundColor: theme.primaryContainer,
                        color: theme.onPrimaryContainer,
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        dangerouslySetInnerHTML={{ __html: iconSvg }}
                    />
                    <span>{route[ERoute.name]}</span>
                </div>
                <div className={styles.titles}>
                    <h1 className={styles.stopName}>
                        {stopName}
                        {stopCode && <span className={styles.stopCode}> {stopCode}</span>}
                    </h1>
                    <p className={styles.routeLongName}>{route[ERoute.longName]}</p>
                </div>
            </div>

            {dates.length > 1 && (
                <div className={styles.dateBar} role="tablist" aria-label={t("stopTimetable.selectDay")}>
                    {dates.map((d) => (
                        <button
                            key={d}
                            type="button"
                            role="tab"
                            aria-selected={d === currentDate}
                            className={`${styles.dateTab} ${d === currentDate ? styles.active : ""}`}
                            onClick={() => setActiveDate(d)}
                            style={
                                d === currentDate
                                    ? {
                                          backgroundColor: theme.primaryContainer,
                                          color: theme.onPrimaryContainer,
                                      }
                                    : undefined
                            }
                        >
                            {formatDateHeader(d)}
                        </button>
                    ))}
                </div>
            )}

            {buckets.length > 0 ? (
                <ul className={styles.hours}>
                    {buckets.map(({ hour, minutes }) => (
                        <li key={hour} className={styles.hourRow}>
                            <span
                                className={styles.hourLabel}
                                style={{ color: theme.primaryContainer }}
                            >
                                {hour.toString().padStart(2, "0")}
                            </span>
                            <span className={styles.minutesList}>
                                {minutes.map((minute, i) => (
                                    <span key={i} className={styles.minute}>
                                        {formatMinute(minute)}
                                    </span>
                                ))}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.empty}>{t("stopTimetable.empty")}</p>
            )}
        </div>
    );
};
