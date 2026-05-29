import Hero from "./Hero/Hero";
import Cities from "./Cities/Cities";
import type { Route } from "./+types";
import { getCities } from "~/util";
import i18n from "~/i18n";

export const meta: Route.MetaFunction = () => [
    { title: i18n.t("home.meta.title") },
    { name: "description", content: i18n.t("home.meta.description") },
];

export const loader = async () => {
    return (await getCities()).map((city) => ({
        id: city.id,
        name: city.name,
        category: city.category,
    }));
};

export default ({ loaderData }: Route.ComponentProps) => {
    return (
        <>
            <Hero cities={loaderData} />
            <Cities cities={loaderData} />
        </>
    );
};
