// import React, { useState, useEffect } from 'react';
// import { useGNSS } from '../../context/GNSSContext';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
// import { Button } from './ui/button';
// import { Input } from './ui/input';
// import { Label } from './ui/label';
// import { Switch } from './ui/switch';
// import { Slider } from './ui/slider';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
// import { Badge } from './ui/badge';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
// import { Save, RotateCcw, Settings, Wifi, Radio, Server, Send, Eye, EyeOff } from 'lucide-react';
// import { toast } from 'sonner';
// import { uiLogger } from '../../utils/uiLogger';
// import { api } from '../../api/gnssApi';

// export const ConfigurationScreen: React.FC = () => {
//   const { configuration, updateConfiguration, survey, streams, startNTRIP, stopNTRIP } = useGNSS();
//   const [config, setConfig] = useState(configuration);
//   const [activeMsgType, setActiveMsgType] = useState<'MSM4' | 'MSM7'>('MSM4');
//   const [rtcmActiveMessages, setRtcmActiveMessages] = useState<string[]>([]);
//   const [rtcmLoading, setRtcmLoading] = useState(true);
//   const [showPasswords, setShowPasswords] = useState({
//     wifi: false,
//     ntrip: false,
//   });

//   // Fetch RTCM status on mount — sync MSM type and ticked messages from backend
//   useEffect(() => {
//     api.getRTCM()
//       .then((status) => {
//         if (status.msm_type === 'MSM4' || status.msm_type === 'MSM7') {
//           setActiveMsgType(status.msm_type);
//         }
//         const activeIds = Object.keys(status.message_counts ?? {}).filter(
//           (id) => (status.message_counts[id] ?? 0) > 0
//         );
//         setRtcmActiveMessages(activeIds);
//       })
//       .catch((e) => console.warn('RTCM status fetch failed:', e))
//       .finally(() => setRtcmLoading(false));

//     // Fetch autoflow config — sync auto mode toggle from backend
//     api.getAutoFlowConfig()
//       .then((cfg) => {
//         if (typeof cfg.enabled === 'boolean') {
//           setConfig(prev => ({
//             ...prev,
//             baseStation: { ...prev.baseStation, autoMode: cfg.enabled },
//           }));
//         }
//       })
//       .catch((e) => console.warn('Autoflow config fetch failed:', e));
//   }, []);

//   const handleMsmTypeChange = async (type: 'MSM4' | 'MSM7') => {
//     setActiveMsgType(type);
//     try {
//       await api.configureRTCM(type);
//       toast.success(`Switched to ${type}`);
//     } catch (e) {
//       toast.error(`Failed to configure RTCM: ${e}`);
//     }
//   };

//   const handleSave = () => {
//     uiLogger.log('Save Configuration clicked', 'ConfigurationScreen', config);
//     updateConfiguration(config);
//     uiLogger.log('Configuration saved', 'ConfigurationScreen');
//     toast.success('Configuration saved successfully');
//   };

//   const handleReset = () => {
//     uiLogger.log('Reset Configuration clicked', 'ConfigurationScreen');
//     setConfig(configuration);
//     toast.info('Configuration reset to defaults');
//   };

//   const handleStartStopNTRIP = async () => {
//     if (streams.ntrip.active) {
//       // Stop NTRIP
//       try {
//         uiLogger.log('Stop NTRIP Connection clicked', 'ConfigurationScreen');
//         await stopNTRIP();
//         toast.success('NTRIP connection stopped');
//       } catch (error) {
//         const errorMsg = error instanceof Error ? error.message : String(error);
//         uiLogger.log('Stop NTRIP Failed', 'ConfigurationScreen', undefined, errorMsg);
//         toast.error(`Failed to stop NTRIP: ${errorMsg}`);
//       }
//     } else {
//       // Start NTRIP
//       try {
//         uiLogger.log('Start NTRIP Connection clicked', 'ConfigurationScreen', {
//           server: config.streams.ntrip.server,
//           port: config.streams.ntrip.port,
//           mountpoint: config.streams.ntrip.mountpoint,
//         });

//         await startNTRIP(
//           config.streams.ntrip.server,
//           config.streams.ntrip.port,
//           config.streams.ntrip.mountpoint,
//           config.streams.ntrip.password,
//           config.streams.ntrip.username
//         );

//         toast.success('NTRIP connection started');
//       } catch (error) {
//         const errorMsg = error instanceof Error ? error.message : String(error);
//         uiLogger.log('Start NTRIP Failed', 'ConfigurationScreen', undefined, errorMsg);
//         toast.error(`Failed to start NTRIP: ${errorMsg}`);
//       }
//     }
//   };

//   const loadCurrentSurvey = () => {
//     uiLogger.log('Load Current Survey clicked', 'ConfigurationScreen', {
//       coordinates: survey.position,
//     });
//     setConfig({
//       ...config,
//       baseStation: {
//         ...config.baseStation,
//         fixedMode: {
//           enabled: true,
//           coordinates: survey.position,
//         },
//       },
//     });
//     toast.success('Loaded coordinates from current survey');
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold mb-2">Configuration</h1>
//         <p className="text-slate-600 dark:text-slate-400">
//           Configure base station operational parameters
//         </p>
//       </div>

//       <div className="space-y-6">
//         <Accordion type="multiple" defaultValue={['base-station', 'ntrip-sender']} className="w-full space-y-4">
//           {/* Base Station Settings */}
//           <AccordionItem value="base-station" className="border rounded-lg px-6">
//             <AccordionTrigger className="hover:no-underline">
//               <div className="flex items-center gap-3">
//                 <Settings className="size-5 text-blue-500" />
//                 <div className="text-left">
//                   <div className="font-semibold">Base Station Settings</div>
//                   <div className="text-sm text-slate-600 dark:text-slate-400">
//                     Survey-in and position configuration
//                   </div>
//                 </div>
//               </div>
//             </AccordionTrigger>
//             <AccordionContent className="pt-4 space-y-6">
//               {/* Survey-In Configuration */}
//               <div className="space-y-4">
//                 <h3 className="font-semibold text-sm">Survey-In Configuration</h3>

//                 <div className="space-y-3">
//                   {/* Duration Control */}
//                   <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
//                     <div className="flex items-center justify-between mb-3">
//                       <Label htmlFor="survey-duration" className="text-sm font-semibold">Duration</Label>
//                       <Badge variant="outline" className="font-mono text-xs">
//                         {Math.floor(config.baseStation.surveyDuration / 60)}m {config.baseStation.surveyDuration % 60}s
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-4">
//                       <div className="flex-1">
//                         <Slider
//                           id="survey-duration"
//                           min={30}
//                           max={600}
//                           step={10}
//                           value={[config.baseStation.surveyDuration]}
//                           onValueChange={([value]) =>
//                             setConfig({
//                               ...config,
//                               baseStation: { ...config.baseStation, surveyDuration: value },
//                             })
//                           }
//                         />
//                         <div className="flex justify-between text-[10px] text-slate-400 mt-1">
//                           <span>30s</span>
//                           <span>5m</span>
//                           <span>10m</span>
//                         </div>
//                       </div>
//                       <div className="w-20">
//                         <Input
//                           type="number"
//                           min={30}
//                           max={600}
//                           value={config.baseStation.surveyDuration}
//                           onChange={(e) => {
//                             const v = Math.min(600, Math.max(30, parseInt(e.target.value) || 30));
//                             setConfig({
//                               ...config,
//                               baseStation: { ...config.baseStation, surveyDuration: v },
//                             });
//                           }}
//                           className="h-9 text-center font-mono text-sm"
//                         />
//                         <div className="text-[10px] text-slate-400 text-center mt-0.5">sec</div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Accuracy Threshold Control */}
//                   <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
//                     <div className="flex items-center justify-between mb-3">
//                       <Label htmlFor="accuracy-threshold" className="text-sm font-semibold">Accuracy Threshold</Label>
//                       <Badge variant="outline" className="font-mono text-xs">
//                         {config.baseStation.accuracyThreshold} cm ({(config.baseStation.accuracyThreshold / 100).toFixed(2)} m)
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-4">
//                       <div className="flex-1">
//                         <Slider
//                           id="accuracy-threshold"
//                           min={1}
//                           max={300}
//                           step={1}
//                           value={[config.baseStation.accuracyThreshold]}
//                           onValueChange={([value]) =>
//                             setConfig({
//                               ...config,
//                               baseStation: { ...config.baseStation, accuracyThreshold: value },
//                             })
//                           }
//                         />
//                         <div className="flex justify-between text-[10px] text-slate-400 mt-1">
//                           <span>1cm</span>
//                           <span>1.5m</span>
//                           <span>3m</span>
//                         </div>
//                       </div>
//                       <div className="w-20">
//                         <Input
//                           type="number"
//                           min={1}
//                           max={300}
//                           value={config.baseStation.accuracyThreshold}
//                           onChange={(e) => {
//                             const v = Math.min(300, Math.max(1, parseInt(e.target.value) || 1));
//                             setConfig({
//                               ...config,
//                               baseStation: { ...config.baseStation, accuracyThreshold: v },
//                             });
//                           }}
//                           className="h-9 text-center font-mono text-sm"
//                         />
//                         <div className="text-[10px] text-slate-400 text-center mt-0.5">cm</div>
//                       </div>
//                     </div>
//                   </div>


//                   <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
//                     <div>
//                       <Label htmlFor="auto-mode">Automatic Start on Boot</Label>
//                       <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
//                         Starts Survey automatically, stop survey <br /> when target accuracy is reached
//                       </p>
//                     </div>
//                     <Switch
//                       id="auto-mode"
//                       checked={config.baseStation.autoMode}
//                       onCheckedChange={async (checked) => {
//                         setConfig({
//                           ...config,
//                           baseStation: { ...config.baseStation, autoMode: checked },
//                         });
//                         try {
//                           if (checked) {
//                             await api.enableAutoFlow({
//                               msm_type: 'MSM4',
//                               min_duration_sec: config.baseStation.surveyDuration,
//                               accuracy_limit_m: config.baseStation.accuracyThreshold / 100,
//                               ntrip_host: config.streams.ntrip.server,
//                               ntrip_port: config.streams.ntrip.port,
//                               ntrip_mountpoint: config.streams.ntrip.mountpoint,
//                               ntrip_password: config.streams.ntrip.password,
//                               ntrip_username: config.streams.ntrip.username,
//                             });
//                             toast.success('Auto mode enabled');
//                           } else {
//                             await api.disableAutoFlow();
//                             toast.success('Auto mode disabled');
//                           }
//                         } catch (e) {
//                           // Rollback on failure
//                           setConfig(prev => ({
//                             ...prev,
//                             baseStation: { ...prev.baseStation, autoMode: !checked },
//                           }));
//                           toast.error(`Failed to ${checked ? 'enable' : 'disable'} auto mode: ${e}`);
//                         }
//                       }}
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Fixed Position Mode */}
//               <div className="space-y-4 pt-4 border-t">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="font-semibold text-sm">Fixed Position Mode</h3>
//                     <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
//                       Use known coordinates instead of survey-in
//                     </p>
//                   </div>
//                   <Switch
//                     checked={config.baseStation.fixedMode.enabled}
//                     onCheckedChange={(checked) =>
//                       setConfig({
//                         ...config,
//                         baseStation: {
//                           ...config.baseStation,
//                           fixedMode: { ...config.baseStation.fixedMode, enabled: checked },
//                         },
//                       })
//                     }
//                   />
//                 </div>

//                 {config.baseStation.fixedMode.enabled && (
//                   <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
//                     <div>
//                       <Label htmlFor="fixed-lat">Latitude (8 decimals)</Label>
//                       <Input
//                         id="fixed-lat"
//                         type="number"
//                         step="0.00000001"
//                         value={config.baseStation.fixedMode.coordinates.latitude}
//                         onChange={(e) =>
//                           setConfig({
//                             ...config,
//                             baseStation: {
//                               ...config.baseStation,
//                               fixedMode: {
//                                 ...config.baseStation.fixedMode,
//                                 coordinates: {
//                                   ...config.baseStation.fixedMode.coordinates,
//                                   latitude: parseFloat(e.target.value) || 0,
//                                 },
//                               },
//                             },
//                           })
//                         }
//                         className="font-mono"
//                       />
//                     </div>

