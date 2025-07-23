import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "./logo.svg";

const features = [
  {
    title: "AI-Powered Meeting Summaries",
    description: "Get instant, accurate summaries and follow-ups after every meeting.",
    badge: "AI",
  },
  {
    title: "Live Transcript & Sentiment Analysis",
    description: "Real-time transcription and sentiment insights for every conversation.",
    badge: "Live",
  },
  {
    title: "OCR & Screenshot Management",
    description: "Capture, analyze, and search meeting screenshots with built-in OCR.",
    badge: "Vision",
  },
  {
    title: "File Uploads & AI Understanding",
    description: "Upload documents and let AI extract key information and action items.",
    badge: "Docs",
  },
  {
    title: "Todo & Action Item Extraction",
    description: "Never miss a task—AI finds todos and next steps automatically.",
    badge: "Tasks",
  },
  {
    title: "Secure, Fast, and Easy",
    description: "Enterprise-grade security, instant setup, and a beautiful interface.",
    badge: "Secure",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Hero Section */}
      <header className="w-full pt-16 pb-24 flex flex-col items-center bg-gradient-to-b from-white to-gray-50">
        <img src={logo} alt="Meeting AI Logo" className="w-20 h-20 mb-6 drop-shadow-lg" />
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-4 text-center">
          Elevate Your Meetings<br />with <span className="text-blue-600">AI</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl text-center">
          Experience the next generation of online meetings—AI-powered, beautifully simple, and incredibly smart. Join, host, and transform your conversations with Meeting AI.
        </p>
        <Button className="px-8 py-4 text-lg rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all">
          Get Started
        </Button>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Badge variant="secondary" className="text-base px-3 py-1">{feature.badge}</Badge>
                  <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">See It In Action</h2>
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            <div className="rounded-2xl overflow-hidden shadow-xl border bg-white">
              <img
                src="/images/meetingsdk-web-client-view.gif"
                alt="Meeting SDK Client Demo"
                className="w-[350px] h-auto object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border bg-white">
              <img
                src="/images/meetingsdk-web-component-view.gif"
                alt="Meeting SDK Component Demo"
                className="w-[350px] h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-white border-t flex flex-col items-center text-gray-400 text-sm">
        <div className="flex gap-6 mb-2">
          <a href="https://github.com/zoom/meetingsdk-react-sample" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition">GitHub</a>
          <a href="https://developers.zoom.us/docs/meeting-sdk/web/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition">Docs</a>
        </div>
        <div>© {new Date().getFullYear()} Meeting AI. All rights reserved.</div>
      </footer>
    </div>
  );
}