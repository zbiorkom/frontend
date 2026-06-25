import { useTranslation } from "react-i18next";
import i18n from "~/i18n";
import type { Route } from "./+types/index";
import CountUp from "./CountUp";
import Partners from "./Partners";
import Reveal from "./Reveal";
import SupportSection from "./SupportSection";
import styles from "./About.module.less";

export const meta: Route.MetaFunction = () => [
    { title: i18n.t("about.meta.title") },
    { name: "description", content: i18n.t("about.meta.description") },
];

type Testimonial = { text: string; author: string; role: string };

const AUTHOR_PHOTO =
    "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=720&q=80";
const PROJECT_PHOTO =
    "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=960&q=80";

const STATS = [
    { value: 42, suffix: "+", labelKey: "about.stats.cities" },
    { value: 120, suffix: "+", labelKey: "about.stats.operators" },
    { value: 2, suffix: " mln+", labelKey: "about.stats.rides" },
] as const;

export default () => {
    const { t } = useTranslation();

    const testimonials = t("about.testimonials.items", {
        returnObjects: true,
    }) as Testimonial[];

    return (
        <article className={styles.page}>
            {/* ---- Author hero ---- */}
            <section className={styles.hero}>
                <Reveal className={styles.heroText}>
                    <span className={styles.kicker}>{t("about.author.kicker")}</span>
                    <h1 className={styles.name}>{t("about.author.name")}</h1>
                    <p className={styles.role}>{t("about.author.role")}</p>
                    <p className={styles.lead}>{t("about.author.bio")}</p>
                </Reveal>

                <Reveal className={styles.heroMedia} delay={120}>
                    <figure className={styles.photoCard}>
                        <img
                            src={AUTHOR_PHOTO}
                            alt={t("about.author.photoAlt")}
                            loading="lazy"
                            draggable={false}
                        />
                    </figure>
                </Reveal>
            </section>

            {/* ---- Support (inline, right under the author) ---- */}
            <Reveal>
                <SupportSection />
            </Reveal>

            {/* ---- Stats strip ---- */}
            <Reveal as="section" className={styles.stats}>
                {STATS.map((s) => (
                    <div key={s.labelKey} className={styles.stat}>
                        <span className={styles.statValue}>
                            <CountUp value={s.value} suffix={s.suffix} />
                        </span>
                        <span className={styles.statLabel}>{t(s.labelKey)}</span>
                    </div>
                ))}
            </Reveal>

            {/* ---- About the project ---- */}
            <section className={styles.project}>
                <Reveal className={styles.projectMedia}>
                    <figure className={styles.photoCard}>
                        <img
                            src={PROJECT_PHOTO}
                            alt={t("about.project.photoAlt")}
                            loading="lazy"
                            draggable={false}
                        />
                    </figure>
                </Reveal>
                <Reveal className={styles.projectText} delay={120}>
                    <span className={styles.kicker}>{t("about.project.kicker")}</span>
                    <h2 className={styles.h2}>{t("about.project.title")}</h2>
                    <p className={styles.lead}>{t("about.project.description")}</p>
                </Reveal>
            </section>

            {/* ---- Partners marquee ---- */}
            <section className={styles.partners}>
                <Reveal className={styles.sectionHead}>
                    <span className={styles.kicker}>{t("about.partners.kicker")}</span>
                    <h2 className={styles.h2}>{t("about.partners.title")}</h2>
                    <p className={styles.sub}>{t("about.partners.subtitle")}</p>
                </Reveal>
                <Partners />
            </section>

            {/* ---- Testimonials (MD3 cards) ---- */}
            <section className={styles.testimonials}>
                <Reveal className={styles.sectionHead}>
                    <span className={styles.kicker}>{t("about.testimonials.kicker")}</span>
                    <h2 className={styles.h2}>{t("about.testimonials.title")}</h2>
                </Reveal>
                <div className={styles.cards}>
                    {testimonials.map((item, i) => (
                        <Reveal key={i} delay={i * 90}>
                            <figure className={styles.card}>
                                <span className={styles.quoteMark} aria-hidden="true">
                                    &ldquo;
                                </span>
                                <blockquote className={styles.cardText}>
                                    {item.text}
                                </blockquote>
                                <figcaption className={styles.cardFoot}>
                                    <span className={styles.avatar} aria-hidden="true">
                                        {item.author.charAt(0)}
                                    </span>
                                    <span className={styles.cardWho}>
                                        <span className={styles.cardAuthor}>
                                            {item.author}
                                        </span>
                                        <span className={styles.cardRole}>{item.role}</span>
                                    </span>
                                </figcaption>
                            </figure>
                        </Reveal>
                    ))}
                </div>
            </section>
        </article>
    );
};
