import { Outlet, redirect } from "react-router";
import { getCity } from "~/util";
import type { Route } from "./+types/layout";

export const loader = async ({ params }: Route.LoaderArgs) => {
    const city = await getCity(params.city!);
    if (!city) return redirect("/404");
    return null;
};

export default () => <Outlet />;
