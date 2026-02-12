import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Chart from "react-apexcharts";
import { type SalesAnalytics } from "../../../services/api/admin/adminDashboardService";

interface OrderChartProps {
  data: SalesAnalytics | null;
  title: string;
}

export default function OrderChart({ data, title }: OrderChartProps) {
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      toolbar: {
        show: true,
        offsetY: -5,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true,
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      fontFamily: 'inherit',
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: [2.5, 2],
      dashArray: [0, 8], // 0 for solid (current), 8 for dashed (previous)
      colors: ["#0D9488", "#94a3b8"], // Teal-600 and Slate-400
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
        colorStops: [
          [
            { offset: 0, color: '#0D9488', opacity: 0.4 },
            { offset: 100, color: '#0D9488', opacity: 0.05 }
          ],
          [
            { offset: 0, color: '#64748b', opacity: 0.3 },
            { offset: 100, color: '#64748b', opacity: 0.05 }
          ]
        ]
      },
    },
    xaxis: {
      categories: data?.thisPeriod?.map(d => d.date) || [],
      tickAmount: 10, // Limit the number of labels to prevent congestion
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: true,
        trim: true,
        style: {
          colors: "#94a3b8",
          fontSize: "10px",
          fontWeight: 500
        },
      },
      tooltip: {
        enabled: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "11px",
          fontWeight: 500
        },
        formatter: (val) => val.toFixed(0),
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
      padding: {
        top: 10,
        right: 15,
        bottom: 0,
        left: 10
      }
    },
    tooltip: {
      theme: "light",
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => `${val} Orders`,
      },
      marker: {
        show: true,
      },
      style: {
        fontSize: '12px',
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      offsetY: 0,
      markers: {
        size: 6,
      },
      itemMargin: {
        horizontal: 15,
        vertical: 5
      },
      onItemClick: {
        toggleDataSeries: true
      },
    },
    markers: {
      size: 0,
      colors: ["#0D9488", "#64748b"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 5,
      }
    }
  };

  const chartSeries = [
    {
      name: "Current Period",
      data: data?.thisPeriod?.map(d => d.value) || [],
    },
    {
      name: "Previous Period (Baseline)",
      data: data?.lastPeriod?.map(d => d.value) || [],
    },
  ];

  return (
    <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <CardHeader className="pb-0 pt-6 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            {title}
          </CardTitle>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Future trend indicators can go here */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <div className="h-[280px] w-full">
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="area"
            height="100%"
          />
        </div>
      </CardContent>
    </Card>
  );
}
