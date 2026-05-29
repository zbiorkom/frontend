import { useTranslation } from "react-i18next";
import { Discord, Facebook, Github, Instagram, Twitter } from "../UI/Icons";
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

export default () => {
    const { t } = useTranslation();
    return (
        <footer>
            <section className={styles.left}>
                <span className={styles.brand}>
                    <span className={styles.zbiorkom}>zbiorkom</span>
                    <span className={styles.live}>.live</span>
                </span>

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
            </section>

            <section className={styles.right}>
                <LanguageSwitcher />

                <nav className={styles.links}>
                    <a href="#">{t("footer.privacy")}</a>
                </nav>
            </section>
        </footer>
    );
};
