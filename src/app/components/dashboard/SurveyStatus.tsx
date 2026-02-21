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
//   Info
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { uiLogger } from '../../../utils/uiLogger';

// interface AccuracyRecord {
//   accuracy: number;
//   elapsedTime: string;
//   isSuccess: boolean;
// }

// export const SurveyStatus: React.FC = () => {
//   const { survey, startSurvey, stopSurvey, configuration, gnssStatus } = useGNSS();
//   const [coordinateFormat, setCoordinateFormat] = useState<'Global' | 'Local'>('Global');
//   const [isLoading, setIsLoading] = useState(false);
//   const [accuracyHistory, setAccuracyHistory] = useState<AccuracyRecord[]>([]);
//   const [finalAccuracyRecord, setFinalAccuracyRecord] = useState<AccuracyRecord | null>(null);
//   const [showAccuracyHistory, setShowAccuracyHistory] = useState(false);
//   const [progressPercentage, setProgressPercentage] = useState(0);
//   const [isPositionFixed, setIsPositionFixed] = useState(false); // Track if position is fixed
//   const [fixedPosition, setFixedPosition] = useState<{ lat: number; lon: number; alt: number } | null>(null);

//   // Track accuracy meets target - but don't reset timer anymore
//   // We just track when position is fixed for display purposes
//   useEffect(() => {
//     const currentAccuracy = survey.currentAccuracy;
//     const targetAccuracy = survey.targetAccuracy;

//     // Check if accuracy is met for first time
//     if (survey.isActive && currentAccuracy > 0 && currentAccuracy <= targetAccuracy && !isPositionFixed) {
//       setIsPositionFixed(true);
//       setFixedPosition({
//         lat: survey.position.latitude,
//         lon: survey.position.longitude,
//         alt: survey.position.altitude,
//       });
//     }
//   }, [survey.currentAccuracy, survey.targetAccuracy, survey.isActive, survey.position, isPositionFixed]);

//   // Reset position fixed when survey stops or changes
//   useEffect(() => {
//     if (!survey.isActive && isPositionFixed) {
//       setIsPositionFixed(false);
//       setFixedPosition(null);
//     }
//   }, [survey.isActive, isPositionFixed]);

//   // Calculate progress percentage
//   useEffect(() => {
//     const requiredTimeSecs = survey.isActive ? survey.requiredTime : configuration.baseStation.surveyDuration;
//     const percentage = requiredTimeSecs > 0
//       ? (survey.elapsedTime / requiredTimeSecs) * 100
//       : 0;
//     setProgressPercentage(percentage);
//   }, [survey.elapsedTime, survey.requiredTime, survey.isActive, configuration.baseStation.surveyDuration]);


//   // Track when survey actually ends (transitions from active to inactive)
//   const surveWasActiveRef = useRef(false);
//   useEffect(() => {
//     // Only log when transitioning from active to inactive
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

//   // Check if coordinates are valid (not 0,0,0 which indicates no fix)
//   const isValidCoordinate = (lat: number, lon: number, alt: number): boolean => {
//     return !(lat === 0 && lon === 0 && alt === 0);
//   };

//   // Format coordinates based on selected tab (Global or Local)
//   const formatCoordinate = () => {
//     if (coordinateFormat === 'Global') {
//       // Global coordinates from GNSS receiver
//       const { latitude, longitude, altitude } = gnssStatus.globalPosition;
//       return {
//         lat: latitude !== 0 ? latitude.toFixed(8) : 'NIL',
//         lon: longitude !== 0 ? longitude.toFixed(8) : 'NIL',
//         alt: altitude !== 0 ? altitude.toFixed(3) : 'NIL',
//       };
//     } else {
//       // Local coordinates from survey processing
//       const { meanX, meanY, meanZ } = survey.localCoordinates;
//       return {
//         lat: meanX !== 0 ? meanX.toFixed(2) : 'NIL',
//         lon: meanY !== 0 ? meanY.toFixed(2) : 'NIL',
//         alt: meanZ !== 0 ? meanZ.toFixed(2) : 'NIL',
//       };
//     }
//   };

