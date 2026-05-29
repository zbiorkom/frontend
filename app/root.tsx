import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { useEffect, type FC } from "react";
import "./app.less";
import "./i18n";
import { useTranslation } from "react-i18next";
import i18nInstance, { detectLangFromRequest, LANG_COOKIE, type Lang } from "./i18n";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

export const links: Route.LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,slnt,wdth,wght,GRAD,ROND@6..144,-10..0,25..151,1..1000,0..100,100&display=swap",
    },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
    const lang = detectLangFromRequest(request);
    if (i18nInstance.language !== lang) {
        await i18nInstance.changeLanguage(lang);
    }
    return { lang };
};

export const Layout: FC<{ children: React.ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();
    const lang = (i18n.resolvedLanguage ?? i18n.language ?? "pl") as Lang;
    return (
        <html lang={lang}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                <Header />
                <main>{children}</main>
                <Footer />
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
};

export default function App({ loaderData }: Route.ComponentProps) {
    const { i18n } = useTranslation();
    const lang = loaderData?.lang ?? "pl";
    useEffect(() => {
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
        if (typeof document !== "undefined") {
            document.cookie = `${LANG_COOKIE}=${lang};path=/;max-age=31536000;samesite=lax`;
        }
    }, [lang, i18n]);
    return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const { t } = useTranslation();
    let message = t("error.generic.title");
    let details = t("error.generic.details");
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : t("error.http.title");
        details =
            error.status === 404
                ? t("error.notFound.details")
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
