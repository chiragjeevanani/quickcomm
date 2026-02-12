import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Chart from "react-apexcharts";
import { type SalesByLocation } from "../../../services/api/admin/adminDashboardService";

interface RevenueBarChartProps {
    data: SalesByLocation[];
    title: string;
}

export default function RevenueBarChart({ data, title }: RevenueBarChartProps) {
    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                }
            },
            animations: {
                enabled: true,
                speed: 800,
            },
            fontFamily: 'inherit',
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: "45%",
                distributed: true,
                dataLabels: {
                    position: "top",
                },
            },
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `₹${(val / 1000).toFixed(1)}k`,
            offsetY: -20,
            style: {
                fontSize: "10px",
                colors: ["#64748b"],
                fontWeight: 700,
            },
        },
        colors: ["#0D9488", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#10B981"],
        xaxis: {
            categories: data.map(d => d.location) || [],
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                style: {
                    colors: "#94a3b8",
                    fontSize: "11px",
                    fontWeight: 600
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: "#94a3b8",
                    fontSize: "11px",
                    fontWeight: 600
                },
                formatter: (val) => `₹${val.toLocaleString()}`,
            },
        },
        grid: {
            borderColor: "#f1f5f9",
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            },
        },
        tooltip: {
            theme: "light",
            y: {
                formatter: (val) => `₹${val.toLocaleString()}`,
            },
        },
        legend: {
            show: false,
        },
    };

    const chartSeries = [
        {
            name: "Revenue",
            data: data.map(d => d.amount) || [],
        },
    ];

    return (
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full">
            <CardHeader className="pb-0 pt-6 px-6">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500"></span>
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