//   const coords = formatCoordinate();

//   const copyCoordinates = () => {
//     const coordText = `${coordinateFormat}: Lat: ${coords.lat}, Lon: ${coords.lon}, Alt: ${coords.alt}m`;
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

//       // Small delay to ensure smooth UI transition
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
//     if (survey.status === 'completed') {
//       return 'Completed';
//     }
//     if (isPositionFixed) {
//       return 'Position Fixed';
//     }
//     if (!survey.isActive) {
//       return survey.status === 'stopped' ? 'Stopped' : 'Idle';
//     }
//     return 'In Progress';
//   };

//   const getStatusBadgeColor = () => {
//     if (survey.status === 'completed') return 'bg-green-500';
//     if (isPositionFixed) return 'bg-green-500';
//     if (!survey.isActive) return survey.status === 'stopped' ? 'bg-red-500' : 'bg-slate-500';
//     return survey.status === 'initializing' ? 'bg-blue-500' : 'bg-yellow-500';
//   };

//   // Display time: always show elapsed time (locked when survey ends)
//   const displayTime = survey.elapsedTime;

//   // Lock accuracy and timer when survey becomes inactive
//   const lockedAccuracy = useRef<number>(0);
//   const lockedTime = useRef<number>(0);

//   useEffect(() => {
//     if (!survey.isActive && survey.elapsedTime > 0) {
//       // Survey just stopped - lock the current values
//       lockedAccuracy.current = survey.currentAccuracy;
//       lockedTime.current = survey.elapsedTime;
//     } else if (survey.isActive) {
//       // Survey is active - don't use locked values
//       lockedAccuracy.current = 0;
//       lockedTime.current = 0;
//     }
//   }, [survey.isActive, survey.currentAccuracy, survey.elapsedTime]);

//   // Use locked values if survey is inactive, otherwise use current values
//   const displayAccuracy = !survey.isActive && lockedAccuracy.current > 0 ? lockedAccuracy.current : survey.currentAccuracy;
//   const finalDisplayTime = !survey.isActive && lockedTime.current > 0 ? lockedTime.current : displayTime;

//   return (
//     <div className="space-y-6">
//       {/* Survey Status Card */}
//       <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle>Survey Status</CardTitle>
//               <CardDescription>Real-time survey-in mode monitoring</CardDescription>
//             </div>
//             <Badge className={`${getStatusBadgeColor()}`}>
//               {getDisplayStatus()}
//             </Badge>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {/* Circular Timer Progress */}
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
//                   className="text-slate-200 dark:text-slate-700"
//                 />
//                 <circle
//                   cx="100"
//                   cy="100"
//                   r="85"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="10"
//                   strokeLinecap="round"
//                   className={progressPercentage >= 100 ? 'text-green-500' : 'text-blue-500'}
//                   strokeDasharray={`${(progressPercentage / 100) * 534.07} 534.07`}
//                   transform="rotate(-90 100 100)"
//                   style={{ transition: 'stroke-dasharray 0.3s ease' }}
//                 />
//               </svg>
//               <div className="absolute inset-0 flex flex-col items-center justify-center">
//                 <span className="text-4xl font-bold font-mono">{formatTime(finalDisplayTime)}</span>
//                 <span className="text-sm text-slate-600 dark:text-slate-400">/ {formatTime(survey.isActive ? survey.requiredTime : configuration.baseStation.surveyDuration)}</span>
//               </div>
//             </div>
//           </div>

//           {/* Four Metrics Boxes */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {/* Box 1: Time Limit */}
//             <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-800">
//               <Clock className="size-5 mx-auto mb-2 text-blue-500" />
//               <div className="text-2xl font-bold font-mono">{formatTime(survey.isActive ? survey.requiredTime : configuration.baseStation.surveyDuration)}</div>
//               <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
//                 Time Limit
//               </div>
//             </div>

//             {/* Box 2: Target */}
//             <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-green-200 dark:border-green-800">
//               <Target className="size-5 mx-auto mb-2 text-green-500" />
//               <div className="text-2xl font-bold font-mono">
//                 {parseFloat((
//                   (survey.isActive ? survey.targetAccuracy : configuration.baseStation.accuracyThreshold)
//                 ).toFixed(0))}<span className="text-xs">cm</span>
//               </div>
//               <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Target</div>
//             </div>