//                     <div>
//                       <Label htmlFor="fixed-lon">Longitude (8 decimals)</Label>
//                       <Input
//                         id="fixed-lon"
//                         type="number"
//                         step="0.00000001"
//                         value={config.baseStation.fixedMode.coordinates.longitude}
//                         onChange={(e) =>
//                           setConfig({
//                             ...config,
//                             baseStation: {
//                               ...config.baseStation,
//                               fixedMode: {
//                                 ...config.baseStation.fixedMode,
//                                 coordinates: {
//                                   ...config.baseStation.fixedMode.coordinates,
//                                   longitude: parseFloat(e.target.value) || 0,
//                                 },
//                               },
//                             },
//                           })
//                         }
//                         className="font-mono"
//                       />
//                     </div>

//                     <div>
//                       <Label htmlFor="fixed-alt">Altitude (meters)</Label>
//                       <Input
//                         id="fixed-alt"
//                         type="number"
//                         step="0.001"
//                         value={config.baseStation.fixedMode.coordinates.altitude}
//                         onChange={(e) =>
//                           setConfig({
//                             ...config,
//                             baseStation: {
//                               ...config.baseStation,
//                               fixedMode: {
//                                 ...config.baseStation.fixedMode,
//                                 coordinates: {
//                                   ...config.baseStation.fixedMode.coordinates,
//                                   altitude: parseFloat(e.target.value) || 0,
//                                 },
//                               },
//                             },
//                           })
//                         }
//                         className="font-mono"
//                       />
//                     </div>

//                     <Button variant="outline" className="w-full" onClick={loadCurrentSurvey}>
//                       Load from Current Survey
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             </AccordionContent>
//           </AccordionItem>

//           {/* NTRIP Sender Settings */}
//           <AccordionItem value="ntrip-sender" className="border rounded-lg px-6">
//             <AccordionTrigger className="hover:no-underline">
//               <div className="flex items-center gap-3">
//                 <Send className="size-5 text-green-500" />
//                 <div className="text-left">
//                   <div className="font-semibold">NTRIP Sender Settings</div>
//                   <div className="text-sm text-slate-600 dark:text-slate-400">
//                     Cast corrections to NTRIP caster
//                   </div>
//                 </div>
//               </div>
//             </AccordionTrigger>
//             <AccordionContent className="pt-4 space-y-4">
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="ntrip-sender-server">Server Address</Label>
//                   <Input
//                     id="ntrip-sender-server"
//                     value={config.streams.ntrip.server}
//                     onChange={(e) =>
//                       setConfig({
//                         ...config,
//                         streams: {
//                           ...config.streams,
//                           ntrip: { ...config.streams.ntrip, server: e.target.value },
//                         },
//                       })
//                     }
//                     placeholder=""
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="ntrip-sender-port">Port</Label>
//                   <Input
//                     id="ntrip-sender-port"
//                     type="number"
//                     value={config.streams.ntrip.port}
//                     onChange={(e) =>
//                       setConfig({
//                         ...config,
//                         streams: {
//                           ...config.streams,
//                           ntrip: { ...config.streams.ntrip, port: parseInt(e.target.value) || 2101 },
//                         },
//                       })
//                     }
//                   />
//                 </div>
//               </div>

//               <div>
//                 <Label htmlFor="ntrip-sender-mountpoint">Mountpoint Name</Label>
//                 <Input
//                   id="ntrip-sender-mountpoint"
//                   value={config.streams.ntrip.mountpoint}
//                   onChange={(e) =>
//                     setConfig({
//                       ...config,
//                       streams: {
//                         ...config.streams,
//                         ntrip: { ...config.streams.ntrip, mountpoint: e.target.value },
//                       },
//                     })
//                   }
//                   placeholder=""
//                 />
//               </div>

//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="ntrip-sender-username">Username</Label>
//                   <Input
//                     id="ntrip-sender-username"
//                     value={config.streams.ntrip.username || ""}
//                     onChange={(e) =>
//                       setConfig({
//                         ...config,
//                         streams: {
//                           ...config.streams,
//                           ntrip: { ...config.streams.ntrip, username: e.target.value },
//                         },
//                       })
//                     }
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="ntrip-sender-password">Password</Label>
//                   <div className="relative">
//                     <Input
//                       id="ntrip-sender-password"
//                       type={showPasswords.ntrip ? 'text' : 'password'}
//                       value={config.streams.ntrip.password}
//                       onChange={(e) =>
//                         setConfig({
//                           ...config,
//                           streams: {
//                             ...config.streams,
//                             ntrip: { ...config.streams.ntrip, password: e.target.value },
//                           },
//                         })
//                       }
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPasswords({ ...showPasswords, ntrip: !showPasswords.ntrip })}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                     >
//                       {showPasswords.ntrip ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 {/* NTRIP Status Display */}
//                 {streams.ntrip.enabled && (
//                   <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-2">
//                     <h4 className="font-semibold text-sm">NTRIP Status</h4>
//                     <div className="grid grid-cols-2 gap-4 text-sm">
//                       <div>
//                         <span className="font-medium">Status:</span>
//                         <Badge variant={streams.ntrip.active ? "default" : "secondary"} className="ml-2">
//                           {streams.ntrip.active ? "Connected" : "Disconnected"}
//                         </Badge>
//                       </div>
//                       <div>
//                         <span className="font-medium">Host:</span>
//                         <span className="ml-2 font-mono">{config.streams.ntrip.server}:{config.streams.ntrip.port}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium">Mountpoint:</span>
//                         <span className="ml-2 font-mono">{streams.ntrip.mountpoint || config.streams.ntrip.mountpoint}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium">Data Sent:</span>
//                         <span className="ml-2">{(streams.ntrip.dataSent / 1024).toFixed(2)} KB</span>
//                       </div>
//                       <div>
//                         <span className="font-medium">Uptime:</span>
//                         <span className="ml-2">{Math.floor(streams.ntrip.uptime / 60)}m {streams.ntrip.uptime % 60}s</span>
//                       </div>
//                       <div>
//                         <span className="font-medium">Data Rate:</span>
//                         <span className="ml-2">{(streams.ntrip.throughput / 1024).toFixed(2)} KB/s</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Connection Control Button */}
//                 <Button
//                   variant={streams.ntrip.active ? "destructive" : "default"}
//                   className="w-full"
//                   onClick={handleStartStopNTRIP}
//                   disabled={!config.streams.ntrip.server || !config.streams.ntrip.mountpoint || !config.streams.ntrip.password}
//                 >
//                   {streams.ntrip.active ? "Stop Connection" : "Start Connection"}
//                 </Button>

//                 {!config.streams.ntrip.server && (
//                   <p className="text-xs text-amber-600 dark:text-amber-400">
//                     Server address is required
//                   </p>
//                 )}
//                 {!config.streams.ntrip.mountpoint && (
//                   <p className="text-xs text-amber-600 dark:text-amber-400">
//                     Mountpoint is required
//                   </p>
//                 )}
//                 {!config.streams.ntrip.password && (
//                   <p className="text-xs text-amber-600 dark:text-amber-400">
//                     Password is required
//                   </p>
//                 )}
//               </div>
//             </AccordionContent>
//           </AccordionItem>

//           {/* NTRIP Receiver Settings */}
//           <AccordionItem value="ntrip-receiver" className="border rounded-lg px-6">
//             <AccordionTrigger className="hover:no-underline">
//               <div className="flex items-center gap-3">
//                 <Radio className="size-5 text-blue-500" />
//                 <div className="text-left">
//                   <div className="font-semibold">NTRIP Receiver Settings</div>
//                   <div className="text-sm text-slate-600 dark:text-slate-400">
//                     Receive corrections from NTRIP caster
//                   </div>
//                 </div>
//               </div>
//             </AccordionTrigger>
//             <AccordionContent className="pt-4 space-y-4">
//               <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
//                 <p className="text-sm text-amber-800 dark:text-amber-200">
//                   ℹ️ NTRIP Receiver functionality coming soon. Currently, the base station sends RTK corrections via NTRIP Sender.
//                 </p>
//               </div>
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="ntrip-receiver-server">Server Address</Label>
//                   <Input
//                     id="ntrip-receiver-server"
//                     disabled
//                     value={config.streams.ntrip.server}
//                     placeholder="caster.emlid.com"
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="ntrip-receiver-port">Port</Label>
//                   <Input
//                     id="ntrip-receiver-port"
//                     type="number"
//                     disabled
//                     value={config.streams.ntrip.port}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <Label htmlFor="ntrip-receiver-mountpoint">Mountpoint Name</Label>
//                 <Input
//                   id="ntrip-receiver-mountpoint"
//                   disabled
//                   value={config.streams.ntrip.mountpoint}
//                   placeholder="EMLID_RECV"
//                 />
//               </div>
//             </AccordionContent>
//           </AccordionItem>

//           {/* Serial Output */}
//           <AccordionItem value="serial" className="border rounded-lg px-6">
//             <AccordionTrigger className="hover:no-underline">
//               <div className="flex items-center gap-3">
//                 <Radio className="size-5 text-blue-500" />
//                 <div className="text-left">
//                   <div className="font-semibold">Serial Output</div>
//                   <div className="text-sm text-slate-600 dark:text-slate-400">
//                     Serial port configuration
//                   </div>
//                 </div>
//               </div>
//             </AccordionTrigger>

//             <AccordionContent className="pt-4 space-y-4">
//               {/* Baud Rate Selection */}
//               <div>
//                 <Label htmlFor="serial-baud">Baud Rate</Label>
//                 <Select
//                   value={config.streams.serial.baudRate.toString()}
//                   onValueChange={(value) =>
//                     setConfig({
//                       ...config,
//                       streams: {
//                         ...config.streams,
//                         serial: { ...config.streams.serial, baudRate: parseInt(value) },
//                       },
//                     })
//                   }
//                 >
//                   <SelectTrigger id="serial-baud" className="mt-1">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="9600">9600</SelectItem>
//                     <SelectItem value="19200">19200</SelectItem>
//                     <SelectItem value="38400">38400</SelectItem>
//                     <SelectItem value="57600">57600</SelectItem>
//                     <SelectItem value="115200">115200</SelectItem>
//                     <SelectItem value="230400">230400</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* RTCM3 Messages Configuration */}
//               <div>
//                 <Label>RTCM3 Messages</Label>

//                 {/* MSM4 / MSM7 Toggle */}
//                 <div className="flex gap-2 mt-3 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
//                   <button
//                     onClick={() => handleMsmTypeChange('MSM4')}
//                     className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeMsgType === 'MSM4'
//                       ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
//                       : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
//                       }`}
//                   >
//                     MSM4
//                   </button>
//                   <button
//                     onClick={() => handleMsmTypeChange('MSM7')}
//                     className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeMsgType === 'MSM7'
//                       ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
//                       : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
//                       }`}
//                   >
//                     MSM7
//                   </button>
//                 </div>

//                 {/* Dynamic Message List — ticked = backend is actively streaming that message */}
//                 {rtcmLoading ? (
//                   <div className="text-sm text-slate-500 dark:text-slate-400 py-2">Loading RTCM status…</div>
//                 ) : (
//                   <div className="space-y-3">
//                     {(activeMsgType === 'MSM4'
//                       ? [
//                         { id: '1005', name: '1005 (Station Position)' },
//                         { id: '1074', name: '1074 (GPS MSM4)' },
//                         { id: '1084', name: '1084 (GLONASS MSM4)' },
//                         { id: '1094', name: '1094 (Galileo MSM4)' },
//                         { id: '1124', name: '1124 (BeiDou MSM4)' },
//                         { id: '1230', name: '1230 (GLONASS Biases)' },
//                       ]
//                       : [
//                         { id: '1005', name: '1005 (Station Position)' },
//                         { id: '1077', name: '1077 (GPS MSM7)' },
//                         { id: '1087', name: '1087 (GLONASS MSM7)' },
//                         { id: '1097', name: '1097 (Galileo MSM7)' },
//                         { id: '1127', name: '1127 (BeiDou MSM7)' },
//                         { id: '1230', name: '1230 (GLONASS Biases)' },
//                       ]
//                     ).map((msg) => {
//                       const isActive = rtcmActiveMessages.includes(msg.id);
//                       return (
//                         <div key={msg.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isActive
//                           ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
//                           : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
//                           }`}>
//                           <input
//                             type="checkbox"
//                             id={`msg-${msg.id}`}
//                             className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                             checked={isActive}
//                             readOnly
//                           />
//                           <label htmlFor={`msg-${msg.id}`} className="flex-1 text-sm font-medium select-none">
//                             {msg.name}
//                           </label>
//                           {isActive && (
//                             <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
//                               streaming
//                             </span>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             </AccordionContent>
//           </AccordionItem>

