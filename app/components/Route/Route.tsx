import { memo } from "react";
import { Link } from "react-router";
import { ERoute, type Route, VehicleType } from "~/typings";
import { typeIcons } from "~/constants";
import type { RouteTheme } from "~/util";
import styles from "./Route.module.less";

type Props = {
    route: Route;
    theme: RouteTheme;
    icon?: string;
};

export default memo(
    ({ route, theme, icon }: Props) => {
        const backgroundColor = theme.onPrimaryContainer + "bb";
        const textColor = theme.primaryContainer;

        const [longNameFirst, longNameSecond] = route[ERoute.longName].split("—");
        const iconSvg = icon ?? typeIcons[route[ERoute.type]] ?? typeIcons[VehicleType.Bus];

        const to = `/${route[ERoute.city]}/${route[ERoute.agency]}/${route[ERoute.id]}`;

        return (
            <Link to={to} className={styles.container} style={{ backgroundColor }}>
                <div className={styles.badge} style={{ backgroundColor: theme.primaryContainer }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        style={{ color: theme.onPrimaryContainer }}
                        fill="currentColor"
                        dangerouslySetInnerHTML={{ __html: iconSvg }}
                    />
                    <span style={{ color: theme.onPrimaryContainer }}>{route[ERoute.name]}</span>
                </div>

                <div className={styles.stops}>
                    {longNameFirst && (
                        <span className={styles.first} style={{ color: textColor }}>
                            {longNameFirst.trim()}
                        </span>
                    )}
                    {longNameSecond && (
                        <span className={styles.second} style={{ color: textColor }}>
                            {longNameSecond.trim()}
                        </span>
                    )}
                </div>
            </Link>
        );
    },
    (a, b) => a.route === b.route && a.theme === b.theme && a.icon === b.icon,
);