//             {/* Box 3: Satellites */}
//             <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-800">
//               <Satellite className="size-5 mx-auto mb-2 text-purple-500" />
//               <div className="text-2xl font-bold">{survey.satelliteCount > 0 ? survey.satelliteCount : 'NIL'}</div>
//               <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Satellites</div>
//             </div>

//             {/* Box 4: Current Accuracy */}
//             <Dialog open={showAccuracyHistory} onOpenChange={setShowAccuracyHistory}>
//               <DialogTrigger asChild>
//                 <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-orange-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
//                   <CheckCircle2 className="size-5 mx-auto mb-2 text-orange-500" />
//                   <div className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400">
//                     {displayAccuracy > 0 ? parseFloat((displayAccuracy).toFixed(1)) : 'NIL'}
//                     {displayAccuracy > 0 && <span className="text-xs">cm</span>}
//                   </div>
//                   <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
//                     {accuracyHistory.length > 1 ? 'Accuracy (Click)' : 'Accuracy'}
//                   </div>
//                 </div>
//               </DialogTrigger>
//               <DialogContent className="max-w-md">
//                 <DialogHeader>
//                   <DialogTitle>Accuracy History</DialogTitle>
//                   <DialogDescription>
//                     All accuracy attempts during this survey
//                   </DialogDescription>
//                 </DialogHeader>
//                 <ScrollArea className="h-64 w-full">
//                   <div className="space-y-2 p-4">
//                     {accuracyHistory.map((record, idx) => (
//                       <div
//                         key={idx}
//                         className={`flex justify-between items-center p-3 rounded-lg ${record.isSuccess
//                             ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
//                             : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
//                           }`}
//                       >
//                         <div>
//                           <div className={`font-mono font-bold ${record.isSuccess ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
//                             {record.accuracy}cm
//                           </div>
//                           <div className={`text-xs ${record.isSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
//                             {record.elapsedTime}
//                           </div>
//                         </div>
//                         <div className={`text-xs font-medium ${record.isSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
//                           {record.isSuccess ? '✓ Met' : '✗ Not Met'}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </ScrollArea>
//               </DialogContent>
//             </Dialog>
//           </div>

//           {/* Control Buttons */}
//           <div className="flex gap-3">
//             {!survey.isActive ? (
//               <Button
//                 onClick={handleStartSurvey}
//                 className="flex-1 gap-2"
//                 disabled={isLoading}
//               >
//                 <Play className="size-4" />
//                 {isLoading ? 'Starting...' : 'Start Survey'}
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

//       {/* Position Information Card */}
//       <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle>Position Information</CardTitle>
//               <CardDescription>
//                 {coordinateFormat === 'Global' ? 'Global coordinates from GNSS receiver' : 'Local coordinates from survey processing'}
//               </CardDescription>
//             </div>
//             <div className="flex gap-2">
//               {isPositionFixed && (
//                 <Badge className="bg-green-500 gap-2">
//                   <CheckCircle2 className="size-3" />
//                   Fixed
//                 </Badge>
//               )}
//               <Badge variant="outline" className="gap-2">
//                 <MapPin className="size-3" />
//                 ±{survey.position.accuracy > 0 ? survey.position.accuracy.toFixed(3) : 'NIL'}m
//               </Badge>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <Tabs value={coordinateFormat} onValueChange={(v) => setCoordinateFormat(v as any)}>
//             <TabsList className="grid w-full grid-cols-2">
//               <TabsTrigger value="Global">Global</TabsTrigger>
//               <TabsTrigger value="Local">Local</TabsTrigger>
//             </TabsList>
//           </Tabs>

//           <div className="space-y-3 font-mono">
//             <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
//               <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
//                 {coordinateFormat === 'Global' ? 'Latitude' : 'Mean X (Easting)'}
//               </div>
//               <div className="text-lg font-semibold">{coords.lat}</div>
//             </div>