//           {/* TCP Server */}
//           <AccordionItem value="tcp" className="border rounded-lg px-6">
//             <AccordionTrigger className="hover:no-underline">
//               <div className="flex items-center gap-3">
//                 <Server className="size-5 text-blue-500" />
//                 <div className="text-left">
//                   <div className="font-semibold">TCP Server</div>
//                   <div className="text-sm text-slate-600 dark:text-slate-400">
//                     TCP socket server settings
//                   </div>
//                 </div>
//               </div>
//             </AccordionTrigger>
//             <AccordionContent className="pt-4 space-y-4">
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="tcp-port">Port Number</Label>
//                   <Input
//                     id="tcp-port"
//                     type="number"
//                     value={config.streams.tcp.port}
//                     onChange={(e) =>
//                       setConfig({
//                         ...config,
//                         streams: {
//                           ...config.streams,
//                           tcp: { ...config.streams.tcp, port: parseInt(e.target.value) || 9000 },
//                         },
//                       })
//                     }
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="tcp-max-clients">Max Clients</Label>
//                   <Input
//                     id="tcp-max-clients"
//                     type="number"
//                     min="1"
//                     max="10"
//                     value={config.streams.tcp.maxClients}
//                     onChange={(e) =>
//                       setConfig({
//                         ...config,
//                         streams: {
//                           ...config.streams,
//                           tcp: { ...config.streams.tcp, maxClients: parseInt(e.target.value) || 5 },
//                         },
//                       })
//                     }
//                   />
//                 </div>
//               </div>

//               <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
//                 <Label htmlFor="tcp-auth">Require Authentication</Label>
//                 <Switch
//                   id="tcp-auth"
//                   checked={config.streams.tcp.authEnabled}
//                   onCheckedChange={(checked) =>
//                     setConfig({
//                       ...config,
//                       streams: {
//                         ...config.streams,
//                         tcp: { ...config.streams.tcp, authEnabled: checked },
//                       },
//                     })
//                   }
//                 />
//               </div>
//             </AccordionContent>
//           </AccordionItem>

//           {/* UDP Broadcast */}
//           <AccordionItem value="udp" className="border rounded-lg px-6">
//             <AccordionTrigger className="hover:no-underline">
//               <div className="flex items-center gap-3">
//                 <Send className="size-5 text-blue-500" />
//                 <div className="text-left">
//                   <div className="font-semibold">UDP Broadcast</div>
//                   <div className="text-sm text-slate-600 dark:text-slate-400">
//                     UDP broadcast configuration
//                   </div>
//                 </div>
//               </div>
//             </AccordionTrigger>
//             <AccordionContent className="pt-4 space-y-4">
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="udp-port">Port Number</Label>
//                   <Input
//                     id="udp-port"
//                     type="number"
//                     value={config.streams.udp.port}
//                     onChange={(e) =>
//                       setConfig({
//                         ...config,
//                         streams: {
//                           ...config.streams,
//                           udp: { ...config.streams.udp, port: parseInt(e.target.value) || 9001 },
//                         },
//                       })
//                     }
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="udp-address">Broadcast Address</Label>
//                   <Input
//                     id="udp-address"
//                     value={config.streams.udp.broadcastAddress}
//                     onChange={(e) =>
//                       setConfig({
//                         ...config,
//                         streams: {
//                           ...config.streams,
//                           udp: { ...config.streams.udp, broadcastAddress: e.target.value },
//                         },
//                       })
//                     }
//                     placeholder="255.255.255.255"
//                   />
//                 </div>
//               </div>

//               <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
//                 <Label htmlFor="udp-multicast">Enable Multicast</Label>
//                 <Switch
//                   id="udp-multicast"
//                   checked={config.streams.udp.multicast}
//                   onCheckedChange={(checked) =>
//                     setConfig({
//                       ...config,
//                       streams: {
//                         ...config.streams,
//                         udp: { ...config.streams.udp, multicast: checked },
//                       },
//                     })
//                   }
//                 />
//               </div>
//             </AccordionContent>
//           </AccordionItem>

//           {/* System Settings */}
//           <AccordionItem value="system" className="border rounded-lg px-6">
//             <AccordionTrigger className="hover:no-underline">
//               <div className="flex items-center gap-3">
//                 <Settings className="size-5 text-blue-500" />
//                 <div className="text-left">
//                   <div className="font-semibold">System Settings</div>
//                   <div className="text-sm text-slate-600 dark:text-slate-400">
//                     WiFi and display configuration
//                   </div>
//                 </div>
//               </div>
//             </AccordionTrigger>
//             <AccordionContent className="pt-4 space-y-4">
//               <div className="space-y-4">
//                 <h3 className="font-semibold text-sm">WiFi Hotspot</h3>
//                 <div>
//                   <Label htmlFor="wifi-ssid">SSID Name</Label>
//                   <Input
//                     id="wifi-ssid"
//                     value={config.system.wifiSsid}
//                     onChange={(e) =>
//                       setConfig({
//                         ...config,
//                         system: { ...config.system, wifiSsid: e.target.value },
//                       })
//                     }
//                     placeholder="GNSS_BASE_XXXX"
//                   />
//                   <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
//                     8-32 alphanumeric characters
//                   </p>
//                 </div>

//                 <div>
//                   <Label htmlFor="wifi-password">Password</Label>
//                   <div className="relative">
//                     <Input
//                       id="wifi-password"
//                       type={showPasswords.wifi ? 'text' : 'password'}
//                       value={config.system.wifiPassword}
//                       onChange={(e) =>
//                         setConfig({
//                           ...config,
//                           system: { ...config.system, wifiPassword: e.target.value },
//                         })
//                       }
//                       placeholder="Minimum 8 characters"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPasswords({ ...showPasswords, wifi: !showPasswords.wifi })}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                     >
//                       {showPasswords.wifi ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-4 pt-4 border-t">
//                 <h3 className="font-semibold text-sm">LED Display</h3>
//                 <div>
//                   <Label htmlFor="led-mode">Display Mode</Label>
//                   <Select
//                     value={config.system.ledMode}
//                     onValueChange={(value) =>
//                       setConfig({
//                         ...config,
//                         system: { ...config.system, ledMode: value },
//                       })
//                     }
//                   >
//                     <SelectTrigger id="led-mode">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="status">Status</SelectItem>
//                       <SelectItem value="off">Off</SelectItem>
//                       <SelectItem value="always-on">Always On</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <div className="flex justify-between items-center mb-2">
//                     <Label htmlFor="led-brightness">Brightness</Label>
//                     <span className="text-sm font-mono">{config.system.ledBrightness}%</span>
//                   </div>
//                   <Slider
//                     id="led-brightness"
//                     min={0}
//                     max={100}
//                     step={10}
//                     value={[config.system.ledBrightness]}
//                     onValueChange={([value]) =>
//                       setConfig({
//                         ...config,
//                         system: { ...config.system, ledBrightness: value },
//                       })
//                     }
//                   />
//                 </div>
//               </div>
//             </AccordionContent>
//           </AccordionItem>
//         </Accordion>

//         {/* Action Buttons */}
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex gap-3">
//               <Button onClick={handleSave} className="flex-1 gap-2">
//                 <Save className="size-4" />
//                 Save Configuration
//               </Button>

//               <AlertDialog>
//                 <AlertDialogTrigger asChild>
//                   <Button variant="outline" className="gap-2">
//                     <RotateCcw className="size-4" />
//                     Reset to Defaults
//                   </Button>
//                 </AlertDialogTrigger>
//                 <AlertDialogContent>
//                   <AlertDialogHeader>
//                     <AlertDialogTitle>Reset Configuration?</AlertDialogTitle>
//                     <AlertDialogDescription>
//                       This will reset all settings to their default values. This action cannot be undone.
//                     </AlertDialogDescription>
//                   </AlertDialogHeader>
//                   <AlertDialogFooter>
//                     <AlertDialogCancel>Cancel</AlertDialogCancel>
//                     <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
//                   </AlertDialogFooter>
//                 </AlertDialogContent>
//               </AlertDialog>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };


































// import React, { useState, useEffect } from 'react';
// import { useGNSS } from '../../context/GNSSContext';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
// import { Button } from './ui/button';
// import { Input } from './ui/input';
// import { Label } from './ui/label';
// import { Switch } from './ui/switch';
// import { Slider } from './ui/slider';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// import { Badge } from './ui/badge';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
// import { 
//   Save, 
//   RotateCcw, 
//   Wifi, 
//   Eye, 
//   EyeOff,
//   Target,
//   Activity,
//   Cpu,
//   MapPin,
//   Radio,
//   Globe,
//   Upload,
//   Download,
//   Terminal
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { uiLogger } from '../../utils/uiLogger';
// import { api } from '../../api/gnssApi';

// export const ConfigurationScreen: React.FC = () => {
//   const { configuration, updateConfiguration, survey, streams, gnssStatus, startNTRIP, stopNTRIP } = useGNSS();
//   const [config, setConfig] = useState(configuration);
//   const [activeMsgType, setActiveMsgType] = useState<'MSM4' | 'MSM7'>('MSM4');
//   const [rtcmActiveMessages, setRtcmActiveMessages] = useState<string[]>([]);
//   const [rtcmLoading, setRtcmLoading] = useState(true);
  
//   const [rtcmHzRates, setRtcmHzRates] = useState<Record<string, string>>({});

//   const [showPasswords, setShowPasswords] = useState({
//     wifi: false,
//     ntripSender: false,
//     ntripReceiver: false,
//   });

//   const [receiverConfig, setReceiverConfig] = useState({
//     server: "caster.example.com",
//     port: 2101,
//     mountpoint: "VRS_RTCM3",
//     username: "",
//     password: "",
//     active: false,
//     throughput: 0,
//     dataReceived: 0,
//     uptime: 0
//   });

//   useEffect(() => {
//     api.getRTCM()
//       .then((status) => {
//         if (status.msm_type === 'MSM4' || status.msm_type === 'MSM7') {
//           setActiveMsgType(status.msm_type);
//         }
//         const activeIds = Object.keys(status.message_counts ?? {}).filter(
//           (id) => (status.message_counts[id] ?? 0) > 0
//         );
//         setRtcmActiveMessages(activeIds);

//         const initialRates: Record<string, string> = {};
//         activeIds.forEach(id => {
//           initialRates[id] = "1"; 
//         });
//         setRtcmHzRates(initialRates);
//       })
//       .catch((e) => console.warn('RTCM status fetch failed:', e))
//       .finally(() => setRtcmLoading(false));

//     api.getAutoFlowConfig()
//       .then((cfg) => {
//         if (typeof cfg.enabled === 'boolean') {
//           setConfig(prev => ({
//             ...prev,
//             baseStation: { ...prev.baseStation, autoMode: cfg.enabled },
//           }));
//         }
//       })
//       .catch((e) => console.warn('Autoflow config fetch failed:', e));
//   }, []);

//   const handleMsmTypeChange = async (type: 'MSM4' | 'MSM7') => {
//     setActiveMsgType(type);
//     try {
//       await api.configureRTCM(type);
//       toast.success(`Switched to ${type}`);
//     } catch (e) {
//       toast.error(`Failed to configure RTCM: ${e}`);
//     }
//   };

//   const handleHzChange = (msgId: string, hz: string) => {
//     setRtcmHzRates(prev => ({ ...prev, [msgId]: hz }));
//     toast.success(`Message ${msgId} set to ${hz} Hz`);
//   };

//   const handleSave = async () => {
//     uiLogger.log('Save Configuration clicked', 'ConfigurationScreen', config);
    
//     try {
//       if (config.baseStation.autoMode) {
//         await api.enableAutoFlow({
//           msm_type: activeMsgType, 
//           min_duration_sec: config.baseStation.surveyDuration,
//           accuracy_limit_m: config.baseStation.accuracyThreshold / 100,
//           ntrip_host: config.streams.ntrip.server,
//           ntrip_port: config.streams.ntrip.port,
//           ntrip_mountpoint: config.streams.ntrip.mountpoint,
//           ntrip_password: config.streams.ntrip.password,
//           ntrip_username: config.streams.ntrip.username,
//         });
//       } else {
//         await api.disableAutoFlow();
//       }

