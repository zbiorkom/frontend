import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import pl from "./locales/pl.json";
import en from "./locales/en.json";

export const LANGS = ["pl", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "pl";
export const LANG_COOKIE = "lang";

const isLang = (v: string | undefined | null): v is Lang =>
    !!v && (LANGS as readonly string[]).includes(v);

const parseCookie = (header: string | null, name: string): string | null => {
    if (!header) return null;
    for (const part of header.split(";")) {
        const [k, ...rest] = part.trim().split("=");
        if (k === name) return decodeURIComponent(rest.join("="));
    }
    return null;
};

const parseAcceptLanguage = (header: string | null): Lang | null => {
    if (!header) return null;
    const tags = header
        .split(",")
        .map((p) => {
            const [tag, q] = p.trim().split(";q=");
            return { tag: tag.toLowerCase().split("-")[0], q: q ? parseFloat(q) : 1 };
        })
        .sort((a, b) => b.q - a.q);
    for (const { tag } of tags) {
        if (isLang(tag)) return tag;
    }
    return null;
};

export const detectLangFromRequest = (request: Request): Lang => {
    const cookie = parseCookie(request.headers.get("cookie"), LANG_COOKIE);
    if (isLang(cookie)) return cookie;
    const accept = parseAcceptLanguage(request.headers.get("accept-language"));
    if (accept) return accept;
    return DEFAULT_LANG;
};

const detectClientLang = (): Lang => {
    if (typeof document === "undefined") return DEFAULT_LANG;
    const cookie = parseCookie(document.cookie, LANG_COOKIE);
    if (isLang(cookie)) return cookie;
    const stored = localStorage.getItem(LANG_COOKIE);
    if (isLang(stored)) return stored;
    const nav = navigator.language?.toLowerCase().split("-")[0];
    if (isLang(nav)) return nav;
    return DEFAULT_LANG;
};

if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        resources: {
            pl: { translation: pl },
            en: { translation: en },
        },
        lng: typeof document === "undefined" ? DEFAULT_LANG : detectClientLang(),
        fallbackLng: DEFAULT_LANG,
        supportedLngs: LANGS as unknown as string[],
        interpolation: { escapeValue: false },
        returnObjects: true,
    });
}

export const setLanguage = (lang: Lang) => {
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    if (typeof document !== "undefined") {
        document.cookie = `${LANG_COOKIE}=${lang};path=/;max-age=31536000;samesite=lax`;
        try {
            localStorage.setItem(LANG_COOKIE, lang);
        } catch {}
    }
};

export default i18n;
