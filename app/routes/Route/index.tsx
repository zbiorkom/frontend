import { useEffect, useRef, useState } from "react";
import { redirect, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { computeRouteTheme, getCity, getRouteGraph } from "~/util";
import { ERoute, ERouteGraphStop, EStop, VehicleType } from "~/typings";
import { typeIcons } from "~/constants";
import { ArrowRight } from "~/components/UI/Icons";
import BackButton from "~/components/BackButton/BackButton";
import i18n from "~/i18n";
import type { Route } from "./+types";
import styles from "./Route.module.less";

const ROW_HEIGHT = 56;

// Track 1 is the main trunk (center). Render it last so it paints above the side lanes.
const MAIN_TRACK = 1;
const byTrackPaint = (a: readonly [unknown, number], b: readonly [unknown, number]) =>
    (a[1] === MAIN_TRACK ? 1 : 0) - (b[1] === MAIN_TRACK ? 1 : 0);

export const loader = async ({ params }: Route.LoaderArgs) => {
    const city = await getCity(params.city!);
    if (!city) return redirect("/404");

    const agency = city.agencies[params.agency!];
    if (!agency) return redirect(`/${params.city}`);

    const data = await getRouteGraph(params.city!, params.route!, { rowHeight: ROW_HEIGHT });
    if (!data) return redirect(`/${params.city}/${params.agency}`);
    if (data.route[ERoute.agency] !== agency.id) {
        return redirect(`/${params.city}/${data.route[ERoute.agency]}/${params.route}`);
    }

    return {
        cityId: city.id,
        cityName: city.name,
        agency,
        route: data.route,
        graph: data.graph,
        theme: computeRouteTheme(data.route[ERoute.color]),
    };
};

export const meta: Route.MetaFunction = ({ data, params }) => {
    if (!data || !("route" in data)) {
        return [{ title: i18n.t("route.meta.titleOnly", { name: params.route ?? "" }) }];
    }
    const name = data.route[ERoute.name];
    const longName = data.route[ERoute.longName];
    return [
        { title: i18n.t("route.meta.titleWithCity", { name, city: data.cityName }) },
        {
            name: "description",
            content: i18n.t("route.meta.description", { name, longName, city: data.cityName }),
        },
    ];
};

const getHeadsign = (dir: { stops: [unknown, ...unknown[]][] }, fallback: string) => {
    const last = dir.stops[dir.stops.length - 1];
    if (!last) return fallback;
    return (last[0] as string[])[EStop.name];
};

export default ({ loaderData }: Route.ComponentProps) => {
    const { t } = useTranslation();
    const { cityId, agency, route, graph, theme } = loaderData;
    const iconSvg = agency.icon ?? typeIcons[route[ERoute.type]] ?? typeIcons[VehicleType.Bus];

    const [activeDir, setActiveDir] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const onDocClick = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    const dir = graph[activeDir] ?? graph[0];

    return (
        <div className={styles.page}>
            <div className={styles.head}>
                <BackButton to={`/${cityId}/${agency.id}`} label={t("route.backLabel")} />
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
                    <h1 className={styles.longName}>{route[ERoute.longName]}</h1>
                    <p className={styles.agencyName}>{agency.name}</p>
                </div>
            </div>

            {graph.length > 1 && (
                <div className={styles.dirPicker} ref={menuRef}>
                    <button
                        type="button"
                        className={styles.dirTrigger}
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-haspopup="listbox"
                        aria-expanded={menuOpen}
                    >
                        <span className={styles.dirTriggerHint} style={{ color: theme.primaryContainer }}>
                            {t("route.directionHint")}
                        </span>
                        <span className={styles.dirTriggerLabel}>
                            {getHeadsign(dir as never, t("route.directionFallback", { n: activeDir + 1 }))}
                        </span>
                        <span
                            className={`${styles.dirChevron} ${menuOpen ? styles.dirChevronOpen : ""}`}
                            aria-hidden
                        >
                            <ArrowRight />
                        </span>
                    </button>
                    {menuOpen && (
                        <ul className={styles.dirMenu} role="listbox">
                            {graph.map((d, i) => {
                                const headsign = getHeadsign(
                                    d as never,
                                    t("route.directionFallback", { n: i + 1 }),
                                );
                                const isActive = activeDir === i;
                                return (
                                    <li key={i} role="presentation">
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={isActive}
                                            className={`${styles.dirOption} ${
                                                isActive ? styles.dirOptionActive : ""
                                            }`}
                                            onClick={() => {
                                                setActiveDir(i);
                                                setMenuOpen(false);
                                            }}
                                            style={
                                                isActive
                                                    ? {
                                                          backgroundColor: theme.primaryContainer,
                                                          color: theme.onPrimaryContainer,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <span className={styles.dirOptionArrow} aria-hidden>
                                                <ArrowRight />
                                            </span>
                                            <span className={styles.dirOptionLabel}>{headsign}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {dir && (
                <section className={styles.direction}>
                    <ol className={styles.stops}>
                        {dir.stops.map((row, si) => {
                            const stop = row[ERouteGraphStop.stop];
                            const width = row[ERouteGraphStop.width];
                            const paths = row[ERouteGraphStop.paths];
                            const nodes = row[ERouteGraphStop.nodes];
                            const code = stop[EStop.code];
                            return (
                                <li
                                    key={`${stop[EStop.id]}-${si}`}
                                    className={styles.stop}
                                    style={{ height: ROW_HEIGHT }}
                                >
                                    <svg
                                        className={styles.rowSvg}
                                        width={width}
                                        height={ROW_HEIGHT}
                                        viewBox={`0 0 ${width} ${ROW_HEIGHT}`}
                                        aria-hidden
                                    >
                                        {[...paths].sort(byTrackPaint).map(([d, track], pi) => (
                                            <path
                                                key={pi}
                                                d={d}
                                                stroke={theme.trackColors[track % theme.trackColors.length]}
                                                strokeWidth={5}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                fill="none"
                                            />
                                        ))}
                                        {[...nodes].sort(byTrackPaint).map(([x, track], ni) => (
                                            <circle
                                                key={ni}
                                                cx={x}
                                                cy={ROW_HEIGHT / 2}
                                                r={7}
                                                fill="#fff"
                                                stroke={theme.trackColors[track % theme.trackColors.length]}
                                                strokeWidth={4}
                                            />
                                        ))}
                                    </svg>
                                    <Link
                                        to={`/${cityId}/stops/${stop[EStop.id]}/${route[ERoute.id]}`}
                                        className={styles.stopLink}
                                    >
                                        <span className={styles.stopName}>
                                            {stop[EStop.name]}
                                            {code && ` ${code}`}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            )}
        </div>
    );
};