//       updateConfiguration(config); 
//       uiLogger.log('Configuration saved', 'ConfigurationScreen');
//       toast.success('Configuration saved successfully');

//     } catch (e) {
//       toast.error(`Failed to save configuration: ${e}`);
//     }
//   };

//   const handleReset = () => {
//     uiLogger.log('Reset Configuration clicked', 'ConfigurationScreen');
//     setConfig(configuration);
//     toast.info('Configuration reset to defaults');
//   };

//   const handleStartStopNTRIP = async () => {
//     if (streams.ntrip.active) {
//       try {
//         await stopNTRIP();
//         toast.success('NTRIP Sender stopped');
//       } catch (error) {
//         toast.error(`Failed to stop NTRIP: ${error}`);
//       }
//     } else {
//       try {
//         await startNTRIP(
//           config.streams.ntrip.server,
//           config.streams.ntrip.port,
//           config.streams.ntrip.mountpoint,
//           config.streams.ntrip.password,
//           config.streams.ntrip.username
//         );
//         toast.success('NTRIP Sender started');
//       } catch (error) {
//         toast.error(`Failed to start NTRIP: ${error}`);
//       }
//     }
//   };

//   const handleStartStopReceiver = () => {
//     if (receiverConfig.active) {
//       setReceiverConfig(prev => ({ ...prev, active: false, throughput: 0, uptime: 0 }));
//       toast.success('NTRIP Receiver stopped');
//     } else {
//       setReceiverConfig(prev => ({ ...prev, active: true, throughput: 4.2, uptime: 1, dataReceived: 102 }));
//       toast.success('NTRIP Receiver started');
//     }
//   };

//   useEffect(() => {
//     let interval: NodeJS.Timeout;
//     if (receiverConfig.active) {
//       interval = setInterval(() => {
//         setReceiverConfig(prev => ({
//           ...prev,
//           uptime: prev.uptime + 1,
//           dataReceived: prev.dataReceived + Math.random() * 5,
//           throughput: 3 + Math.random() * 2
//         }));
//       }, 1000);
//     }
//     return () => clearInterval(interval);
//   }, [receiverConfig.active]);

//   const loadCurrentSurvey = () => {
//     setConfig({
//       ...config,
//       baseStation: {
//         ...config.baseStation,
//         fixedMode: {
//           enabled: true,
//           coordinates: survey.position,
//         },
//       },
//     });
//     toast.success('Loaded coordinates from current survey');
//   };

//   // Shared classes for beautifully unified inputs
//   const inputClasses = "mt-1.5 h-11 text-sm font-medium bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100 shadow-sm";
//   const labelClasses = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
//   const boxClasses = "p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 shadow-sm";

//   return (
//     <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen animate-in fade-in duration-300 pb-24">
      
//       {/* ── Header & Global Actions ── */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-5">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">System Configuration</h1>
//           <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">
//             Configure positioning, telemetry, and system parameters
//           </p>
//         </div>
        
//         <div className="flex items-center gap-3">
//           <AlertDialog>
//             <AlertDialogTrigger asChild>
//               <Button variant="outline" className="h-11 px-5 gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 shadow-sm text-sm font-semibold rounded-lg">
//                 <RotateCcw className="size-4" />
//                 <span className="hidden sm:inline">Reset Defaults</span>
//               </Button>
//             </AlertDialogTrigger>
//             <AlertDialogContent className="dark:bg-slate-900 border dark:border-slate-800 rounded-xl">
//               <AlertDialogHeader>
//                 <AlertDialogTitle className="dark:text-slate-50 text-lg font-bold">Reset Configuration?</AlertDialogTitle>
//                 <AlertDialogDescription className="dark:text-slate-400 text-sm font-medium">
//                   This will reset all settings to their default values. This action cannot be undone.
//                 </AlertDialogDescription>
//               </AlertDialogHeader>
//               <AlertDialogFooter className="gap-2 mt-2">
//                 <AlertDialogCancel className="h-10 border dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800 rounded-lg font-semibold text-sm">Cancel</AlertDialogCancel>
//                 <AlertDialogAction onClick={handleReset} className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm">Reset Settings</AlertDialogAction>
//               </AlertDialogFooter>
//             </AlertDialogContent>
//           </AlertDialog>
          
//           <Button onClick={handleSave} className="h-11 px-6 gap-2 transition-transform active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm font-semibold rounded-lg">
//             <Save className="size-4" />
//             Save Changes
//           </Button>
//         </div>
//       </div>

//       {/* ── Main Layout Grid (2 Columns) ── */}
//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

//         {/* ── LEFT COLUMN ── */}
//         <div className="space-y-6 flex flex-col">

//           {/* Base Station Settings Card */}
//           <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
//             <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 p-5">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
//                   <Target className="size-5" />
//                 </div>
//                 <div>
//                   <CardTitle className="text-lg font-bold dark:text-slate-50">Base Station Positioning</CardTitle>
//                   <CardDescription className="text-xs font-medium mt-0.5 dark:text-slate-400">Configure Survey-In constraints and operation modes</CardDescription>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent className="p-6 space-y-6">
              
//               <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
//                 <div>
//                   <Label htmlFor="auto-mode" className="text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer">Automatic Flow Mode</Label>
//                   <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
//                     Start survey automatically. Auto-switches to NTRIP cast when target accuracy is reached.
//                   </p>
//                 </div>
//                 <Switch
//                   id="auto-mode"
//                   checked={config.baseStation.autoMode}
//                   onCheckedChange={(checked) => setConfig({ ...config, baseStation: { ...config.baseStation, autoMode: checked } })}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                 {/* Duration */}
//                 <div className={boxClasses}>
//                   <div className="flex items-center justify-between mb-5">
//                     <Label htmlFor="survey-duration" className={labelClasses}>Min Duration</Label>
//                     <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
//                       {Math.floor(config.baseStation.surveyDuration / 60)}m {config.baseStation.surveyDuration % 60}s
//                     </Badge>
//                   </div>
//                   <div className="space-y-4">
//                     <Slider
//                       id="survey-duration"
//                       min={30} max={600} step={10}
//                       className="py-1"
//                       value={[config.baseStation.surveyDuration]}
//                       onValueChange={([value]) => setConfig({ ...config, baseStation: { ...config.baseStation, surveyDuration: value } })}
//                     />
//                     <div className="relative">
//                       <Input
//                         type="number" min={30} max={600}
//                         value={config.baseStation.surveyDuration}
//                         onChange={(e) => {
//                           const v = Math.min(600, Math.max(30, parseInt(e.target.value) || 30));
//                           setConfig({ ...config, baseStation: { ...config.baseStation, surveyDuration: v } });
//                         }}
//                         className={`${inputClasses} pr-10 font-mono text-sm text-center`}
//                       />
//                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold uppercase mt-0.5">sec</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Accuracy */}
//                 <div className={boxClasses}>
//                   <div className="flex items-center justify-between mb-5">
//                     <Label htmlFor="accuracy-threshold" className={labelClasses}>Target Accuracy</Label>
//                     <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
//                       {(config.baseStation.accuracyThreshold / 100).toFixed(2)} m
//                     </Badge>
//                   </div>
//                   <div className="space-y-4">
//                     <Slider
//                       id="accuracy-threshold"
//                       min={1} max={300} step={1}
//                       className="py-1"
//                       value={[config.baseStation.accuracyThreshold]}
//                       onValueChange={([value]) => setConfig({ ...config, baseStation: { ...config.baseStation, accuracyThreshold: value } })}
//                     />
//                     <div className="relative">
//                       <Input
//                         type="number" min={1} max={300}
//                         value={config.baseStation.accuracyThreshold}
//                         onChange={(e) => {
//                           const v = Math.min(300, Math.max(1, parseInt(e.target.value) || 1));
//                           setConfig({ ...config, baseStation: { ...config.baseStation, accuracyThreshold: v } });
//                         }}
//                         className={`${inputClasses} pr-10 font-mono text-sm text-center`}
//                       />
//                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold uppercase mt-0.5">cm</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Fixed Position Sub-Card */}
//               <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 overflow-hidden shadow-sm">
//                 <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50">
//                   <div>
//                     <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Fixed Position Override</h3>
//                     <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Use precise known coordinates instead of surveying.</p>
//                   </div>
//                   <Switch
//                     checked={config.baseStation.fixedMode.enabled}
//                     onCheckedChange={(checked) =>
//                       setConfig({ ...config, baseStation: { ...config.baseStation, fixedMode: { ...config.baseStation.fixedMode, enabled: checked } } })
//                     }
//                   />
//                 </div>
                
//                 {config.baseStation.fixedMode.enabled && (
//                   <div className="p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
//                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                       <div>
//                         <Label htmlFor="fixed-lat" className={labelClasses}>Latitude</Label>
//                         <Input
//                           id="fixed-lat" type="number" step="0.00000001"
//                           value={config.baseStation.fixedMode.coordinates.latitude}
//                           onChange={(e) => setConfig({ ...config, baseStation: { ...config.baseStation, fixedMode: { ...config.baseStation.fixedMode, coordinates: { ...config.baseStation.fixedMode.coordinates, latitude: parseFloat(e.target.value) || 0 } } } })}
//                           className={`${inputClasses} font-mono`}
//                         />
//                       </div>
//                       <div>
//                         <Label htmlFor="fixed-lon" className={labelClasses}>Longitude</Label>
//                         <Input
//                           id="fixed-lon" type="number" step="0.00000001"
//                           value={config.baseStation.fixedMode.coordinates.longitude}
//                           onChange={(e) => setConfig({ ...config, baseStation: { ...config.baseStation, fixedMode: { ...config.baseStation.fixedMode, coordinates: { ...config.baseStation.fixedMode.coordinates, longitude: parseFloat(e.target.value) || 0 } } } })}
//                           className={`${inputClasses} font-mono`}
//                         />
//                       </div>
//                       <div>
//                         <Label htmlFor="fixed-alt" className={labelClasses}>Altitude (m)</Label>
//                         <Input
//                           id="fixed-alt" type="number" step="0.001"
//                           value={config.baseStation.fixedMode.coordinates.altitude}
//                           onChange={(e) => setConfig({ ...config, baseStation: { ...config.baseStation, fixedMode: { ...config.baseStation.fixedMode, coordinates: { ...config.baseStation.fixedMode.coordinates, altitude: parseFloat(e.target.value) || 0 } } } })}
//                           className={`${inputClasses} font-mono`}
//                         />
//                       </div>
//                     </div>
//                     <Button variant="outline" className="w-full gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors active:scale-95 font-semibold h-10 rounded-lg text-xs tracking-wide bg-white dark:bg-slate-900" onClick={loadCurrentSurvey}>
//                       <MapPin className="size-4 text-blue-500" />
//                       LOAD CURRENT POSITION
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           {/* NTRIP Configuration Card */}
//           <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden flex flex-col flex-1">
//             <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 p-5">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
//                   <Globe className="size-5" />
//                 </div>
//                 <div>
//                   <CardTitle className="text-base font-semibold dark:text-slate-50">NTRIP Configuration</CardTitle>
//                   <CardDescription className="text-xs font-normal mt-0.5 dark:text-slate-400">Manage Caster network connections</CardDescription>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent className="p-0 flex-1 flex flex-col">
//               <Tabs defaultValue="sender" className="w-full h-full flex flex-col">
//                 <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
//                   <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-950/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800/60 h-11">
//                     <TabsTrigger value="sender" className="flex items-center justify-center text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">
//                       <Upload className="size-3.5 mr-2 opacity-70" /> SENDER
//                     </TabsTrigger>
//                     <TabsTrigger value="receiver" className="flex items-center justify-center text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">
//                       <Download className="size-3.5 mr-2 opacity-70" /> RECEIVER
//                     </TabsTrigger>
//                   </TabsList>
//                 </div>

//                 {/* SENDER TAB */}
//                 <TabsContent value="sender" className="p-6 m-0 space-y-6 flex-1 flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
//                   {streams.ntrip.active && (
//                     <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 animate-in fade-in">
//                       <div>
//                         <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Data Rate</div>
//                         <div className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-400">{(streams.ntrip.throughput / 1024).toFixed(2)} <span className="text-xs font-medium">KB/s</span></div>
//                       </div>
//                       <div>
//                         <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Total Sent</div>
//                         <div className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-400">{(streams.ntrip.dataSent / 1024).toFixed(1)} <span className="text-xs font-medium">KB</span></div>
//                       </div>
//                       <div>
//                         <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Uptime</div>
//                         <div className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-400">{Math.floor(streams.ntrip.uptime / 60)}m {streams.ntrip.uptime % 60}s</div>
//                       </div>
//                       <div>
//                         <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Mountpoint</div>
//                         <div className="text-sm font-semibold font-mono text-emerald-900 dark:text-emerald-400 truncate pr-2 mt-1">{streams.ntrip.mountpoint || config.streams.ntrip.mountpoint}</div>
//                       </div>
//                     </div>
//                   )}

