import { redirect } from "react-router";
import { computeRouteTheme, getCity, getRoutes } from "~/util";
import { ERoute } from "~/typings";
import type { Route } from "./+types/agency";
import AgencyDetail from "./AgencyDetail/AgencyDetail";
import i18n from "~/i18n";

export const loader = async ({ params }: Route.LoaderArgs) => {
    const city = await getCity(params.city!);
    if (!city) return redirect("/404");

    const agency = city.agencies[params.agency!];
    if (!agency) return redirect(`/${params.city}`);

    const allRoutes = await getRoutes(params.city!);
    const routes = allRoutes
        .filter((r) => r[ERoute.agency] === agency.id)
        .map((r) => ({ route: r, theme: computeRouteTheme(r[ERoute.color]) }));

    return {
        cityId: city.id,
        cityName: city.name,
        agency,
        routes,
    };
};

export const meta: Route.MetaFunction = ({ data, params }) => {
    const agencyName = (data && "agency" in data ? data.agency.name : params.agency) ?? "";
    const cityName = (data && "cityName" in data ? data.cityName : params.city) ?? "";
    return [
        { title: i18n.t("agency.meta.title", { agency: agencyName, city: cityName }) },
        {
            name: "description",
            content: i18n.t("agency.meta.description", { agency: agencyName, city: cityName }),
        },
    ];
};

export default ({ loaderData }: Route.ComponentProps) => {
    return (
        <AgencyDetail
            city={loaderData.cityId}
            cityName={loaderData.cityName}
            agency={loaderData.agency}
            routes={loaderData.routes}
        />
    );
};
