import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { ERoute, type Agency, type Route as RouteData } from "~/typings";
import { vehicleTypeI18nKeys } from "~/constants";
import { ArrowRight, Search } from "~/components/UI/Icons";
import Route from "~/components/Route/Route";
import type { RouteTheme } from "~/util";
import styles from "./AgencyDetail.module.less";

const MIN_COLUMN_WIDTH = 320;
const COLUMN_GAP = 8;

type EnrichedRoute = { route: RouteData; theme: RouteTheme };

type VirtualRow =
    | { kind: "header"; key: string; label: string }
    | { kind: "row"; key: string; items: EnrichedRoute[] };

type Props = {
    city: string;
    cityName: string;
    agency: Agency;
    routes: EnrichedRoute[];
};

export default ({ city, cityName, agency, routes }: Props) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query);

    const filtered = useMemo(() => {
        const q = deferredQuery.trim().toLowerCase();
        if (!q) return routes;
        return routes.filter(({ route }) =>
            route[ERoute.name].toLowerCase().includes(q) ||
            route[ERoute.longName].toLowerCase().includes(q),
        );
    }, [routes, deferredQuery]);

    const grouped = useMemo(() => {
        const map = new Map<number, EnrichedRoute[]>();
        for (const r of filtered) {
            const type = r.route[ERoute.type];
            if (!map.has(type)) map.set(type, []);
            map.get(type)!.push(r);
        }
        return [...map.entries()].sort((a, b) => a[0] - b[0]);
    }, [filtered]);

    const hasMultipleTypes = grouped.length > 1;

    const listRef = useRef<HTMLDivElement | null>(null);
    const [columns, setColumns] = useState(1);
    const offsetRef = useRef(0);

    useLayoutEffect(() => {
        offsetRef.current = listRef.current?.offsetTop ?? 0;
    });

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const update = () => {
            const w = el.clientWidth;
            const cols = Math.max(
                1,
                Math.floor((w + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP)),
            );
            setColumns(cols);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const rows = useMemo<VirtualRow[]>(() => {
        const out: VirtualRow[] = [];
        for (const [type, items] of grouped) {
            if (hasMultipleTypes) {
                const key = vehicleTypeI18nKeys[type];
                out.push({
                    kind: "header",
                    key: `h-${type}`,
                    label: key ? t(key) : t("agency.groupOther"),
                });
            }
            for (let i = 0; i < items.length; i += columns) {
                out.push({
                    kind: "row",
                    key: `r-${type}-${i}`,
                    items: items.slice(i, i + columns),
                });
            }
        }
        return out;
    }, [grouped, columns, hasMultipleTypes, t]);

    const virtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: (i) => (rows[i].kind === "header" ? 44 : 88),
        overscan: 6,
        getItemKey: (i) => rows[i].key,
        scrollMargin: offsetRef.current,
    });

    const description = t("agency.description", {
        count: routes.length,
        name: agency.name,
        cityName,
    });

    return (
        <div className={styles.detail}>
            <div className={styles.titleRow}>
                <Link
                    to={`/${city}`}
                    className={styles.back}
                    aria-label={t("agency.backLabel")}
                >
                    <ArrowRight />
                </Link>
                <h2>{agency.name}</h2>
            </div>

            <p className={styles.description}>{description}</p>

            <label className={styles.searchWrap}>
                <Search className={styles.searchIcon} />
                <input
                    className={styles.search}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("agency.searchPlaceholder")}
                />
                {query && (
                    <button
                        type="button"
                        className={styles.clear}
                        onClick={() => setQuery("")}
                        aria-label={t("common.clear")}
                    >
                        ×
                    </button>
                )}
            </label>

            <div
                ref={listRef}
                className={styles.virtualList}
                style={{ height: virtualizer.getTotalSize() }}
            >
                {virtualizer.getVirtualItems().map((v) => {
                    const row = rows[v.index];
                    return (
                        <div
                            key={v.key}
                            data-index={v.index}
                            ref={virtualizer.measureElement}
                            className={styles.virtualItem}
                            style={{
                                transform: `translateY(${v.start - virtualizer.options.scrollMargin}px)`,
                            }}
                        >
                            {row.kind === "header" ? (
                                <h3 className={styles.groupHeader}>{row.label}</h3>
                            ) : (
                                <div
                                    className={styles.row}
                                    style={{
                                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                    }}
                                >
                                    {row.items.map(({ route, theme }) => (
                                        <Route
                                            key={route[0]}
                                            route={route}
                                            theme={theme}
                                            icon={agency.icon}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {!filtered.length && (
                <p className={styles.empty}>{t("agency.noResults", { query: deferredQuery })}</p>
            )}
        </div>
    );
};
