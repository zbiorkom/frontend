import { useEffect, useMemo, useRef } from "react";
import { Map, Marker, NavigationControl, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Itinerary, PlannerEndpoint } from "~/typings";
import { EStop } from "~/typings";
import styles from "./Planner.module.less";

type Props = {
    mapStyle: string;
    from: PlannerEndpoint | null;
    to: PlannerEndpoint | null;
    selected: Itinerary | null;
};

const decodePolyline = (str: string, precision = 6): [number, number][] => {
    const factor = 10 ** precision;
    const coords: [number, number][] = [];
    let i = 0;
    let lat = 0;
    let lng = 0;
    while (i < str.length) {
        let result = 0;
        let shift = 0;
        let b: number;
        do {
            b = str.charCodeAt(i++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;

        result = 0;
        shift = 0;
        do {
            b = str.charCodeAt(i++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;

        coords.push([lng / factor, lat / factor]);
    }
    return coords;
};

const DEFAULT_VIEW = { longitude: 21.012, latitude: 52.23, zoom: 11 };

export default ({ mapStyle, from, to, selected }: Props) => {
    const mapRef = useRef<MapRef>(null);

    const initialView = useMemo(() => {
        if (from && to) {
            return {
                longitude: (from.location[0] + to.location[0]) / 2,
                latitude: (from.location[1] + to.location[1]) / 2,
                zoom: 12,
            };
        }
        const single = from ?? to;
        if (single) {
            return { longitude: single.location[0], latitude: single.location[1], zoom: 13 };
        }
        return DEFAULT_VIEW;
    }, []);

    const routeGeojson = useMemo(() => {
        if (!selected) return null;
        const features = selected.legs.flatMap((leg, i) => {
            const encoded = "polyline" in leg ? leg.polyline : leg.geometry;
            if (!encoded) return [];
            const coords = decodePolyline(encoded);
            if (coords.length < 2) return [];
            const isTransit = "stops" in leg;
            const color = isTransit ? leg.routes[0]?.[6] : null;
            return [
                {
                    type: "Feature" as const,
                    geometry: { type: "LineString" as const, coordinates: coords },
                    properties: {
                        index: i,
                        kind: isTransit ? "transit" : "walk",
                        color: color || (isTransit ? "#3366cc" : "#666"),
                    },
                },
            ];
        });
        return { type: "FeatureCollection" as const, features };
    }, [selected]);

    const stopsGeojson = useMemo(() => {
        if (!selected) return null;
        const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
        for (const leg of selected.legs) {
            if (!("stops" in leg)) continue;
            const stops = leg.stops;
            const color = leg.routes[0]?.[6] || "#3366cc";
            for (let i = 0; i < stops.length; i++) {
                const stop = stops[i];
                const loc = stop[EStop.location];
                if (!loc) continue;
                const isEnd = i === 0 || i === stops.length - 1;
                features.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: loc },
                    properties: {
                        name: stop[EStop.name],
                        color,
                        end: isEnd ? 1 : 0,
                    },
                });
            }
        }
        return { type: "FeatureCollection" as const, features };
    }, [selected]);

    useEffect(() => {
        if (!mapRef.current) return;
        const points: [number, number][] = [];
        if (from) points.push(from.location);
        if (to) points.push(to.location);
        if (selected) {
            for (const leg of selected.legs) {
                const encoded = "polyline" in leg ? leg.polyline : leg.geometry;
                if (!encoded) continue;
                points.push(...decodePolyline(encoded));
            }
        }
        if (points.length < 2) return;
        const bounds = new LngLatBounds(points[0], points[0]);
        for (const p of points) bounds.extend(p);
        mapRef.current.fitBounds(bounds, {
            padding: { top: 80, right: 80, bottom: 80, left: 80 },
            duration: 600,
            maxZoom: 16,
        });
    }, [from, to, selected]);

    return (
        <Map
            ref={mapRef}
            initialViewState={initialView}
            mapStyle={mapStyle}
            style={{ width: "100%", height: "100%" }}
        >
            <NavigationControl position="top-right" />

            {routeGeojson && (
                <Source id="route" type="geojson" data={routeGeojson}>
                    <Layer
                        id="route-casing"
                        type="line"
                        paint={{
                            "line-color": "#ffffff",
                            "line-width": ["case", ["==", ["get", "kind"], "walk"], 4, 7],
                        }}
                        layout={{ "line-join": "round", "line-cap": "round" }}
                    />
                    <Layer
                        id="route-line"
                        type="line"
                        paint={{
                            "line-color": ["get", "color"],
                            "line-width": ["case", ["==", ["get", "kind"], "walk"], 2, 5],
                            "line-dasharray": [
                                "case",
                                ["==", ["get", "kind"], "walk"],
                                ["literal", [0.5, 1.5]],
                                ["literal", [1]],
                            ],
                        }}
                        layout={{ "line-join": "round", "line-cap": "round" }}
                    />
                </Source>
            )}

            {stopsGeojson && (
                <Source id="stops" type="geojson" data={stopsGeojson}>
                    <Layer
                        id="stops-intermediate"
                        type="circle"
                        filter={["==", ["get", "end"], 0]}
                        paint={{
                            "circle-radius": 4,
                            "circle-color": "#ffffff",
                            "circle-stroke-color": ["get", "color"],
                            "circle-stroke-width": 2,
                        }}
                    />
                    <Layer
                        id="stops-end"
                        type="circle"
                        filter={["==", ["get", "end"], 1]}
                        paint={{
                            "circle-radius": 6,
                            "circle-color": ["get", "color"],
                            "circle-stroke-color": "#ffffff",
                            "circle-stroke-width": 2,
                        }}
                    />
                </Source>
            )}

            {from && (
                <Marker longitude={from.location[0]} latitude={from.location[1]} anchor="center">
                    <span className={`${styles.marker} ${styles.markerFrom}`} />
                </Marker>
            )}
            {to && (
                <Marker longitude={to.location[0]} latitude={to.location[1]} anchor="center">
                    <span className={`${styles.marker} ${styles.markerTo}`} />
                </Marker>
            )}
        </Map>
    );
};
