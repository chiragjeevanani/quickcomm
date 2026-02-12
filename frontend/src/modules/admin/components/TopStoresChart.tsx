import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Chart from "react-apexcharts";
import { type TopSeller } from "../../../services/api/admin/adminDashboardService";

interface TopStoresChartProps {
    data: TopSeller[];
    title: string;
}

export default function TopStoresChart({ data, title }: TopStoresChartProps) {
    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            toolbar: {
                show: false,
            },
            animations: {
                enabled: true,
                speed: 800,
            },
            fontFamily: 'inherit',
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                barHeight: "60%",
                distributed: true,
                dataLabels: {
                    position: "bottom",
                },
            },
        },
        colors: ["#3B82F6", "#0D9488", "#8B5CF6", "#F59E0B", "#EF4444"],
        dataLabels: {
            enabled: true,
            textAnchor: "start",
            style: {
                colors: ["#fff"],
                fontWeight: 700,
                fontSize: "11px",
            },
            formatter: (val: number, opt) => {
                return `${opt.w.globals.labels[opt.dataPointIndex]}: ₹${val.toLocaleString()}`;
            },
            offsetX: 0,
        },
        xaxis: {
            categories: data.map(d => d.storeName) || [],
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                show: false,
            },
        },
        yaxis: {
            labels: {
                show: true,
                style: {
                    colors: "#64748b",
                    fontSize: "11px",
                    fontWeight: 600
                },
            },
        },
        grid: {
            borderColor: "#f1f5f9",
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: false
                }
            },
        },
        tooltip: {
            theme: "light",
            y: {
                formatter: (val) => `₹${val.toLocaleString()}`,
            },
        },
    };

    const chartSeries = [
        {
            name: "Revenue",
            data: data.map(d => d.totalRevenue) || [],
        },
    ];

    return (
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full">
            <CardHeader className="pb-0 pt-6 px-6">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
                <div className="h-[280px] w-full mt-4">
                    <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="bar"
                        height="100%"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
