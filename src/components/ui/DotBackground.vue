<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null
let mouseX = 0
let mouseY = 0

// 配置参数
const config = {
  dotSize: 3.5,             // 点的大小
  dotSpacing: 30,         // 点之间的间距
  baseOpacity: 0.15,      // 基础透明度
  hoverOpacity: 0.8,      // 悬停时的透明度
  hoverRadius: 150,       // 悬停影响半径
  animationSpeed: 0.02,   // 动画速度
  dotColor: {
    light: [120, 119, 198],  // RGB for light mode
    dark: [120, 119, 198]    // RGB for dark mode
  }
}

// 获取当前主题
const isDarkMode = () => {
  return document.documentElement.classList.contains('dark')
}

// 绘制网格点
const drawDots = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
  const { dotSize, dotSpacing, baseOpacity, hoverOpacity, hoverRadius, dotColor } = config

  ctx.clearRect(0, 0, width, height)

  const rgb = isDarkMode() ? dotColor.dark : dotColor.light

  // 计算网格
  const cols = Math.ceil(width / dotSpacing)
  const rows = Math.ceil(height / dotSpacing)

  // 添加轻微的波浪动画偏移
  const waveOffset = Math.sin(time * config.animationSpeed) * 2

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * dotSpacing + dotSpacing / 2
      const y = row * dotSpacing + dotSpacing / 2 + waveOffset * Math.sin(col * 0.1)

      // 计算与鼠标的距离
      const dx = x - mouseX
      const dy = y - mouseY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 计算透明度
      let opacity = baseOpacity
      if (distance < hoverRadius) {
        const distanceRatio = 1 - distance / hoverRadius
        opacity = baseOpacity + (hoverOpacity - baseOpacity) * distanceRatio * distanceRatio
      }

      // 添加从上往下的渐变效果（越往下越淡）
      const fadeRatio = 1 - (y / height) * 0.92  // 底部透明度降低到 8%
      opacity *= fadeRatio * 1.3  // 整体加深顶部亮度

      // 绘制点
      ctx.beginPath()
      ctx.arc(x, y, dotSize, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`
      ctx.fill()
    }
  }
}

// 动画循环
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

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  // 平滑过渡鼠标位置
  mouseX += (e.clientX - mouseX) * 0.1
  mouseY += (e.clientY - mouseY) * 0.1
}

// 处理触摸移动
const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length === 0) return

  const touch = e.touches[0]
  if (!touch) return

  mouseX = touch.clientX
  mouseY = touch.clientY
}

// 处理窗口大小变化
const handleResize = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  // 设置画布尺寸为视口大小
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // 重新绘制
  const ctx = canvas.getContext('2d')
  if (ctx) {
    drawDots(ctx, canvas.width, canvas.height, time)
  }
}

// 监听主题变化
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
  
  // 初始化鼠标位置到屏幕中心
  mouseX = window.innerWidth / 2
  mouseY = window.innerHeight / 2
  
  // 添加事件监听
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('touchmove', handleTouchMove, { passive: true })
  window.addEventListener('resize', handleResize)
  
  // 监听主题变化
  const observer = new MutationObserver(handleThemeChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
  
  // 开始动画
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
      style="touch-action: none; z-index: 0;"
    />
  </Teleport>
</template>