//                   <div className="space-y-4 flex-1">
//                     <div>
//                       <Label htmlFor="ntrip-server" className={labelClasses}>Caster Host</Label>
//                       <Input id="ntrip-server" value={config.streams.ntrip.server} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, server: e.target.value } } })} className={`${inputClasses} font-mono`} />
//                     </div>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <Label htmlFor="ntrip-port" className={labelClasses}>Port</Label>
//                         <Input id="ntrip-port" type="number" value={config.streams.ntrip.port} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, port: parseInt(e.target.value) || 2101 } } })} className={`${inputClasses} font-mono`} />
//                       </div>
//                       <div>
//                         <Label htmlFor="ntrip-mountpoint" className={labelClasses}>Mountpoint</Label>
//                         <Input id="ntrip-mountpoint" value={config.streams.ntrip.mountpoint} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, mountpoint: e.target.value } } })} className={`${inputClasses} font-mono`} />
//                       </div>
//                     </div>
//                     <div>
//                       <Label htmlFor="ntrip-user" className={labelClasses}>Username</Label>
//                       <Input id="ntrip-user" value={config.streams.ntrip.username || ""} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, username: e.target.value } } })} className={inputClasses} />
//                     </div>
//                     <div>
//                       <Label htmlFor="ntrip-pass" className={labelClasses}>Password</Label>
//                       <div className="relative">
//                         <Input id="ntrip-pass" type={showPasswords.ntripSender ? 'text' : 'password'} value={config.streams.ntrip.password} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, password: e.target.value } } })} className={`${inputClasses} pr-10`} />
//                         <button type="button" onClick={() => setShowPasswords({ ...showPasswords, ntripSender: !showPasswords.ntripSender })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors p-1">
//                           {showPasswords.ntripSender ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   <Button
//                     variant={streams.ntrip.active ? "destructive" : "default"}
//                     className={`w-full h-11 rounded-lg text-sm font-bold tracking-wide transition-transform active:scale-95 shadow-sm ${streams.ntrip.active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
//                     onClick={handleStartStopNTRIP}
//                     disabled={!config.streams.ntrip.server || !config.streams.ntrip.mountpoint || !config.streams.ntrip.password}
//                   >
//                     {streams.ntrip.active ? "STOP SENDER" : "START SENDER"}
//                   </Button>
//                 </TabsContent>

//                 {/* RECEIVER TAB */}
//                 <TabsContent value="receiver" className="p-6 m-0 space-y-5 flex-1 flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
//                   {receiverConfig.active && (
//                     <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 animate-in fade-in">
//                       <div>
//                         <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-0.5">Data Rate</div>
//                         <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-400">{receiverConfig.throughput.toFixed(2)} <span className="text-xs font-medium">KB/s</span></div>
//                       </div>
//                       <div>
//                         <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-0.5">Total Recv</div>
//                         <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-400">{receiverConfig.dataReceived.toFixed(1)} <span className="text-xs font-medium">KB</span></div>
//                       </div>
//                       <div>
//                         <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-0.5">Uptime</div>
//                         <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-400">{Math.floor(receiverConfig.uptime / 60)}m {receiverConfig.uptime % 60}s</div>
//                       </div>
//                       <div>
//                         <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-0.5">Mountpoint</div>
//                         <div className="text-sm font-semibold font-mono text-blue-900 dark:text-blue-400 truncate pr-2 mt-1">{receiverConfig.mountpoint}</div>
//                       </div>
//                     </div>
//                   )}

//                   <div className="space-y-4 flex-1">
//                     <div>
//                       <Label htmlFor="ntrip-recv-server" className={labelClasses}>Caster Host</Label>
//                       <Input id="ntrip-recv-server" value={receiverConfig.server} onChange={(e) => setReceiverConfig({ ...receiverConfig, server: e.target.value })} className={`${inputClasses} font-mono`} />
//                     </div>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <Label htmlFor="ntrip-recv-port" className={labelClasses}>Port</Label>
//                         <Input id="ntrip-recv-port" type="number" value={receiverConfig.port} onChange={(e) => setReceiverConfig({ ...receiverConfig, port: parseInt(e.target.value) || 2101 })} className={`${inputClasses} font-mono`} />
//                       </div>
//                       <div>
//                         <Label htmlFor="ntrip-recv-mountpoint" className={labelClasses}>Mountpoint</Label>
//                         <Input id="ntrip-recv-mountpoint" value={receiverConfig.mountpoint} onChange={(e) => setReceiverConfig({ ...receiverConfig, mountpoint: e.target.value })} className={`${inputClasses} font-mono`} />
//                       </div>
//                     </div>
//                     <div>
//                       <Label htmlFor="ntrip-recv-user" className={labelClasses}>Username</Label>
//                       <Input id="ntrip-recv-user" value={receiverConfig.username} onChange={(e) => setReceiverConfig({ ...receiverConfig, username: e.target.value })} className={inputClasses} />
//                     </div>
//                     <div>
//                       <Label htmlFor="ntrip-recv-pass" className={labelClasses}>Password</Label>
//                       <div className="relative">
//                         <Input id="ntrip-recv-pass" type={showPasswords.ntripReceiver ? 'text' : 'password'} value={receiverConfig.password} onChange={(e) => setReceiverConfig({ ...receiverConfig, password: e.target.value })} className={`${inputClasses} pr-10`} />
//                         <button type="button" onClick={() => setShowPasswords({ ...showPasswords, ntripReceiver: !showPasswords.ntripReceiver })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors p-1">
//                           {showPasswords.ntripReceiver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   <Button
//                     variant={receiverConfig.active ? "destructive" : "default"}
//                     className={`w-full h-11 rounded-lg text-sm font-bold tracking-wide transition-transform active:scale-95 shadow-sm ${receiverConfig.active ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
//                     onClick={handleStartStopReceiver}
//                     disabled={!receiverConfig.server || !receiverConfig.mountpoint}
//                   >
//                     {receiverConfig.active ? "STOP RECEIVER" : "START RECEIVER"}
//                   </Button>
//                 </TabsContent>
//               </Tabs>
//             </CardContent>
//           </Card>

//         </div>

//         {/* ── RIGHT COLUMN ── */}
//         <div className="space-y-6 flex flex-col">

//           {/* Telemetry Interfaces Card */}
//           <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
//             <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 p-5">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
//                   <Activity className="size-5" />
//                 </div>
//                 <div>
//                   <CardTitle className="text-base font-semibold dark:text-slate-50">Telemetry Interfaces</CardTitle>
//                   <CardDescription className="text-xs font-medium mt-0.5 dark:text-slate-400">Local data stream endpoints</CardDescription>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent className="p-0">
//               <Tabs defaultValue="serial" className="w-full flex flex-col">
//                 <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
//                   <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-950/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800/60 h-11">
//                     <TabsTrigger value="serial" className="flex items-center justify-center text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">SERIAL</TabsTrigger>
//                     <TabsTrigger value="tcp" className="flex items-center justify-center text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">TCP</TabsTrigger>
//                     <TabsTrigger value="udp" className="flex items-center justify-center text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">UDP</TabsTrigger>
//                   </TabsList>
//                 </div>
                
//                 {/* Serial Tab */}
//                 <TabsContent value="serial" className="p-6 m-0 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
//                   <div>
//                     <Label htmlFor="serial-baud" className={labelClasses}>Baud Rate</Label>
//                     <Select
//                       value={config.streams.serial.baudRate.toString()}
//                       onValueChange={(value) => setConfig({ ...config, streams: { ...config.streams, serial: { ...config.streams.serial, baudRate: parseInt(value) } } })}
//                     >
//                       <SelectTrigger id="serial-baud" className={`${inputClasses} font-mono px-3`}>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 rounded-lg">
//                         <SelectItem value="9600" className="font-mono text-sm dark:focus:bg-slate-800">9600 bps</SelectItem>
//                         <SelectItem value="19200" className="font-mono text-sm dark:focus:bg-slate-800">19200 bps</SelectItem>
//                         <SelectItem value="38400" className="font-mono text-sm dark:focus:bg-slate-800">38400 bps</SelectItem>
//                         <SelectItem value="57600" className="font-mono text-sm dark:focus:bg-slate-800">57600 bps</SelectItem>
//                         <SelectItem value="115200" className="font-mono text-sm dark:focus:bg-slate-800">115200 bps</SelectItem>
//                         <SelectItem value="230400" className="font-mono text-sm dark:focus:bg-slate-800">230400 bps</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
//                       <Label className={labelClasses}>RTCM3 Messages</Label>
//                       <div className="flex gap-1.5">
//                         <button
//                           onClick={() => handleMsmTypeChange('MSM4')}
//                           className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all border ${activeMsgType === 'MSM4' ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}
//                         >
//                           MSM4
//                         </button>
//                         <button
//                           onClick={() => handleMsmTypeChange('MSM7')}
//                           className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all border ${activeMsgType === 'MSM7' ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}
//                         >
//                           MSM7
//                         </button>
//                       </div>
//                     </div>
                    
//                     {/* Unconstrained full-height RTCM list */}
//                     <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 p-2 shadow-sm">
//                       {rtcmLoading ? (
//                         <div className="p-6 text-center text-xs font-medium text-slate-500">Scanning active streams...</div>
//                       ) : (
//                         <div className="space-y-1">
//                           {(activeMsgType === 'MSM4'
//                             ? [
//                                 { id: '1005', name: '1005 (Station)' },
//                                 { id: '1074', name: '1074 (GPS)' },
//                                 { id: '1084', name: '1084 (GLONASS)' },
//                                 { id: '1094', name: '1094 (Galileo)' },
//                                 { id: '1124', name: '1124 (BeiDou)' },
//                                 { id: '1230', name: '1230 (Biases)' },
//                               ]
//                             : [
//                                 { id: '1005', name: '1005 (Station)' },
//                                 { id: '1077', name: '1077 (GPS)' },
//                                 { id: '1087', name: '1087 (GLONASS)' },
//                                 { id: '1097', name: '1097 (Galileo)' },
//                                 { id: '1127', name: '1127 (BeiDou)' },
//                                 { id: '1230', name: '1230 (Biases)' },
//                               ]
//                           ).map((msg) => {
//                             const isActive = rtcmActiveMessages.includes(msg.id);
//                             return (
//                               <div key={msg.id} className={`flex items-center justify-between p-2.5 rounded-lg transition-colors border ${isActive ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/50'}`}>
//                                 <div className="flex items-center gap-3">
//                                   <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-800'}`} />
//                                   <span className={`text-sm font-medium font-mono ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-600'}`}>{msg.name}</span>
//                                 </div>
                                
//                                 {isActive && (
//                                   <Select 
//                                     value={rtcmHzRates[msg.id]} 
//                                     onValueChange={(val) => handleHzChange(msg.id, val)}
//                                   >
//                                     <SelectTrigger className="w-[65px] h-8 text-[11px] font-semibold font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-none dark:text-slate-200 rounded-md">
//                                       <SelectValue />
//                                     </SelectTrigger>
//                                     <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-lg min-w-[65px]">
//                                       <SelectItem value="1" className="font-mono text-[11px] font-semibold dark:focus:bg-slate-800">1 Hz</SelectItem>
//                                       <SelectItem value="2" className="font-mono text-[11px] font-semibold dark:focus:bg-slate-800">2 Hz</SelectItem>
//                                       <SelectItem value="5" className="font-mono text-[11px] font-semibold dark:focus:bg-slate-800">5 Hz</SelectItem>
//                                     </SelectContent>
//                                   </Select>
//                                 )}
//                               </div>
//                             );
//                           })}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </TabsContent>

