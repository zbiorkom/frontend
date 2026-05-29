import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import PlaceField from "~/components/PlaceField/PlaceField";
import type { PlannerEndpoint } from "~/typings";
import { encodePlannerEndpoint } from "~/util";
import styles from "./Hero.module.less";

type Props = {
    cities: { id: string; name: string }[];
};

const FEATURE_KEYS = ["liveLocation", "routes", "timetables", "planner"] as const;

export default ({ cities }: Props) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const geocodeCity = cities[0]?.id;

    const [from, setFrom] = useState<PlannerEndpoint | null>(null);
    const [to, setTo] = useState<PlannerEndpoint | null>(null);

    const swap = () => {
        setFrom(to);
        setTo(from);
    };

    const ready = !!from && !!to;

    const submit = () => {
        if (!from || !to) return;
        const params = new URLSearchParams({
            from: encodePlannerEndpoint(from),
            to: encodePlannerEndpoint(to),
        });
        navigate(`/planner?${params}`);
    };

    return (
        <section className={styles.hero}>
            <div className={styles.main}>
                <div className={styles.content}>
                    <h1 className={styles.title}>
                        <span className={styles.titleQuestion}>
                            {t("home.titleQuestion")}
                        </span>
                        <span className={styles.titleAnswer}>
                            {t("home.titleAnswer")}
                        </span>
                    </h1>

                    <div className={styles.planner}>
                        <div className={styles.fields}>
                            <PlaceField
                                kind="from"
                                value={from}
                                onChange={setFrom}
                                city={geocodeCity}
                                placeholder={t("home.planner.fromPlaceholder")}
                                label={t("home.planner.fromLabel")}
                            />
                            <button
                                type="button"
                                className={styles.swap}
                                onClick={swap}
                                aria-label={t("home.planner.swap")}
                            >
                                <SwapIcon />
                            </button>
                            <PlaceField
                                kind="to"
                                value={to}
                                onChange={setTo}
                                city={geocodeCity}
                                placeholder={t("home.planner.toPlaceholder")}
                                label={t("home.planner.toLabel")}
                            />
                        </div>

                        <div
                            className={`${styles.submitWrap} ${ready ? styles.submitReady : ""}`}
                        >
                            <button
                                type="button"
                                className={styles.submit}
                                disabled={!ready}
                                onClick={submit}
                            >
                                <span>{t("home.planner.submit")}</span>
                                <ArrowRightIcon />
                            </button>
                        </div>
                    </div>

                    <div className={styles.stores}>
                        <a
                            href="https://play.google.com/store/apps/details?id=com.zbiorkomlive"
                            target="_blank"
                            rel="noreferrer noopener"
                            className={styles.storeBadge}
                            aria-label="Google Play"
                        >
                            <PlayIcon className={styles.storeIcon} />
                            <span className={styles.storeText}>
                                <span className={styles.storeKicker}>
                                    {t("home.stores.androidKicker")}
                                </span>
                                <span className={styles.storeName}>Google Play</span>
                            </span>
                        </a>
                        <a
                            href="https://apps.apple.com/app/zbiorkom-live"
                            target="_blank"
                            rel="noreferrer noopener"
                            className={styles.storeBadge}
                            aria-label="App Store"
                        >
                            <AppleIcon className={styles.storeIcon} />
                            <span className={styles.storeText}>
                                <span className={styles.storeKicker}>
                                    {t("home.stores.iosKicker")}
                                </span>
                                <span className={styles.storeName}>App Store</span>
                            </span>
                        </a>
                    </div>
                </div>

                <div className={styles.phone} aria-hidden>
                    <img
                        src="https://media.licdn.com/dms/image/v2/D4D22AQEy-etiV9wciA/feedshare-shrink_1280/B4DZbdaFgtHsAk-/0/1747471325946?e=2147483647&v=beta&t=8BEzA0ryU9D06W8MwNO4QHpzKe42CbZmSwG40W1Dnvg"
                        alt=""
                        className={styles.phoneImg}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                    />
                </div>
            </div>

            <ul className={styles.features}>
                {FEATURE_KEYS.map((key) => (
                    <li
                        key={key}
                        className={`${styles.feature} ${styles[`feature_${key}`]}`}
                    >
                        <span aria-hidden className={styles.featureIcon}>
                            {key === "liveLocation" && <LiveIcon />}
                            {key === "routes" && <RouteIcon />}
                            {key === "timetables" && <ClockIcon />}
                            {key === "planner" && <PlannerIcon />}
                        </span>
                        <span className={styles.featureTitle}>
                            {t(`home.features.${key}`)}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

const SwapIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path
            fill="currentColor"
            d="M6.99 11 3 15l3.99 4v-3H14v-2H6.99zM21 9l-3.99-4v3H10v2h7.01v3z"
        />
    </svg>
);

const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path
            fill="currentColor"
            d="M14 5l-1.41 1.41L17.17 11H4v2h13.17l-4.58 4.59L14 19l7-7z"
        />
    </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path
            fill="currentColor"
            d="M3.6 1.5C3.2 1.8 3 2.3 3 3v18c0 .7.2 1.2.6 1.5L13.7 12zm12 8.4L17.9 7.7 5.5 1l10.1 8.9zm-10 13.1L17.9 16.3l-2.3-2.2zm14.3-9.4-3-1.7L18.7 12l1.2 1.1 3-1.7c.9-.5.9-1.3 0-1.8"
        />
    </svg>
);

const AppleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path
            fill="currentColor"
            d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.3-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"
        />
    </svg>
);

const LiveIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
            fill="currentColor"
            d="M12 2A7 7 0 0 0 5 9c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5"
        />
    </svg>
);

const RouteIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
            fill="currentColor"
            d="M19 15.5c-.97 0-1.86.33-2.57.88l-1.66-1.66 2.83-2.83a4 4 0 0 0 0-5.66l-2.83-2.83-1.41 1.41 2.83 2.83a2 2 0 0 1 0 2.83l-2.83 2.83-3.66-3.66c.55-.71.88-1.6.88-2.57A4 4 0 1 0 5.6 11.4l5 5a4 4 0 1 0 8.41-1zM5.5 7a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0M19 21a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"
        />
    </svg>
);

const ClockIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
            fill="currentColor"
            d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16m.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
        />
    </svg>
);

const PlannerIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
            fill="currentColor"
            d="M20.5 3.5 19 2l-2 2H7L5 2 3.5 3.5 5 5v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5zM12 19a2 2 0 1 1 0-4 2 2 0 0 1 0 4m4-7H8v-2h8zm0-4H8V6h8z"
        />
    </svg>
);
