"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CompetitorListData } from "@/constants";

export const description = "A radar chart with a custom label";
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
            data={CompetitorListData}
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
                const data = CompetitorListData[index];

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
