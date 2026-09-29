"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemInfo = getSystemInfo;
const os_1 = __importDefault(require("os"));
function getSystemInfo() {
    const cpus = os_1.default.cpus();
    const totalMem = os_1.default.totalmem();
    const freeMem = os_1.default.freemem();
    const usedMem = totalMem - freeMem;
    const totalGb = Math.round((totalMem / (1024 ** 3)) * 10) / 10;
    const freeGb = Math.round((freeMem / (1024 ** 3)) * 10) / 10;
    const usedPercent = Math.round((usedMem / totalMem) * 100);
    const uptimeHours = Math.round((os_1.default.uptime() / 3600) * 10) / 10;
    const cpuModel = cpus[0]?.model || 'Generic CPU';
    const cpuCount = cpus.length;
    return {
        platform: 'Windows',
        osRelease: os_1.default.release(),
        hostname: os_1.default.hostname(),
        architecture: os_1.default.arch(),
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
