import { DarkScheme } from "material-color-lite";
import type {
    City,
    GeocodeMatch,
    PlanEtasResponse,
    PlannerEndpoint,
    PlanRealtimeResponse,
    PlanResponse,
    Point,
    Route,
    RouteGraphResponse,
    StopTimetableResponse,
} from "./typings";

export type RouteTheme = {
    primaryContainer: string;
    onPrimaryContainer: string;
    trackColors: string[];
};

export const computeRouteTheme = (color: string): RouteTheme => {
    const scheme = new DarkScheme(color);
    return {
        primaryContainer: scheme.primaryContainer,
        onPrimaryContainer: scheme.onPrimaryContainer,
        trackColors: [
            scheme.getTone("primary", 40),
            scheme.getTone("tertiary", 40),
            scheme.getTone("secondary", 40),
            scheme.getTone("primary", 30),
            scheme.getTone("tertiary", 30),
            scheme.getTone("secondary", 30),
            scheme.getTone("primary", 50),
            scheme.getTone("tertiary", 50),
        ],
    };
};

const citiesIndex: Record<string, number> = {};
let citiesCache: City[] | null = null;
const routesCache: Record<string, Route[]> = {};

export const getCities = async () => {
    if (citiesCache) {
        return citiesCache;
    }

    const { cities } = await fetch(process.env.API_BASE!)
        .then((res) => res.json() as Promise<{ cities: City[] }>)
        .catch(() => ({ cities: [] }));

    citiesCache = cities;
    cities.forEach((city, index) => {
        citiesIndex[city.id] = index;
    });

    return cities;
};

export const getCity = async (id: string) => {
    if (!citiesCache) {
        await getCities();
    }

    return citiesCache![citiesIndex[id]];
};

export const getRoutes = async (city: string) => {
    if (routesCache[city]) return routesCache[city];

    const routes = await fetch(`${process.env.API_BASE!}/${city}/routes`)
        .then((res) => res.json() as Promise<Route[]>)
        .catch(() => [] as Route[]);

    routesCache[city] = routes;
    return routes;
};

export const getRouteGraph = async (
    city: string,
    routeId: string,
    opts: { rowHeight?: number } = {},
): Promise<RouteGraphResponse | null> => {
    const params = new URLSearchParams();
    if (opts.rowHeight !== undefined) params.set("rowHeight", String(opts.rowHeight));
    const qs = params.toString();
    const url = `${process.env.API_BASE!}/${city}/routes/${routeId}/graph${qs ? `?${qs}` : ""}`;
    return fetch(url)
        .then((res) => (res.ok ? (res.json() as Promise<RouteGraphResponse>) : null))
        .catch(() => null);
};

export const encodePlannerEndpoint = (endpoint: PlannerEndpoint): string =>
    `${endpoint.location[0]},${endpoint.location[1]},${endpoint.name}`;

export const decodePlannerEndpoint = (value: string): PlannerEndpoint | null => {
    const idx1 = value.indexOf(",");
    if (idx1 < 0) return null;
    const idx2 = value.indexOf(",", idx1 + 1);
    if (idx2 < 0) return null;
    const lon = +value.slice(0, idx1);
    const lat = +value.slice(idx1 + 1, idx2);
    const name = value.slice(idx2 + 1);
    if (!isFinite(lon) || !isFinite(lat) || !name) return null;
    return { location: [lon, lat], name };
};

const apiBase = () =>
    (typeof window === "undefined" ? process.env.API_BASE : import.meta.env.VITE_API_BASE)!;

export const geocode = async (
    city: string,
    query: string,
    signal?: AbortSignal,
): Promise<GeocodeMatch[]> => {
    const url = `${apiBase()}/${city}/plan/geocode?query=${encodeURIComponent(query)}`;
    return fetch(url, { signal })
        .then((res) => (res.ok ? (res.json() as Promise<GeocodeMatch[]>) : []))
        .catch(() => [] as GeocodeMatch[]);
};

export const reverseGeocode = async (
    city: string,
    location: Point,
): Promise<GeocodeMatch | null> => {
    const url = `${apiBase()}/${city}/plan/reverseGeocode?location=${location[0]},${location[1]}`;
    return fetch(url)
        .then((res) => (res.ok ? (res.json() as Promise<GeocodeMatch>) : null))
        .catch(() => null);
};

export type PlanOptions = {
    time?: string;
    isArrivalTime?: boolean;
    pedestrianSpeed?: number;
    cyclingSpeed?: number;
};

export const plan = async (
    city: string,
    fromPlace: Point,
    toPlace: Point,
    opts: PlanOptions = {},
): Promise<PlanResponse | null> => {
    const params = new URLSearchParams({
        fromPlace: `${fromPlace[0]},${fromPlace[1]}`,
        toPlace: `${toPlace[0]},${toPlace[1]}`,
    });
    if (opts.time) params.set("time", opts.time);
    if (opts.isArrivalTime) params.set("isArrivalTime", "true");
    if (opts.pedestrianSpeed !== undefined)
        params.set("pedestrianSpeed", String(opts.pedestrianSpeed));
    if (opts.cyclingSpeed !== undefined)
        params.set("cyclingSpeed", String(opts.cyclingSpeed));
    const url = `${apiBase()}/${city}/plan?${params.toString()}`;
    return fetch(url)
        .then((res) => (res.ok ? (res.json() as Promise<PlanResponse>) : null))
        .catch(() => null);
};

export const getPlanEtas = async (
    city: string,
    keys: string[],
): Promise<PlanEtasResponse> => {
    const url = `${apiBase()}/${city}/plan/etas?keys=${keys.join(",")}`;
    return fetch(url)
        .then((res) => (res.ok ? (res.json() as Promise<PlanEtasResponse>) : []))
        .catch(() => [] as PlanEtasResponse);
};

export const getPlanRealtime = async (
    city: string,
    key: string,
): Promise<PlanRealtimeResponse> => {
    const url = `${apiBase()}/${city}/plan/realtime?key=${key}`;
    return fetch(url)
        .then((res) => (res.ok ? (res.json() as Promise<PlanRealtimeResponse>) : []))
        .catch(() => [] as PlanRealtimeResponse);
};

export const getStopTimetable = async (
    city: string,
    stopId: string,
    routeId: string,
): Promise<StopTimetableResponse | null> => {
    const url = `${process.env.API_BASE!}/${city}/stops/${stopId}/timetable/${routeId}`;
    return fetch(url)
        .then((res) => (res.ok ? (res.json() as Promise<StopTimetableResponse>) : null))
        .catch(() => null);
};
