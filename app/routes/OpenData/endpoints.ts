// Public ("open data") API endpoints documented on the single /opendata page.
// Structure is language-neutral; titles/descriptions/param hints come from i18n.

import type { CodeLang } from "./CodeBlock/CodeBlock";

/** Public site origin, used for canonical URLs and structured data. */
export const SITE_URL = "https://zbiorkom.live";

export const OPEN_API_BASE =
    (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/api6\/?$/, "/api6-open") ??
    "https://api.zbiorkom.live/api6-open";

export type OpenParam = {
    /** literal name as it appears in the URL, e.g. ":stopSlug" or "limit" */
    name: string;
    in: "path" | "query";
    /** i18n key under openData.hints */
    hint: string;
};

/** One line of a format's "what's in / what's out" checklist. */
export type SpecItem = {
    /** `yes` = provided (✓), `no` = deliberately omitted (✗) */
    status: "yes" | "no";
    /** language-neutral technical token (file / entity / field), shown in monospace */
    code: string;
    /** i18n key under openData.spec.<slug>.items for the human-readable note */
    desc: string;
};

/** Per-format conformance note: which parts of the standard we expose vs. skip. */
export type EndpointSpec = {
    items: SpecItem[];
};

/**
 * One returnable format of an endpoint that can answer in more than one
 * (e.g. GTFS-RT → protobuf | JSON, SIRI → JSON | XML). Each variant is shown
 * as its own request line with a format badge and its own response shape.
 */
export type FormatVariant = {
    /** badge label, e.g. "Protobuf", "JSON", "XML" */
    label: string;
    /** appended to the displayed URL after the last segment, e.g. "+json"; "" for the default */
    suffix: string;
    /** language for the response code block (omit when there is no preview) */
    lang?: CodeLang;
    /** response shape for this format, or null for binary (no preview) */
    typing: string | null;
};

export type OpenEndpoint = {
    /** anchor id + i18n key under openData.ep */
    slug: string;
    /** path after the base URL, with :placeholders */
    path: string;
    params: OpenParam[];
    /** response shape as a TypeScript type, or null for binary (buffer) responses */
    typing: string | null;
    /**
     * Present when the endpoint serves more than one format — rendered as one
     * request line per variant. When set, `typing` is ignored.
     */
    formats?: FormatVariant[];
    /**
     * Conformance checklist for the standardized formats (GTFS, GTFS-RT, NeTEx,
     * SIRI). Each of these is a "standard" yet differs in what it actually carries,
     * so we spell out exactly what is and isn't included. Absent for the
     * non-standard JSON endpoints.
     */
    spec?: EndpointSpec;
};

const CITY: OpenParam = { name: ":city", in: "path", hint: "city" };

const ROUTE_TYPE = `enum RouteType {
    Tram = 0,
    Subway = 1,
    Rail = 2,
    Bus = 3,
    Ferry = 4,
    CableTram = 5,
    AerialLift = 6,
    Funicular = 7,
    Trolleybus = 11,
    Monorail = 12,
}`;

const stopsTyping = `type Response = {
    stops: Stop[];
};

// Tuple — field order matters
type Stop = [
    id: string,                           // GTFS stop_id
    city: string,
    name: string,
    code: string,                         // stop_code, or ""
    location: [lon: number, lat: number],
    routeTypes: RouteType[],              // vehicle types calling here
    bearing?: number,                     // heading, degrees
];

${ROUTE_TYPE}`;

const departuresTyping = `type Response = {
    departures: Departure[];
};

type Departure = {
    trip: {
        route: {
            id: string;
            name: string;
            agency: string;               // "default" = main operator
            type: RouteType;
            color: string;                // hex, without "#"
        };
        headsign?: string;
        brigade?: string;
        shortName?: string;
    };
    scheduledDeparture: number;           // unix ms
    delay: number;                        // ms
    isRealtime: boolean;
    isCancelled: boolean;
    platform?: string;
};`;

