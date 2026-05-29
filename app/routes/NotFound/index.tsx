import { useTranslation } from "react-i18next";

export default () => {
    const { t } = useTranslation();
    return <div>{t("common.notFound")}</div>;
};
