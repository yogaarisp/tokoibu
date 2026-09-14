import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Camera, CameraOff, RefreshCw, X, Keyboard, Zap, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { imageMatcher, MatchResult } from '@/lib/imageMatcher'
import { Product } from '@/types'

interface Props {
  onDetected: (code: string) => void
  onProductMatched: (product: Product) => void
  onClose: () => void
  products: Product[]
  title?: string
}

type ScanMode = 'barcode' | 'hybrid' | 'image'

export default function SmartScanner({
  onDetected,
  onProductMatched,
  onClose,
  products,
  title = 'Smart Scanner'
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCode, setLastCode] = useState<string>('')
  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [scanMode, setScanMode] = useState<ScanMode>('hybrid')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [showCandidates, setShowCandidates] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)

  const cooldownRef = useRef(false)
  const barcodeTimeoutRef = useRef<number | null>(null)

  const prepareVideoElement = useCallback(() => {
    const video = videoRef.current
    if (!video) return null

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

  // Inisialisasi model AI
  const initAI = useCallback(async () => {
    setModelLoading(true)
    try {
      await imageMatcher.initialize()
      await imageMatcher.registerProducts(products.filter(p => p.photo_url))
    } catch (error) {
      console.error('Failed to initialize AI:', error)
    } finally {
      setModelLoading(false)
    }
  }, [products])

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader()
    initCameraList()
    initAI()

    return () => {
      readerRef.current?.reset()
      imageMatcher.clear()
    }
  }, [initCameraList, initAI])

  // Image recognition processing
  const processImageFrame = useCallback(async () => {
    if (scanMode === 'barcode' || aiProcessing) return
    if (!videoRef.current || videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return

    setAiProcessing(true)
    try {
      const matches = await imageMatcher.matchFrame(videoRef.current, products)
      console.log('Image match results:', matches) // Debug log
      setMatchResults(matches)

      if (matches.length > 0) {
        const bestMatch = matches[0]
        console.log('Best match:', bestMatch.product.name, 'Confidence:', bestMatch.confidence) // Debug log
        if (bestMatch.confidence >= 0.7) { // Turunkan threshold auto-add
          // High confidence: auto-add
          if (!cooldownRef.current) {
            cooldownRef.current = true
            onProductMatched(bestMatch.product)
            setTimeout(() => cooldownRef.current = false, 1500)
          }
        } else if (bestMatch.confidence >= 0.4) { // Turunkan threshold show candidates
          // Medium confidence: show candidates
          setShowCandidates(true)
        }
      }
    } catch (error) {
      console.error('Image processing error:', error)
    } finally {
      setAiProcessing(false)
    }
  }, [scanMode, aiProcessing, products, onProductMatched])

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

          // Trigger image recognition if no barcode found after timeout
          if (scanMode !== 'barcode') {
            if (barcodeTimeoutRef.current) {
              window.clearTimeout(barcodeTimeoutRef.current)
            }
            barcodeTimeoutRef.current = window.setTimeout(() => {
              processImageFrame()
            }, 1000)
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
  }, [lastCode, onDetected, prepareVideoElement, scanMode, processImageFrame])

  useEffect(() => {
    if (selectedCamera && !manualMode) {
      startScanning(selectedCamera)
    }
    return () => {
      readerRef.current?.reset()
      if (barcodeTimeoutRef.current) {
        window.clearTimeout(barcodeTimeoutRef.current)
      }
    }
  }, [manualMode, selectedCamera, startScanning])

  const handleManualSubmit = () => {
    if (manualInput.trim().length >= 4) {
      onDetected(manualInput.trim())
      setManualInput('')
    }
  }

  const handleCandidateSelect = (product: Product) => {
    onProductMatched(product)
    setShowCandidates(false)
    setMatchResults([])
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
              <Zap size={16} className="text-primary-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{title}</p>
              <p className="text-xs text-slate-400">
                {modelLoading ? 'Memuat AI model...' :
                 manualMode ? 'Input manual' :
                 scanMode === 'barcode' ? 'Mode Barcode' :
                 scanMode === 'image' ? 'Mode Image' : 'Mode Hybrid'}
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
        <div className="p-5 space-y-4 relative"> {/* Tambahkan relative untuk parent popup */}
          {!manualMode ? (
            <>
              {/* Scan mode toggle */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setScanMode('barcode')}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1',
                    scanMode === 'barcode' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                  )}
                >
                  <Zap size={12} />
                  Barcode
                </button>
                <button
                  onClick={() => setScanMode('hybrid')}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1',
                    scanMode === 'hybrid' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                  )}
                >
                  <Zap size={12} />+<Image size={12} />
                  Hybrid
                </button>
                <button
                  onClick={() => setScanMode('image')}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1',
                    scanMode === 'image' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                  )}
                >
                  <Image size={12} />
                  Image
                </button>
              </div>

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

                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-48 h-32">
                    {/* Bounding box corners */}
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                      <div key={pos} className={cn(
                        'absolute w-6 h-6 border-primary-400',
                        pos === 'top-left'     && 'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                        pos === 'top-right'    && 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                        pos === 'bottom-left'  && 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                        pos === 'bottom-right' && 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
                      )} />
                    ))}
                    {/* Scan line animation */}
                    {scanning && (
                      <div className="absolute left-2 right-2 h-0.5 bg-primary-400/70 rounded-full animate-bounce top-1/2" />
                    )}
                  </div>
                </div>

                {/* AI processing indicator */}
                {aiProcessing && (
                  <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-medium">AI Processing...</span>
                  </div>
                )}

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

              {/* Camera selector */}
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

              {/* Candidate products popup */}
              {showCandidates && matchResults.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl p-4 z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-800">Pilih Produk</p>
                    <button
                      onClick={() => {
                        setShowCandidates(false)
                        setMatchResults([])
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {matchResults.map((match) => (
                      <button
                        key={match.product.id}
                        onClick={() => handleCandidateSelect(match.product)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-primary-50 transition-colors text-left"
                      >
                        {match.product.photo_url && (
                          <img
                            src={match.product.photo_url}
                            alt={match.product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{match.product.name}</p>
                          <p className="text-xs text-slate-400">{Math.round(match.confidence * 100)}% match</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary-600">
                            Rp {Number(match.product.sell_price).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-center text-slate-400">
                {scanMode === 'barcode' ? 'Arahkan kamera ke barcode / QR code' :
                 scanMode === 'image' ? 'Arahkan kamera ke produk untuk identifikasi' :
                 'Scan barcode, atau tunggu 1 detik untuk identifikasi produk'}
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