//                 {/* TCP Tab */}
//                 <TabsContent value="tcp" className="p-6 m-0 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <Label htmlFor="tcp-port" className={labelClasses}>Port</Label>
//                       <Input id="tcp-port" type="number" value={config.streams.tcp.port} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, tcp: { ...config.streams.tcp, port: parseInt(e.target.value) || 9000 } } })} className={`${inputClasses} font-mono`} />
//                     </div>
//                     <div>
//                       <Label htmlFor="tcp-clients" className={labelClasses}>Max Clients</Label>
//                       <Input id="tcp-clients" type="number" min="1" max="10" value={config.streams.tcp.maxClients} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, tcp: { ...config.streams.tcp, maxClients: parseInt(e.target.value) || 5 } } })} className={`${inputClasses} font-mono`} />
//                     </div>
//                   </div>
//                   <div className={boxClasses}>
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <Label htmlFor="tcp-auth" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">Require Auth</Label>
//                         <p className="text-xs font-medium text-slate-500 mt-0.5">Enforce authentication on connection.</p>
//                       </div>
//                       <Switch id="tcp-auth" checked={config.streams.tcp.authEnabled} onCheckedChange={(checked) => setConfig({ ...config, streams: { ...config.streams, tcp: { ...config.streams.tcp, authEnabled: checked } } })} />
//                     </div>
//                   </div>
//                 </TabsContent>

//                 {/* UDP Tab */}
//                 <TabsContent value="udp" className="p-6 m-0 space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
//                   <div>
//                     <Label htmlFor="udp-port" className={labelClasses}>Port</Label>
//                     <Input id="udp-port" type="number" value={config.streams.udp.port} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, udp: { ...config.streams.udp, port: parseInt(e.target.value) || 9001 } } })} className={`${inputClasses} font-mono`} />
//                   </div>
//                   <div>
//                     <Label htmlFor="udp-address" className={labelClasses}>Broadcast Address</Label>
//                     <Input id="udp-address" value={config.streams.udp.broadcastAddress} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, udp: { ...config.streams.udp, broadcastAddress: e.target.value } } })} className={`${inputClasses} font-mono`} />
//                   </div>
//                   <div className={boxClasses}>
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <Label htmlFor="udp-multicast" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">Enable Multicast</Label>
//                         <p className="text-xs font-medium text-slate-500 mt-0.5">Send stream to multicast group.</p>
//                       </div>
//                       <Switch id="udp-multicast" checked={config.streams.udp.multicast} onCheckedChange={(checked) => setConfig({ ...config, streams: { ...config.streams, udp: { ...config.streams.udp, multicast: checked } } })} />
//                     </div>
//                   </div>
//                 </TabsContent>
//               </Tabs>
//             </CardContent>
//           </Card>

//           {/* System Environment Card */}
//           <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
//             <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 p-5">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
//                   <Cpu className="size-5" />
//                 </div>
//                 <div>
//                   <CardTitle className="text-base font-semibold dark:text-slate-50">System Environment</CardTitle>
//                   <CardDescription className="text-xs font-medium mt-0.5 dark:text-slate-400">Hardware and local network controls</CardDescription>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent className="p-6 space-y-8">
              
//               {/* WiFi Section */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 mb-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
//                   <Wifi className="size-4 text-slate-500" />
//                   <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">Local Wi-Fi Hotspot</h3>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="wifi-ssid" className={labelClasses}>SSID Name</Label>
//                     <Input id="wifi-ssid" value={config.system.wifiSsid} onChange={(e) => setConfig({ ...config, system: { ...config.system, wifiSsid: e.target.value } })} className={`${inputClasses} font-mono`} />
//                   </div>
//                   <div>
//                     <Label htmlFor="wifi-password" className={labelClasses}>Password</Label>
//                     <div className="relative">
//                       <Input id="wifi-password" type={showPasswords.wifi ? 'text' : 'password'} value={config.system.wifiPassword} onChange={(e) => setConfig({ ...config, system: { ...config.system, wifiPassword: e.target.value } })} className={`${inputClasses} font-mono pr-10`} />
//                       <button type="button" onClick={() => setShowPasswords({ ...showPasswords, wifi: !showPasswords.wifi })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors p-1">
//                         {showPasswords.wifi ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Hardware LED Section */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 mb-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
//                   <Radio className="size-4 text-slate-500" />
//                   <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">Hardware LEDs</h3>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//                   <div>
//                     <Label htmlFor="led-mode" className={labelClasses}>Display Mode</Label>
//                     <Select value={config.system.ledMode} onValueChange={(value) => setConfig({ ...config, system: { ...config.system, ledMode: value } })}>
//                       <SelectTrigger id="led-mode" className={`${inputClasses} px-3`}>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 rounded-lg">
//                         <SelectItem value="status" className="font-medium text-sm py-2 dark:focus:bg-slate-800">Status Indicators</SelectItem>
//                         <SelectItem value="always-on" className="font-medium text-sm py-2 dark:focus:bg-slate-800">Always On</SelectItem>
//                         <SelectItem value="off" className="font-medium text-sm py-2 dark:focus:bg-slate-800">Disabled (Stealth)</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div>
//                     <div className="flex justify-between items-center mb-4">
//                       <Label htmlFor="led-brightness" className={labelClasses}>Brightness</Label>
//                       <Badge variant="outline" className="font-mono text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">{config.system.ledBrightness}%</Badge>
//                     </div>
//                     <Slider id="led-brightness" min={0} max={100} step={10} className="py-1" value={[config.system.ledBrightness]} onValueChange={([value]) => setConfig({ ...config, system: { ...config.system, ledBrightness: value } })} />
//                   </div>
//                 </div>
//               </div>

//             </CardContent>
//           </Card>


//         </div>
//       </div>
//     </div>
//   );
// };




























































































import React, { useState, useEffect } from 'react';
import { useGNSS } from '../../context/GNSSContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { 
  Save, 
  RotateCcw, 
  Wifi, 
  Eye, 
  EyeOff,
  Target,
  Activity,
  Cpu,
  MapPin,
  Radio,
  Globe,
  Upload,
  Download,
  Terminal,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { uiLogger } from '../../utils/uiLogger';
import { api } from '../../api/gnssApi';

