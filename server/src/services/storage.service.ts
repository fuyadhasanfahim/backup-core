import { exec } from "child_process";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";
import { config } from "../config/env";
import logger from "../utils/logger";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export class StorageService {
  /**
   * Get current disk usage (cross-platform)
   */
  async getStorageInfo() {
    try {
      if (process.platform === "win32") {
        return this.getWindowsStorageInfo();
      }
      return this.getLinuxStorageInfo();
    } catch (error) {
      logger.error("Failed to get storage info:", error);
      // Return safe fallback instead of throwing to prevent dashboard crashes
      return {
        total: "0 GB", used: "0 GB", free: "0 GB", usePercent: 0,
        backupSize: "0 GB", totalGB: 0, usedGB: 0, freeGB: 0, backupGB: 0
      };
    }
  }

  /**
   * Windows-specific storage info using PowerShell (CIM Interface)
   */
  private async getWindowsStorageInfo() {
    // Get drive letter of backup directory (default to C if not found)
    const backupPath = config.backupDir; 
    let driveLetter = backupPath.includes(":") ? backupPath.split(":")[0] : "C";
    driveLetter = driveLetter.replace(/\\|\//g, ""); // Clean formatting

    // 1. Get disk info (CIM is more reliable than Get-PSDrive for 'Size')
    const { stdout: psDisk } = await execAsync(
      `powershell -Command "Get-CimInstance Win32_LogicalDisk -Filter \\"DeviceID='${driveLetter}:'\\" | Select-Object Size, FreeSpace | ConvertTo-Json"`
    );
    
    let totalGB = 0;
    let freeGB = 0;
    let usedGB = 0;
    let usePercent = 0;

    if (psDisk.trim()) {
      const diskData = JSON.parse(psDisk);
      totalGB = Math.round((diskData.Size || 0) / 1073741824);
      freeGB = Math.round((diskData.FreeSpace || 0) / 1073741824);
      usedGB = totalGB - freeGB;
      usePercent = totalGB > 0 ? Math.round((usedGB / totalGB) * 100) : 0;
    }

    // 2. Get backup directory size
    let backupGB = 0;
    try {
      // Use Force to include hidden files and handle permission errors gracefully
      const { stdout: psDir } = await execAsync(
        `powershell -Command "if (Test-Path '${backupPath}') { (Get-ChildItem -Path '${backupPath}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum } else { 0 }"`
      );
      backupGB = parseFloat(psDir.trim() || "0") / 1073741824;
    } catch (err) {
      logger.warn(`Could not get Windows backup directory size: ${err}`);
    }

    return {
      total: `${totalGB} GB`,
      used: `${usedGB} GB`,
      free: `${freeGB} GB`,
      usePercent,
      backupSize: `${backupGB.toFixed(2)} GB`,
      totalGB,
      usedGB,
      freeGB,
      backupGB,
    };
  }

  /**
   * Linux-specific storage info using df/du
   */
  private async getLinuxStorageInfo() {
    // Get root filesystem info
    const { stdout: dfOutput } = await execAsync("df -BG / | tail -1");
    const parts = dfOutput.trim().split(/\s+/);

    // parts: [filesystem, size, used, avail, use%, mountpoint]
    const totalGB = parseFloat(parts[1]?.replace("G", "") || "0");
    const usedGB = parseFloat(parts[2]?.replace("G", "") || "0");
    const freeGB = parseFloat(parts[3]?.replace("G", "") || "0");
    const usePercent = parseInt(parts[4]?.replace("%", "") || "0", 10);

    // Get backup directory size
    let backupGB = 0;
    try {
      const { stdout: duOutput } = await execAsync(
        `du -sB1 ${config.backupDir} 2>/dev/null | cut -f1`
      );
      backupGB = parseFloat(duOutput.trim()) / 1073741824; // bytes to GB
    } catch {
      logger.warn("Could not get backup directory size");
    }

    return {
      total: `${totalGB} GB`,
      used: `${usedGB} GB`,
      free: `${freeGB} GB`,
      usePercent,
      backupSize: `${backupGB.toFixed(2)} GB`,
      totalGB,
      usedGB,
      freeGB,
      backupGB,
    };
  }

  /**
   * Save a storage snapshot (called periodically or after backup)
   */
  async saveSnapshot() {
    const info = await this.getStorageInfo();

    return prisma.storageSnapshot.create({
      data: {
        totalGB: info.totalGB,
        usedGB: info.usedGB,
        freeGB: info.freeGB,
        backupGB: info.backupGB,
      },
    });
  }

  /**
   * Get storage history for charts
   */
  async getStorageHistory(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.storageSnapshot.findMany({
      where: {
        date: { gte: since },
      },
      orderBy: { date: "asc" },
    });
  }
}

export const storageService = new StorageService();