//             <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
//               <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
//                 {coordinateFormat === 'Global' ? 'Longitude' : 'Mean Y (Northing)'}
//               </div>
//               <div className="text-lg font-semibold">{coords.lon}</div>
//             </div>

//             <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
//               <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
//                 {coordinateFormat === 'Global' ? 'Altitude (MSL)' : 'Mean Z (Height)'}
//               </div>
//               <div className="text-lg font-semibold">{coords.alt} m</div>
//             </div>
//           </div>

//           <Button variant="outline" className="w-full gap-2" onClick={copyCoordinates}>
//             <Copy className="size-4" />
//             Copy {coordinateFormat} Coordinates
//           </Button>
//         </CardContent>
//       </Card>

//     </div>
//   );
// };



























































// import { useGNSS } from '../../../context/GNSSContext';
// import { api } from '../../../api/gnssApi';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
// import { Button } from '../ui/button';
// import { Badge } from '../ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
// import { useState, useRef, useEffect} from 'react';
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
//   Info
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { uiLogger } from '../../../utils/uiLogger';

// interface AccuracyRecord {
//   accuracy: number;
//   elapsedTime: string;
//   isSuccess: boolean;
// }

// export const SurveyStatus: React.FC = () => {
//   const { survey, startSurvey, stopSurvey, configuration, gnssStatus } = useGNSS();
//   const [coordinateFormat, setCoordinateFormat] = useState<'Global' | 'Local'>('Global');
//   const [isLoading, setIsLoading] = useState(false);
//   const [accuracyHistory, setAccuracyHistory] = useState<AccuracyRecord[]>([]);
//   const [finalAccuracyRecord, setFinalAccuracyRecord] = useState<AccuracyRecord | null>(null);
//   const [showAccuracyHistory, setShowAccuracyHistory] = useState(false);
//   const [progressPercentage, setProgressPercentage] = useState(0);
//   const [isPositionFixed, setIsPositionFixed] = useState(false); 
//   const [fixedPosition, setFixedPosition] = useState<{ lat: number; lon: number; alt: number } | null>(null);

//   // ⭐ Core UI Fix: Define the required time and hard-clamp the display time so the clock stops at the limit
//   const requiredTimeSecs = survey.isActive ? survey.requiredTime : configuration.baseStation.surveyDuration;
//   const clampedElapsedTime = Math.min(survey.elapsedTime, requiredTimeSecs);

//   useEffect(() => {
//     const currentAccuracy = survey.currentAccuracy;
//     const targetAccuracy = survey.targetAccuracy;

//     if (survey.isActive && currentAccuracy > 0 && currentAccuracy <= targetAccuracy && !isPositionFixed) {
//       setIsPositionFixed(true);
//       setFixedPosition({
//         lat: survey.position.latitude,
//         lon: survey.position.longitude,
//         alt: survey.position.altitude,
//       });
//     }
//   }, [survey.currentAccuracy, survey.targetAccuracy, survey.isActive, survey.position, isPositionFixed]);

//   useEffect(() => {
//     if (!survey.isActive && isPositionFixed) {
//       setIsPositionFixed(false);
//       setFixedPosition(null);
//     }
//   }, [survey.isActive, isPositionFixed]);

//   useEffect(() => {
//     // ⭐ Core UI Fix: Calculate percentage using the clamped time, capped at 100%
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

//   const isValidCoordinate = (lat: number, lon: number, alt: number): boolean => {
//     return !(lat === 0 && lon === 0 && alt === 0);
//   };

//   const formatCoordinate = () => {
//     if (coordinateFormat === 'Global') {
//       const { latitude, longitude, altitude } = gnssStatus.globalPosition;
//       return {
//         lat: latitude !== 0 ? latitude.toFixed(8) : 'NIL',
//         lon: longitude !== 0 ? longitude.toFixed(8) : 'NIL',
//         alt: altitude !== 0 ? altitude.toFixed(3) : 'NIL',
//       };
//     } else {
//       const { meanX, meanY, meanZ } = survey.localCoordinates;
//       return {
//         lat: meanX !== 0 ? meanX.toFixed(2) : 'NIL',
//         lon: meanY !== 0 ? meanY.toFixed(2) : 'NIL',
//         alt: meanZ !== 0 ? meanZ.toFixed(2) : 'NIL',
//       };
//     }
//   };

