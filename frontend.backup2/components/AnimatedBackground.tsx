'use client'
import { useEffect, useRef } from 'react'

interface Orb {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    console.log('[AnimatedBackground] canvas mounted, size will be', window.innerWidth, 'x', window.innerHeight)

    const orbs: Orb[] = [
      { x: 0.2, y: 0.3, vx: 0.0003, vy: 0.0002, r: 0.55, color: '45, 156, 219' },
      { x: 0.8, y: 0.6, vx: -0.0002, vy: 0.0003, r: 0.5, color: '0, 198, 255' },
      { x: 0.5, y: 0.8, vx: 0.0001, vy: -0.0002, r: 0.45, color: '29, 78, 216' },
    ]

    let animId: number

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    function draw() {
      if (!canvas || !ctx) return

      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-background').trim()
      ctx.fillStyle = bgColor || '#060B18'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      orbs.forEach(orb => {
        orb.x += orb.vx
        orb.y += orb.vy

        if (orb.x < 0 || orb.x > 1) orb.vx *= -1
        if (orb.y < 0 || orb.y > 1) orb.vy *= -1

        const cx = orb.x * canvas.width
        const cy = orb.y * canvas.height
        const radius = orb.r * Math.min(canvas.width, canvas.height)

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        gradient.addColorStop(0, `rgba(${orb.color}, 0.35)`)
        gradient.addColorStop(0.5, `rgba(${orb.color}, 0.12)`)
        gradient.addColorStop(1, `rgba(${orb.color}, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  )
}
