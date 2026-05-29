import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Agency } from "~/typings";
import { ArrowRight } from "~/components/UI/Icons";
import styles from "./AgencyGrid.module.less";

type Props = {
    city: string;
    agencies: { agency: Agency; routeCount: number }[];
};

export default ({ city, agencies }: Props) => {
    const { t } = useTranslation();
    return (
        <div className={styles.grid}>
            {agencies.map(({ agency, routeCount }) => (
                <Link
                    key={agency.id}
                    to={`/${city}/${agency.id}`}
                    className={styles.tile}
                >
                    <h3 className={styles.name}>{agency.name}</h3>

                    <div className={styles.footer}>
                        <p className={styles.count}>
                            {t("city.lineCount", { count: routeCount })}
                        </p>
                        <ArrowRight className={styles.arrow} />
                    </div>
                </Link>
            ))}
        </div>
    );
};
