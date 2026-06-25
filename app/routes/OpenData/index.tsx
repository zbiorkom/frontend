import { redirect } from "react-router";
import { useTranslation } from "react-i18next";
import i18n from "~/i18n";
import { getCity } from "~/util";
import type { Route } from "./+types/index";
import { OPEN_API_BASE, OPEN_ENDPOINTS, SITE_URL } from "./endpoints";
import BackButton from "~/components/BackButton/BackButton";
import CodeBlock from "./CodeBlock/CodeBlock";
import JsonLd from "./JsonLd";
import styles from "./OpenData.module.less";

export const loader = async ({ params }: Route.LoaderArgs) => {
    const city = await getCity(params.city!);
    if (!city) return redirect("/404");

    const agency = city.agencies[params.agency!];
    if (!agency) return redirect(`/${params.city}`);

    return {
        cityId: city.id,
        cityName: city.name,
        agencyId: agency.id,
        agencyName: agency.name,
    };
};

export const meta: Route.MetaFunction = ({ data }) => {
    const agency = data?.agencyName ?? "";
    const city = data?.cityName ?? "";
    return [
        { title: i18n.t("openData.meta.title", { agency, city }) },
        { name: "description", content: i18n.t("openData.meta.description", { agency, city }) },
    ];
};

/** Resolve :city / :agency placeholders to the concrete operator. */
const resolvePath = (path: string, city: string, agency: string) =>
    path.replace(":city", city).replace(":agency", agency);

export default ({ loaderData }: Route.ComponentProps) => {
    const { t } = useTranslation();
    const { cityId, cityName, agencyId, agencyName } = loaderData;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "DataCatalog",
        name: i18n.t("openData.meta.title", { agency: agencyName, city: cityName }),
        url: `${SITE_URL}/${cityId}/${agencyId}/opendata`,
        provider: { "@type": "Organization", name: "zbiorkom.live", url: SITE_URL },
        dataset: OPEN_ENDPOINTS.map((e) => ({
            "@type": "Dataset",
            name: t(`openData.ep.${e.slug}.title`),
            description: t(`openData.ep.${e.slug}.summary`),
        })),
    };

    return (
        <article className={styles.page}>
            <JsonLd data={jsonLd} />

            <div className={styles.hero}>
                <div className={styles.titleRow}>
                    <BackButton
                        to={`/${cityId}/${agencyId}`}
                        label={t("agency.backLabel")}
                    />
                    <h1 className={styles.h1}>{t("openData.title")}</h1>
                </div>
                <p className={styles.intro}>
                    {t("openData.intro", { agency: agencyName, city: cityName })}
                </p>
            </div>

            <aside className={styles.terms} role="note">
                <h2 className={styles.termsTitle}>{t("openData.terms.title")}</h2>
                <p>{t("openData.terms.intro")}</p>
                {(["attribution", "nonCommercial", "commercial"] as const).map((k) => (
                    <p key={k}>
                        <strong>{t(`openData.terms.${k}Title`)}</strong>{" "}
                        {t(`openData.terms.${k}`)}
                    </p>
                ))}
            </aside>

            {OPEN_ENDPOINTS.map((e) => {
                // :city and :agency are already filled into the URL above.
                const params = e.params.filter(
                    (p) => p.name !== ":city" && p.name !== ":agency",
                );
                return (
                    <section key={e.slug} id={e.slug} className={styles.endpoint}>
                        <h2 className={styles.epTitle}>{t(`openData.ep.${e.slug}.title`)}</h2>

                        {/* One signature per returnable format, or a single line otherwise. */}
                        {(e.formats ?? [{ label: "", suffix: "", typing: e.typing }]).map(
                            (f) => (
                                <div key={f.label} className={styles.sig}>
                                    <span className={styles.method}>GET</span>
                                    <code className={styles.path}>
                                        {OPEN_API_BASE}
                                        {resolvePath(e.path, cityId, agencyId)}
                                        {f.suffix}
                                    </code>
                                    {f.label && (
                                        <span className={styles.formatTag}>{f.label}</span>
                                    )}
                                </div>
                            ),
                        )}

                        <p className={styles.desc}>{t(`openData.ep.${e.slug}.summary`)}</p>

                        {params.length > 0 && (
                            <div className={styles.params}>
                                <h3 className={styles.subhead}>{t("openData.paramsTitle")}</h3>
                                <dl className={styles.paramList}>
                                    {params.map((p) => (
                                        <div
                                            key={`${p.in}-${p.name}`}
                                            className={styles.param}
                                        >
                                            <dt>
                                                <code className={styles.paramName}>
                                                    {p.name}
                                                </code>
                                                <span className={styles.inTag}>{p.in}</span>
                                            </dt>
                                            <dd>{t(`openData.hints.${p.hint}`)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}

                        {e.spec && (
                            <div className={styles.spec}>
                                <p className={styles.specProfile}>
                                    {t(`openData.spec.${e.slug}.profile`)}
                                </p>
                                <div className={styles.specCols}>
                                    {(["yes", "no"] as const).map((status) => {
                                        const items = e.spec!.items.filter(
                                            (i) => i.status === status,
                                        );
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={status} className={styles.specCol}>
                                                <h3 className={styles.subhead}>
                                                    {t(
                                                        status === "yes"
                                                            ? "openData.specIncluded"
                                                            : "openData.specExcluded",
                                                    )}
                                                </h3>
                                                <ul className={styles.checklist}>
                                                    {items.map((i) => (
                                                        <li
                                                            key={i.code}
                                                            className={
                                                                status === "yes"
                                                                    ? styles.yes
                                                                    : styles.no
                                                            }
                                                        >
                                                            <span
                                                                aria-hidden
                                                                className={styles.mark}
                                                            >
                                                                {status === "yes" ? "✓" : "✗"}
                                                            </span>
                                                            <span className={styles.specText}>
                                                                <code
                                                                    className={styles.specCode}
                                                                >
                                                                    {i.code}
                                                                </code>
                                                                <span className={styles.specDesc}>
                                                                    {t(
                                                                        `openData.spec.${e.slug}.items.${i.desc}`,
                                                                    )}
                                                                </span>
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {(() => {
                            // Response shapes: one per format when multi-format,
                            // otherwise the single top-level typing.
                            const variants = e.formats ?? [
                                {
                                    label: "TypeScript",
                                    suffix: "",
                                    lang: "typescript" as const,
                                    typing: e.typing,
                                },
                            ];
                            const shown = variants.filter((v) => v.typing || e.formats);
                            if (shown.length === 0) return null;
                            return (
                                <div className={styles.output}>
                                    <h3 className={styles.subhead}>
                                        {t("openData.responseTitle")}
                                    </h3>
                                    {shown.map((v) =>
                                        v.typing ? (
                                            <CodeBlock
                                                key={v.label}
                                                code={v.typing}
                                                lang={v.lang ?? "typescript"}
                                                label={v.label}
                                            />
                                        ) : (
                                            <p
                                                key={v.label}
                                                className={styles.binaryNote}
                                            >
                                                <span className={styles.formatTag}>
                                                    {v.label}
                                                </span>
                                                {t("openData.responseBinaryNote")}
                                            </p>
                                        ),
                                    )}
                                </div>
                            );
                        })()}
                    </section>
                );
            })}
        </article>
    );
};
