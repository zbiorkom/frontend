import { Trans } from "react-i18next";
import styles from "./Hero.module.less";

type Props = {
    name: string;
    agencyCount: number;
    routeCount: number;
};

export default ({ name, agencyCount, routeCount }: Props) => {
    return (
        <section className={styles.hero}>
            <h1 className={styles.title}>{name}</h1>
            <p className={styles.lead}>
                <Trans
                    i18nKey="city.heroLead"
                    count={agencyCount}
                    values={{ name, agencyCount, routeCount }}
                    components={{ strong: <strong /> }}
                />
            </p>
        </section>
    );
};
