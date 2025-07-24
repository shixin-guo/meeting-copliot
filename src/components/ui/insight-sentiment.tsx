"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";

export function InsightSentiment() {
  // chartData: [{ time: "12:01:05", desktop: 65, mobile: 50 }, ...]
  const [chartData, setChartData] = useState<{ time: string; desktop: number; mobile: number }[]>(
    [],
  );
  const [currentScore, setCurrentScore] = useState(50);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<Date | null>(null);

  // Helper to format duration as HH:mm:ss
  function formatDuration(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((v) => String(v).padStart(2, "0")).join(":");
  }

  const chartConfig = {
    desktop: {
      label: "Score",
      color: "#4F8AFA", // Use hex color
    },
  } satisfies ChartConfig;

  // 初始化数据
  useEffect(() => {
    startTimeRef.current = new Date();
    const initialData: { time: string; desktop: number; mobile: number }[] = [];
    const now = Date.now();
    let baseScore = 45;
    let baseMobile = 40;
    for (let i = 6; i >= 0; i--) {
      const pointTime = now - i * 18000; // 18 seconds apart
      const variation = (Math.random() - 0.5) * 10;
      const variationMobile = (Math.random() - 0.5) * 8;
      baseScore = Math.max(20, Math.min(80, baseScore + variation));
      baseMobile = Math.max(20, Math.min(80, baseMobile + variationMobile));
      let duration = 0;
      if (startTimeRef.current) {
        duration = pointTime - startTimeRef.current.getTime();
      }
      initialData.push({
        time: formatDuration(Math.max(duration, 0)),
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
      const steps = 5;
      const stepDesktop = (targetDesktop - lastDesktop) / steps;
      const stepMobile = (targetMobile - lastMobile) / steps;
      let currentStep = 0;
      const animationInterval = setInterval(() => {
        currentStep++;
        const newDesktop = Math.round(lastDesktop + stepDesktop * currentStep);
        const newMobile = Math.round(lastMobile + stepMobile * currentStep);
        let duration = 0;
        if (startTimeRef.current) {
          duration = Date.now() - startTimeRef.current.getTime();
        }
        const newDataPoint = {
          time: formatDuration(duration),
          desktop: newDesktop,
          mobile: newMobile,
        };
        setChartData((prev) => {
          const updated = [...prev, newDataPoint];
          if (updated.length > 6) {
            return updated.slice(-6);
          }
          return updated;
        });
        setCurrentScore(newDesktop);
        if (currentStep >= steps) {
          clearInterval(animationInterval);
          setIsAnimating(false);
        }
      }, 5000);
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
    <Card className="bg-background/30 border-none rounded-none shadow-none gap-2">
      <CardContent>
        <div className="flex items-center gap-3 mb-6">
          <div className="text-center">
            <div
              className="text-3xl font-bold tracking-tight"
              style={{ color: getScoreColor(currentScore) }}
            >
              {currentScore}
            </div>
            <div className="text-sm text-muted-foreground">{getSentimentLabel(currentScore)}</div>
          </div>
          {getTrendIcon()}
        </div>
        <div className="w-[180px] p-2">
          <ChartContainer config={chartConfig}>
            <LineChart accessibilityLayer data={chartData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => value.slice(3, 8)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Line dataKey="desktop" type="natural" stroke="#4F8AFA" strokeWidth={1} />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
