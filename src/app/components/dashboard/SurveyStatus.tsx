// import React, { useState, useEffect, useRef } from 'react';
// import { useGNSS } from '../../../context/GNSSContext';
// import { api } from '../../../api/gnssApi';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
// import { Button } from '../ui/button';
// import { Badge } from '../ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
// import { ScrollArea } from '../ui/scroll-area';
// import {
//   Play,
//   Square,
//   MapPin,
//   Copy,
//   CheckCircle2,
//   Clock,
//   Target,
//   Satellite,
//   Settings,
//   Info,
//   Radio, // Added for the NTRIP banner
//   Activity // Added for the NTRIP banner
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { uiLogger } from '../../../utils/uiLogger';

// interface AccuracyRecord {
//   accuracy: number;
//   elapsedTime: string;
//   isSuccess: boolean;
// }

// export const SurveyStatus: React.FC = () => {
//   // ⭐ Added 'streams' to the destructuring so we can access NTRIP data
//   const { survey, startSurvey, stopSurvey, configuration, gnssStatus, streams } = useGNSS();
//   const [coordinateFormat, setCoordinateFormat] = useState<'Global' | 'Local'>('Global');
//   const [isLoading, setIsLoading] = useState(false);
//   const [accuracyHistory, setAccuracyHistory] = useState<AccuracyRecord[]>([]);
//   const [finalAccuracyRecord, setFinalAccuracyRecord] = useState<AccuracyRecord | null>(null);
//   const [showAccuracyHistory, setShowAccuracyHistory] = useState(false);
//   const [progressPercentage, setProgressPercentage] = useState(0);
//   const hasMetTargetAccuracy = survey.currentAccuracy > 0 && survey.currentAccuracy <= survey.targetAccuracy;
//   const showFixedIndicators = !survey.isActive && survey.status !== 'stopped' && hasMetTargetAccuracy;

//   const requiredTimeSecs = survey.isActive ? survey.requiredTime : configuration.baseStation.surveyDuration;
//   const clampedElapsedTime = Math.min(survey.elapsedTime, requiredTimeSecs);

//   useEffect(() => {
//     const percentage = requiredTimeSecs > 0
//       ? Math.min((clampedElapsedTime / requiredTimeSecs) * 100, 100)
//       : 0;
//     setProgressPercentage(percentage);
//   }, [clampedElapsedTime, requiredTimeSecs]);

