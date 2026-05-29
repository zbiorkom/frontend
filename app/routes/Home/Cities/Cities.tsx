import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { CityCategory } from "~/typings";
import { cityCategoryEmojis, cityCategoryI18nKeys, cityCategoryOrder } from "~/constants";
import styles from "./Cities.module.less";

type CityItem = {
    id: string;
    name: string;
    category?: CityCategory;
};

type Props = {
    cities: CityItem[];
};

const UNCATEGORIZED = "__uncategorized__";

export default ({ cities }: Props) => {
    const { t } = useTranslation();

    const grouped = useMemo(() => {
        const map = new Map<CityCategory | typeof UNCATEGORIZED, CityItem[]>();
        for (const city of cities) {
            const key =
                city.category && cityCategoryI18nKeys[city.category]
                    ? city.category
                    : UNCATEGORIZED;
            const list = map.get(key);
            if (list) list.push(city);
            else map.set(key, [city]);
        }
        const order: (CityCategory | typeof UNCATEGORIZED)[] = [
            ...cityCategoryOrder,
            UNCATEGORIZED,
        ];
        return order
            .filter((cat) => map.has(cat))
            .map((cat) => ({
                category: cat,
                cities: map.get(cat)!.slice().sort((a, b) => a.name.localeCompare(b.name)),
            }));
    }, [cities]);

    return (
        <section className={styles.container}>
            <h2>{t("home.citiesTitle")}</h2>

            <div className={styles.groups}>
                {grouped.map(({ category, cities }) => (
                    <div key={category} className={styles.group}>
                        {category !== UNCATEGORIZED && (
                            <h3 className={styles.groupTitle}>
                                <span aria-hidden className={styles.groupEmoji}>
                                    {cityCategoryEmojis[category]}
                                </span>
                                <span>{t(cityCategoryI18nKeys[category])}</span>
                            </h3>
                        )}
                        <ul className={styles.cities}>
                            {cities.map((city) => (
                                <li key={city.id}>
                                    <Link to={`/${city.id}`} className={styles.cityLink}>
                                        {city.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
};
