import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface GaugeChartProps {
  value: number;
  maxValue: number;
  label: string;
}

export default function GaugeChart({ value, maxValue, label }: GaugeChartProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = 70;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full">
      <CardHeader className="pb-0 pt-6 px-6">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
        <div className="relative flex items-center justify-center mt-4">
          {/* SVG Container */}
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90 transition-transform duration-500"
          >
            {/* Background Circle */}
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset: 0 }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="text-muted/20"
            />

            {/* Gradient Definition */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Progress Circle with Glow */}
            <motion.circle
              stroke="url(#gaugeGradient)"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              filter="url(#glow)"
            />
          </svg>

          {/* Center Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-2xl font-black text-foreground tracking-tighter"
            >
              ₹{value.toLocaleString()}
            </motion.span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Avg Order
            </span>
          </div>
        </div>

        {/* Legend/Scale */}
        <div className="w-full flex justify-between px-6 mt-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Target</span>
            <span className="text-xs font-bold text-foreground">₹{maxValue.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Progress</span>
            <span className="text-xs font-bold text-emerald-600">{percentage.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
