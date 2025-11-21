import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, LoadStatus, CalibrationPoint, SystemConfig, THEME_COLORS } from './types';
import { calculateCalibrationCoefficients } from './utils';
import MainScreen from './components/views/MainScreen';
import SettingsMenu from './components/views/SettingsMenu';
import CalibrationScreen from './components/views/CalibrationScreen';
import BluetoothScreen from './components/views/BluetoothScreen';
import TimeSetupScreen from './components/views/TimeSetupScreen';
import { NumericKeypad, Header } from './components/Shared';
import { Zap, Bluetooth, Moon, Sun, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  // --- 1. Simulated Firmware State ---
  const [simulatedVoltage, setSimulatedVoltage] = useState(0.5); 
  
  // Bluetooth State
  const [btConnectedDevice, setBtConnectedDevice] = useState<string | null>("ProSensor-X1"); 
  
  // Time State (Offset from system time in ms)
  const [timeOffset, setTimeOffset] = useState(0);

  // --- 2. System Config (Persistent Memory) ---
  // Initializing with a "Factory Calibration" so the Demo works immediately
  const initialSlope = 2500; // (10000 - 0) / (4.5 - 0.5)
  const initialIntercept = -1250; // 0 = 2500*0.5 + c => c = -1250

  const [config, setConfig] = useState<SystemConfig>({
    maxLoad: 10000.0, // Default 10 Tonnes in KG
    isDarkMode: true,
    calibrationPoints: [
      { id: 1, voltage: 0.5, weight: 0 },
      { id: 2, voltage: 4.5, weight: 10000 }
    ],
    slope: initialSlope, 
    intercept: initialIntercept 
  });

  // --- 3. Runtime State ---
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  
  // Calculate Real-time Weight based on sensor voltage and calibration
  const currentWeight = useMemo(() => {
    if (!btConnectedDevice) return 0;
    const w = (simulatedVoltage * config.slope) + config.intercept;
    return Math.max(0, w); // Clamp negative noise
  }, [simulatedVoltage, config.slope, config.intercept, btConnectedDevice]);

  // Calculate Status Logic
  const loadPercentage = (currentWeight / config.maxLoad) * 100;
  
  let status = LoadStatus.NORMAL;
  if (loadPercentage > 100) status = LoadStatus.OVERLOAD;
  else if (loadPercentage > 95) status = LoadStatus.FULL;
  else if (loadPercentage > 85) status = LoadStatus.DANGER;
  else if (loadPercentage > 70) status = LoadStatus.WARNING;

  // --- 4. Handlers ---
  
  const handleCalibrationSave = (newPoints: CalibrationPoint[]) => {
    const [m, c] = calculateCalibrationCoefficients(newPoints);
    setConfig(prev => ({
      ...prev,
      calibrationPoints: newPoints,
      slope: m,
      intercept: c
    }));
    setView(ViewState.SETTINGS); // Return to settings after save
  };

  const handleMaxLoadSave = (valStr: string) => {
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {
      // Input is in TON, store as KG
      setConfig(prev => ({ ...prev, maxLoad: val * 1000 }));
    }
    setView(ViewState.SETTINGS);
  };

  // Helper for Demo Buttons
  const setDemoLoad = (percent: number) => {
    const targetWeight = (percent / 100) * config.maxLoad;
    // weight = slope * v + intercept  =>  v = (weight - intercept) / slope
    let targetVoltage = (targetWeight - config.intercept) / config.slope;
    // Clamp to sensor limits
    targetVoltage = Math.max(0.4, Math.min(4.7, targetVoltage));
    setSimulatedVoltage(targetVoltage);
  };

  // --- 5. Render View Router ---
  const renderView = () => {
    switch (view) {
      case ViewState.HOME:
        return (
          <MainScreen 
            currentWeight={currentWeight}
            maxLoad={config.maxLoad}
            loadPercentage={loadPercentage}
            status={status}
            darkMode={config.isDarkMode}
            isConnected={!!btConnectedDevice}
            bluetoothDeviceName={btConnectedDevice}
            timeOffset={timeOffset}
            onOpenSettings={() => setView(ViewState.SETTINGS)}
          />
        );
      case ViewState.SETTINGS:
        return (
          <SettingsMenu 
            onNavigate={setView} 
            onBack={() => setView(ViewState.HOME)}
            darkMode={config.isDarkMode}
            toggleDarkMode={() => setConfig(prev => ({...prev, isDarkMode: !prev.isDarkMode}))}
            maxLoad={config.maxLoad}
          />
        );
      case ViewState.CALIBRATION:
        return (
          <CalibrationScreen 
            currentVoltage={simulatedVoltage}
            initialPoints={config.calibrationPoints}
            onSave={handleCalibrationSave}
            onBack={() => setView(ViewState.SETTINGS)}
            darkMode={config.isDarkMode}
          />
        );
      case ViewState.MAX_LOAD_EDIT:
        return (
          <NumericKeypad 
            label="ENTER MAX CAPACITY (TON)"
            initialValue={(config.maxLoad / 1000).toString()}
            onCancel={() => setView(ViewState.SETTINGS)}
            onEnter={handleMaxLoadSave}
            darkMode={config.isDarkMode}
          />
        );
      case ViewState.SENSOR_CONN:
        return (
          <BluetoothScreen 
            connectedDevice={btConnectedDevice}
            onConnect={setBtConnectedDevice}
            onDisconnect={() => setBtConnectedDevice(null)}
            onBack={() => setView(ViewState.SETTINGS)}
            darkMode={config.isDarkMode}
          />
        );
      case ViewState.TIME_SETUP:
        return (
          <TimeSetupScreen 
            currentTimeOffset={timeOffset}
            onSave={(newOffset) => {
              setTimeOffset(newOffset);
              setView(ViewState.SETTINGS);
            }}
            onBack={() => setView(ViewState.SETTINGS)}
            darkMode={config.isDarkMode}
          />
        );
      case ViewState.SYSTEM_INFO:
        return (
          <div className={`w-full h-full flex flex-col ${config.isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
             <Header title="System Info" onBack={() => setView(ViewState.SETTINGS)} darkMode={config.isDarkMode} />
             <div className="p-4 space-y-4 text-sm font-mono">
               <div>
                 <div className="opacity-50 text-xs">FIRMWARE</div>
                 <div>v2.1.0-stable</div>
               </div>
               <div>
                 <div className="opacity-50 text-xs">HARDWARE ID</div>
                 <div>HW-992-XJ</div>
               </div>
               <div>
                 <div className="opacity-50 text-xs">CALIB SLOPE</div>
                 <div>{config.slope.toFixed(4)}</div>
               </div>
               <div>
                 <div className="opacity-50 text-xs">CALIB INTERCEPT</div>
                 <div>{config.intercept.toFixed(4)}</div>
               </div>
             </div>
          </div>
        )
      default:
        return <div>Not Implemented</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center gap-12 p-8 flex-wrap content-center">
      
      {/* --- DEVICE SIMULATION CONTAINER --- */}
      <div className="relative shadow-2xl rounded-[30px] border-[8px] border-gray-900 bg-gray-900 overflow-hidden shrink-0">
        {/* Physical Device Bezel/Screen Wrapper */}
        <div 
          className="w-[240px] h-[320px] overflow-hidden bg-black relative select-none"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {renderView()}
        </div>
        
        {/* Decorative Glare */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none rounded-r-[20px]" />
      </div>


      {/* --- SIMULATOR CONTROLS (External Tester) --- */}
      <div className="w-[320px] bg-gray-700 p-6 rounded-xl text-white shadow-xl border border-gray-600">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-600 pb-3">
          <SettingsMenu size={20} className="text-gray-400"/>
          <h2 className="text-lg font-bold">Control Panel</h2>
        </div>
        
        {/* Quick Scenarios */}
        <div className="mb-6">
          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Quick Scenarios</label>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setDemoLoad(0)} className="bg-gray-600 hover:bg-gray-500 p-2 rounded text-xs font-bold transition-colors">Empty</button>
            <button onClick={() => setDemoLoad(50)} className="bg-green-900/50 hover:bg-green-900 text-green-400 p-2 rounded text-xs font-bold transition-colors border border-green-900">Normal</button>
            <button onClick={() => setDemoLoad(75)} className="bg-yellow-900/50 hover:bg-yellow-900 text-yellow-400 p-2 rounded text-xs font-bold transition-colors border border-yellow-900">Warning</button>
            <button onClick={() => setDemoLoad(90)} className="bg-orange-900/50 hover:bg-orange-900 text-orange-400 p-2 rounded text-xs font-bold transition-colors border border-orange-900">Danger</button>
            <button onClick={() => setDemoLoad(110)} className="col-span-2 bg-red-900/50 hover:bg-red-900 text-red-400 p-2 rounded text-xs font-bold transition-colors border border-red-900 flex items-center justify-center gap-1">
              <AlertTriangle size={12}/> Overload
            </button>
          </div>
        </div>

        {/* Manual Slider */}
        <div className="mb-6 bg-gray-800 p-3 rounded-lg">
          <div className="flex justify-between mb-2">
             <label className="text-[10px] uppercase font-bold text-gray-400">Voltage Injector</label>
             <span className="text-xs font-mono text-blue-400">{simulatedVoltage.toFixed(2)} V</span>
          </div>
          <input 
            type="range" 
            min="0.4" 
            max="4.7" 
            step="0.01" 
            value={simulatedVoltage}
            onChange={(e) => setSimulatedVoltage(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* System Toggles */}
        <div className="grid grid-cols-2 gap-3">
           <button 
             onClick={() => setBtConnectedDevice(prev => prev ? null : "ProSensor-X1")}
             className={`p-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-colors border ${btConnectedDevice ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
           >
             <Bluetooth size={16} />
             {btConnectedDevice ? 'Connected' : 'Disconnected'}
           </button>

           <button 
             onClick={() => setConfig(prev => ({...prev, isDarkMode: !prev.isDarkMode}))}
             className={`p-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-colors border ${config.isDarkMode ? 'bg-purple-900/30 border-purple-800 text-purple-300' : 'bg-gray-200 border-gray-300 text-gray-800'}`}
           >
             {config.isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
             {config.isDarkMode ? 'Dark' : 'Light'}
           </button>
        </div>

        <div className="mt-6 text-[10px] text-gray-500 font-mono text-center">
           PROLOAD SIMULATOR v2.1<br/>
           <span className="opacity-50">Press buttons to trigger device states</span>
        </div>
      </div>

    </div>
  );
};

export default App;