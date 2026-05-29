export type Point = [longitude: number, latitude: number];

export type City = {
    id: string;
    name: string;
    description?: string;
    category?: CityCategory;
    location: Point;
    agencies: Record<string, Agency>;
};

export enum CityCategory {
    LowerSilesian = "lowerSilesian",
    KuyavianPomeranian = "kuyavianPomeranian",
    Lodz = "lodz",
    Lublin = "lublin",
    Lubusz = "lubusz",
    LesserPoland = "lesserPoland",
    Masovian = "masovian",
    Opole = "opole",
    Subcarpathian = "subcarpathian",
    Podlasie = "podlasie",
    Pomeranian = "pomeranian",
    Silesian = "silesian",
    HolyCross = "holyCross",
    WarmianMasurian = "warmianMasurian",
    GreaterPoland = "greaterPoland",
    WestPomeranian = "westPomeranian",
    Finland = "finland",
    Sweden = "sweden",
    Netherlands = "netherlands",
    Virtual = "virtual",
}

export type Agency = {
    id: string;
    name: string;
    location?: Point;
    icon?: string;
    faresUrl?: string;
    dataSources?: {
        text: string;
        url?: string;
    }[];
};

export type Route = [
    id: string,
    city: string,
    name: string,
    longName: string,
    agency: "default" | string,
    type: VehicleType,
    color: string,
];

export enum ERoute {
    id,
    city,
    name,
    longName,
    agency,
    type,
    color,
}

export enum VehicleType {
    Tram = 0,
    Subway = 1,
    Train = 2,
    Bus = 3,
    Ferry = 4,
    CableTram = 5,
    AerialLift = 6,
    Funicular = 7,
    Trolleybus = 11,
    Monorail = 12,
}

export type Stop = [
    id: string,
    city: string,
    name: string,
    code: string,
    location: Point,
    routeTypes: VehicleType[],
    bearing: number,
];

export enum EStop {
    id,
    city,
    name,
    code,
    location,
    routeTypes,
    bearing,
}

export type RouteGraphNode = [x: number, track: number];

export type RouteGraphPath = [d: string, track: number];

export type RouteGraphStop = [
    stop: Stop,
    tracks: number[],
    width: number,
    paths: RouteGraphPath[],
    nodes: RouteGraphNode[],
];

export enum ERouteGraphStop {
    stop,
    tracks,
    width,
    paths,
    nodes,
}

export type RouteGraphDirection = {
    stops: RouteGraphStop[];
};

export type RouteGraphResponse = {
    route: Route;
    graph: RouteGraphDirection[];
};

export type TimetableEntry = [tripIdx: number, departure: number, alight: number];

export type StopTimetableResponse = {
    stop: Stop;
    timetable: Record<string, TimetableEntry[]>;
};

export type GeocodeMatchType = "ADDRESS" | "PLACE" | "STOP";

export type GeocodeMatch = {
    type: GeocodeMatchType;
    name: string;
    description?: string;
    location: Point;
};

export type PlannerEndpoint = {
    name: string;
    description?: string;
    location: Point;
};

export type PlanNonTransitLeg = {
    mode: string;
    geometry: string;
    distance: number;
    duration: number;
};

export type PlanTransitLeg = {
    stops: Stop[];
    polyline: string;
    routes: Route[];
    duration: number;
};

export type PlanLeg = PlanNonTransitLeg | PlanTransitLeg;

export const isTransitLeg = (leg: PlanLeg): leg is PlanTransitLeg =>
    (leg as PlanTransitLeg).stops !== undefined;

export type Itinerary = {
    key: string;
    legs: PlanLeg[];
};

export type PlanResponse = {
    previousPageCursor?: string;
    nextPageCursor?: string;
    itineraries: Itinerary[];
};

export type PlanEta = {
    leaveTime: number;
    arrivalTime: number;
    realtimeCoverage: number;
};

export type PlanEtasResponse = (PlanEta | null)[];

export type PlanRealtimeDeparture = unknown;

export type PlanRealtimeResponse = (PlanRealtimeDeparture[] | null)[];