const positionsTyping = `type Response = {
    positions: VehiclePosition[];
};

type VehiclePosition = {
    vehicle: {
        id: string;                       // fleet number
        type: RouteType;
        agency: string;
        model: string | null;
    };
    routeName: string;
    routeColor: string;                   // hex, without "#"
    brigade: string;
    location: [lon: number, lat: number];
    timestamp: number;                    // unix ms
    bearing: number;                      // degrees
    delay: number;                        // ms
    headsign: string | null;
    upcomingStops: UpcomingStop[];        // up to 3 nearest stops
    url: string;
};

type UpcomingStop = {
    sequence: number;
    name: string;
    scheduledArrival: number;             // unix ms
    scheduledDeparture: number;           // unix ms
};`;

const gtfsRtTyping = `// GTFS-Realtime feed. Binary protobuf by default,
// or this JSON shape when the "+json" format suffix is used.
type Response = {
    header: {
        gtfsRealtimeVersion: "2.0";
        incrementality: "FULL_DATASET";
        timestamp: number;                // unix seconds
    };
    entity: FeedEntity[];
};

type FeedEntity = {
    id: string;
    tripUpdate?: TripUpdate;
    vehicle?: VehiclePosition;
};

type TripUpdate = {
    trip: TripDescriptor;
    vehicle?: { id: string; label?: string };
    stopTimeUpdate: {
        stopSequence: number;
        arrival?: { time: number };       // unix seconds
        departure?: { time: number };
        scheduleRelationship: "SCHEDULED" | "SKIPPED";
    }[];
    timestamp?: number;
};

type VehiclePosition = {
    trip: TripDescriptor;
    vehicle?: { id: string; label?: string };
    position: { latitude: number; longitude: number; bearing?: number };
    currentStopSequence?: number;
    currentStatus: "IN_TRANSIT_TO" | "STOPPED_AT";
    timestamp?: number;
};

type TripDescriptor = {
    tripId: string;
    startDate: string;                    // "YYYYMMDD"
    startTime: string;                    // "HH:MM:SS"
    routeId: string;
    scheduleRelationship: "SCHEDULED";
};`;

const siriJsonTyping = `// SIRI 2.0 ServiceDelivery snapshot — JSON (default format).
type Response = {
    Siri: {
        ServiceDelivery: {
            ResponseTimestamp: string;            // ISO-8601 UTC
            ProducerRef: "ZBIORKOMLIVE";
            EstimatedTimetableDelivery?: [{
                version: "2.0";
                EstimatedJourneyVersionFrame: {
                    EstimatedVehicleJourney: EstimatedVehicleJourney[];
                };
            }];
            VehicleMonitoringDelivery?: [{
                version: "2.0";
                VehicleActivity: VehicleActivity[];
            }];
        };
    };
};

type EstimatedVehicleJourney = {
    LineRef: string;
    FramedVehicleJourneyRef: { DataFrameRef: string; DatedVehicleJourneyRef: string };
    DataSource: string;
    IsCompleteStopSequence: true;
    EstimatedCalls: { EstimatedCall: EstimatedCall[] };
};

type EstimatedCall = {
    StopPointRef: string;                     // Quay id
    Order: number;
    AimedArrivalTime?: string;                // local ISO, no zone
    ExpectedArrivalTime?: string;
    AimedDepartureTime?: string;
    ExpectedDepartureTime?: string;
    Cancellation?: true;                      // cancelled call
};

type VehicleActivity = {
    RecordedAtTime: string;
    ValidUntilTime: string;                   // +60s
    MonitoredVehicleJourney: {
        LineRef: string;
        FramedVehicleJourneyRef: { DataFrameRef: string; DatedVehicleJourneyRef: string };
        OriginRef?: string;
        DestinationRef?: string;
        VehicleLocation: { Longitude: number; Latitude: number };   // EPSG:4326
        Bearing?: number;
        Delay?: string;                       // ISO-8601 duration, e.g. "PT60S"
        VehicleRef: string;
        MonitoredCall?: { StopPointRef: string; Order: number; VehicleAtStop: boolean };
        IsCompleteStopSequence: false;
    };
};`;

