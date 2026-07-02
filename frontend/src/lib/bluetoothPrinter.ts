/**
 * Bluetooth Thermal Printer Manager
 *
 * Menggunakan Web Bluetooth API (Chrome/Edge)
 * Support printer: Epson, Star, Generic ESC/POS (Gprinter, Rongta, Xprinter, dll)
 *
 * UUID Service standar ESC/POS BLE:
 * - Generic: 000018f0-0000-1000-8000-00805f9b34fb
 * - BLE Serial: 6e400001-b5a3-f393-e0a9-e50e24dcca9e (Nordic UART)
 */

// Known BLE service UUIDs untuk printer thermal
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',  // Generic ESC/POS
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',  // Nordic UART (banyak printer China)
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',  // Microchip
  '0000ff00-0000-1000-8000-00805f9b34fb',  // Generic
]

const PRINTER_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',  // Generic write
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',  // Nordic UART TX
  '0000ff02-0000-1000-8000-00805f9b34fb',  // Generic write 2
  '000018f1-0000-1000-8000-00805f9b34fb',  // Write characteristic
]

export interface PrinterDevice {
  id: string
  name: string
  device: BluetoothDevice
  server?: BluetoothRemoteGATTServer
  characteristic?: BluetoothRemoteGATTCharacteristic
}

export interface PrinterSettings {
  deviceId?: string
  deviceName?: string
  paperWidth: 32 | 48   // 32 = 58mm, 48 = 80mm
  characterSet: string
}

const DEFAULT_SETTINGS: PrinterSettings = {
  paperWidth: 32,
  characterSet: 'PC437',
}

class BluetoothPrinterManager {
  private connected: PrinterDevice | null = null

  /** Cek apakah Web Bluetooth tersedia di browser ini */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  }

  /** Cek apakah sudah terkoneksi */
  isConnected(): boolean {
    return !!(this.connected?.server?.connected)
  }

  getConnectedDevice(): PrinterDevice | null {
    return this.connected
  }

  /** Scan dan pilih printer Bluetooth */
  async connect(): Promise<PrinterDevice> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth tidak didukung browser ini. Gunakan Chrome/Edge.')
    }

    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES,
    })

    return this.connectToDevice(device)
  }

  /** Connect ke device yang sudah dipilih */
  private async connectToDevice(device: BluetoothDevice): Promise<PrinterDevice> {
    if (!device.gatt) throw new Error('GATT tidak tersedia pada device ini.')

    const server = await device.gatt.connect()

    // Coba setiap service UUID yang dikenal
    let characteristic: BluetoothRemoteGATTCharacteristic | undefined

    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid)
        // Coba setiap characteristic UUID
        for (const charUuid of PRINTER_CHARACTERISTICS) {
          try {
            characteristic = await service.getCharacteristic(charUuid)
            break
          } catch {}
        }
        if (characteristic) break
      } catch {}
    }

    // Fallback: ambil semua service dan characteristic yang writeable
    if (!characteristic) {
      const services = await server.getPrimaryServices()
      for (const svc of services) {
        const chars = await svc.getCharacteristics()
        for (const ch of chars) {
          if (ch.properties.write || ch.properties.writeWithoutResponse) {
            characteristic = ch
            break
          }
        }
        if (characteristic) break
      }
    }

    if (!characteristic) {
      throw new Error('Tidak menemukan characteristic printer yang kompatibel.')
    }

    // Handle disconnect event
    device.addEventListener('gattserverdisconnected', () => {
      this.connected = null
    })

    this.connected = { id: device.id, name: device.name ?? 'Printer', device, server, characteristic }
    return this.connected
  }

  /** Disconnect */
  async disconnect(): Promise<void> {
    this.connected?.device.gatt?.disconnect()
    this.connected = null
  }

  /** Kirim raw bytes ke printer */
  async print(data: Uint8Array): Promise<void> {
    if (!this.connected?.characteristic) {
      throw new Error('Printer belum terkoneksi.')
    }

    // Printer BLE biasanya punya MTU limit (20-512 bytes)
    // Chunk data kalau terlalu besar
    const CHUNK_SIZE = 200
    const char = this.connected.characteristic

    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE)
      try {
        // Coba writeWithoutResponse dulu (lebih cepat)
        if (char.properties.writeWithoutResponse) {
          await char.writeValueWithoutResponse(chunk)
        } else {
          await char.writeValue(chunk)
        }
        // Delay kecil antar chunk
        await new Promise(r => setTimeout(r, 30))
      } catch (e) {
        throw new Error(`Gagal mengirim data ke printer: ${e}`)
      }
    }
  }
}

// Singleton
export const printerManager = new BluetoothPrinterManager()

/** Simpan/ambil settings printer dari localStorage */
export const printerStorage = {
  save: (settings: PrinterSettings) => {
    localStorage.setItem('printer_settings', JSON.stringify(settings))
  },
  load: (): PrinterSettings => {
    try {
      const raw = localStorage.getItem('printer_settings')
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {}
    return DEFAULT_SETTINGS
  },
  clear: () => localStorage.removeItem('printer_settings'),
}
