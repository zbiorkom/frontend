import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Discord, Facebook, Github, Instagram, Logo, Twitter } from "../UI/Icons";
import LanguageSwitcher from "./LanguageSwitcher";
import styles from "./Footer.module.less";

const socials = [
    {
        name: "Facebook",
        href: "https://www.facebook.com/profile.php?id=61558868339377",
        icon: Facebook,
    },
    {
        name: "Twitter",
        href: "https://twitter.com/zbiorkomlive",
        icon: Twitter,
    },
    {
        name: "Instagram",
        href: "https://www.instagram.com/zbiorkom.live/",
        icon: Instagram,
    },
    {
        name: "GitHub",
        href: "https://github.com/zbiorkom",
        icon: Github,
    },
    {
        name: "Discord",
        href: "https://discord.gg/gUhMz2Wckf",
        icon: Discord,
    },
];

const pages = [
    { to: "/", labelKey: "nav.home" },
    { to: "/cities", labelKey: "nav.cities" },
    { to: "/about", labelKey: "nav.about" },
    { to: "/contact", labelKey: "nav.contact" },
] as const;

export default () => {
    const { t } = useTranslation();

    return (
        <footer>
            <div className={styles.divider} aria-hidden="true">
                <svg width="100%" height="12" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern
                            id="footerWave"
                            width="28"
                            height="12"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M0 6 Q 7 2.5 14 6 T 28 6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="12" fill="url(#footerWave)" />
                </svg>
            </div>

            <div className={styles.inner}>
                <div className={styles.about}>
                    <Link to="/" aria-label="zbiorkom.live">
                        <Logo className={styles.logo} />
                    </Link>
                    <p className={styles.description}>{t("footer.description")}</p>
                </div>

                <nav className={styles.pages}>
                    <span className={styles.pagesTitle}>{t("footer.pages")}</span>
                    {pages.map(({ to, labelKey }) => (
                        <Link key={to} to={to}>
                            {t(labelKey)}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className={styles.bottom}>
                <div className={styles.bottomLeft}>
                    <span className={styles.brand}>
                        <span className={styles.zbiorkom}>zbiorkom</span>
                        <span className={styles.live}>.live</span>
                    </span>
                    <Link to="/contact">{t("footer.contact")}</Link>
                    <a href="#">{t("footer.privacy")}</a>
                </div>

                <div className={styles.bottomRight}>
                    <div className={styles.socials}>
                        {socials.map((social) => (
                            <a
                                key={social.name}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={social.name}
                            >
                                <social.icon />
                            </a>
                        ))}
                    </div>

                    <LanguageSwitcher />
                </div>
            </div>
        </footer>
    );
};
