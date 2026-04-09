import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  Play,
  Square,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { uiLogger } from '../../utils/uiLogger';
import { api } from '../../api/gnssApiDynamic';

/* ── Custom Responsive Section Wrapper (Native Mobile Feel with Perfect Dark Mode) ── */
const SectionCard: React.FC<{
  title: string;
  description: string;
  icon: any;
  children: React.ReactNode;
  isMobile: boolean;
  handleSave: () => Promise<boolean>;
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
                <Button
                  onClick={async () => {
                    const saved = await handleSave();
                    if (saved) {
                      setIsOpen(false);
                    }
                  }}
                  className="w-full h-11 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Save & Close
                </Button>
             </div>
          </div>
        )}
      </>
    );
  }

  // Desktop/Tablet Standard Card
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
  const { configuration, updateConfiguration, survey, streams, gnssStatus, startNTRIP, stopNTRIP, isAutoFlowActive, applyFixedBasePosition, fixedBaseReference, isFixedBaseDisplayActive, setFixedBaseDisplayActive } = useGNSS();
  const [config, setConfig] = useState(configuration);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNtripActionPending, setIsNtripActionPending] = useState(false);
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
  const [autoFlowPromptDismissed, setAutoFlowPromptDismissed] = useState(false);
  const [autoFlowActionPending, setAutoFlowActionPending] = useState(false);
  
  // ⭐ FIX: Changed breakpoint to 768px. Tablets (like iPad) are typically 768px+. 
  // This ensures tablets get the full desktop grid view, and only phones get the clickable modal view.
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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
  }, []);

  useEffect(() => {
    if (!isDirty) {
      setConfig(configuration);
    }
  }, [configuration, isDirty]);

  useEffect(() => {
    if (!config.baseStation.autoMode) {
      setAutoFlowPromptDismissed(false);
    }
  }, [config.baseStation.autoMode]);

  const backendAutoFlowEnabled = configuration.baseStation.autoMode;
  const isAutoFlowToggleDirty = config.baseStation.autoMode !== backendAutoFlowEnabled;

  const handleMsmTypeChange = async (type: 'MSM4' | 'MSM7') => {
    if (streams.ntrip.active) {
      toast.info('Stop NTRIP Sender before changing RTCM mode.');
      return;
    }

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

  const getAutoFlowPayload = () => ({
    enabled: config.baseStation.autoMode,
    msm_type: activeMsgType,
    min_duration_sec: config.baseStation.surveyDuration,
    accuracy_limit_m: config.baseStation.accuracyThreshold / 100,
    ntrip_host: config.streams.ntrip.server,
    ntrip_port: config.streams.ntrip.port,
    ntrip_mountpoint: config.streams.ntrip.mountpoint,
    ntrip_password: config.streams.ntrip.password,
    ntrip_username: config.streams.ntrip.username,
    ntrip_version: 1,
  });

  const normalizeSavedConfig = (saved: any) => {
    const backendConfig = saved?.config ?? {};
    const savedPassword = typeof backendConfig.ntrip_password === 'string'
      ? backendConfig.ntrip_password
      : undefined;
    const hasMaskedPassword = typeof savedPassword === 'string' && /^\*+$/.test(savedPassword);

    return {
      ...config,
      baseStation: {
        ...config.baseStation,
        autoMode: typeof saved?.enabled === 'boolean' ? saved.enabled : config.baseStation.autoMode,
        surveyDuration: Number.isFinite(Number(backendConfig.min_duration_sec))
          ? Number(backendConfig.min_duration_sec)
          : config.baseStation.surveyDuration,
        accuracyThreshold: Number.isFinite(Number(backendConfig.accuracy_limit_m))
          ? Math.round(Number(backendConfig.accuracy_limit_m) * 100)
          : config.baseStation.accuracyThreshold,
      },
      streams: {
        ...config.streams,
        ntrip: {
          ...config.streams.ntrip,
          server: typeof backendConfig.ntrip_host === 'string' && backendConfig.ntrip_host.length > 0
            ? backendConfig.ntrip_host
            : config.streams.ntrip.server,
          port: Number.isFinite(Number(backendConfig.ntrip_port))
            ? Number(backendConfig.ntrip_port)
            : config.streams.ntrip.port,
          mountpoint: typeof backendConfig.ntrip_mountpoint === 'string' && backendConfig.ntrip_mountpoint.length > 0
            ? backendConfig.ntrip_mountpoint
            : config.streams.ntrip.mountpoint,
          password: typeof savedPassword === 'string' && savedPassword.length > 0 && !hasMaskedPassword
            ? savedPassword
            : config.streams.ntrip.password,
          username: typeof backendConfig.ntrip_username === 'string'
            ? backendConfig.ntrip_username
            : config.streams.ntrip.username,
        },
      },
    };
  };

  const updateDraftConfig = (updater: (prev: typeof config) => typeof config) => {
    setIsDirty(true);
    setConfig((prev) => updater(prev));
  };

  const updateNtripDraft = (patch: Partial<typeof config.streams.ntrip>) => {
    updateDraftConfig((prev) => ({
      ...prev,
      streams: {
        ...prev.streams,
        ntrip: {
          ...prev.streams.ntrip,
          ...patch,
        },
      },
    }));
  };

  const handleSave = async (): Promise<boolean> => {
    uiLogger.log('Save Configuration clicked', 'ConfigurationScreen', config);
    const payload = getAutoFlowPayload();
    const shouldApplyFixedBase =
      config.baseStation.fixedMode.enabled &&
      (
        !isFixedBaseDisplayActive ||
        !fixedBaseReference ||
        Math.abs(config.baseStation.fixedMode.coordinates.latitude - fixedBaseReference.llh.latitude) > 1e-9 ||
        Math.abs(config.baseStation.fixedMode.coordinates.longitude - fixedBaseReference.llh.longitude) > 1e-9 ||
        Math.abs(config.baseStation.fixedMode.coordinates.altitude - fixedBaseReference.llh.height_ellipsoid) > 1e-6 ||
        Math.abs(config.baseStation.fixedMode.coordinates.accuracy - fixedBaseReference.fixed_pos_acc) > 1e-6
      );

    setIsSaving(true);
    try {
      const saveResponse = await api.saveAutoFlowConfig(payload);

      if (shouldApplyFixedBase) {
        await applyFixedBasePosition({
          latitude: config.baseStation.fixedMode.coordinates.latitude,
          longitude: config.baseStation.fixedMode.coordinates.longitude,
          height: config.baseStation.fixedMode.coordinates.altitude,
          accuracyMeters: config.baseStation.fixedMode.coordinates.accuracy,
          msmType: activeMsgType,
        });
      }

      const backendSnapshot =
        saveResponse && typeof saveResponse === 'object' && ('config' in saveResponse || 'enabled' in saveResponse)
          ? saveResponse
          : await api.getAutoFlowConfig().catch(() => null);
      const normalizedConfig = normalizeSavedConfig(
        backendSnapshot ?? saveResponse ?? payload
      );

      setAutoFlowPromptDismissed(false);
      setIsDirty(false);
      setConfig(normalizedConfig);
      updateConfiguration(normalizedConfig);
      uiLogger.log('Configuration saved', 'ConfigurationScreen');
      toast.success(
        normalizedConfig.baseStation.autoMode
          ? 'Auto Flow enabled and configuration saved.'
          : 'Auto Flow disabled and configuration saved.'
      );
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      uiLogger.log('Save Configuration Failed', 'ConfigurationScreen', undefined, errorMsg);
      toast.error(`Failed to save configuration: ${errorMsg}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartAutoFlow = async () => {
    setAutoFlowActionPending(true);
    try {
      await api.startAutoFlow(getAutoFlowPayload());
      setAutoFlowPromptDismissed(false);
      uiLogger.log('Auto Flow started manually', 'ConfigurationScreen');
      toast.success('Auto Flow started');
    } catch (e) {
      toast.error(`Failed to start Auto Flow: ${e}`);
    } finally {
      setAutoFlowActionPending(false);
    }
  };

  const handleStopAutoFlow = async () => {
    setAutoFlowActionPending(true);
    try {
      await api.stopAutoFlow();
      setAutoFlowPromptDismissed(false);
      uiLogger.log('Auto Flow stopped manually', 'ConfigurationScreen');
      toast.success('Auto Flow stopped');
    } catch (e) {
      toast.error(`Failed to stop Auto Flow: ${e}`);
    } finally {
      setAutoFlowActionPending(false);
    }
  };

  const handleReset = () => {
    uiLogger.log('Reset Configuration clicked', 'ConfigurationScreen');
    setIsDirty(false);
    setConfig(configuration);
    toast.info('Configuration reset to defaults');
  };

  const handleStartStopNTRIP = async () => {
    if (isNtripActionPending) {
      return;
    }

    setIsNtripActionPending(true);
    if (streams.ntrip.active) {
      try {
        await stopNTRIP();
        toast.success('NTRIP Sender stopped');
      } catch (error) {
        toast.error(`Failed to stop NTRIP: ${error}`);
      } finally {
        setIsNtripActionPending(false);
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
      } finally {
        setIsNtripActionPending(false);
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

  const loadCurrentSurvey = async () => {
    const latitude = gnssStatus.globalPosition.latitude || survey.position.latitude;
    const longitude = gnssStatus.globalPosition.longitude || survey.position.longitude;
    const altitude = gnssStatus.globalPosition.altitude || survey.position.altitude;
    const accuracy = gnssStatus.globalPosition.horizontalAccuracy || survey.position.accuracy || config.baseStation.fixedMode.coordinates.accuracy;

    const nextConfig = {
      ...config,
      baseStation: {
        ...config.baseStation,
        fixedMode: {
          enabled: true,
          coordinates: {
            latitude,
            longitude,
            altitude,
            accuracy,
          },
        },
      },
    };

    setIsDirty(false);
    setConfig(nextConfig);
    updateConfiguration(nextConfig);

    try {
      await applyFixedBasePosition({
        latitude,
        longitude,
        height: altitude,
        accuracyMeters: accuracy,
        msmType: activeMsgType,
      });
      toast.success('Loaded current position and applied fixed base');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to apply fixed base: ${errorMsg}`);
    }
  };

  useEffect(() => {
    if (!fixedBaseReference || isDirty) {
      return;
    }

    setConfig((prev) => ({
      ...prev,
      baseStation: {
        ...prev.baseStation,
        fixedMode: {
          enabled: true,
          coordinates: {
            latitude: fixedBaseReference.llh.latitude,
            longitude: fixedBaseReference.llh.longitude,
            altitude: fixedBaseReference.llh.height_ellipsoid,
            accuracy: fixedBaseReference.fixed_pos_acc,
          },
        },
      },
    }));
  }, [fixedBaseReference, isDirty]);

  const updateFixedCoordinates = (patch: Partial<typeof config.baseStation.fixedMode.coordinates>) => {
    updateDraftConfig((prev) => ({
      ...prev,
      baseStation: {
        ...prev.baseStation,
        fixedMode: {
          ...prev.baseStation.fixedMode,
          coordinates: {
            ...prev.baseStation.fixedMode.coordinates,
            ...patch,
          },
        },
      },
    }));
  };

  // Shared classes for typography scaling (Matches Desktop & Mobile flawlessly)
  const inputClasses = "mt-1.5 h-11 text-sm font-medium bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100 shadow-sm";
  const labelClasses = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
  const boxClasses = "p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 shadow-sm";

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-full animate-in fade-in duration-300 pb-6 md:pb-8">
      
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
            
            <Button onClick={handleSave} disabled={isSaving} className="h-10 px-5 gap-2 transition-transform active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed">
              <Save className="size-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Main Layout Grid (Mobile List vs Desktop/Tablet Columns) ── */}
      <div className={`grid gap-4 md:gap-6 items-start ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>

        {/* ── COLUMN 1 ── */}
        <div className="space-y-4 md:space-y-6 flex flex-col">

          <SectionCard title="Base Station Positioning" description="Configure Survey-In constraints and operation modes" icon={Target} isMobile={isMobile} handleSave={handleSave}>
              {/*
              <div className="flex items-center justify-between p-4 md:p-5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
                <div className="pr-3">
                  <Label htmlFor="auto-mode" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">Automatic Flow Profile</Label>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Save an Auto Flow profile for this backend. The flow stays idle until the operator starts it manually.
                  </p>
                </div>
                <Switch
                  id="auto-mode"
                  checked={config.baseStation.autoMode}
                  onCheckedChange={(checked) => setConfig({ ...config, baseStation: { ...config.baseStation, autoMode: checked } })}
                />
              </div>

              {config.baseStation.autoMode && (
                <div className="relative overflow-hidden rounded-2xl border border-blue-200/70 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-950 shadow-sm">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
                  <div className="p-5 md:p-6 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                            <Play className="size-4" />
                          </div>
                          <div>
                            <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">Auto Flow Console</Label>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                              Manual launch control for the saved Auto Flow profile.
                            </p>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 pl-[3.25rem]">
                          Saving this profile does not start the flow. The operator must choose to start it.
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`px-2.5 py-1 rounded-md font-semibold text-[10px] uppercase tracking-wider shrink-0 ${
                          isAutoFlowActive
                            ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                            : 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-slate-900/80'
                        }`}
                      >
                        {isAutoFlowActive ? 'Running' : 'Idle'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 p-4 shadow-sm">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Profile</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {activeMsgType} / {config.baseStation.surveyDuration}s
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 p-4 shadow-sm">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Target</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {config.baseStation.accuracyThreshold} cm
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 p-4 shadow-sm">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Mountpoint</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {config.streams.ntrip.mountpoint || 'Not set'}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-950/40 p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                        Operator Decision
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {isAutoFlowActive
                          ? 'Auto Flow is currently running on the backend.'
                          : autoFlowPromptDismissed
                          ? 'Auto Flow is armed and waiting. Start it whenever the operator is ready.'
                          : 'Choose whether to start Auto Flow now or keep it armed for later.'}
                      </p>
                    </div>

                    {isAutoFlowActive ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleStopAutoFlow}
                        disabled={autoFlowActionPending}
                        className="w-full h-11 rounded-lg text-sm font-semibold tracking-wide transition-transform active:scale-95 shadow-sm"
                      >
                        <Square className="size-4 mr-2" />
                        Stop Auto Flow
                      </Button>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          type="button"
                          onClick={handleStartAutoFlow}
                          disabled={autoFlowActionPending}
                          className="h-11 rounded-lg text-sm font-semibold tracking-wide transition-transform active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          <Play className="size-4 mr-2" />
                          Start Auto Flow
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAutoFlowPromptDismissed(true)}
                          disabled={autoFlowActionPending}
                          className="h-11 rounded-lg text-sm font-semibold tracking-wide transition-transform active:scale-95 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        >
                          <X className="size-4 mr-2" />
                          {autoFlowPromptDismissed ? 'Skipped For Now' : 'Skip For Now'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              */}

              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-gradient-to-br from-white via-blue-50/60 to-slate-50 dark:from-slate-900 dark:via-blue-950/10 dark:to-slate-950 shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="pr-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${
                          config.baseStation.autoMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          <Activity className="size-4" />
                        </div>
                        <div>
                          <Label htmlFor="autoflow-mode" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
                            Autoflow Mode
                          </Label>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Toggling here only changes the draft. Autoflow changes on the backend only after Save & Close.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Switch
                      id="autoflow-mode"
                      checked={config.baseStation.autoMode}
                      onCheckedChange={(checked) => updateDraftConfig((prev) => ({ ...prev, baseStation: { ...prev.baseStation, autoMode: checked } }))}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 p-3.5 shadow-sm">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Backend State</div>
                      <div className={`text-sm font-semibold ${backendAutoFlowEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {backendAutoFlowEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 p-3.5 shadow-sm">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Draft State</div>
                      <div className={`text-sm font-semibold ${
                        isAutoFlowToggleDirty
                          ? 'text-amber-700 dark:text-amber-300'
                          : config.baseStation.autoMode
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {isAutoFlowToggleDirty
                          ? config.baseStation.autoMode
                            ? 'Will Enable On Save'
                            : 'Will Disable On Save'
                          : 'Synced With Backend'}
                      </div>
                    </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 p-3.5 shadow-sm">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Runtime</div>
                        <div className={`text-sm font-semibold ${isAutoFlowActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {isAutoFlowActive ? 'Currently Running' : 'Currently Idle'}
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {streams.ntrip.active && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/10 px-4 py-3 text-xs font-medium text-amber-800 dark:text-amber-200">
                  Stop NTRIP Sender before switching RTCM mode between MSM4 and MSM7.
                </div>
              )}

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
                      min={1} max={600} step={1}
                      value={[config.baseStation.surveyDuration]}
                      onValueChange={([value]) => updateDraftConfig((prev) => ({ ...prev, baseStation: { ...prev.baseStation, surveyDuration: value } }))}
                    />
                    <div className="relative">
                      <Input
                        type="number"
                        value={config.baseStation.surveyDuration || ''}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          updateDraftConfig((prev) => ({ ...prev, baseStation: { ...prev.baseStation, surveyDuration: isNaN(v) ? 0 : v } }));
                        }}
                        onBlur={(e) => {
                          let v = parseInt(e.target.value);
                          if (isNaN(v) || v < 1) v = 1;
                          updateDraftConfig((prev) => ({ ...prev, baseStation: { ...prev.baseStation, surveyDuration: v } }));
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
                      onValueChange={([value]) => updateDraftConfig((prev) => ({ ...prev, baseStation: { ...prev.baseStation, accuracyThreshold: value } }))}
                    />
                    <div className="relative">
                      <Input
                        type="number" 
                        value={config.baseStation.accuracyThreshold || ''}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          updateDraftConfig((prev) => ({ ...prev, baseStation: { ...prev.baseStation, accuracyThreshold: isNaN(v) ? 0 : v } }));
                        }}
                        onBlur={(e) => {
                          let v = parseInt(e.target.value);
                          if (isNaN(v) || v < 1) v = 1;
                          if (v > 300) v = 300;
                          updateDraftConfig((prev) => ({ ...prev, baseStation: { ...prev.baseStation, accuracyThreshold: v } }));
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
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        setFixedBaseDisplayActive(false);
                      }

                      updateDraftConfig((prev) => ({
                        ...prev,
                        baseStation: {
                          ...prev.baseStation,
                          fixedMode: { ...prev.baseStation.fixedMode, enabled: checked },
                        },
                      }));
                    }}
                  />
                </div>
                
                {config.baseStation.fixedMode.enabled && (
                  <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="fixed-lat" className={labelClasses}>Latitude</Label>
                        <Input
                          id="fixed-lat" type="number" step="0.00000001"
                          value={config.baseStation.fixedMode.coordinates.latitude}
                          onChange={(e) => updateFixedCoordinates({ latitude: parseFloat(e.target.value) || 0 })}
                          className={`${inputClasses} font-mono`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fixed-lon" className={labelClasses}>Longitude</Label>
                        <Input
                          id="fixed-lon" type="number" step="0.00000001"
                          value={config.baseStation.fixedMode.coordinates.longitude}
                          onChange={(e) => updateFixedCoordinates({ longitude: parseFloat(e.target.value) || 0 })}
                          className={`${inputClasses} font-mono`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fixed-alt" className={labelClasses}>Height (m)</Label>
                        <Input
                          id="fixed-alt" type="number" step="0.001"
                          value={config.baseStation.fixedMode.coordinates.altitude}
                          onChange={(e) => updateFixedCoordinates({ altitude: parseFloat(e.target.value) || 0 })}
                          className={`${inputClasses} font-mono`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fixed-acc" className={labelClasses}>Accuracy (m)</Label>
                        <Input
                          id="fixed-acc" type="number" step="0.001"
                          value={config.baseStation.fixedMode.coordinates.accuracy}
                          onChange={(e) => updateFixedCoordinates({ accuracy: parseFloat(e.target.value) || 0 })}
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
                        <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Bytes Sent</div>
                        <div className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-400">{streams.ntrip.dataSent} <span className="text-[10px] font-medium">B</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Bytes Recv</div>
                        <div className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-400">{streams.ntrip.dataReceived} <span className="text-[10px] font-medium">B</span></div>
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
                      <Input id="ntrip-server" value={config.streams.ntrip.server} onChange={(e) => updateNtripDraft({ server: e.target.value })} className={`${inputClasses} font-mono`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ntrip-port" className={labelClasses}>Port</Label>
                        <Input id="ntrip-port" type="number" value={config.streams.ntrip.port} onChange={(e) => updateNtripDraft({ port: parseInt(e.target.value) || 2101 })} className={`${inputClasses} font-mono`} />
                      </div>
                      <div>
                        <Label htmlFor="ntrip-mountpoint" className={labelClasses}>Mountpoint</Label>
                        <Input id="ntrip-mountpoint" value={config.streams.ntrip.mountpoint} onChange={(e) => updateNtripDraft({ mountpoint: e.target.value })} className={`${inputClasses} font-mono`} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="ntrip-user" className={labelClasses}>Username</Label>
                      <Input id="ntrip-user" value={config.streams.ntrip.username || ""} onChange={(e) => updateNtripDraft({ username: e.target.value })} className={inputClasses} />
                    </div>
                    <div>
                      <Label htmlFor="ntrip-pass" className={labelClasses}>Password</Label>
                      <div className="relative">
                        <Input id="ntrip-pass" type={showPasswords.ntripSender ? 'text' : 'password'} value={config.streams.ntrip.password} onChange={(e) => updateNtripDraft({ password: e.target.value })} className={`${inputClasses} pr-10`} />
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
                    disabled={isNtripActionPending || !config.streams.ntrip.server || !config.streams.ntrip.mountpoint || !config.streams.ntrip.password}
                  >
                    {isNtripActionPending
                      ? streams.ntrip.active ? "STOPPING SENDER..." : "STARTING SENDER..."
                      : streams.ntrip.active ? "STOP SENDER" : "START SENDER"}
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

        {/* ── COLUMN 2 ── */}
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
