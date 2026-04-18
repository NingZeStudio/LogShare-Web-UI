<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null
let mouseX = 0
let mouseY = 0

const config = {
  dotSize: 3.5,
  dotSpacing: 30,
  baseOpacity: 0.15,
  hoverOpacity: 0.8,
  hoverRadius: 150,
  animationSpeed: 0.02,
  dotColor: {
    light: [120, 119, 198],
    dark: [120, 119, 198]
  }
}

const isDarkMode = () => {
  return document.documentElement.classList.contains('dark')
}

const drawDots = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
  const { dotSize, dotSpacing, baseOpacity, hoverOpacity, hoverRadius, dotColor } = config

  ctx.clearRect(0, 0, width, height)

  const rgb = isDarkMode() ? dotColor.dark : dotColor.light

  const cols = Math.ceil(width / dotSpacing)
  const rows = Math.ceil(height / dotSpacing)

  const waveOffset = Math.sin(time * config.animationSpeed) * 2

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * dotSpacing + dotSpacing / 2
      const y = row * dotSpacing + dotSpacing / 2 + waveOffset * Math.sin(col * 0.1)

      const dx = x - mouseX
      const dy = y - mouseY
      const distance = Math.sqrt(dx * dx + dy * dy)

      let opacity = baseOpacity
      if (distance < hoverRadius) {
        const distanceRatio = 1 - distance / hoverRadius
        opacity = baseOpacity + (hoverOpacity - baseOpacity) * distanceRatio * distanceRatio
      }

      const fadeRatio = 1 - (y / height) * 0.92
      opacity *= fadeRatio * 1.3

      ctx.beginPath()
      ctx.arc(x, y, dotSize, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`
      ctx.fill()
    }
  }
}

let time = 0
const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  time++
  drawDots(ctx, canvas.width, canvas.height, time)
  animationFrameId = requestAnimationFrame(animate)
}

const handleMouseMove = (e: MouseEvent) => {
  mouseX += (e.clientX - mouseX) * 0.1
  mouseY += (e.clientY - mouseY) * 0.1
}

const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length === 0) return

  const touch = e.touches[0]
  if (!touch) return

  mouseX = touch.clientX
  mouseY = touch.clientY
}

const handleResize = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const ctx = canvas.getContext('2d')
  if (ctx) {
    drawDots(ctx, canvas.width, canvas.height, time)
  }
}

const handleThemeChange = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (ctx) {
    drawDots(ctx, canvas.width, canvas.height, time)
  }
}

onMounted(() => {
  handleResize()

  mouseX = window.innerWidth / 2
  mouseY = window.innerHeight / 2

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('touchmove', handleTouchMove, { passive: true })
  window.addEventListener('resize', handleResize)

  const observer = new MutationObserver(handleThemeChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })

  animate()
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }

  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <Teleport to="body">
    <canvas
      ref="canvasRef"
      class="fixed inset-0 pointer-events-none"
      style="touch-action: none; z-index: 0"
    />
  </Teleport>
</template>
