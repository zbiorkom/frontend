import { Link } from "react-router";
import { ArrowRight } from "../UI/Icons";
import styles from "./BackButton.module.less";

type Props = {
    /** accessible label (required — describes where "back" leads) */
    label: string;
    /** navigate to this path; omit and pass onClick for in-page back */
    to?: string;
    onClick?: () => void;
    className?: string;
};

export default ({ label, to, onClick, className }: Props) => {
    const cls = `${styles.back}${className ? ` ${className}` : ""}`;

    if (to) {
        return (
            <Link to={to} className={cls} aria-label={label}>
                <ArrowRight />
            </Link>
        );
    }

    return (
        <button type="button" className={cls} onClick={onClick} aria-label={label}>
            <ArrowRight />
        </button>
    );
};
