"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SentimentChart() {
  // chartData: [{ time: "12:01:05", desktop: 65, mobile: 50 }, ...]
  const [chartData, setChartData] = useState<{ time: string; desktop: number; mobile: number }[]>(
    [],
  );
  const [currentScore, setCurrentScore] = useState(50);
  const [isAnimating, setIsAnimating] = useState(false);

  const chartConfig = {
    desktop: {
      label: "Score",
      color: "#4F8AFA", // Use hex color
    },
  } satisfies ChartConfig;

  // 初始化数据
  useEffect(() => {
    const initialData: { time: string; desktop: number; mobile: number }[] = [];
    const now = Date.now();
    let baseScore = 45;
    let baseMobile = 40;
    for (let i = 19; i >= 0; i--) {
      const time = new Date(now - i * 18000); // 18 seconds apart
      const variation = (Math.random() - 0.5) * 10;
      const variationMobile = (Math.random() - 0.5) * 8;
      baseScore = Math.max(20, Math.min(80, baseScore + variation));
      baseMobile = Math.max(20, Math.min(80, baseMobile + variationMobile));
      initialData.push({
        time: time.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        desktop: Math.round(baseScore),
        mobile: Math.round(baseMobile),
      });
    }
    setChartData(initialData);
    setCurrentScore(initialData[initialData.length - 1].desktop);
  }, []);

  // 实时添加新数据
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAnimating) {
        return;
      }
      setIsAnimating(true);
      const lastDesktop = chartData.length > 0 ? chartData[chartData.length - 1].desktop : 50;
      const lastMobile = chartData.length > 0 ? chartData[chartData.length - 1].mobile : 40;
      const targetDesktop = Math.max(20, Math.min(80, lastDesktop + (Math.random() - 0.5) * 15));
      const targetMobile = Math.max(20, Math.min(80, lastMobile + (Math.random() - 0.5) * 10));
      const steps = 10;
      const stepDesktop = (targetDesktop - lastDesktop) / steps;
      const stepMobile = (targetMobile - lastMobile) / steps;
      let currentStep = 0;
      const animationInterval = setInterval(() => {
        currentStep++;
        const newDesktop = Math.round(lastDesktop + stepDesktop * currentStep);
        const newMobile = Math.round(lastMobile + stepMobile * currentStep);
        const now = new Date();
        const newDataPoint = {
          time: now.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          desktop: newDesktop,
          mobile: newMobile,
        };
        setChartData((prev) => {
          const updated = [...prev, newDataPoint];
          if (updated.length > 20) {
            return updated.slice(-20);
          }
          return updated;
        });
        setCurrentScore(newDesktop);
        if (currentStep >= steps) {
          clearInterval(animationInterval);
          setIsAnimating(false);
        }
      }, 100);
    }, 12000); // Update every 12 seconds
    return () => clearInterval(interval);
  }, [chartData, isAnimating]);

  // trend, getTrendIcon, getSentimentLabel, getScoreColor 保持不变，trend 计算用 desktop
  const getTrend = () => {
    if (chartData.length < 2) {
      return "neutral";
    }
    const recent = chartData.slice(-5);
    const avgRecent = recent.reduce((sum, item) => sum + item.desktop, 0) / recent.length;
    const avgPrevious = chartData.slice(-10, -5).reduce((sum, item) => sum + item.desktop, 0) / 5;
    if (avgRecent > avgPrevious + 2) {
      return "up";
    }
    if (avgRecent < avgPrevious - 2) {
      return "down";
    }
    return "neutral";
  };
  const trend = getTrend();
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 80) {
      return "Very Positive";
    }
    if (score >= 60) {
      return "Positive";
    }
    if (score >= 40) {
      return "Neutral";
    }
    if (score >= 20) {
      return "Negative";
    }
    return "Very Negative";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) {
      return "#4F8AFA"; // blue
    }
    if (score >= 60) {
      return "#34C759"; // green
    }
    if (score >= 40) {
      return "#FFD600"; // yellow
    }
    if (score >= 20) {
      return "#FF9500"; // orange
    }
    return "#FF3B30"; // red
  };

  return (
    <Card className="bg-background/30 border-none">
      <CardHeader>
        <CardTitle>Sentiment Analysis</CardTitle>
        <CardDescription>Real-time sentiment score monitoring</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <div
              className="text-3xl font-bold tracking-tight"
              style={{ color: getScoreColor(currentScore) }}
            >
              {currentScore}
            </div>
            <div className="text-sm text-muted-foreground">{getSentimentLabel(currentScore)}</div>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm text-muted-foreground">
              {trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Stable"}
            </span>
          </div>
        </div>
        <div className="h-[200px]">
          <ChartContainer config={chartConfig}>
            <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 5)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Line
                dataKey="desktop"
                type="natural"
                stroke="#4F8AFA"
                strokeWidth={2}
                dot={{ fill: "#4F8AFA" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
        <div className="mt-8 text-sm text-muted-foreground text-center">
          Updates every 4 seconds • Last 20 data points
        </div>
      </CardContent>
    </Card>
  );
}
