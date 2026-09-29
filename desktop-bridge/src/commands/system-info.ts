import os from 'os';

export interface SystemInfoResult {
  platform: string;
  osRelease: string;
  hostname: string;
  architecture: string;
  cpus: {
    model: string;
    count: number;
    speedMhz: number;
  };
  memory: {
    totalGb: number;
    freeGb: number;
    usedPercent: number;
  };
  uptimeHours: number;
  message: string;
}

export function getSystemInfo(): SystemInfoResult {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const totalGb = Math.round((totalMem / (1024 ** 3)) * 10) / 10;
  const freeGb = Math.round((freeMem / (1024 ** 3)) * 10) / 10;
  const usedPercent = Math.round((usedMem / totalMem) * 100);
  const uptimeHours = Math.round((os.uptime() / 3600) * 10) / 10;

  const cpuModel = cpus[0]?.model || 'Generic CPU';
  const cpuCount = cpus.length;

  return {
    platform: 'Windows',
    osRelease: os.release(),
    hostname: os.hostname(),
    architecture: os.arch(),
    cpus: {
      model: cpuModel,
      count: cpuCount,
      speedMhz: cpus[0]?.speed || 0,
    },
    memory: {
      totalGb,
      freeGb,
      usedPercent,
    },
    uptimeHours,
    message: `Windows on ${cpuModel} (${cpuCount} cores), ${totalGb} GB RAM (${usedPercent}% in use), uptime ${uptimeHours} hours.`,
  };
}
