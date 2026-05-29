import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Logo } from "../UI/Icons";
import styles from "./Header.module.less";

const navClass = ({ isActive }: { isActive: boolean }) => `${isActive ? styles.active : ""}`;

const routes = [
    { to: "/", labelKey: "nav.home" },
    { to: "/cities", labelKey: "nav.cities" },
    { to: "/contact", labelKey: "nav.contact" },
] as const;

export default () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMenuOpen]);

    const toggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    return (
        <>
            <div
                className={`${styles.backdrop} ${isMenuOpen ? styles.open : ""}`}
                onClick={() => setIsMenuOpen(false)}
            />
            <header className={isMenuOpen ? styles.open : ""}>
                <div className={styles.headerTop}>
                    <Link to="/" className={styles.logo}>
                        <Logo className={styles.icon} />

                        <span className={styles.logoText}>
                            <span className={styles.zbiorkom}>zbiorkom</span>
                            <span className={styles.live}>.live</span>
                        </span>
                    </Link>

                    <button
                        className={`${styles.hamburger} ${isMenuOpen ? styles.open : ""}`}
                        onClick={toggleMenu}
                        aria-label={t("nav.toggleMenu")}
                    >
                        <span className={styles.bar}></span>
                        <span className={styles.bar}></span>
                        <span className={styles.bar}></span>
                    </button>
                </div>

                <nav className={`${styles.nav} ${isMenuOpen ? styles.open : ""}`}>
                    {routes.map(({ to, labelKey }) => (
                        <NavLink key={to} to={to} className={navClass}>
                            {t(labelKey)}
                        </NavLink>
                    ))}
                </nav>
            </header>
        </>
    );
};