//   const coords = formatCoordinate();

//   const copyCoordinates = () => {
//     const coordText = `${coordinateFormat}: Lat: ${coords.lat}, Lon: ${coords.lon}, Alt: ${coords.alt}m`;
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
//     if (survey.status === 'completed') {
//       return 'Completed';
//     }
//     if (isPositionFixed) {
//       return 'Position Fixed';
//     }
//     if (!survey.isActive) {
//       return survey.status === 'stopped' ? 'Stopped' : 'Idle';
//     }
//     return 'In Progress';
//   };

//   const getStatusBadgeColor = () => {
//     if (survey.status === 'completed') return 'bg-emerald-500 text-white';
//     if (isPositionFixed) return 'bg-emerald-500 text-white';
//     if (!survey.isActive) return survey.status === 'stopped' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
//     return survey.status === 'initializing' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white';
//   };

//   const lockedAccuracy = useRef<number>(0);
//   const lockedTime = useRef<number>(0);

//   useEffect(() => {
//     if (!survey.isActive && clampedElapsedTime > 0) {
//       lockedAccuracy.current = survey.currentAccuracy;
//       lockedTime.current = clampedElapsedTime; // Store the clamped version
//     } else if (survey.isActive) {
//       lockedAccuracy.current = 0;
//       lockedTime.current = 0;
//     }
//   }, [survey.isActive, survey.currentAccuracy, clampedElapsedTime]);

//   // Notice how displayAccuracy correctly ignores the time clamp and relies directly on survey.currentAccuracy
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
//           {/* Circular Timer Progress */}
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

//           {/* Four Metrics Boxes */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {/* Box 1: Time Limit */}
//             <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
//               <Clock className="size-5 mx-auto mb-2 text-blue-500" />
//               <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">{formatTime(requiredTimeSecs)}</div>
//               <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
//                 Time Limit
//               </div>
//             </div>

//             {/* Box 2: Target */}
//             <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
//               <Target className="size-5 mx-auto mb-2 text-emerald-500" />
//               <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
//                 {parseFloat((
//                   (survey.isActive ? survey.targetAccuracy : configuration.baseStation.accuracyThreshold)
//                 ).toFixed(0))}<span className="text-xs font-sans font-semibold text-slate-500 dark:text-slate-400 ml-1">cm</span>
//               </div>
//               <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Target</div>
//             </div>

//             {/* Box 3: Satellites */}
//             <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
//               <Satellite className="size-5 mx-auto mb-2 text-purple-500" />
//               <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{survey.satelliteCount > 0 ? survey.satelliteCount : 'NIL'}</div>
//               <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Satellites</div>
//             </div>

//             {/* Box 4: Current Accuracy (Un-clamped Live Updates) */}
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

//           {/* Control Buttons */}
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


//       {/* Position Information Card - Rugged Controller UI */}
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
//               {isPositionFixed && (
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
//             className="w-full gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-xl h-10 font-bold text-xs" 
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
import { api } from '../../../api/gnssApi';
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
  Settings,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { uiLogger } from '../../../utils/uiLogger';

interface AccuracyRecord {
  accuracy: number;
  elapsedTime: string;
  isSuccess: boolean;
}