//   const surveWasActiveRef = useRef(false);
//   useEffect(() => {
//     if (!survey.isActive && surveWasActiveRef.current === true) {
//       uiLogger.log('Survey ended', 'SurveyStatus', {
//         finalAccuracy: survey.currentAccuracy,
//         duration: survey.elapsedTime,
//       });
//     }
//     surveWasActiveRef.current = survey.isActive;
//   }, [survey.isActive, survey.currentAccuracy, survey.elapsedTime]);

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   const formatCoordinate = () => {
//     const lat = gnssStatus.globalPosition.latitude || survey.position.latitude;
//     const lon = gnssStatus.globalPosition.longitude || survey.position.longitude;
//     const alt = gnssStatus.globalPosition.altitude || survey.position.altitude;

//     if (coordinateFormat === 'Global') {
//       return {
//         lat: lat && !isNaN(lat) && lat !== 0 ? lat.toFixed(8) : 'NIL',
//         lon: lon && !isNaN(lon) && lon !== 0 ? lon.toFixed(8) : 'NIL',
//         alt: alt && !isNaN(alt) && alt !== 0 ? alt.toFixed(3) : 'NIL',
//       };
//     } else {
//       let finalX = survey.localCoordinates.meanX;
//       let finalY = survey.localCoordinates.meanY;
//       let finalZ = survey.localCoordinates.meanZ;

//       if ((!finalX || isNaN(finalX) || finalX === 0) && (!finalY || isNaN(finalY) || finalY === 0) && lat !== 0 && lon !== 0) {
//         finalX = (lon * 20037508.34) / 180;
//         const rad = (lat * Math.PI) / 180;
//         finalY = (Math.log(Math.tan((Math.PI / 4) + (rad / 2))) * (20037508.34 / Math.PI));
//         finalZ = alt;
//       }

//       const isValidX = finalX !== undefined && finalX !== null && !isNaN(finalX) && finalX !== 0;
//       const isValidY = finalY !== undefined && finalY !== null && !isNaN(finalY) && finalY !== 0;
//       const isValidZ = finalZ !== undefined && finalZ !== null && !isNaN(finalZ) && finalZ !== 0;

//       return {
//         lat: isValidX ? finalX.toFixed(4) : 'NIL',
//         lon: isValidY ? finalY.toFixed(4) : 'NIL',
//         alt: isValidZ ? finalZ.toFixed(4) : 'NIL',
//       };
//     }
//   };

//   const coords = formatCoordinate();

//   const copyCoordinates = () => {
//     const coordText = `${coordinateFormat}: Lat/X: ${coords.lat}, Lon/Y: ${coords.lon}, Alt/Z: ${coords.alt}m`;
//     navigator.clipboard.writeText(coordText);
//     uiLogger.log('Copy Coordinates', 'SurveyStatus', coordText);
//     toast.success('Coordinates copied to clipboard');
//   };

//   const handleStartSurvey = async () => {
//     try {
//       setIsLoading(true);
//       setAccuracyHistory([]);
//       setFinalAccuracyRecord(null);
//       uiLogger.log('Start Survey Button Clicked', 'SurveyStatus', {
//         duration: configuration.baseStation.surveyDuration,
//         accuracy: configuration.baseStation.accuracyThreshold,
//       });

//       await startSurvey();

//       uiLogger.log('Survey Started Successfully', 'SurveyStatus');
//       toast.success('Survey started');

//       setTimeout(() => {
//         setIsLoading(false);
//       }, 100);
//     } catch (error) {
//       const errorMsg = error instanceof Error ? error.message : String(error);
//       uiLogger.log('Start Survey Failed', 'SurveyStatus', undefined, errorMsg);
//       toast.error(`Failed to start survey: ${errorMsg}`);
//       setIsLoading(false);
//     }
//   };

//   const handleStopSurvey = async () => {
//     try {
//       setIsLoading(true);
//       uiLogger.log('Stop Survey Button Clicked', 'SurveyStatus', {
//         elapsedTime: survey.elapsedTime,
//         accuracy: `${(survey.currentAccuracy).toFixed(1)}cm`,
//       });

//       await stopSurvey();

//       uiLogger.log('Survey Stopped Successfully', 'SurveyStatus');
//       toast.success('Survey stopped');
//     } catch (error) {
//       const errorMsg = error instanceof Error ? error.message : String(error);
//       uiLogger.log('Stop Survey Failed', 'SurveyStatus', undefined, errorMsg);
//       toast.error(`Failed to stop survey: ${errorMsg}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getDisplayStatus = () => {
//     if (survey.isActive) return 'In Progress';
//     if (survey.status === 'stopped') return 'Stopped';
//     if (showFixedIndicators) return 'Position Fixed';
//     return 'Idle';
//   };

//   const getStatusBadgeColor = () => {
//     if (survey.isActive) return survey.status === 'initializing' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white';
//     if (survey.status === 'stopped') return 'bg-red-500 text-white';
//     if (showFixedIndicators) return 'bg-emerald-500 text-white';
//     return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
//   };

//   const lockedAccuracy = useRef<number>(0);
//   const lockedTime = useRef<number>(0);

//   useEffect(() => {
//     if (!survey.isActive && clampedElapsedTime > 0) {
//       lockedAccuracy.current = survey.currentAccuracy;
//       lockedTime.current = clampedElapsedTime; 
//     } else if (survey.isActive) {
//       lockedAccuracy.current = 0;
//       lockedTime.current = 0;
//     }
//   }, [survey.isActive, survey.currentAccuracy, clampedElapsedTime]);

//   const displayAccuracy = !survey.isActive && lockedAccuracy.current > 0 ? lockedAccuracy.current : survey.currentAccuracy;
//   const finalDisplayTime = !survey.isActive && lockedTime.current > 0 ? lockedTime.current : clampedElapsedTime;

//   return (
//     <div className="space-y-6">
//       {/* Survey Status Card */}
//       <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle className="text-slate-900 dark:text-slate-50">Survey Status</CardTitle>
//               <CardDescription className="text-slate-500 dark:text-slate-400">Real-time survey-in mode monitoring</CardDescription>
//             </div>
//             <Badge className={`${getStatusBadgeColor()} border-none shadow-none`}>
//               {getDisplayStatus()}
//             </Badge>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div className="flex items-center justify-center">
//             <div className="relative">
//               <svg className="size-48" viewBox="0 0 200 200">
//                 <circle
//                   cx="100"
//                   cy="100"
//                   r="85"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="10"
//                   className="text-slate-100 dark:text-slate-800"
//                 />
//                 <circle
//                   cx="100"
//                   cy="100"
//                   r="85"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="10"
//                   strokeLinecap="round"
//                   className={progressPercentage >= 100 ? 'text-emerald-500' : 'text-blue-500'}
//                   strokeDasharray={`${(progressPercentage / 100) * 534.07} 534.07`}
//                   transform="rotate(-90 100 100)"
//                   style={{ transition: 'stroke-dasharray 0.3s ease' }}
//                 />
//               </svg>
//               <div className="absolute inset-0 flex flex-col items-center justify-center">
//                 <span className="text-4xl font-bold font-mono text-slate-900 dark:text-slate-50">{formatTime(finalDisplayTime)}</span>
//                 <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ {formatTime(requiredTimeSecs)}</span>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
//               <Clock className="size-5 mx-auto mb-2 text-blue-500" />
//               <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">{formatTime(requiredTimeSecs)}</div>
//               <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
//                 Time Limit
//               </div>
//             </div>

//             <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
//               <Target className="size-5 mx-auto mb-2 text-emerald-500" />
//               <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
//                 {parseFloat((
//                   (survey.isActive ? survey.targetAccuracy : configuration.baseStation.accuracyThreshold)
//                 ).toFixed(0))}<span className="text-xs font-sans font-semibold text-slate-500 dark:text-slate-400 ml-1">cm</span>
//               </div>
//               <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Target</div>
//             </div>

//             <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
//               <Satellite className="size-5 mx-auto mb-2 text-purple-500" />
//               <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{survey.satelliteCount > 0 ? survey.satelliteCount : 'NIL'}</div>
//               <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Satellites</div>
//             </div>

//             <Dialog open={showAccuracyHistory} onOpenChange={setShowAccuracyHistory}>
//               <DialogTrigger asChild>
//                 <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
//                   <CheckCircle2 className="size-5 mx-auto mb-2 text-orange-500" />
//                   <div className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-500">
//                     {displayAccuracy > 0 ? parseFloat((displayAccuracy).toFixed(1)) : 'NIL'}
//                     {displayAccuracy > 0 && <span className="text-xs font-sans font-semibold ml-1">cm</span>}
//                   </div>
//                   <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
//                     {accuracyHistory.length > 1 ? 'Accuracy (Click)' : 'Accuracy'}
//                   </div>
//                 </div>
//               </DialogTrigger>
//               <DialogContent className="max-w-md bg-white dark:bg-[#020617] border-slate-200 dark:border-slate-800">
//                 <DialogHeader>
//                   <DialogTitle className="text-slate-900 dark:text-slate-50">Accuracy History</DialogTitle>
//                   <DialogDescription className="text-slate-500 dark:text-slate-400">
//                     All accuracy attempts during this survey
//                   </DialogDescription>
//                 </DialogHeader>
//                 <ScrollArea className="h-64 w-full">
//                   <div className="space-y-2 p-4">
//                     {accuracyHistory.map((record, idx) => (
//                       <div
//                         key={idx}
//                         className={`flex justify-between items-center p-3 rounded-lg ${record.isSuccess
//                             ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
//                             : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'
//                           }`}
//                       >
//                         <div>
//                           <div className={`font-mono font-bold ${record.isSuccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
//                             {record.accuracy}cm
//                           </div>
//                           <div className={`text-xs ${record.isSuccess ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
//                             {record.elapsedTime}
//                           </div>
//                         </div>
//                         <div className={`text-xs font-bold ${record.isSuccess ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
//                           {record.isSuccess ? '✓ Met' : '✗ Not Met'}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </ScrollArea>
//               </DialogContent>
//             </Dialog>
//           </div>

//           <div className="flex gap-3">
//             {!survey.isActive ? (
//               <Button
//                 onClick={handleStartSurvey}
//                 className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
//                 disabled={isLoading}
//               >
//                 <Play className="size-4" />
//                 Start Survey
//               </Button>
//             ) : (
//               <Button
//                 onClick={handleStopSurvey}
//                 variant="destructive"
//                 className="flex-1 gap-2"
//                 disabled={isLoading}
//               >
//                 <Square className="size-4" />
//                 Stop Survey
//               </Button>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* ⭐ NEW: Dashboard Live NTRIP Streaming Banner */}
//       {streams?.ntrip?.active && (
//         <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/50 bg-white dark:bg-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in slide-in-from-bottom-4 fade-in zoom-in-95 duration-500">
//           <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 animate-[pulse_3s_ease-in-out_infinite]" />
          
//           <div className="relative p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
//             <div className="flex items-center gap-4">
//                <div className="relative flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] shrink-0">
//                   <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
//                   <Radio className="size-6 relative z-10 animate-pulse" />
//                </div>
//                <div>
//                   <div className="flex items-center gap-2">
//                      <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-emerald-400 tracking-tight">LIVE NTRIP STREAM</h3>
//                      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 text-[9px] uppercase tracking-wider py-0">Broadcasting</Badge>
//                   </div>
//                   <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px] md:max-w-xs">
//                     MOUNT: <span className="text-slate-800 dark:text-emerald-200">{streams.ntrip.mountpoint || configuration.streams.ntrip.mountpoint || 'VRS_RTCM'}</span>
//                   </p>
//                </div>
//             </div>

//             <div className="flex items-center gap-6 justify-between md:justify-end bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
//                <div>
//                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1"><Activity className="size-3 text-emerald-500" /> Speed</p>
//                   <p className="font-mono text-lg font-bold text-slate-900 dark:text-emerald-400 leading-none mt-1">
//                     {(streams.ntrip.throughput / 1024).toFixed(2)}<span className="text-[10px] font-sans font-medium text-slate-500 dark:text-slate-400 ml-1">KB/s</span>
//                   </p>
//                </div>
//                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
//                <div>
//                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Sent</p>
//                   <p className="font-mono text-lg font-bold text-slate-900 dark:text-emerald-400 leading-none mt-1">
//                     {(streams.ntrip.dataSent / 1024).toFixed(1)}<span className="text-[10px] font-sans font-medium text-slate-500 dark:text-slate-400 ml-1">KB</span>
//                   </p>
//                </div>
//                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
//                <div className="hidden sm:block">
//                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Uptime</p>
//                   <p className="font-mono text-lg font-bold text-slate-900 dark:text-emerald-400 leading-none mt-1">
//                     {Math.floor(streams.ntrip.uptime / 60)}:{String(streams.ntrip.uptime % 60).padStart(2, '0')}
//                   </p>
//                </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Position Information Card */}
//       <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
//         <CardHeader className="pb-4 border-b-2 border-slate-200 dark:border-slate-800">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
//                 <MapPin className="size-5" />
//               </div>
//               <div>
//                 <CardTitle className="text-base text-slate-900 dark:text-slate-50 uppercase tracking-wide">Position Data</CardTitle>
//                 <CardDescription className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
//                   {coordinateFormat === 'Global' ? 'GLOBAL_GNSS_RX' : 'LOCAL_SURVEY_PROC'}
//                 </CardDescription>
//               </div>
//             </div>
//             <div className="flex flex-col items-end gap-2">
//               {showFixedIndicators && (
//                 <Badge className="bg-emerald-500 text-white border-none gap-1.5 px-2 py-0.5 rounded-full text-[10px]">
//                   <span className="size-1.5 bg-white rounded-full animate-pulse" />
//                   RTK FIXED
//                 </Badge>
//               )}
//               <div className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
//                 ±{survey.position.accuracy > 0 ? survey.position.accuracy.toFixed(3) : 'NIL'}m
//               </div>
//             </div>
//           </div>
//         </CardHeader>
        
//         <CardContent className="p-5 space-y-5">
//           <Tabs value={coordinateFormat} onValueChange={(v) => setCoordinateFormat(v as any)}>
//             <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
//               <TabsTrigger value="Global" className="rounded-md data-[state=active]:shadow-sm text-xs font-bold">GLOBAL</TabsTrigger>
//               <TabsTrigger value="Local" className="rounded-md data-[state=active]:shadow-sm text-xs font-bold">LOCAL</TabsTrigger>
//             </TabsList>
//           </Tabs>

//           <div className="bg-white dark:bg-black rounded-xl border-2 border-slate-200 dark:border-slate-800 p-1 font-mono overflow-hidden">
//             <div className="grid grid-cols-1 divide-y-2 divide-slate-100 dark:divide-slate-900">
              
//               <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
//                 <div className="text-[10px] font-bold text-slate-400 w-24 shrink-0">
//                   {coordinateFormat === 'Global' ? 'LAT' : 'EAST (X)'}
//                 </div>
//                 <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{coords.lat}</div>
//               </div>

//               <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
//                 <div className="text-[10px] font-bold text-slate-400 w-24 shrink-0">
//                   {coordinateFormat === 'Global' ? 'LON' : 'NORTH (Y)'}
//                 </div>
//                 <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{coords.lon}</div>
//               </div>

//               <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors bg-slate-50 dark:bg-slate-900/30">
//                 <div className="text-[10px] font-bold text-slate-400 w-24 shrink-0">
//                   {coordinateFormat === 'Global' ? 'ALT (MSL)' : 'HEIGHT (Z)'}
//                 </div>
//                 <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
//                   {coords.alt} <span className="text-xs text-slate-500 font-normal">m</span>
//                 </div>
//               </div>

//             </div>
//           </div>

//           <Button 
//             variant="default" 
//             className="w-full gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-xl h-10 font-bold text-xs transition-transform active:scale-95" 
//             onClick={copyCoordinates}
//           >
//             <Copy className="size-4" />
//             COPY TO CLIPBOARD
//           </Button>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

































import React, { useState, useEffect, useRef } from 'react';
import { useGNSS } from '../../../context/GNSSContext';
import { api } from '../../../api/gnssApiDynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import {
  Play,
  Square,
  MapPin,
  Copy,
  CheckCircle2,
  Clock,
  Target,
  Satellite,
  Radio, 
  Activity, 
  RefreshCw // Added for the minimal spinner
} from 'lucide-react';
import { toast } from 'sonner';
import { uiLogger } from '../../../utils/uiLogger';

