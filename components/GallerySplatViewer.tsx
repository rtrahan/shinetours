'use client'

import { useEffect, useRef, useState } from 'react'

interface GallerySplatViewerProps {
  className?: string
  splatUrl?: string
  fallbackSrc?: string
  theme?: 'light' | 'dark'
  onReady?: () => void
}

const BASE_CAMERA = {
  position: [0, -0.02, -0.56] as const,
  lookAt: [0, 0, 0.65] as const,
}

export default function GallerySplatViewer({
  className = '',
  splatUrl = '/gaussians/20240917_yale.ksplat',
  fallbackSrc = '/20240917_yale.jpg',
  theme = 'dark',
  onReady,
}: GallerySplatViewerProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const viewerRef = useRef<any>(null)
  const onReadyRef = useRef(onReady)
  const orientationHandlerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null)
  const parallaxFrameRef = useRef(0)
  const scrollFrameRef = useRef(0)
  const scrollZoomRef = useRef(1)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const pointerCurrentRef = useRef({ x: 0, y: 0 })
  const [isReady, setIsReady] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [awaitingMotionGesture, setAwaitingMotionGesture] = useState(false)
  const isLightTheme = theme === 'light'
  const viewerBackground = isLightTheme ? '#faf7f0' : '#0c0a09'
  const stageBackgroundClass = isLightTheme ? 'bg-[#faf7f0]' : 'bg-stone-950'
  const fallbackOverlayClass = isLightTheme
    ? 'bg-gradient-to-t from-white/20 via-transparent to-transparent'
    : 'bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-stone-950/10'
  const vignetteClass = isLightTheme
    ? 'bg-[radial-gradient(circle_at_center,rgba(250,247,240,0.02)_0%,rgba(250,247,240,0.06)_55%,rgba(250,247,240,0.22)_100%)]'
    : 'bg-[radial-gradient(circle_at_center,rgba(12,10,9,0.18)_0%,rgba(12,10,9,0.34)_45%,rgba(12,10,9,0.78)_100%)]'
  const edgeFadeClass = isLightTheme
    ? 'bg-gradient-to-t from-white/20 via-transparent to-white/5'
    : 'bg-gradient-to-t from-stone-950/55 via-transparent to-stone-950/20'
  const sceneVerticalOffset = '5vh'
  const imageVerticalOffset = 38

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  const markReady = () => {
    setIsReady(true)
    onReadyRef.current?.()
  }

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

  const applyImageTransform = () => {
    if (!imageRef.current) return

    const current = pointerCurrentRef.current
    imageRef.current.style.transform = `scale(${1.06 * scrollZoomRef.current}) translate3d(${current.x * 30}px, ${current.y * 22 + imageVerticalOffset}px, 0)`
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
    setAwaitingMotionGesture(false)
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
      setParallaxCamera(-current.x, -current.y)

      applyImageTransform()

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
    const canTouch = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 767px)').matches
    const stage = stageRef.current

    if (prefersReducedMotion || !canTouch || !stage) return

    let isTracking = false
    let isHorizontalDrag = false
    let isVerticalScroll = false
    let startX = 0
    let startY = 0
    let startOffsetX = 0
    let settleFrame = 0

    const clamp = (value: number) => Math.max(-1, Math.min(1, value))

    const applyTouchParallax = (offsetX: number) => {
      pointerCurrentRef.current = { x: offsetX, y: 0 }
      setParallaxCamera(-offsetX, 0)
      applyImageTransform()
    }

    const settleTouchParallax = () => {
      const current = pointerCurrentRef.current
      current.x += (0 - current.x) * 0.16
      current.y = 0

      setParallaxCamera(-current.x, 0)
      applyImageTransform()

      if (Math.abs(current.x) > 0.01) {
        settleFrame = requestAnimationFrame(settleTouchParallax)
      } else {
        applyTouchParallax(0)
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return

      cancelAnimationFrame(settleFrame)
      isTracking = true
      isHorizontalDrag = false
      isVerticalScroll = false
      startX = event.clientX
      startY = event.clientY
      startOffsetX = pointerCurrentRef.current.x
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isTracking) return

      const deltaX = event.clientX - startX
      const deltaY = event.clientY - startY
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (!isHorizontalDrag && !isVerticalScroll) {
        if (absX < 8 && absY < 8) return
        if (absY > absX * 1.15) {
          isVerticalScroll = true
          return
        }
        isHorizontalDrag = true
      }

      if (!isHorizontalDrag) return

      event.preventDefault()
      applyTouchParallax(clamp(startOffsetX + deltaX / 160))
    }

    const handlePointerEnd = () => {
      if (!isTracking) return

      const shouldSettle = isHorizontalDrag
      isTracking = false
      isHorizontalDrag = false
      isVerticalScroll = false

      if (shouldSettle) {
        cancelAnimationFrame(settleFrame)
        settleFrame = requestAnimationFrame(settleTouchParallax)
      }
    }

    stage.addEventListener('pointerdown', handlePointerDown)
    stage.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)

    return () => {
      cancelAnimationFrame(settleFrame)
      stage.removeEventListener('pointerdown', handlePointerDown)
      stage.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
    }
  }, [])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let ticking = false

    const updateScrollZoom = () => {
      const stage = stageRef.current
      const viewportHeight = window.innerHeight || 1

      if (!stage) {
        ticking = false
        return
      }

      const rect = stage.getBoundingClientRect()
      const stageCenter = rect.top + rect.height / 2
      const activeDistance = (viewportHeight + rect.height) / 2
      const distanceFromCenter = Math.abs(stageCenter - viewportHeight / 2)
      const proximity = Math.max(0, Math.min(1, 1 - distanceFromCenter / activeDistance))
      const easedProximity = proximity * proximity * (3 - 2 * proximity)

      scrollZoomRef.current = 1 + easedProximity * 0.5

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(0, ${sceneVerticalOffset}, 0) scale(${scrollZoomRef.current})`
      }
      applyImageTransform()
      ticking = false
    }

    const requestScrollZoom = () => {
      if (ticking) return
      ticking = true
      scrollFrameRef.current = requestAnimationFrame(updateScrollZoom)
    }

    requestScrollZoom()
    window.addEventListener('scroll', requestScrollZoom, { passive: true })
    window.addEventListener('resize', requestScrollZoom)

    return () => {
      cancelAnimationFrame(scrollFrameRef.current)
      window.removeEventListener('scroll', requestScrollZoom)
      window.removeEventListener('resize', requestScrollZoom)
    }
  }, [])

  useEffect(() => {
    if (!awaitingMotionGesture) return

    let hasRequestedPermission = false

    const requestMotionPermission = () => {
      if (hasRequestedPermission) return
      hasRequestedPermission = true

      void enableDeviceMotion().finally(() => {
        setAwaitingMotionGesture(false)
      })
    }

    window.addEventListener('touchmove', requestMotionPermission, { passive: true, once: true })
    window.addEventListener('wheel', requestMotionPermission, { passive: true, once: true })
    window.addEventListener('scroll', requestMotionPermission, { passive: true, once: true })

    return () => {
      window.removeEventListener('touchmove', requestMotionPermission)
      window.removeEventListener('wheel', requestMotionPermission)
      window.removeEventListener('scroll', requestMotionPermission)
    }
  }, [awaitingMotionGesture])

  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.style.backgroundColor = viewerBackground
    }

    if (containerRef.current) {
      containerRef.current.style.backgroundColor = viewerBackground
      const canvas = containerRef.current.querySelector('canvas')
      if (canvas instanceof HTMLCanvasElement) {
        canvas.style.backgroundColor = viewerBackground
      }
    }

    const renderer = viewerRef.current?.renderer ?? viewerRef.current?.threeRenderer
    renderer?.setClearColor?.(viewerBackground, 1)
  }, [viewerBackground, isReady])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 767px)').matches

    setIsReady(false)
    setUseFallback(false)

    if (prefersReducedMotion || !splatUrl) {
      setUseFallback(true)
      setIsReady(true)
      onReadyRef.current?.()
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
        markReady()

        if (isMobile) {
          const DeviceOrientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
            requestPermission?: () => Promise<'granted' | 'denied'>
          }

          if (typeof DeviceOrientation?.requestPermission === 'function') {
            setAwaitingMotionGesture(true)
          } else {
            await enableDeviceMotion()
          }
        }
      } catch (error) {
        console.error('Failed to load gallery splat:', error)
        setUseFallback(true)
        onReadyRef.current?.()
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
      <div ref={stageRef} style={{ touchAction: 'pan-y' }} className={`relative overflow-hidden ${stageBackgroundClass} ${className}`}>
        <img
          ref={imageRef}
          src={fallbackSrc}
          alt="Yale University Art Gallery Exterior"
          className="absolute inset-0 h-full w-full object-cover object-[center_45%] will-change-transform"
        />
        <div className={`pointer-events-none absolute inset-0 ${fallbackOverlayClass}`} />
      </div>
    )
  }

  return (
    <div ref={stageRef} style={{ touchAction: 'pan-y' }} className={`relative overflow-hidden ${stageBackgroundClass} ${className}`}>
      <div
        ref={containerRef}
        style={{ backgroundColor: viewerBackground }}
        className={`absolute inset-0 origin-center transition-opacity duration-1000 will-change-transform ${
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
      <div className={`pointer-events-none absolute inset-0 ${vignetteClass}`} />
      <div className={`pointer-events-none absolute inset-0 ${edgeFadeClass}`} />
    </div>
  )
}