const siriXmlTyping = `// SIRI 2.0 document — Content-Type: application/xml
// <Siri><ServiceDelivery> carrying the same data as the JSON form:
//   EstimatedTimetableDelivery  — estimated arrival/departure times
//   VehicleMonitoringDelivery   — live vehicle positions
type Response = string; // XML`;

// Conformance checklists for the four standardized formats. Distilled from the
// open-data spec: every format is a "standard", but each carries a different
// subset, so we list what we expose (✓) and what we deliberately skip (✗).
const gtfsSpec: EndpointSpec = {
    items: [
        { status: "yes", code: "agency.txt", desc: "agency" },
        { status: "yes", code: "feed_info.txt", desc: "feedInfo" },
        { status: "yes", code: "attributions.txt", desc: "attributions" },
        { status: "yes", code: "routes.txt", desc: "routes" },
        { status: "yes", code: "trips.txt", desc: "trips" },
        { status: "yes", code: "stops.txt", desc: "stops" },
        { status: "yes", code: "stop_times.txt", desc: "stopTimes" },
        { status: "yes", code: "shapes.txt", desc: "shapes" },
        { status: "yes", code: "calendar(_dates).txt", desc: "calendar" },
        { status: "yes", code: "frequencies.txt", desc: "frequencies" },
        { status: "no", code: "transfers.txt", desc: "transfers" },
        { status: "no", code: "pathways.txt / levels.txt", desc: "pathways" },
        { status: "no", code: "fare_*", desc: "fares" },
        { status: "no", code: "translations.txt", desc: "translations" },
        { status: "no", code: "shape_dist_traveled / timepoint", desc: "distTraveled" },
        { status: "no", code: "route_desc / route_url / agency_phone", desc: "routeMeta" },
    ],
};

const gtfsRtSpec: EndpointSpec = {
    items: [
        { status: "yes", code: "TripUpdate", desc: "tripUpdates" },
        { status: "yes", code: "VehiclePosition", desc: "vehiclePositions" },
        { status: "yes", code: "SKIPPED", desc: "skipped" },
        { status: "yes", code: "block delay propagation", desc: "delayProp" },
        { status: "yes", code: "protobuf / +json", desc: "formats" },
        { status: "no", code: "Alert", desc: "alerts" },
        { status: "no", code: "stopTimeUpdate.stop_id", desc: "stopId" },
        { status: "no", code: "delay / uncertainty", desc: "delayField" },
        { status: "no", code: "occupancy / congestion", desc: "occupancy" },
        { status: "no", code: "trip ADDED / CANCELED", desc: "tripScheduleRel" },
        { status: "no", code: "TripModifications / Shape / Stop", desc: "tripMods" },
    ],
};

const netexSpec: EndpointSpec = {
    items: [
        { status: "yes", code: "ResourceFrame", desc: "resourceFrame" },
        { status: "yes", code: "SiteFrame (StopPlace + Quay)", desc: "siteFrame" },
        { status: "yes", code: "ServiceFrame (Network / Line)", desc: "serviceFrame" },
        { status: "yes", code: "ServiceCalendarFrame", desc: "calendarFrame" },
        { status: "yes", code: "TimetableFrame (ServiceJourney)", desc: "timetableFrame" },
        { status: "yes", code: "EPIP profile (EU_PI)", desc: "epip" },
        { status: "no", code: "FareFrame", desc: "fares" },
        { status: "no", code: "Interchange / Connection", desc: "interchanges" },
        { status: "no", code: "RouteLink / ServiceLink", desc: "geometry" },
        { status: "no", code: "Block / VehicleType", desc: "blocks" },
        { status: "no", code: "FlexibleLine", desc: "flexible" },
        { status: "no", code: "AccessibilityAssessment", desc: "accessibility" },
        { status: "no", code: "StopPlaceEntrance / PathLink", desc: "entrances" },
        { status: "no", code: "SIRI-SX situations", desc: "situations" },
    ],
};