interface AccuracyRecord {
  accuracy: number;
  elapsedTime: string;
  isSuccess: boolean;
}

export const SurveyStatus: React.FC = () => {
  const { survey, startSurvey, stopSurvey, configuration, gnssStatus, streams } = useGNSS();
  const [coordinateFormat, setCoordinateFormat] = useState<'Global' | 'Local'>('Global');
  const [isLoading, setIsLoading] = useState(false);
  const [accuracyHistory, setAccuracyHistory] = useState<AccuracyRecord[]>([]);
  const [finalAccuracyRecord, setFinalAccuracyRecord] = useState<AccuracyRecord | null>(null);
  const [showAccuracyHistory, setShowAccuracyHistory] = useState(false);
  const [displayElapsedTime, setDisplayElapsedTime] = useState(0);
  const prevIsActiveRef = useRef(survey.isActive);
  const prevStatusRef = useRef(survey.status);
  const startToastIdRef = useRef<string | number | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const hasMetTargetAccuracy = survey.valid || (survey.currentAccuracy > 0 && survey.currentAccuracy <= survey.targetAccuracy);
  const showFixedIndicators = !survey.isActive && survey.status !== 'stopped' && hasMetTargetAccuracy;

  const requiredTimeSecs = survey.requiredTime > 0 ? survey.requiredTime : configuration.baseStation.surveyDuration;

  useEffect(() => {
    const justStarted = survey.isActive && !prevIsActiveRef.current;
    prevIsActiveRef.current = survey.isActive;

    if (survey.status === 'initializing') {
      setDisplayElapsedTime(0);
      return;
    }

    if (survey.isActive || justStarted) {
      setDisplayElapsedTime(survey.elapsedTime);
      return;
    }

    const settledElapsed = Math.min(survey.elapsedTime, requiredTimeSecs);
    setDisplayElapsedTime(settledElapsed);
  }, [survey.elapsedTime, survey.isActive, survey.status, requiredTimeSecs]);

  const clampedElapsedTime = Math.min(displayElapsedTime, requiredTimeSecs);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const becameRunning = prevStatus !== 'in-progress' && survey.status === 'in-progress';
    const justEnteredInitializing = prevStatus !== 'initializing' && survey.status === 'initializing';
    const justFailed = prevStatus !== 'failed' && survey.status === 'failed';

    if (justEnteredInitializing) {
      if (startToastIdRef.current !== null) {
        toast.dismiss(startToastIdRef.current);
      }
      startToastIdRef.current = toast.loading('Starting survey...');
    }

    if (becameRunning) {
      if (startToastIdRef.current !== null) {
        toast.dismiss(startToastIdRef.current);
        startToastIdRef.current = null;
      }
      uiLogger.log('Survey Started Successfully', 'SurveyStatus');
      toast.success('Survey started');
      setIsLoading(false);
    }

    if (justFailed) {
      if (startToastIdRef.current !== null) {
        toast.dismiss(startToastIdRef.current);
        startToastIdRef.current = null;
      }
      setIsLoading(false);
    }

    if (!survey.isActive && survey.status !== 'initializing' && startToastIdRef.current !== null && prevStatus === 'initializing') {
      toast.dismiss(startToastIdRef.current);
      startToastIdRef.current = null;
    }

    prevStatusRef.current = survey.status;
  }, [survey.status, survey.isActive]);

  useEffect(() => {
    const percentage = requiredTimeSecs > 0
      ? Math.min((clampedElapsedTime / requiredTimeSecs) * 100, 100)
      : 0;
    setProgressPercentage(percentage);
  }, [clampedElapsedTime, requiredTimeSecs]);

  const surveWasActiveRef = useRef(false);
  useEffect(() => {
    if (!survey.isActive && surveWasActiveRef.current === true) {
      uiLogger.log('Survey ended', 'SurveyStatus', {
        finalAccuracy: survey.currentAccuracy,
        duration: survey.elapsedTime,
      });
    }
    surveWasActiveRef.current = survey.isActive;
  }, [survey.isActive, survey.currentAccuracy, survey.elapsedTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCoordinate = () => {
    const lat = gnssStatus.globalPosition.latitude || survey.position.latitude;
    const lon = gnssStatus.globalPosition.longitude || survey.position.longitude;
    const alt = gnssStatus.globalPosition.altitude || survey.position.altitude;

    if (coordinateFormat === 'Global') {
      return {
        lat: lat && !isNaN(lat) && lat !== 0 ? lat.toFixed(8) : 'NIL',
        lon: lon && !isNaN(lon) && lon !== 0 ? lon.toFixed(8) : 'NIL',
        alt: alt && !isNaN(alt) && alt !== 0 ? alt.toFixed(3) : 'NIL',
      };
    } else {
      let finalX = survey.localCoordinates.meanX;
      let finalY = survey.localCoordinates.meanY;
      let finalZ = survey.localCoordinates.meanZ;

      if ((!finalX || isNaN(finalX) || finalX === 0) && (!finalY || isNaN(finalY) || finalY === 0) && lat !== 0 && lon !== 0) {
        finalX = (lon * 20037508.34) / 180;
        const rad = (lat * Math.PI) / 180;
        finalY = (Math.log(Math.tan((Math.PI / 4) + (rad / 2))) * (20037508.34 / Math.PI));
        finalZ = alt;
      }

      const isValidX = finalX !== undefined && finalX !== null && !isNaN(finalX) && finalX !== 0;
      const isValidY = finalY !== undefined && finalY !== null && !isNaN(finalY) && finalY !== 0;
      const isValidZ = finalZ !== undefined && finalZ !== null && !isNaN(finalZ) && finalZ !== 0;

      return {
        lat: isValidX ? finalX.toFixed(4) : 'NIL',
        lon: isValidY ? finalY.toFixed(4) : 'NIL',
        alt: isValidZ ? finalZ.toFixed(4) : 'NIL',
      };
    }
  };

  const coords = formatCoordinate();

  const copyCoordinates = () => {
    const coordText = `${coordinateFormat}: Lat/X: ${coords.lat}, Lon/Y: ${coords.lon}, Alt/Z: ${coords.alt}m`;
    navigator.clipboard.writeText(coordText);
    uiLogger.log('Copy Coordinates', 'SurveyStatus', coordText);
    toast.success('Coordinates copied to clipboard');
  };

  const handleStartSurvey = async () => {
    try {
      setIsLoading(true);
      setAccuracyHistory([]);
      setFinalAccuracyRecord(null);
      uiLogger.log('Start Survey Button Clicked', 'SurveyStatus', {
        duration: configuration.baseStation.surveyDuration,
        accuracy: configuration.baseStation.accuracyThreshold,
      });

      await startSurvey();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (startToastIdRef.current !== null) {
        toast.dismiss(startToastIdRef.current);
        startToastIdRef.current = null;
      }
      uiLogger.log('Start Survey Failed', 'SurveyStatus', undefined, errorMsg);
      toast.error(`Failed to start survey: ${errorMsg}`);
      setIsLoading(false);
    }
  };

  const handleStopSurvey = async () => {
    try {
      setIsLoading(true);
      uiLogger.log('Stop Survey Button Clicked', 'SurveyStatus', {
        elapsedTime: survey.elapsedTime,
        accuracy: `${(survey.currentAccuracy).toFixed(1)}cm`,
      });

      await stopSurvey();

      uiLogger.log('Survey Stopped Successfully', 'SurveyStatus');
      toast.success('Survey stopped');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      uiLogger.log('Stop Survey Failed', 'SurveyStatus', undefined, errorMsg);
      toast.error(`Failed to stop survey: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayStatus = () => {
    if (survey.isActive) return 'In Progress';
    if (survey.status === 'initializing') return 'Initializing';
    if (survey.status === 'stopped') return 'Stopped';
    if (showFixedIndicators) return 'Position Fixed';
    return 'Idle';
  };

  const getStatusBadgeColor = () => {
    if (survey.isActive) return survey.status === 'initializing' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white';
    if (survey.status === 'initializing') return 'bg-blue-500 text-white';
    if (survey.status === 'stopped') return 'bg-red-500 text-white';
    if (showFixedIndicators) return 'bg-emerald-500 text-white';
    return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const lockedAccuracy = useRef<number>(0);
  const lockedTime = useRef<number>(0);

  useEffect(() => {
    if (!survey.isActive && clampedElapsedTime > 0) {
      lockedAccuracy.current = survey.currentAccuracy;
      lockedTime.current = clampedElapsedTime; 
    } else if (survey.isActive) {
      lockedAccuracy.current = 0;
      lockedTime.current = 0;
    }
  }, [survey.isActive, survey.currentAccuracy, clampedElapsedTime]);

  const displayAccuracy = !survey.isActive && lockedAccuracy.current > 0 ? lockedAccuracy.current : survey.currentAccuracy;
  const finalDisplayTime = !survey.isActive && lockedTime.current > 0 ? lockedTime.current : clampedElapsedTime;

  return (
    <div className="space-y-6">
      
      {/* ── SURVEY STATUS CARD ── */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-50">Survey Status</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Real-time survey-in mode monitoring</CardDescription>
            </div>
            <Badge className={`${getStatusBadgeColor()} border-none shadow-none`}>
              {getDisplayStatus()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg className="size-48" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className={progressPercentage >= 100 ? 'text-emerald-500' : 'text-blue-500'}
                  strokeDasharray={`${(progressPercentage / 100) * 534.07} 534.07`}
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dasharray 0.3s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold font-mono text-slate-900 dark:text-slate-50">{formatTime(finalDisplayTime)}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ {formatTime(requiredTimeSecs)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
              <Clock className="size-5 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">{formatTime(requiredTimeSecs)}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Time Limit</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
              <Target className="size-5 mx-auto mb-2 text-emerald-500" />
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
                {parseFloat(((survey.isActive ? survey.targetAccuracy : configuration.baseStation.accuracyThreshold)).toFixed(0))}
                <span className="text-xs font-sans font-semibold text-slate-500 dark:text-slate-400 ml-1">cm</span>
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Target</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
              <Satellite className="size-5 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{survey.satelliteCount > 0 ? survey.satelliteCount : 'NIL'}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Satellites</div>
            </div>

            <Dialog open={showAccuracyHistory} onOpenChange={setShowAccuracyHistory}>
              <DialogTrigger asChild>
                <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <CheckCircle2 className="size-5 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-500">
                    {displayAccuracy > 0 ? parseFloat((displayAccuracy).toFixed(1)) : 'NIL'}
                    {displayAccuracy > 0 && <span className="text-xs font-sans font-semibold ml-1">cm</span>}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {accuracyHistory.length > 1 ? 'Accuracy (Click)' : 'Accuracy'}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white dark:bg-[#020617] border-slate-200 dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 dark:text-slate-50">Accuracy History</DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-slate-400">All accuracy attempts during this survey</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-2 p-4">
                    {accuracyHistory.map((record, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center p-3 rounded-lg ${record.isSuccess
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'
                          }`}
                      >
                        <div>
                          <div className={`font-mono font-bold ${record.isSuccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{record.accuracy}cm</div>
                          <div className={`text-xs ${record.isSuccess ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>{record.elapsedTime}</div>
                        </div>
                        <div className={`text-xs font-bold ${record.isSuccess ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                          {record.isSuccess ? '✓ Met' : '✗ Not Met'}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-3">
            {!survey.isActive ? (
              <Button
                onClick={handleStartSurvey}
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading || survey.status === 'initializing'}
              >
                <Play className="size-4" /> {survey.status === 'initializing' ? 'Starting Survey' : 'Start Survey'}
              </Button>
            ) : (
              <Button onClick={handleStopSurvey} variant="destructive" className="flex-1 gap-2" disabled={isLoading}>
                <Square className="size-4" /> Stop Survey
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ⭐ MINIMAL, TECHNICAL NTRIP STATUS STRIP */}
      {streams?.ntrip?.active && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          
          {/* Subtle loading bar running continuously along the top border */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-500 w-1/3 animate-[translateX_2s_ease-in-out_infinite]" />
          </div>

          <div className="p-4 md:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Left side: Identity & Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Radio className="size-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">NTRIP Broadcasting</h3>
                  <RefreshCw className="size-3 text-slate-400 animate-spin duration-3000" />
                </div>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  MOUNT: <span className="font-semibold text-slate-700 dark:text-slate-300">{streams.ntrip.mountpoint || configuration.streams.ntrip.mountpoint || 'VRS_RTCM'}</span>
                </p>
              </div>
            </div>

            {/* Right side: Clean Data Readout */}
            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 justify-between sm:justify-end">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Speed</p>
                <p className="font-mono text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  {(streams.ntrip.throughput / 1024).toFixed(2)}<span className="text-[9px] ml-0.5 text-slate-500">KB/s</span>
                </p>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tx Total</p>
                <p className="font-mono text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  {(streams.ntrip.dataSent / 1024).toFixed(1)}<span className="text-[9px] ml-0.5 text-slate-500">KB</span>
                </p>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Uptime</p>
                <p className="font-mono text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  {Math.floor(streams.ntrip.uptime / 60)}:{String(streams.ntrip.uptime % 60).padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>

          {/* Add the custom keyframe for the top loading bar if you don't have it in your global CSS */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes translateX {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}} />
        </Card>
      )}

      {/* ── POSITION DATA CARD ── */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4 border-b-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <MapPin className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-slate-50 uppercase tracking-wide">Position Data</CardTitle>
                <CardDescription className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {coordinateFormat === 'Global' ? 'GLOBAL_GNSS_RX' : 'LOCAL_SURVEY_PROC'}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {showFixedIndicators && (
                <Badge className="bg-emerald-500 text-white border-none gap-1.5 px-2 py-0.5 rounded-full text-[10px]">
                  <span className="size-1.5 bg-white rounded-full animate-pulse" />
                  RTK FIXED
                </Badge>
              )}
              <div className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                ±{survey.position.accuracy > 0 ? survey.position.accuracy.toFixed(3) : 'NIL'}m
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-5 space-y-5">
          <Tabs value={coordinateFormat} onValueChange={(v) => setCoordinateFormat(v as any)}>
            <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
              <TabsTrigger value="Global" className="rounded-md data-[state=active]:shadow-sm text-xs font-bold">GLOBAL</TabsTrigger>
              <TabsTrigger value="Local" className="rounded-md data-[state=active]:shadow-sm text-xs font-bold">LOCAL</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="bg-white dark:bg-black rounded-xl border-2 border-slate-200 dark:border-slate-800 p-1 font-mono overflow-hidden">
            <div className="grid grid-cols-1 divide-y-2 divide-slate-100 dark:divide-slate-900">
              
              <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-[10px] font-bold text-slate-400 w-24 shrink-0">
                  {coordinateFormat === 'Global' ? 'LAT' : 'EAST (X)'}
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{coords.lat}</div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-[10px] font-bold text-slate-400 w-24 shrink-0">
                  {coordinateFormat === 'Global' ? 'LON' : 'NORTH (Y)'}
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{coords.lon}</div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors bg-slate-50 dark:bg-slate-900/30">
                <div className="text-[10px] font-bold text-slate-400 w-24 shrink-0">
                  {coordinateFormat === 'Global' ? 'ALT (MSL)' : 'HEIGHT (Z)'}
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                  {coords.alt} <span className="text-xs text-slate-500 font-normal">m</span>
                </div>
              </div>

            </div>
          </div>

          <Button 
            variant="default" 
            className="w-full gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-xl h-10 font-bold text-xs transition-transform active:scale-95" 
            onClick={copyCoordinates}
          >
            <Copy className="size-4" />
            COPY TO CLIPBOARD
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
