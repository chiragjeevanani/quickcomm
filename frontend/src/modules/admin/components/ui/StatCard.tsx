import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { slideUp } from "../../lib/animations";
import { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: {
        value: number;
        isUp: boolean;
    };
    description?: string;
    delay?: number;
    className?: string;
}

export default function StatCard({ title, value, icon, trend, description, delay = 0, className }: StatCardProps) {
    return (
        <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            transition={{ delay }}
            className={className}
        >
            <Card className="h-full overflow-hidden border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <CardContent className="p-6 h-full flex flex-col justify-between min-h-[160px]">
                    <div>
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
                            <div className="p-2 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
                                {icon}
                            </div>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-2">{value}</h2>
                    </div>

                    <div className="mt-4">
                        {trend && (
                            <div className="flex items-center">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${trend.isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {trend.isUp ? '↑' : '↓'} {trend.value}%
                                </span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground ml-2 tracking-tighter">vs last month</span>
                            </div>
                        )}
                        {description && !trend && (
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{description}</p>
                        )}
                    </div>
                </CardContent>
                {/* Subtle bottom progress-like line with pulse effect */}
                <div className="h-1 w-full bg-muted/30">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, delay: delay + 0.5, ease: "circOut" }}
                        className="h-full bg-primary/40"
                    />
                </div>
            </Card>
        </motion.div>
    );
}
