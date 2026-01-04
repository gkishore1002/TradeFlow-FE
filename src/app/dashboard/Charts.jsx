"use client";
import React, { useEffect, useRef } from 'react';

const Charts = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          "width": "100%",
          "height": "100%",
          "symbol": "NASDAQ:AAPL",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "light",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "container_id": "tradingview_widget",
          "autosize": true
        });
      }
    };
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div id="tradingview_widget" ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default Charts;
