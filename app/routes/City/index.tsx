import { redirect } from "react-router";
import { getCity, getRoutes } from "~/util";
import { ERoute } from "~/typings";
import type { Route } from "./+types";
import AgencyGrid from "./AgencyGrid/AgencyGrid";
import Hero from "./Hero/Hero";
import i18n from "~/i18n";

export const loader = async ({ params }: Route.LoaderArgs) => {
    const city = await getCity(params.city!);
    if (!city) return redirect("/404");

    const allRoutes = await getRoutes(params.city!);

    const agencies = Object.values(city.agencies).map((agency) => {
        let routeCount = 0;
        for (const r of allRoutes) {
            if (r[ERoute.agency] === agency.id) routeCount++;
        }
        return { agency, routeCount };
    });

    return {
        cityId: city.id,
        cityName: city.name,
        agencyCount: agencies.length,
        routeCount: allRoutes.length,
        agencies,
    };
};

export const meta: Route.MetaFunction = ({ params }) => {
    const name = params.city ?? "";
    return [
        { title: i18n.t("city.meta.title", { name }) },
        { name: "description", content: i18n.t("city.meta.description", { name }) },
    ];
};

export default ({ loaderData }: Route.ComponentProps) => {
    return (
        <>
            <Hero
                name={loaderData.cityName}
                agencyCount={loaderData.agencyCount}
                routeCount={loaderData.routeCount}
            />
            <AgencyGrid city={loaderData.cityId} agencies={loaderData.agencies} />
        </>
    );
};
