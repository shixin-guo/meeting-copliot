"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
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

export function InsightTopic() {
  return (
    <Card className="bg-background/0 border-none rounded-none shadow-none gap-2">
      <CardContent className="pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square w-[180px]">
          <RadarChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
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
                    <tspan className="fill-muted-foreground">{data.topic}</tspan>
                  </text>
                );
              }}
            />

            <PolarGrid />
            <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
