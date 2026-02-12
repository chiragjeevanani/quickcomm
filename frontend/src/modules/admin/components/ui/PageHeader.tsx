import { motion } from "framer-motion";
import { fadeIn } from "../../lib/animations";
import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
                {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </motion.div>
    );
}
