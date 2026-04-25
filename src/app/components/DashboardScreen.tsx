import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { SurveyStatus } from './dashboard/SurveyStatus';
import { GNSSStatusTab } from './dashboard/GNSSStatusTab';
import { Satellite, Activity } from 'lucide-react';
import { useGNSS } from '../../context/GNSSContext';

export const DashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'survey' | 'gnss'>('survey');
  const { streams } = useGNSS();

  return (
    // Light: Soft clean slate | Dark: Deep navy/slate-950
    <div className="min-h-full bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto p-6 md:p-8 md:pt-10">

        {/* Top Navigation & Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          
          <div className="space-y-1.5">
            {/* Live Status Indicator (Kept blue for high visibility) */}
            <div className="flex items-center gap-3 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 dark:bg-blue-500"></span>
              </span>
              <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                Live Telemetry
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
            {streams.ntrip.active && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/10 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">NTRIP</div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-emerald-200">
                  {((streams.ntrip.throughput || 0) / 1024).toFixed(2)} KB/s
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {((streams.ntrip.dataSent || 0) / 1024).toFixed(1)} KB
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {Math.floor((streams.ntrip.uptime || 0) / 60)}:{String(Math.floor((streams.ntrip.uptime || 0) % 60)).padStart(2, '0')}
                </div>
              </div>
            )}

            {streams.lora.enabled && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">LORA</div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                  {((streams.lora.throughput || 0) / 1024).toFixed(2)} KB/s
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {((streams.lora.bytesSent || 0) / 1024).toFixed(1)} KB
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {Math.floor((streams.lora.uptime || 0) / 60)}:{String(Math.floor((streams.lora.uptime || 0) % 60)).padStart(2, '0')}
                </div>
              </div>
            )}
          </div>

          {/* Segmented Control Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full md:w-auto">
            {/* Light: Soft translucent slate | Dark: Rich dark slate box */}
            <TabsList className="flex p-1 bg-slate-200/70 dark:bg-slate-900/60 rounded-xl h-auto border border-slate-300/50 dark:border-slate-800">
              
              <TabsTrigger
                value="survey"
                className="flex items-center gap-2.5 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all 
                           text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200
                           data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 
                           data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                           shadow-none data-[state=active]:shadow-sm"
              >
                <Activity className="w-4 h-4" />
                Survey Status
              </TabsTrigger>
              
              {/* <TabsTrigger
                value="gnss"
                className="flex items-center gap-2.5 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all 
                           text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200
                           data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 
                           data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                           shadow-none data-[state=active]:shadow-sm"
              >
                <Satellite className="w-4 h-4" />
                GNSS Status
              </TabsTrigger> */}

            </TabsList>
          </Tabs>
        </div>

        {/* Main Content Viewport */}
        <div className="relative w-full">
          <Tabs value={activeTab} className="w-full">
            
            <TabsContent value="survey" className="m-0 focus-visible:outline-none animate-in fade-in zoom-in-[0.99] duration-300 ease-out">
              <SurveyStatus />
            </TabsContent>

            {/* <TabsContent value="gnss" className="m-0 focus-visible:outline-none animate-in fade-in zoom-in-[0.99] duration-300 ease-out">
              <GNSSStatusTab />
            </TabsContent> */}

          </Tabs>
        </div>

      </div>
    </div>
  );
};
