import { useTranslation } from "react-i18next";
import { LANGS, setLanguage, type Lang } from "~/i18n";
import styles from "./Footer.module.less";

export default () => {
    const { t, i18n } = useTranslation();
    const current = (i18n.resolvedLanguage ?? i18n.language ?? "pl") as Lang;

    return (
        <div className={styles.langSwitcher} role="group" aria-label={t("nav.switchLanguage")}>
            {LANGS.map((lang) => (
                <button
                    key={lang}
                    type="button"
                    aria-pressed={lang === current}
                    className={lang === current ? styles.active : ""}
                    onClick={() => setLanguage(lang)}
                >
                    {lang}
                </button>
            ))}
        </div>
    );
};
