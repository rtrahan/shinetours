'use client'

import { useEffect, useRef, useState } from 'react'

interface GallerySplatViewerProps {
  className?: string
  splatUrl?: string
  fallbackSrc?: string
}

const BASE_CAMERA = {
  position: [0, -0.02, -0.42] as const,
  lookAt: [0, 0, 0.65] as const,
}

export default function GallerySplatViewer({
  className = '',
  splatUrl = '/gaussians/20240917_yale.ksplat',
  fallbackSrc = '/20240917_yale.jpg',
}: GallerySplatViewerProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const viewerRef = useRef<any>(null)
  const orientationHandlerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null)
  const parallaxFrameRef = useRef(0)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const pointerCurrentRef = useRef({ x: 0, y: 0 })
  const [isReady, setIsReady] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [needsMotionTap, setNeedsMotionTap] = useState(false)

  const setFixedCamera = () => {
    const viewer = viewerRef.current
    if (!viewer?.camera) return
    viewer.camera.position.set(...BASE_CAMERA.position)
    viewer.camera.lookAt(...BASE_CAMERA.lookAt)
    viewer.camera.updateProjectionMatrix()
  }

  const setParallaxCamera = (offsetX: number, offsetY: number) => {
    const viewer = viewerRef.current
    if (!viewer?.camera) return

    viewer.camera.position.set(
      BASE_CAMERA.position[0] + offsetX * 0.42,
      BASE_CAMERA.position[1] + offsetY * 0.24,
      BASE_CAMERA.position[2] + Math.abs(offsetX) * 0.08
    )
    viewer.camera.lookAt(
      BASE_CAMERA.lookAt[0] + offsetX * 0.2,
      BASE_CAMERA.lookAt[1] + offsetY * 0.12,
      BASE_CAMERA.lookAt[2]
    )
    viewer.camera.updateProjectionMatrix()
  }

  const setMotionCamera = (beta: number, gamma: number) => {
    const tiltX = Math.max(-1, Math.min(1, gamma / 45))
    const tiltY = Math.max(-1, Math.min(1, (beta - 45) / 45))

    setParallaxCamera(tiltX * 0.95, tiltY * 0.85)
  }

  const enableDeviceMotion = async () => {
    const DeviceOrientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }

    if (typeof DeviceOrientation?.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientation.requestPermission()
        if (permission !== 'granted') return false
      } catch {
        return false
      }
    }

    if (orientationHandlerRef.current) {
      window.removeEventListener('deviceorientation', orientationHandlerRef.current, true)
    }

    orientationHandlerRef.current = (event: DeviceOrientationEvent) => {
      setMotionCamera(event.beta ?? 0, event.gamma ?? 0)
    }

    window.addEventListener('deviceorientation', orientationHandlerRef.current, true)
    setNeedsMotionTap(false)
    return true
  }

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 767px)').matches

    if (prefersReducedMotion || isMobile) return

    const handlePointerMove = (event: PointerEvent) => {
      pointerTargetRef.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      }
    }

    const handlePointerLeave = () => {
      pointerTargetRef.current = { x: 0, y: 0 }
    }

    const animateMouseParallax = () => {
      const current = pointerCurrentRef.current
      const target = pointerTargetRef.current

      current.x += (target.x - current.x) * 0.13
      current.y += (target.y - current.y) * 0.13
      setParallaxCamera(current.x, current.y)

      if (imageRef.current) {
        imageRef.current.style.transform = `scale(1.06) translate3d(${-current.x * 30}px, ${-current.y * 22}px, 0)`
      }

      parallaxFrameRef.current = requestAnimationFrame(animateMouseParallax)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerleave', handlePointerLeave)
    parallaxFrameRef.current = requestAnimationFrame(animateMouseParallax)

    return () => {
      cancelAnimationFrame(parallaxFrameRef.current)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 767px)').matches

    if (prefersReducedMotion) {
      setUseFallback(true)
      return
    }

    const container = containerRef.current
    if (!container) return

    let disposed = false

    const init = async () => {
      try {
        const GaussianSplats3D = await import('@mkkellogg/gaussian-splats-3d')

        const viewer = new GaussianSplats3D.Viewer({
          rootElement: container,
          sharedMemoryForWorkers: false,
          selfDrivenMode: true,
          useBuiltInControls: false,
          showLoadingUI: false,
          cameraUp: [0, -1, 0],
          initialCameraPosition: [...BASE_CAMERA.position],
          initialCameraLookAt: [...BASE_CAMERA.lookAt],
        })

        viewerRef.current = viewer

        await viewer
          .addSplatScene(splatUrl, {
            splatAlphaRemovalThreshold: 18,
            showLoadingUI: false,
            progressiveLoad: isMobile,
            position: [0, 0, 0],
            scale: [1, 1, 1],
          })
          .catch((err: unknown) => {
            if (!disposed) throw err
          })

        if (disposed) {
          await viewer.dispose().catch(() => {})
          return
        }

        viewer.start()
        setFixedCamera()
        setIsReady(true)

        if (isMobile) {
          const DeviceOrientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
            requestPermission?: () => Promise<'granted' | 'denied'>
          }

          if (typeof DeviceOrientation?.requestPermission === 'function') {
            setNeedsMotionTap(true)
          } else {
            await enableDeviceMotion()
          }
        }
      } catch (error) {
        console.error('Failed to load gallery splat:', error)
        setUseFallback(true)
      }
    }

    init()

    return () => {
      disposed = true
      if (orientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', orientationHandlerRef.current, true)
      }
      if (viewerRef.current) {
        viewerRef.current.dispose().catch(() => {})
        viewerRef.current = null
      }
    }
  }, [splatUrl])

  if (useFallback) {
    return (
      <div ref={stageRef} className={`relative overflow-hidden bg-stone-950 ${className}`}>
        <img
          ref={imageRef}
          src={fallbackSrc}
          alt="Yale University Art Gallery Exterior"
          className="absolute inset-0 h-full w-full object-cover object-[center_45%] will-change-transform"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-stone-950/10" />
      </div>
    )
  }

  return (
    <div ref={stageRef} className={`relative overflow-hidden bg-stone-950 ${className}`}>
      <div
        ref={containerRef}
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <img
        ref={imageRef}
        src={fallbackSrc}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover object-[center_45%] transition-opacity duration-700 will-change-transform ${
          isReady ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(12,10,9,0.18)_0%,rgba(12,10,9,0.34)_45%,rgba(12,10,9,0.78)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/55 via-transparent to-stone-950/20" />
      {needsMotionTap && (
        <button
          type="button"
          onClick={() => {
            void enableDeviceMotion()
          }}
          className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/30 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm md:hidden"
        >
          Tap to enable motion
        </button>
      )}
    </div>
  )
}