const siriSpec: EndpointSpec = {
    items: [
        { status: "yes", code: "EstimatedTimetableDelivery (ET)", desc: "et" },
        { status: "yes", code: "VehicleMonitoringDelivery (VM)", desc: "vm" },
        { status: "yes", code: "ServiceDelivery snapshot", desc: "snapshot" },
        { status: "yes", code: "XML / JSON", desc: "formats" },
        { status: "no", code: "StopMonitoringDelivery (SM)", desc: "sm" },
        { status: "no", code: "SituationExchangeDelivery (SX)", desc: "sx" },
        { status: "no", code: "ProductionTimetable / GeneralMessage", desc: "otherDeliveries" },
        { status: "no", code: "SubscriptionRequest / Heartbeat", desc: "subscriptions" },
        { status: "no", code: "ServiceRequest filtering", desc: "requestResponse" },
        { status: "no", code: "Occupancy / OnwardCalls", desc: "occupancy" },
    ],
};

// Order: the four standardized exchange formats first (GTFS, GTFS-Realtime,
// NeTEx, SIRI), then the non-standard JSON endpoints as before.
export const OPEN_ENDPOINTS: OpenEndpoint[] = [
    {
        slug: "gtfs",
        path: "/:city/gtfs/:agency",
        params: [CITY, { name: ":agency", in: "path", hint: "agency" }],
        typing: null,
        spec: gtfsSpec,
    },
    {
        slug: "gtfs-realtime",
        path: "/:city/gtfsRealtime/:agency/:feedTypes",
        params: [
            CITY,
            { name: ":agency", in: "path", hint: "agency" },
            { name: ":feedTypes", in: "path", hint: "feedTypes" },
        ],
        typing: null,
        formats: [
            { label: "Protobuf", suffix: "", typing: null },
            { label: "JSON", suffix: "+json", lang: "typescript", typing: gtfsRtTyping },
        ],
        spec: gtfsRtSpec,
    },
    {
        slug: "netex",
        path: "/:city/netex/:agency",
        params: [CITY, { name: ":agency", in: "path", hint: "agency" }],
        typing: null,
        spec: netexSpec,
    },
    {
        slug: "siri",
        path: "/:city/siri/:agency/:feedTypes",
        params: [
            CITY,
            { name: ":agency", in: "path", hint: "agency" },
            { name: ":feedTypes", in: "path", hint: "feedTypesSiri" },
        ],
        typing: null,
        formats: [
            { label: "JSON", suffix: "", lang: "typescript", typing: siriJsonTyping },
            { label: "XML", suffix: "+xml", lang: "typescript", typing: siriXmlTyping },
        ],
        spec: siriSpec,
    },
    {
        slug: "stops",
        path: "/:city/stops",
        params: [CITY],
        typing: stopsTyping,
    },
    {
        slug: "departures",
        path: "/:city/stops/:stopSlug",
        params: [
            CITY,
            { name: ":stopSlug", in: "path", hint: "stopSlug" },
            { name: "limit", in: "query", hint: "limit" },
            { name: "time", in: "query", hint: "time" },
            { name: "agencies", in: "query", hint: "agenciesFilter" },
            { name: "routes", in: "query", hint: "routesFilter" },
        ],
        typing: departuresTyping,
    },
    {
        slug: "positions",
        path: "/:city/positions/:bbox",
        params: [
            CITY,
            { name: ":bbox", in: "path", hint: "bbox" },
            { name: "agencies", in: "query", hint: "agenciesFilter" },
            { name: "routes", in: "query", hint: "routesFilter" },
        ],
        typing: positionsTyping,
    },
];