/* ── Custom Responsive Section Wrapper (Native Mobile Feel with Perfect Dark Mode) ── */
const SectionCard: React.FC<{
  title: string;
  description: string;
  icon: any;
  children: React.ReactNode;
  isMobile: boolean;
  handleSave: () => void;
}> = ({ title, description, icon: Icon, children, isMobile, handleSave }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent background scrolling when mobile modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (isMobile) {
    return (
      <>
        {/* Mobile Mini Card (List Item) */}
        <div onClick={() => setIsOpen(true)} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-95 transition-transform cursor-pointer">
          <div className="flex items-center gap-4">
             <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Icon className="size-5" />
             </div>
             <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50">{title}</h3>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
             </div>
          </div>
          <ChevronRight className="size-4 text-slate-400" />
        </div>

        {/* Mobile True Full-Screen Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-[#030712] animate-in slide-in-from-right-4 duration-200">
             
             {/* Sticky Native Header */}
             <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm shrink-0 pt-safe">
                <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-full h-9 w-9 p-0 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                   <ChevronLeft className="size-5" />
                </Button>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-50">{title}</h3>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{description}</p>
                </div>
             </div>
             
             {/* Scrolling Content Body - Wrapped in matching Card style */}
             <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  {children}
                </div>
             </div>

             {/* Sticky Native Footer */}
             <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md pb-safe shrink-0">
                <Button onClick={() => { handleSave(); setIsOpen(false); }} className="w-full h-11 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  Save & Close
                </Button>
             </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Standard Card
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden flex flex-col flex-1">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Icon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold dark:text-slate-50">{title}</CardTitle>
            <CardDescription className="text-xs font-medium mt-0.5 dark:text-slate-400">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 md:p-6 space-y-6 flex-1 flex flex-col">
        {children}
      </CardContent>
    </Card>
  );
};


export const ConfigurationScreen: React.FC = () => {
  const { configuration, updateConfiguration, survey, streams, gnssStatus, startNTRIP, stopNTRIP } = useGNSS();
  const [config, setConfig] = useState(configuration);
  const [activeMsgType, setActiveMsgType] = useState<'MSM4' | 'MSM7'>('MSM4');
  const [rtcmActiveMessages, setRtcmActiveMessages] = useState<string[]>([]);
  const [rtcmLoading, setRtcmLoading] = useState(true);
  
  const [rtcmHzRates, setRtcmHzRates] = useState<Record<string, string>>({});

  const [showPasswords, setShowPasswords] = useState({
    wifi: false,
    ntripSender: false,
    ntripReceiver: false,
  });

  const [receiverConfig, setReceiverConfig] = useState({
    server: "caster.example.com",
    port: 2101,
    mountpoint: "VRS_RTCM3",
    username: "",
    password: "",
    active: false,
    throughput: 0,
    dataReceived: 0,
    uptime: 0
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    api.getRTCM()
      .then((status) => {
        if (status.msm_type === 'MSM4' || status.msm_type === 'MSM7') {
          setActiveMsgType(status.msm_type);
        }
        const activeIds = Object.keys(status.message_counts ?? {}).filter(
          (id) => (status.message_counts[id] ?? 0) > 0
        );
        setRtcmActiveMessages(activeIds);

        const initialRates: Record<string, string> = {};
        activeIds.forEach(id => { initialRates[id] = "1"; });
        setRtcmHzRates(initialRates);
      })
      .catch((e) => console.warn('RTCM status fetch failed:', e))
      .finally(() => setRtcmLoading(false));

    api.getAutoFlowConfig()
      .then((cfg) => {
        if (typeof cfg.enabled === 'boolean') {
          setConfig(prev => ({
            ...prev,
            baseStation: { ...prev.baseStation, autoMode: cfg.enabled },
          }));
        }
      })
      .catch((e) => console.warn('Autoflow config fetch failed:', e));
  }, []);

  const handleMsmTypeChange = async (type: 'MSM4' | 'MSM7') => {
    setActiveMsgType(type);
    try {
      await api.configureRTCM(type);
      toast.success(`Switched to ${type}`);
    } catch (e) {
      toast.error(`Failed to configure RTCM: ${e}`);
    }
  };

  const handleHzChange = (msgId: string, hz: string) => {
    setRtcmHzRates(prev => ({ ...prev, [msgId]: hz }));
    toast.success(`Message ${msgId} set to ${hz} Hz`);
  };

  const handleSave = async () => {
    uiLogger.log('Save Configuration clicked', 'ConfigurationScreen', config);
    try {
      if (config.baseStation.autoMode) {
        await api.enableAutoFlow({
          msm_type: activeMsgType, 
          min_duration_sec: config.baseStation.surveyDuration,
          accuracy_limit_m: config.baseStation.accuracyThreshold / 100,
          ntrip_host: config.streams.ntrip.server,
          ntrip_port: config.streams.ntrip.port,
          ntrip_mountpoint: config.streams.ntrip.mountpoint,
          ntrip_password: config.streams.ntrip.password,
          ntrip_username: config.streams.ntrip.username,
        });
      } else {
        await api.disableAutoFlow();
      }

      updateConfiguration(config); 
      uiLogger.log('Configuration saved', 'ConfigurationScreen');
      toast.success('Configuration saved successfully');
    } catch (e) {
      toast.error(`Failed to save configuration: ${e}`);
    }
  };

  const handleReset = () => {
    uiLogger.log('Reset Configuration clicked', 'ConfigurationScreen');
    setConfig(configuration);
    toast.info('Configuration reset to defaults');
  };

  const handleStartStopNTRIP = async () => {
    if (streams.ntrip.active) {
      try {
        await stopNTRIP();
        toast.success('NTRIP Sender stopped');
      } catch (error) {
        toast.error(`Failed to stop NTRIP: ${error}`);
      }
    } else {
      try {
        await startNTRIP(
          config.streams.ntrip.server,
          config.streams.ntrip.port,
          config.streams.ntrip.mountpoint,
          config.streams.ntrip.password,
          config.streams.ntrip.username
        );
        toast.success('NTRIP Sender started');
      } catch (error) {
        toast.error(`Failed to start NTRIP: ${error}`);
      }
    }
  };

  const handleStartStopReceiver = () => {
    if (receiverConfig.active) {
      setReceiverConfig(prev => ({ ...prev, active: false, throughput: 0, uptime: 0 }));
      toast.success('NTRIP Receiver stopped');
    } else {
      setReceiverConfig(prev => ({ ...prev, active: true, throughput: 4.2, uptime: 1, dataReceived: 102 }));
      toast.success('NTRIP Receiver started');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (receiverConfig.active) {
      interval = setInterval(() => {
        setReceiverConfig(prev => ({
          ...prev,
          uptime: prev.uptime + 1,
          dataReceived: prev.dataReceived + Math.random() * 5,
          throughput: 3 + Math.random() * 2
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [receiverConfig.active]);

  const loadCurrentSurvey = () => {
    setConfig({
      ...config,
      baseStation: {
        ...config.baseStation,
        fixedMode: { enabled: true, coordinates: survey.position },
      },
    });
    toast.success('Loaded coordinates from current survey');
  };

  // Shared classes for typography scaling (Matches Desktop & Mobile flawlessly)
  const inputClasses = "mt-1.5 h-11 text-sm font-medium bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100 shadow-sm";
  const labelClasses = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
  const boxClasses = "p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 shadow-sm";

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen animate-in fade-in duration-300 pb-24">
      
      {/* ── Header & Desktop Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 md:pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">System Configuration</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Configure positioning, telemetry, and system parameters
          </p>
        </div>
        
        {/* Actions Hidden on Mobile, handled inside modals or bottom */}
        {!isMobile && (
          <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="h-10 px-4 gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 shadow-sm text-sm font-semibold rounded-lg">
                  <RotateCcw className="size-4" />
                  Reset Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="dark:bg-slate-900 border dark:border-slate-800 rounded-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="dark:text-slate-50 text-base font-bold">Reset Configuration?</AlertDialogTitle>
                  <AlertDialogDescription className="dark:text-slate-400 text-sm font-medium">
                    This will reset all settings to their default values. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 mt-2">
                  <AlertDialogCancel className="h-10 border dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800 rounded-lg font-semibold text-sm">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm">Reset Settings</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button onClick={handleSave} className="h-10 px-5 gap-2 transition-transform active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm font-semibold rounded-lg">
              <Save className="size-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* ── Main Layout Grid (Mobile List vs Desktop Columns) ── */}
      <div className={`grid gap-4 md:gap-6 items-start ${isMobile ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>

        {/* ── COLUMN 1 ── */}
        <div className="space-y-4 md:space-y-6 flex flex-col">

          <SectionCard title="Base Station Positioning" description="Configure Survey-In constraints and operation modes" icon={Target} isMobile={isMobile} handleSave={handleSave}>
              <div className="flex items-center justify-between p-4 md:p-5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
                <div className="pr-3">
                  <Label htmlFor="auto-mode" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">Automatic Flow Mode</Label>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Start survey automatically. Auto-switches to NTRIP cast when target accuracy is reached.
                  </p>
                </div>
                <Switch
                  id="auto-mode"
                  checked={config.baseStation.autoMode}
                  onCheckedChange={(checked) => setConfig({ ...config, baseStation: { ...config.baseStation, autoMode: checked } })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Duration */}
                <div className={boxClasses}>
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="survey-duration" className={labelClasses}>Min Duration</Label>
                    <Badge variant="outline" className="font-mono text-[10px] font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                      {Math.floor(config.baseStation.surveyDuration / 60)}m {config.baseStation.surveyDuration % 60}s
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <Slider
                      id="survey-duration"
                      min={30} max={600} step={10}
                      value={[config.baseStation.surveyDuration]}
                      onValueChange={([value]) => setConfig({ ...config, baseStation: { ...config.baseStation, surveyDuration: value } })}
                    />
                    <div className="relative">
                      <Input
                        type="number" min={30} max={600}
                        value={config.baseStation.surveyDuration}
                        onChange={(e) => {
                          const v = Math.min(600, Math.max(30, parseInt(e.target.value) || 30));
                          setConfig({ ...config, baseStation: { ...config.baseStation, surveyDuration: v } });
                        }}
                        className={`${inputClasses} pr-10 font-mono text-sm text-center`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold uppercase mt-0.5">sec</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy */}
                <div className={boxClasses}>
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="accuracy-threshold" className={labelClasses}>Target Accuracy</Label>
                    <Badge variant="outline" className="font-mono text-[10px] font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                      {(config.baseStation.accuracyThreshold / 100).toFixed(2)} m
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <Slider
                      id="accuracy-threshold"
                      min={1} max={300} step={1}
                      value={[config.baseStation.accuracyThreshold]}
                      onValueChange={([value]) => setConfig({ ...config, baseStation: { ...config.baseStation, accuracyThreshold: value } })}
                    />
                    <div className="relative">
                      <Input
                        type="number" min={1} max={300}
                        value={config.baseStation.accuracyThreshold}
                        onChange={(e) => {
                          const v = Math.min(300, Math.max(1, parseInt(e.target.value) || 1));
                          setConfig({ ...config, baseStation: { ...config.baseStation, accuracyThreshold: v } });
                        }}
                        className={`${inputClasses} pr-10 font-mono text-sm text-center`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold uppercase mt-0.5">cm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Position Sub-Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Fixed Position Override</h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Use precise known coordinates.</p>
                  </div>
                  <Switch
                    checked={config.baseStation.fixedMode.enabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, baseStation: { ...config.baseStation, fixedMode: { ...config.baseStation.fixedMode, enabled: checked } } })
                    }
                  />
                </div>
                
                {config.baseStation.fixedMode.enabled && (
                  <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="fixed-lat" className={labelClasses}>Latitude</Label>
                        <Input
                          id="fixed-lat" type="number" step="0.00000001"
                          value={config.baseStation.fixedMode.coordinates.latitude}
                          onChange={(e) => setConfig({ ...config, baseStation: { ...config.baseStation, fixedMode: { ...config.baseStation.fixedMode, coordinates: { ...config.baseStation.fixedMode.coordinates, latitude: parseFloat(e.target.value) || 0 } } } })}
                          className={`${inputClasses} font-mono`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fixed-lon" className={labelClasses}>Longitude</Label>
                        <Input
                          id="fixed-lon" type="number" step="0.00000001"
                          value={config.baseStation.fixedMode.coordinates.longitude}
                          onChange={(e) => setConfig({ ...config, baseStation: { ...config.baseStation, fixedMode: { ...config.baseStation.fixedMode, coordinates: { ...config.baseStation.fixedMode.coordinates, longitude: parseFloat(e.target.value) || 0 } } } })}
                          className={`${inputClasses} font-mono`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fixed-alt" className={labelClasses}>Altitude (m)</Label>
                        <Input
                          id="fixed-alt" type="number" step="0.001"
                          value={config.baseStation.fixedMode.coordinates.altitude}
                          onChange={(e) => setConfig({ ...config, baseStation: { ...config.baseStation, fixedMode: { ...config.baseStation.fixedMode, coordinates: { ...config.baseStation.fixedMode.coordinates, altitude: parseFloat(e.target.value) || 0 } } } })}
                          className={`${inputClasses} font-mono`}
                        />
                      </div>
                    </div>
                    <Button variant="outline" className="w-full gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors active:scale-95 font-semibold h-10 rounded-lg text-xs tracking-wide bg-white dark:bg-slate-900" onClick={loadCurrentSurvey}>
                      <MapPin className="size-4 text-blue-500" />
                      LOAD CURRENT POSITION
                    </Button>
                  </div>
                )}
              </div>
          </SectionCard>

          <SectionCard title="NTRIP Configuration" description="Manage Caster network connections" icon={Globe} isMobile={isMobile} handleSave={handleSave}>
              <Tabs defaultValue="sender" className="w-full flex flex-col">
                <div className="pb-3">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-950/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800/60 h-10">
                    <TabsTrigger value="sender" className="flex items-center justify-center text-[11px] sm:text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">
                      <Upload className="size-3 mr-1.5 text-slate-500" /> SENDER
                    </TabsTrigger>
                    <TabsTrigger value="receiver" className="flex items-center justify-center text-[11px] sm:text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">
                      <Download className="size-3 mr-1.5 text-slate-500" /> RECEIVER
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* SENDER TAB */}
                <TabsContent value="sender" className="m-0 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  {streams.ntrip.active && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 animate-in fade-in">
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Data Rate</div>
                        <div className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-400">{(streams.ntrip.throughput / 1024).toFixed(2)} <span className="text-[10px] font-medium">KB/s</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Total Sent</div>
                        <div className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-400">{(streams.ntrip.dataSent / 1024).toFixed(1)} <span className="text-[10px] font-medium">KB</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Uptime</div>
                        <div className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-400">{Math.floor(streams.ntrip.uptime / 60)}m {streams.ntrip.uptime % 60}s</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Mountpoint</div>
                        <div className="text-xs font-semibold font-mono text-emerald-900 dark:text-emerald-400 truncate pr-2 mt-1">{streams.ntrip.mountpoint || config.streams.ntrip.mountpoint}</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 flex-1">
                    <div>
                      <Label htmlFor="ntrip-server" className={labelClasses}>Caster Host</Label>
                      <Input id="ntrip-server" value={config.streams.ntrip.server} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, server: e.target.value } } })} className={`${inputClasses} font-mono`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ntrip-port" className={labelClasses}>Port</Label>
                        <Input id="ntrip-port" type="number" value={config.streams.ntrip.port} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, port: parseInt(e.target.value) || 2101 } } })} className={`${inputClasses} font-mono`} />
                      </div>
                      <div>
                        <Label htmlFor="ntrip-mountpoint" className={labelClasses}>Mountpoint</Label>
                        <Input id="ntrip-mountpoint" value={config.streams.ntrip.mountpoint} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, mountpoint: e.target.value } } })} className={`${inputClasses} font-mono`} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="ntrip-user" className={labelClasses}>Username</Label>
                      <Input id="ntrip-user" value={config.streams.ntrip.username || ""} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, username: e.target.value } } })} className={inputClasses} />
                    </div>
                    <div>
                      <Label htmlFor="ntrip-pass" className={labelClasses}>Password</Label>
                      <div className="relative">
                        <Input id="ntrip-pass" type={showPasswords.ntripSender ? 'text' : 'password'} value={config.streams.ntrip.password} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, ntrip: { ...config.streams.ntrip, password: e.target.value } } })} className={`${inputClasses} pr-10`} />
                        <button type="button" onClick={() => setShowPasswords({ ...showPasswords, ntripSender: !showPasswords.ntripSender })} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors p-2">
                          {showPasswords.ntripSender ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={streams.ntrip.active ? "destructive" : "default"}
                    className={`w-full h-11 rounded-lg text-sm font-semibold tracking-wide transition-transform active:scale-95 shadow-sm mt-2 ${streams.ntrip.active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                    onClick={handleStartStopNTRIP}
                    disabled={!config.streams.ntrip.server || !config.streams.ntrip.mountpoint || !config.streams.ntrip.password}
                  >
                    {streams.ntrip.active ? "STOP SENDER" : "START SENDER"}
                  </Button>
                </TabsContent>

                {/* RECEIVER TAB */}
                <TabsContent value="receiver" className="m-0 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  {receiverConfig.active && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 animate-in fade-in">
                      <div>
                        <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-0.5">Data Rate</div>
                        <div className="text-base font-bold font-mono text-blue-900 dark:text-blue-400">{receiverConfig.throughput.toFixed(2)} <span className="text-[10px] font-medium">KB/s</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-0.5">Total Recv</div>
                        <div className="text-base font-bold font-mono text-blue-900 dark:text-blue-400">{receiverConfig.dataReceived.toFixed(1)} <span className="text-[10px] font-medium">KB</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-0.5">Uptime</div>
                        <div className="text-base font-bold font-mono text-blue-900 dark:text-blue-400">{Math.floor(receiverConfig.uptime / 60)}m {receiverConfig.uptime % 60}s</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-500 uppercase tracking-wider mb-0.5">Mountpoint</div>
                        <div className="text-xs font-semibold font-mono text-blue-900 dark:text-blue-400 truncate pr-2 mt-1">{receiverConfig.mountpoint}</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 flex-1">
                    <div>
                      <Label htmlFor="ntrip-recv-server" className={labelClasses}>Caster Host</Label>
                      <Input id="ntrip-recv-server" value={receiverConfig.server} onChange={(e) => setReceiverConfig({ ...receiverConfig, server: e.target.value })} className={`${inputClasses} font-mono`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ntrip-recv-port" className={labelClasses}>Port</Label>
                        <Input id="ntrip-recv-port" type="number" value={receiverConfig.port} onChange={(e) => setReceiverConfig({ ...receiverConfig, port: parseInt(e.target.value) || 2101 })} className={`${inputClasses} font-mono`} />
                      </div>
                      <div>
                        <Label htmlFor="ntrip-recv-mountpoint" className={labelClasses}>Mountpoint</Label>
                        <Input id="ntrip-recv-mountpoint" value={receiverConfig.mountpoint} onChange={(e) => setReceiverConfig({ ...receiverConfig, mountpoint: e.target.value })} className={`${inputClasses} font-mono`} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="ntrip-recv-user" className={labelClasses}>Username</Label>
                      <Input id="ntrip-recv-user" value={receiverConfig.username} onChange={(e) => setReceiverConfig({ ...receiverConfig, username: e.target.value })} className={inputClasses} />
                    </div>
                    <div>
                      <Label htmlFor="ntrip-recv-pass" className={labelClasses}>Password</Label>
                      <div className="relative">
                        <Input id="ntrip-recv-pass" type={showPasswords.ntripReceiver ? 'text' : 'password'} value={receiverConfig.password} onChange={(e) => setReceiverConfig({ ...receiverConfig, password: e.target.value })} className={`${inputClasses} pr-10`} />
                        <button type="button" onClick={() => setShowPasswords({ ...showPasswords, ntripReceiver: !showPasswords.ntripReceiver })} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors p-2">
                          {showPasswords.ntripReceiver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={receiverConfig.active ? "destructive" : "default"}
                    className={`w-full h-11 rounded-lg text-sm font-semibold tracking-wide transition-transform active:scale-95 shadow-sm mt-2 ${receiverConfig.active ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    onClick={handleStartStopReceiver}
                    disabled={!receiverConfig.server || !receiverConfig.mountpoint}
                  >
                    {receiverConfig.active ? "STOP RECEIVER" : "START RECEIVER"}
                  </Button>
                </TabsContent>
              </Tabs>
          </SectionCard>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4 md:space-y-6 flex flex-col">

          <SectionCard title="Telemetry Interfaces" description="Local data stream endpoints" icon={Activity} isMobile={isMobile} handleSave={handleSave}>
              <Tabs defaultValue="serial" className="w-full flex flex-col">
                <div className="pb-3">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-950/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800/60 h-10">
                    <TabsTrigger value="serial" className="flex items-center justify-center text-[10px] sm:text-[11px] font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">SERIAL</TabsTrigger>
                    <TabsTrigger value="tcp" className="flex items-center justify-center text-[10px] sm:text-[11px] font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">TCP</TabsTrigger>
                    <TabsTrigger value="udp" className="flex items-center justify-center text-[10px] sm:text-[11px] font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 rounded-md data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full">UDP</TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Serial Tab */}
                <TabsContent value="serial" className="m-0 space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div>
                    <Label htmlFor="serial-baud" className={labelClasses}>Baud Rate</Label>
                    <Select
                      value={config.streams.serial.baudRate.toString()}
                      onValueChange={(value) => setConfig({ ...config, streams: { ...config.streams, serial: { ...config.streams.serial, baudRate: parseInt(value) } } })}
                    >
                      <SelectTrigger id="serial-baud" className={`${inputClasses} font-mono px-3`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 rounded-lg">
                        <SelectItem value="9600" className="font-mono text-sm dark:focus:bg-slate-800">9600 bps</SelectItem>
                        <SelectItem value="19200" className="font-mono text-sm dark:focus:bg-slate-800">19200 bps</SelectItem>
                        <SelectItem value="38400" className="font-mono text-sm dark:focus:bg-slate-800">38400 bps</SelectItem>
                        <SelectItem value="57600" className="font-mono text-sm dark:focus:bg-slate-800">57600 bps</SelectItem>
                        <SelectItem value="115200" className="font-mono text-sm dark:focus:bg-slate-800">115200 bps</SelectItem>
                        <SelectItem value="230400" className="font-mono text-sm dark:focus:bg-slate-800">230400 bps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
                      <Label className={labelClasses}>RTCM3 Messages</Label>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleMsmTypeChange('MSM4')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all border ${activeMsgType === 'MSM4' ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}>MSM4</button>
                        <button onClick={() => handleMsmTypeChange('MSM7')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all border ${activeMsgType === 'MSM7' ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}>MSM7</button>
                      </div>
                    </div>
                    
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 p-2 shadow-sm">
                      {rtcmLoading ? (
                        <div className="p-4 text-center text-xs font-medium text-slate-500">Scanning active streams...</div>
                      ) : (
                        <div className="space-y-1">
                          {(activeMsgType === 'MSM4'
                            ? [
                                { id: '1005', name: '1005 (Station)' },
                                { id: '1074', name: '1074 (GPS)' },
                                { id: '1084', name: '1084 (GLONASS)' },
                                { id: '1094', name: '1094 (Galileo)' },
                                { id: '1124', name: '1124 (BeiDou)' },
                                { id: '1230', name: '1230 (Biases)' },
                              ]
                            : [
                                { id: '1005', name: '1005 (Station)' },
                                { id: '1077', name: '1077 (GPS)' },
                                { id: '1087', name: '1087 (GLONASS)' },
                                { id: '1097', name: '1097 (Galileo)' },
                                { id: '1127', name: '1127 (BeiDou)' },
                                { id: '1230', name: '1230 (Biases)' },
                              ]
                          ).map((msg) => {
                            const isActive = rtcmActiveMessages.includes(msg.id);
                            return (
                              <div key={msg.id} className={`flex items-center justify-between p-2 rounded-lg transition-colors border ${isActive ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/50'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-800'}`} />
                                  <span className={`text-xs font-medium font-mono ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-600'}`}>{msg.name}</span>
                                </div>
                                
                                {isActive && (
                                  <Select value={rtcmHzRates[msg.id]} onValueChange={(val) => handleHzChange(msg.id, val)}>
                                    <SelectTrigger className="w-[60px] h-7 text-[10px] font-semibold font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-none dark:text-slate-200 rounded-md">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-lg min-w-[60px]">
                                      <SelectItem value="1" className="font-mono text-[10px] font-semibold dark:focus:bg-slate-800">1 Hz</SelectItem>
                                      <SelectItem value="2" className="font-mono text-[10px] font-semibold dark:focus:bg-slate-800">2 Hz</SelectItem>
                                      <SelectItem value="5" className="font-mono text-[10px] font-semibold dark:focus:bg-slate-800">5 Hz</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* TCP Tab */}
                <TabsContent value="tcp" className="m-0 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tcp-port" className={labelClasses}>Port</Label>
                      <Input id="tcp-port" type="number" value={config.streams.tcp.port} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, tcp: { ...config.streams.tcp, port: parseInt(e.target.value) || 9000 } } })} className={`${inputClasses} font-mono`} />
                    </div>
                    <div>
                      <Label htmlFor="tcp-clients" className={labelClasses}>Max Clients</Label>
                      <Input id="tcp-clients" type="number" min="1" max="10" value={config.streams.tcp.maxClients} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, tcp: { ...config.streams.tcp, maxClients: parseInt(e.target.value) || 5 } } })} className={`${inputClasses} font-mono`} />
                    </div>
                  </div>
                  <div className={boxClasses}>
                    <div className="flex items-center justify-between">
                      <div className="pr-3">
                        <Label htmlFor="tcp-auth" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">Require Auth</Label>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">Enforce authentication on connection.</p>
                      </div>
                      <Switch id="tcp-auth" checked={config.streams.tcp.authEnabled} onCheckedChange={(checked) => setConfig({ ...config, streams: { ...config.streams, tcp: { ...config.streams.tcp, authEnabled: checked } } })} />
                    </div>
                  </div>
                </TabsContent>

                {/* UDP Tab */}
                <TabsContent value="udp" className="m-0 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div>
                    <Label htmlFor="udp-port" className={labelClasses}>Port</Label>
                    <Input id="udp-port" type="number" value={config.streams.udp.port} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, udp: { ...config.streams.udp, port: parseInt(e.target.value) || 9001 } } })} className={`${inputClasses} font-mono`} />
                  </div>
                  <div>
                    <Label htmlFor="udp-address" className={labelClasses}>Broadcast Address</Label>
                    <Input id="udp-address" value={config.streams.udp.broadcastAddress} onChange={(e) => setConfig({ ...config, streams: { ...config.streams, udp: { ...config.streams.udp, broadcastAddress: e.target.value } } })} className={`${inputClasses} font-mono`} />
                  </div>
                  <div className={boxClasses}>
                    <div className="flex items-center justify-between">
                      <div className="pr-3">
                        <Label htmlFor="udp-multicast" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">Enable Multicast</Label>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">Send stream to multicast group.</p>
                      </div>
                      <Switch id="udp-multicast" checked={config.streams.udp.multicast} onCheckedChange={(checked) => setConfig({ ...config, streams: { ...config.streams, udp: { ...config.streams.udp, multicast: checked } } })} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
          </SectionCard>

          <SectionCard title="System Environment" description="Hardware and local network controls" icon={Cpu} isMobile={isMobile} handleSave={handleSave}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <Wifi className="size-4 text-slate-500" />
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">Local Wi-Fi Hotspot</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wifi-ssid" className={labelClasses}>SSID Name</Label>
                    <Input id="wifi-ssid" value={config.system.wifiSsid} onChange={(e) => setConfig({ ...config, system: { ...config.system, wifiSsid: e.target.value } })} className={`${inputClasses} font-mono`} />
                  </div>
                  <div>
                    <Label htmlFor="wifi-password" className={labelClasses}>Password</Label>
                    <div className="relative">
                      <Input id="wifi-password" type={showPasswords.wifi ? 'text' : 'password'} value={config.system.wifiPassword} onChange={(e) => setConfig({ ...config, system: { ...config.system, wifiPassword: e.target.value } })} className={`${inputClasses} font-mono pr-10`} />
                      <button type="button" onClick={() => setShowPasswords({ ...showPasswords, wifi: !showPasswords.wifi })} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors p-2">
                        {showPasswords.wifi ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <Radio className="size-4 text-slate-500" />
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">Hardware LEDs</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="led-mode" className={labelClasses}>Display Mode</Label>
                    <Select value={config.system.ledMode} onValueChange={(value) => setConfig({ ...config, system: { ...config.system, ledMode: value } })}>
                      <SelectTrigger id="led-mode" className={`${inputClasses} px-3`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 rounded-lg">
                        <SelectItem value="status" className="font-medium text-sm py-2 dark:focus:bg-slate-800">Status Indicators</SelectItem>
                        <SelectItem value="always-on" className="font-medium text-sm py-2 dark:focus:bg-slate-800">Always On</SelectItem>
                        <SelectItem value="off" className="font-medium text-sm py-2 dark:focus:bg-slate-800">Disabled (Stealth)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label htmlFor="led-brightness" className={labelClasses}>Brightness</Label>
                      <Badge variant="outline" className="font-mono text-[10px] font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">{config.system.ledBrightness}%</Badge>
                    </div>
                    <Slider id="led-brightness" min={0} max={100} step={10} className="py-1" value={[config.system.ledBrightness]} onValueChange={([value]) => setConfig({ ...config, system: { ...config.system, ledBrightness: value } })} />
                  </div>
                </div>
              </div>
          </SectionCard>

          <SectionCard title="System Diagnostics" description="Live hardware readout" icon={Terminal} isMobile={isMobile} handleSave={handleSave}>
              <div className="grid grid-cols-2 gap-4">
                <div className={boxClasses}>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Firmware Build</div>
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">{gnssStatus.firmwareVersion || "v2.4.1-stable"}</div>
                </div>
                <div className={boxClasses}>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">GNSS Engine</div>
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">{gnssStatus.updateRate} Hz <span className="text-[9px] text-slate-400 font-sans font-medium ml-1 uppercase">Multi-band</span></div>
                </div>
                <div className={boxClasses}>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Constellations</div>
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">GPS, GLO, GAL, BDS</div>
                </div>
                <div className={`${boxClasses} flex items-center justify-between`}>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">System Health</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mt-0.5">Optimal</div>
                  </div>
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
              </div>
          </SectionCard>

        </div>
      </div>

      {/* Mobile-only Global Reset Button placed at the bottom of the list */}
      {isMobile && (
        <Button variant="outline" onClick={handleReset} className="w-full mt-6 h-12 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl bg-white dark:bg-slate-900 shadow-sm mb-safe">
          <RotateCcw className="size-4 mr-2" />
          Reset All Changes
        </Button>
      )}
    </div>
  );
};