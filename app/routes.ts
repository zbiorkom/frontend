import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    index("routes/Home/index.tsx"),
    route("planner", "routes/Planner/index.tsx"),
    route("about", "routes/About/index.tsx"),
    route("404", "routes/NotFound/index.tsx"),
    ...prefix(":city", [
        layout("routes/City/layout.tsx", [
            index("routes/City/index.tsx"),
            route("stops/:stopId/:routeId", "routes/StopTimetable/index.tsx"),
            route(":agency", "routes/City/agency.tsx"),
            route(":agency/opendata", "routes/OpenData/index.tsx"),
            route(":agency/:route", "routes/Route/index.tsx"),
        ]),
    ]),
] satisfies RouteConfig;
