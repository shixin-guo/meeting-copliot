"use client";

import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A radar chart with a custom label";

const chartData = [
  { topic: "Google", desktop: 5, mobile: 45 },
  { topic: "Teams ", desktop: 2, mobile: 65 },
  { topic: "Audit", desktop: 5, mobile: 55 },
  { topic: "Webex", desktop: 10, mobile: 80 },
  { topic: "Zoom", desktop: 15, mobile: 70 },
  { topic: "Slack", desktop: 7, mobile: 40 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },

} satisfies ChartConfig;

export function ChartRadarLabelCustom() {
  return (
    <Card className="bg-background/30 border-none">
      <CardHeader className="items-center pb-4">
        <CardTitle>Business Topics Analysis</CardTitle>
        <CardDescription>
          Showing business topics analysis across different platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadarChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              bottom: 10,
              left: 10,
            }}
          >
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <PolarAngleAxis
              dataKey="topic"
              tick={({ x, y, textAnchor, index, ...props }) => {
                const data = chartData[index];

                return (
                  <text
                    x={x}
                    y={index === 0 ? y - 10 : y}
                    textAnchor={textAnchor}
                    fontSize={13}
                    fontWeight={500}
                    {...props}
                  >
                    <tspan>{data.topic}</tspan>
                    <tspan x={x} dy={"1rem"} fontSize={12} className="fill-muted-foreground">
                      {data.desktop}
                    </tspan>
                  </text>
                );
              }}
            />

            <PolarGrid />
            <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">
          Business Topics Analysis 2024
        </div>
      </CardFooter>
    </Card>
  );
}
