/**
 * BarcodeScanner — komponen kamera untuk scan barcode/QR code
 *
 * Mendukung:
 * - Kamera HP (front/back) & webcam laptop
 * - Semua format: EAN-13, EAN-8, Code128, QR Code, dll
 * - Fallback input manual kalau kamera tidak tersedia
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Camera, CameraOff, RefreshCw, X, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
  title?: string
}

export default function BarcodeScanner({ onDetected, onClose, title = 'Scan Barcode' }: Props) {
  const videoRef        = useRef<HTMLVideoElement>(null)
  const readerRef       = useRef<BrowserMultiFormatReader | null>(null)
  const [cameras, setCameras]         = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [scanning, setScanning]       = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [lastCode, setLastCode]       = useState<string>('')
  const [manualMode, setManualMode]   = useState(false)
  const [manualInput, setManualInput] = useState('')
  const cooldownRef = useRef(false)

  const prepareVideoElement = useCallback(() => {
    const video = videoRef.current
    if (!video) return null

    // Safari/iOS sering butuh atribut ini agar preview kamera benar-benar tampil.
    video.muted = true
    video.autoplay = true
    video.playsInline = true
    video.setAttribute('muted', 'true')
    video.setAttribute('autoplay', 'true')
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')

    return video
  }, [])

  const initCameraList = useCallback(async () => {
    if (!readerRef.current) return

    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    if (!window.isSecureContext && !isLocalhost) {
      setError('Kamera hanya bisa dipakai lewat HTTPS atau localhost.')
      setManualMode(true)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Browser ini tidak mendukung akses kamera.')
      setManualMode(true)
      return
    }

    try {
      // Warm-up permission lebih dulu agar label kamera muncul dan preview lebih stabil.
      const warmupStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      warmupStream.getTracks().forEach((track) => track.stop())

      const devices = await readerRef.current.listVideoInputDevices()
      setCameras(devices)

      if (!devices.length) {
        setError('Kamera tidak ditemukan di perangkat ini.')
        setManualMode(true)
        return
      }

      const back = devices.find((d) =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      )

      setSelectedCamera(back?.deviceId ?? devices[0]?.deviceId ?? '')
      setError(null)
    } catch (e: any) {
      const name = e?.name ?? ''
      const message =
        name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Izinkan kamera di browser lalu coba lagi.'
          : name === 'NotFoundError'
            ? 'Perangkat ini tidak punya kamera yang bisa dipakai.'
            : name === 'NotReadableError'
              ? 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera lalu coba lagi.'
              : 'Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.'

      setError(message)
      setManualMode(true)
    }
  }, [])

  // Inisialisasi reader dan ambil daftar kamera
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader()
    initCameraList()

    return () => {
      readerRef.current?.reset()
    }
  }, [initCameraList])

  // Mulai scanning saat kamera dipilih
  const startScanning = useCallback(async (deviceId: string) => {
    if (!readerRef.current || !deviceId) return

    const video = prepareVideoElement()
    if (!video) return

    setScanning(false)
    setError(null)
    readerRef.current.reset()

    const markVideoReady = () => {
      setScanning(true)
      setError(null)
    }

    video.addEventListener('playing', markVideoReady, { once: true })

    try {
      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        video,
        (result, err) => {
          if (result) {
            // Cooldown 1.5 detik agar tidak double detect
            if (cooldownRef.current) return
            const code = result.getText()
            if (code === lastCode) return

            cooldownRef.current = true
            setLastCode(code)

            // Flash effect
            videoRef.current?.classList.add('brightness-150')
            setTimeout(() => videoRef.current?.classList.remove('brightness-150'), 200)

            onDetected(code)

            setTimeout(() => {
              cooldownRef.current = false
              setLastCode('')
            }, 1500)
          }
          if (err && !(err instanceof NotFoundException)) {
            // NotFoundException normal — artinya belum ada barcode di frame
          }
        }
      )

      await video.play().catch(() => undefined)

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        setScanning(true)
      }
    } catch (e: any) {
      const name = e?.name ?? ''
      const message =
        name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Izinkan kamera di browser lalu coba lagi.'
          : name === 'NotReadableError'
            ? 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera lalu coba lagi.'
            : 'Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.'

      setError(message)
      setManualMode(true)
    } finally {
      video.removeEventListener('playing', markVideoReady)
    }
  }, [lastCode, onDetected, prepareVideoElement])

  useEffect(() => {
    if (selectedCamera && !manualMode) {
      startScanning(selectedCamera)
    }
    return () => { readerRef.current?.reset() }
  }, [manualMode, selectedCamera, startScanning])

  const handleManualSubmit = () => {
    if (manualInput.trim().length >= 4) {
      onDetected(manualInput.trim())
      setManualInput('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
              <Camera size={16} className="text-primary-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{title}</p>
              <p className="text-xs text-slate-400">
                {manualMode ? 'Input manual' : scanning ? 'Kamera aktif — arahkan ke barcode' : 'Memulai kamera...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle manual/camera */}
            <button
              onClick={() => {
                setManualMode(!manualMode)
                if (manualMode && selectedCamera) {
                  startScanning(selectedCamera)
                } else {
                  readerRef.current?.reset()
                  setScanning(false)
                }
              }}
              className="btn-icon w-8 h-8"
              title={manualMode ? 'Pakai kamera' : 'Input manual'}
            >
              {manualMode ? <Camera size={16} /> : <Keyboard size={16} />}
            </button>
            <button onClick={onClose} className="btn-icon w-8 h-8">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {!manualMode ? (
            <>
              {/* Video feed */}
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover transition-all duration-200"
                  autoPlay
                  muted
                  playsInline
                  disablePictureInPicture
                />

                {/* Scan overlay — kotak bidik di tengah */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-48 h-32">
                    {/* Sudut-sudut kotak */}
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                      <div key={pos} className={cn(
                        'absolute w-6 h-6 border-primary-400',
                        pos === 'top-left'     && 'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                        pos === 'top-right'    && 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                        pos === 'bottom-left'  && 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                        pos === 'bottom-right' && 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
                      )} />
                    ))}
                    {/* Garis scan animasi */}
                    {scanning && (
                      <div className="absolute left-2 right-2 h-0.5 bg-primary-400/70 rounded-full animate-bounce top-1/2" />
                    )}
                  </div>
                </div>

                {/* Status overlay */}
                {!scanning && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm font-medium">Memulai kamera...</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center text-white px-4">
                      <CameraOff size={32} className="mx-auto mb-2 text-red-400" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera selector (kalau ada lebih dari 1 kamera) */}
              {cameras.length > 1 && (
                <div className="flex items-center gap-2">
                  <select
                    className="input text-sm flex-1"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                  >
                    {cameras.map((cam, i) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Kamera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => startScanning(selectedCamera)}
                    className="btn-secondary px-3"
                    title="Restart kamera"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              )}

              <p className="text-xs text-center text-slate-400">
                Arahkan kamera ke barcode / QR code pada kemasan produk
              </p>
            </>
          ) : (
            /* Manual input mode */
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <Keyboard size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Input Barcode Manual</p>
                <p className="text-xs text-slate-400 mt-1">Ketik atau scan barcode ke kolom di bawah</p>
              </div>
              <div>
                <label className="label">Kode Barcode</label>
                <input
                  type="text"
                  className="input"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="Contoh: 8999999800014"
                  autoFocus
                />
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={manualInput.length < 4}
                className="btn-primary w-full"
              >
                Cari Produk
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