export const SurveyStatus: React.FC = () => {
  const { survey, startSurvey, stopSurvey, configuration, gnssStatus } = useGNSS();
  const [coordinateFormat, setCoordinateFormat] = useState<'Global' | 'Local'>('Global');
  const [isLoading, setIsLoading] = useState(false);
  const [accuracyHistory, setAccuracyHistory] = useState<AccuracyRecord[]>([]);
  const [finalAccuracyRecord, setFinalAccuracyRecord] = useState<AccuracyRecord | null>(null);
  const [showAccuracyHistory, setShowAccuracyHistory] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isPositionFixed, setIsPositionFixed] = useState(false); 
  const [fixedPosition, setFixedPosition] = useState<{ lat: number; lon: number; alt: number } | null>(null);

  const requiredTimeSecs = survey.isActive ? survey.requiredTime : configuration.baseStation.surveyDuration;
  const clampedElapsedTime = Math.min(survey.elapsedTime, requiredTimeSecs);

  useEffect(() => {
    const currentAccuracy = survey.currentAccuracy;
    const targetAccuracy = survey.targetAccuracy;

    if (survey.isActive && currentAccuracy > 0 && currentAccuracy <= targetAccuracy && !isPositionFixed) {
      setIsPositionFixed(true);
      setFixedPosition({
        lat: survey.position.latitude,
        lon: survey.position.longitude,
        alt: survey.position.altitude,
      });
    }
  }, [survey.currentAccuracy, survey.targetAccuracy, survey.isActive, survey.position, isPositionFixed]);

  useEffect(() => {
    if (!survey.isActive && isPositionFixed) {
      setIsPositionFixed(false);
      setFixedPosition(null);
    }
  }, [survey.isActive, isPositionFixed]);

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

      // ⭐ Fallback Math: If backend fails to send local coords, generate Easting/Northing manually via Web Mercator (EPSG:3857)
      if ((!finalX || isNaN(finalX) || finalX === 0) && (!finalY || isNaN(finalY) || finalY === 0) && lat !== 0 && lon !== 0) {
        finalX = (lon * 20037508.34) / 180;
        const rad = (lat * Math.PI) / 180;
        finalY = (Math.log(Math.tan((Math.PI / 4) + (rad / 2))) * (20037508.34 / Math.PI));
        finalZ = alt;
      }

      // Strict validation so we never render "NaN"
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

      uiLogger.log('Survey Started Successfully', 'SurveyStatus');
      toast.success('Survey started');

      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
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
    if (survey.status === 'completed') return 'Completed';
    if (isPositionFixed) return 'Position Fixed';
    if (!survey.isActive) return survey.status === 'stopped' ? 'Stopped' : 'Idle';
    return 'In Progress';
  };

  const getStatusBadgeColor = () => {
    if (survey.status === 'completed') return 'bg-emerald-500 text-white';
    if (isPositionFixed) return 'bg-emerald-500 text-white';
    if (!survey.isActive) return survey.status === 'stopped' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    return survey.status === 'initializing' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white';
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
      {/* Survey Status Card */}
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
          {/* Circular Timer Progress */}
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

          {/* Four Metrics Boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Box 1: Time Limit */}
            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
              <Clock className="size-5 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">{formatTime(requiredTimeSecs)}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Time Limit
              </div>
            </div>

            {/* Box 2: Target */}
            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
              <Target className="size-5 mx-auto mb-2 text-emerald-500" />
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
                {parseFloat((
                  (survey.isActive ? survey.targetAccuracy : configuration.baseStation.accuracyThreshold)
                ).toFixed(0))}<span className="text-xs font-sans font-semibold text-slate-500 dark:text-slate-400 ml-1">cm</span>
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Target</div>
            </div>

            {/* Box 3: Satellites */}
            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
              <Satellite className="size-5 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{survey.satelliteCount > 0 ? survey.satelliteCount : 'NIL'}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Satellites</div>
            </div>

            {/* Box 4: Current Accuracy (Un-clamped Live Updates) */}
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
                  <DialogDescription className="text-slate-500 dark:text-slate-400">
                    All accuracy attempts during this survey
                  </DialogDescription>
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
                          <div className={`font-mono font-bold ${record.isSuccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                            {record.accuracy}cm
                          </div>
                          <div className={`text-xs ${record.isSuccess ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                            {record.elapsedTime}
                          </div>
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

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!survey.isActive ? (
              <Button
                onClick={handleStartSurvey}
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                <Play className="size-4" />
                Start Survey
              </Button>
            ) : (
              <Button
                onClick={handleStopSurvey}
                variant="destructive"
                className="flex-1 gap-2"
                disabled={isLoading}
              >
                <Square className="size-4" />
                Stop Survey
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Position Information Card - Rugged Controller UI */}
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
              {isPositionFixed && (
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