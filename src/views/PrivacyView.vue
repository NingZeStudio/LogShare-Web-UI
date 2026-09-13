<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  PhLockKey as LockKey,
  PhChartLineUp as ChartLineUp,
  PhShieldCheck as ShieldCheck,
  PhTrash as Trash,
  PhBrain as Brain,
  PhEyeSlash as EyeSlash,
  PhCpu as Cpu,
  PhClockCountdown as ClockCountdown,
  PhScales as Scale,
  PhScroll as Scroll,
  PhArrowSquareOut as ExternalLink
} from '@phosphor-icons/vue'
import { t } from '@/lib/i18n'

const activeSection = ref<string>('introduction')

const scrollToSection = (id: string) => {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const sections = [
  { id: 'introduction', title: '一、引言与隐私原则', icon: LockKey },
  { id: 'log-data', title: '二、用户主动提交的日志数据', icon: EyeSlash },
  { id: 'telemetry', title: '三、系统遥测与性能监测指标（重点）', icon: ChartLineUp },
  { id: 'security-waf', title: '四、边缘安全防护与网络记录', icon: ShieldCheck },
  { id: 'ai-data', title: '五、AI 诊断服务中的数据交互', icon: Brain },
  { id: 'retention', title: '六、数据保存周期与物理销毁（TTL）', icon: ClockCountdown },
  { id: 'user-rights', title: '七、用户自决权与数据管理', icon: Trash },
  { id: 'updates', title: '八、政策修订与联系途径', icon: Scale }
]
</script>

<template>
  <div class="container mx-auto min-w-0 max-w-4xl overflow-x-clip px-3 py-6 md:py-8">
    <!-- 顶部状态栏与切换选项卡 -->
    <div
      class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4"
    >
      <div>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            <LockKey weight="duotone" class="h-3.5 w-3.5" />
            数据隐私与透明度
          </span>
          <span class="text-xs text-muted-foreground">生效日期：2026 年 9 月 13 日</span>
        </div>
        <h1 class="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {{ t('privacy_policy') }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          详细说明我们如何收集、保护并透明化处理您的日志、遥测及性能指标
        </p>
      </div>

      <!-- 快速切换到服务协议 -->
      <div
        class="flex items-center gap-2 self-start sm:self-auto rounded-lg border border-border bg-muted/30 p-1"
      >
        <RouterLink
          to="/terms"
          class="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60"
        >
          <Scroll weight="duotone" class="h-3.5 w-3.5" />
          {{ t('terms_of_service') }}
        </RouterLink>
        <span
          class="rounded-md bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
        >
          {{ t('privacy_policy') }}
        </span>
      </div>
    </div>

    <!-- 目录索引卡片 -->
    <div class="mb-8 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div
        class="mb-2.5 flex items-center justify-between text-xs font-semibold text-muted-foreground"
      >
        <span>隐私条款目录</span>
        <span class="text-[11px] font-normal">点击可快速定位至章节</span>
      </div>
      <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <button
          v-for="sec in sections"
          :key="sec.id"
          class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors hover:bg-muted"
          :class="
            activeSection === sec.id
              ? 'bg-muted/80 text-foreground font-semibold'
              : 'text-muted-foreground'
          "
          @click="scrollToSection(sec.id)"
        >
          <component :is="sec.icon" weight="duotone" class="h-4 w-4 shrink-0 text-primary" />
          <span class="truncate">{{ sec.title }}</span>
        </button>
      </div>
    </div>

    <!-- 隐私条款正文 -->
    <div class="space-y-10 text-sm leading-relaxed text-foreground">
      <!-- 一、引言与隐私原则 -->
      <section id="introduction" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <LockKey weight="duotone" class="h-5 w-5 text-primary" />
          一、引言与隐私原则
        </h2>
        <p class="text-muted-foreground">
          LogShare.CN（以下简称“我们”或“本平台”）深知个人隐私与数据安全的重要性。我们恪守《中华人民共和国网络安全法》、《中华人民共和国个人信息保护法》等法律法规原则，坚持<strong>“数据最小化”、“目的明确限制”与“安全透明”</strong>的核心准则。
        </p>
        <p class="text-muted-foreground">
          本隐私政策旨在向您公开说明：当您访问平台、提交日志或与平台服务进行网络交互时，我们所处理的数据类型、用途、安全保护手段及您享有的数据控制权利。
        </p>
      </section>

      <!-- 二、用户主动提交的日志数据 -->
      <section id="log-data" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <EyeSlash weight="duotone" class="h-5 w-5 text-primary" />
          二、用户主动提交的日志数据
        </h2>
        <div class="space-y-2 text-muted-foreground">
          <p>
            当您使用本平台的核心托管与分析功能时，我们会接收并存储您主动上传的日志文本或文件包：
          </p>
          <ul class="list-disc pl-5 space-y-1 text-xs">
            <li>
              <strong class="text-foreground">文本与文件内容：</strong>
              包含您粘贴或上传的 Minecraft/Hytale
              服务器控制台日志、启动器崩溃报告、客户端堆栈跟踪以及附加配置文件（如 .log, .txt,
              .json, .yml, .toml 等格式）；
            </li>
            <li>
              <strong class="text-foreground">辅助元数据：</strong>
              客户端上传时可选择性附带的来源标识（如启动器版本标签）、日志标题或自定义元数据键值对；
            </li>
            <li>
              <strong class="text-foreground">随机凭据：</strong>
              系统针对每次成功存储的日志生成唯一的七位随机标识符（Log
              ID）以及供持有人使用的专属删除凭证（Deletion Token）。
            </li>
          </ul>
          <div class="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs">
            <strong class="text-amber-800 dark:text-amber-300">特别建议与脱敏提示：</strong>
            <p class="mt-1 text-muted-foreground">
              为防止意外泄露，请在上传前仔细检查日志中是否包含数据库账号密码、RCON
              连接口令、公网真实公网 IP
              或私人令牌等敏感凭证。服务端虽配置有预处理过滤机制（Pre-Filters），但无法穷尽所有自定义私有格式，保护个人隐私的最佳实践是在上传前主动予以隐去。
            </p>
          </div>
        </div>
      </section>

      <!-- 三、系统遥测与性能监测指标（重点） -->
      <section id="telemetry" class="scroll-mt-20 space-y-3">
        <div class="flex items-center gap-2 border-b border-border/60 pb-2">
          <ChartLineUp weight="duotone" class="h-5 w-5 text-primary" />
          <h2 class="text-lg font-bold tracking-tight text-foreground">
            三、系统遥测与性能监测指标（Telemetry & Web Vitals）
          </h2>
          <span class="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary"
            >重点告知</span
          >
        </div>

        <p class="text-muted-foreground">
          为确保前台网页与后台 API
          在各类网络和终端设备上的高可用性与流畅响应，我们在前台前端注入了轻量级、零侵入的<strong>系统性能与体验遥测模块</strong>。
        </p>

        <div class="rounded-xl border border-border/80 bg-card p-4 space-y-4 shadow-sm">
          <h3
            class="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5"
          >
            <Cpu weight="duotone" class="h-4 w-4 text-primary" />
            1. 遥测采集的指标范围（严格限定为技术性能度量）
          </h3>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <div class="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
              <strong class="text-foreground flex items-center gap-1">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                页面核心体验指标（Web Vitals）
              </strong>
              <p class="text-muted-foreground leading-normal">
                测量网页加载与交互质量：包括首次内容绘制（FCP）、最大内容绘制（LCP）、累计布局偏移（CLS）、以及用户交互响应延迟（INP/FID）。
              </p>
            </div>
            <div class="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
              <strong class="text-foreground flex items-center gap-1">
                <span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                API 接口健康度与响应耗时
              </strong>
              <p class="text-muted-foreground leading-normal">
                前台向 API（如 <code class="text-foreground font-mono">/v1/log</code>、<code
                  class="text-foreground font-mono"
                  >/v1/limits</code
                >）发起网络请求的平均往返耗时（ms）与 HTTP 状态码（如 200, 429, 500）。
              </p>
            </div>
            <div class="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
              <strong class="text-foreground flex items-center gap-1">
                <span class="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                前端应用运行异常统计
              </strong>
              <p class="text-muted-foreground leading-normal">
                前端 JavaScript
                在解析复杂日志高亮或解压大型压缩包时产生的未捕获异常摘要与发生频次（用于前端工程师排查
                Bug）。
              </p>
            </div>
            <div class="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
              <strong class="text-foreground flex items-center gap-1">
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                粗粒度运行环境标识
              </strong>
              <p class="text-muted-foreground leading-normal">
                浏览器内核大版本与屏幕基准视口（用于检测深浅色渲染或移动端适配异常），不采集硬件序列号或设备独有指纹。
              </p>
            </div>
          </div>

          <h3
            class="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 pt-2 border-t border-border/40"
          >
            <ShieldCheck weight="duotone" class="h-4 w-4 text-emerald-500" />
            2. 严正承诺：遥测数据的绝对匿名性
          </h3>
          <ul class="list-disc pl-4 text-xs space-y-1.5 text-muted-foreground">
            <li>
              <strong class="text-foreground">绝不收集个人身份信息（PII）：</strong>
              遥测数据中<strong>绝对不包含</strong>任何真实姓名、手机号、身份证件、邮箱、社交账号或密码。
            </li>
            <li>
              <strong class="text-foreground">绝不上报用户业务私密内容：</strong>
              上报的接口监控数据中仅包含通用路径字符串（例如
              <code class="font-mono text-foreground">POST /v1/log</code
              >），绝不上报请求体中所包含的日志原文正文或私密 Token。
            </li>
            <li>
              <strong class="text-foreground">无跨站跟踪与商业画像：</strong>
              我们不使用任何第三方跨站追踪
              Cookie，不参与任何广告联盟或用户兴趣画像分析，所有遥测数据仅供 LogShare.CN
              研发运维团队进行性能调优。
            </li>
          </ul>

          <h3
            class="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 pt-2 border-t border-border/40"
          >
            <ClockCountdown weight="duotone" class="h-4 w-4 text-primary" />
            3. 存储机制与生命周期
          </h3>
          <p class="text-xs text-muted-foreground leading-normal">
            遥测上报数据到达服务端后，由聚合中间件进行窗口滑动汇总并记录于 Redis
            环形缓冲区中。系统仅保留短期时序统计指标（按小时/天聚合），历史数据将随时间推移被新数据自动循环覆盖淘汰，不作永久档案留存。
          </p>
        </div>
      </section>

      <!-- 四、边缘安全防护与网络记录 -->
      <section id="security-waf" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <ShieldCheck weight="duotone" class="h-5 w-5 text-primary" />
          四、边缘安全防护与网络记录（OpenLiteWaf & OpenLiteStats）
        </h2>
        <div class="space-y-2 text-muted-foreground">
          <p>
            为抵御针对服务器的恶意探测、SQL 注入、XSS 跨站攻击以及高频自动化 CC
            泛洪，我们在网关层运行了自主研发的边缘应用防火墙（OpenLiteWaf）与访问统计模块（OpenLiteStats）：
          </p>
          <ul class="list-disc pl-5 space-y-1 text-xs">
            <li>
              <strong class="text-foreground">攻击特征拦截记录：</strong>
              当检测到包含注入或恶意代码探测的请求时，防火墙会阻断请求并临时记录命中规则的特征。
            </li>
            <li>
              <strong class="text-foreground">IP 地址脱敏与掩码：</strong>
              在公开的安全监控大盘与常规访问统计中，所有 IP 地址均经过严格的掩码脱敏处理（例如 IPv4
              仅保留前两个字段 <code class="font-mono text-foreground">203.0.*.*</code>，IPv6
              仅保留前三个块并做折叠）。
            </li>
          </ul>
        </div>
      </section>

      <!-- 五、AI 诊断服务中的数据交互 -->
      <section id="ai-data" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <Brain weight="duotone" class="h-5 w-5 text-primary" />
          五、AI 诊断服务中的数据交互
        </h2>
        <div class="space-y-2 text-muted-foreground">
          <p>
            当您在日志详情页主动点击“使用 LogAgent 分析”或通过 API 调用
            <code class="font-mono text-foreground">/v1/ai/*</code>
            路由时，系统将启动大语言模型分析流程：
          </p>
          <ul class="list-disc pl-5 space-y-1 text-xs">
            <li>
              <strong class="text-foreground">主动触发机制：</strong>
              AI
              分析绝不会在后台对您上传的日志进行静默或非预期的扫描，只有在接收到显式分析指令后才会执行；
            </li>
            <li>
              <strong class="text-foreground">上下文裁剪与聚焦：</strong>
              LogAgent
              采用智能错误特征定位算法，仅提取与报错堆栈直接相关的核心因果窗口片段发往模型推理，最大限度减少非必要上下文的传输；
            </li>
            <li>
              <strong class="text-foreground">模型接口隐私承诺：</strong>
              平台所对接的企业级模型推理端点严格遵守商用数据保密协议，承诺传输的分析文本不参与任何公共基础大模型的训练迭代。
            </li>
          </ul>
        </div>
      </section>

      <!-- 六、数据保存周期与物理销毁（TTL） -->
      <section id="retention" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <ClockCountdown weight="duotone" class="h-5 w-5 text-primary" />
          六、数据保存周期与物理销毁（TTL）
        </h2>
        <p class="text-muted-foreground">
          LogShare.CN 实施严格的<strong>生存周期限制（TTL）与自动销毁机制</strong>：
        </p>
        <ul class="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
          <li>
            <strong class="text-foreground">自动到期清理：</strong>
            数据库存储配置了统一的数据存活时间。到期后，系统内核与数据库事件调度器将自动发起物理删除操作，彻底释放存储空间；
          </li>
          <li>
            <strong class="text-foreground">不保留隐蔽备份：</strong>
            日志一旦被主动删除或 TTL
            到期清理，其主日志记录、附加展开文件及本地分析缓存均会被不可逆地全量擦除。
          </li>
        </ul>
      </section>

      <!-- 七、用户自决权与数据管理 -->
      <section id="user-rights" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <Trash weight="duotone" class="h-5 w-5 text-primary" />
          七、用户自决权与数据管理
        </h2>
        <div class="space-y-2 text-muted-foreground">
          <p>我们尊重并充分保障用户对自身所提交数据的最高自决权：</p>
          <ul class="list-disc pl-5 space-y-1 text-xs">
            <li>
              <strong class="text-foreground">即时删除权：</strong>
              您可通过前端界面上的“删除日志”按钮，或通过调用
              <code class="font-mono text-foreground">DELETE /v1/log/{id}</code>
              并附带上传时签发的删除令牌，在任何时间即刻永久清除您的日志数据；
            </li>
            <li>
              <strong class="text-foreground">导出与分享控制：</strong>
              您可以随时将格式化日志或原始文件（Raw）下载导出至您的本地存储设备。
            </li>
          </ul>
        </div>
      </section>

      <!-- 八、政策修订与联系途径 -->
      <section id="updates" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <Scale weight="duotone" class="h-5 w-5 text-primary" />
          八、政策修订与联系途径
        </h2>
        <p class="text-muted-foreground">
          随着平台技术架构升级、新功能推出或相关法律法规调整，我们可能会适时更新本隐私政策。任何重大变更均会在本页面及时公示，并在版本记录中予以体现。
        </p>
        <p class="text-muted-foreground">
          如您对本隐私政策、遥测指标收集机制或数据保护实践有任何疑问、意见或合规请求，欢迎通过以下渠道与开发运维团队取得联系：
        </p>
        <ul class="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
          <li>
            官方开源社区反馈：
            <a
              href="https://github.com/NingZeStudio/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >
              GitHub NingZeStudio
            </a>
          </li>
          <li>
            官方技术交流群：
            <a
              href="https://qm.qq.com/q/gZ2El58RVe"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >
              QQ 交流群
            </a>
          </li>
        </ul>
        <div
          class="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground"
        >
          <span>LogShare.CN 隐私与数据保护团队</span>
          <RouterLink
            to="/terms"
            class="inline-flex items-center gap-1 text-primary hover:underline"
          >
            阅读《服务协议》
            <ExternalLink weight="duotone" class="h-3 w-3" />
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>
