<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  PhScroll as Scroll,
  PhShieldCheck as ShieldCheck,
  PhWarningOctagon as WarningOctagon,
  PhBrain as Brain,
  PhFileCode as FileCode,
  PhScales as Scale,
  PhCheckCircle as CheckCircle,
  PhArrowSquareOut as ExternalLink,
  PhLockKey as LockKey
} from '@phosphor-icons/vue'
import { t } from '@/lib/i18n'

const activeSection = ref<string>('acceptance')

const scrollToSection = (id: string) => {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const sections = [
  { id: 'acceptance', title: '一、导言与协议接纳', icon: Scroll },
  { id: 'services', title: '二、平台服务定位与功能', icon: FileCode },
  { id: 'rules', title: '三、用户使用规范与合规红线', icon: WarningOctagon },
  { id: 'content', title: '四、数据提交、权属与许可', icon: CheckCircle },
  { id: 'ai-disclaimer', title: '五、AI 诊断与 Codex 规则免责声明', icon: Brain },
  { id: 'liability', title: '六、服务可用性与有限责任', icon: ShieldCheck },
  { id: 'governing-law', title: '七、协议修订与管辖法律', icon: Scale }
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
            class="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            <Scroll weight="duotone" class="h-3.5 w-3.5" />
            法律协议与合规
          </span>
          <span class="text-xs text-muted-foreground">生效日期：2026 年 9 月 13 日</span>
        </div>
        <h1 class="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {{ t('terms_of_service') }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          LogShare.CN 平台使用规则、权利义务与服务准则
        </p>
      </div>

      <!-- 快速切换到隐私政策 -->
      <div
        class="flex items-center gap-2 self-start sm:self-auto rounded-lg border border-border bg-muted/30 p-1"
      >
        <span
          class="rounded-md bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
        >
          {{ t('terms_of_service') }}
        </span>
        <RouterLink
          to="/privacy"
          class="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60"
        >
          <LockKey weight="duotone" class="h-3.5 w-3.5" />
          {{ t('privacy_policy') }}
        </RouterLink>
      </div>
    </div>

    <!-- 目录快速跳转与概览 -->
    <div class="mb-8 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div
        class="mb-2.5 flex items-center justify-between text-xs font-semibold text-muted-foreground"
      >
        <span>条款目录索引</span>
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

    <!-- 条款正文区 -->
    <div class="space-y-10 text-sm leading-relaxed text-foreground">
      <!-- 一、导言与协议接纳 -->
      <section id="acceptance" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <Scroll weight="duotone" class="h-5 w-5 text-primary" />
          一、导言与协议接纳
        </h2>
        <p class="text-muted-foreground">
          欢迎使用
          LogShare.CN（以下简称“本平台”或“我们”）。本平台是由独立开发者及开源社区协作维护的沙盒游戏（如
          Minecraft、Hytale）日志托管、协同排查与自动化诊断服务系统。
        </p>
        <p class="text-muted-foreground">
          在您访问、浏览本平台，或通过 Web
          界面、命令行工具、客户端第三方集成插件（包含但不限于各类启动器、服务器管理面板）调用 API
          服务前，请您务必仔细阅读并透彻理解本《服务协议》（以下简称“本协议”）。
        </p>
        <div
          class="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground"
        >
          <strong class="text-foreground">特别提示：</strong>
          当您勾选、点击提交、或通过 API
          端点上传任何日志数据即表示您已自愿且完全接纳本协议所有条款及配套的
          <RouterLink to="/privacy" class="text-primary hover:underline">《隐私政策》</RouterLink
          >。如您不同意本协议的任一条款，请立即停止访问并停止使用本平台提供的任何服务。
        </div>
      </section>

      <!-- 二、平台服务定位与功能 -->
      <section id="services" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <FileCode weight="duotone" class="h-5 w-5 text-primary" />
          二、平台服务定位与功能
        </h2>
        <p class="text-muted-foreground">
          LogShare.CN
          专注于为游戏开服人员、Mod/插件开发者和玩家社区提供高效的故障协同处理基础设施，主要功能包含：
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-muted-foreground">
          <li>
            <strong class="text-foreground">日志在线托管与分享：</strong>
            支持上传纯文本日志文件或包含多文件的压缩包（.zip，系统安全解压且支持解压防护上限），并生成高可读性、具备语法高亮与行号对齐的公开或特定分享链接；
          </li>
          <li>
            <strong class="text-foreground">Codex 规则库与模式匹配分析：</strong>
            由服务端高效模式识别算法自动提取崩溃根因、Mod 依赖缺失及环境信息（如 Java
            版本、游戏核心架构等）；
          </li>
          <li>
            <strong class="text-foreground">LogAgent 智能辅助诊断（AI）：</strong>
            基于多模型协同与专业知识库（RAG），结合智能日志局部探测工具，为难以直观排查的疑难崩溃提供针对性分析建议；
          </li>
          <li>
            <strong class="text-foreground">开放 HTTP RESTful API：</strong>
            向启动器、面板及自动化脚本提供全链路 Brotli / Gzip 压缩支持的高性能存取与诊断接口。
          </li>
        </ul>
      </section>

      <!-- 三、用户使用规范与合规红线 -->
      <section id="rules" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <WarningOctagon weight="duotone" class="h-5 w-5 text-destructive" />
          三、用户使用规范与合规红线
        </h2>
        <p class="text-muted-foreground">
          用户在使用本平台时，必须严格遵守所在国家或地区的相关法律法规，恪守互联网公序良俗与网络安全准则。严禁利用本平台进行任何违法、违规或恶意行为。
        </p>

        <div class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
          <h3
            class="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5"
          >
            <WarningOctagon weight="duotone" class="h-4 w-4" />
            严格禁止下列行为（触发即立即阻断并保留追究法律责任之权利）：
          </h3>
          <ul class="list-disc pl-4 text-xs space-y-1 text-muted-foreground">
            <li>
              上传、张贴、存储任何危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一的内容；
            </li>
            <li>上传包含淫秽、色情、赌博、暴力、恐怖活动或教唆犯罪的内容；</li>
            <li>上传包含侮辱、诽谤、人身攻击、侵犯他人名誉权或侵犯第三方隐私机密的数据；</li>
            <li>
              上传任何形式的计算机恶意可执行病毒、木马、蠕虫、特洛伊木马、挂马脚本或恶意构造的压缩炸弹（Decompression
              Bomb）；
            </li>
            <li>
              利用自动化工具对本平台 API 发起无意义高频爆破、拒绝服务攻击（DDoS / CC
              泛洪）、未授权穿透探测或恶意爬取；
            </li>
            <li>
              恶意绕过或试图破解平台安全防护屏障（包含 OpenLiteWaf
              边缘防火墙、速率限制或删除凭证鉴权机制）。
            </li>
          </ul>
        </div>
        <p class="text-xs text-muted-foreground">
          系统前置部署有智能边缘应用防火墙（OpenLiteWaf），针对异常网络特征与恶意载荷将执行实时自动熔断、请求阻断及
          IP 级防护封禁。
        </p>
      </section>

      <!-- 四、数据提交、权属与许可 -->
      <section id="content" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <CheckCircle weight="duotone" class="h-5 w-5 text-primary" />
          四、数据提交、权属与许可
        </h2>
        <div class="space-y-2 text-muted-foreground">
          <p>
            <strong class="text-foreground">1. 内容所有权：</strong>
            您在平台上传或提交的日志、配置文件等原始内容，其著作权及知识产权仍归您或合法权利人所有。
          </p>
          <p>
            <strong class="text-foreground">2. 服务运营许可：</strong>
            为实现日志分享、错误定位、页面渲染及 AI
            诊断服务，您授予本平台全球范围内的、非独占的、免许可费用的技术使用许可，仅限于本平台内部进行安全扫描、缓存存储、文本切片、多端格式化渲染以及传递给诊断分析引擎处理。
          </p>
          <p>
            <strong class="text-foreground">3. 敏感数据脱敏倡议：</strong>
            服务器日志通常可能意外记录了诸如 RCON 管理密码、数据库连接串、私有 API Key
            或局域网内网拓扑。
            <span class="text-foreground font-medium"
              >请在上传前务必主动检查并剔除高危私密凭证。</span
            >
            平台虽然内置了敏感信息预过滤（Pre-Filters），但无法保证识别并消除所有自创格式的敏感字段，因用户未脱敏导致的隐私外泄由用户自行承担。
          </p>
          <p>
            <strong class="text-foreground">4. 删除与注销自决权：</strong>
            对于每次成功上传的日志记录，系统均会签发唯一的随机删除令牌（Deletion
            Token）。持有该令牌的客户端或用户可随时发起强制销毁请求，服务端将即刻物理清除对应日志记录及其关联附加文件。
          </p>
        </div>
      </section>

      <!-- 五、AI 诊断与 Codex 规则免责声明 -->
      <section id="ai-disclaimer" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <Brain weight="duotone" class="h-5 w-5 text-primary" />
          五、AI 诊断与 Codex 规则免责声明
        </h2>
        <div class="space-y-2 text-muted-foreground">
          <p>
            本平台所提供的 Codex 规则识别与 LogAgent
            大语言模型诊断仅作为<strong>辅助排查工具与技术参考建议</strong>，绝不构成任何确定性的技术担保或官方实施承诺：
          </p>
          <ul class="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
            <li>
              <strong class="text-foreground">生成内容的局限性：</strong>
              人工智能分析基于已有上下文与知识库模式进行推理，可能存在幻觉、未预见的误报或方案不匹配；
            </li>
            <li>
              <strong class="text-foreground">操作责任自负：</strong>
              在采纳 AI
              或诊断结果对生产服务器、游戏存档、核心配置文件进行增删或升级操作前，您有责任进行充分验证并在本地完成完整数据备份。因直接套用诊断建议造成的存档损坏、服务器故障或数据丢失，本平台不承担任何法律与经济责任。
            </li>
          </ul>
        </div>
      </section>

      <!-- 六、服务可用性与有限责任 -->
      <section id="liability" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <ShieldCheck weight="duotone" class="h-5 w-5 text-primary" />
          六、服务可用性与有限责任
        </h2>
        <div class="space-y-2 text-muted-foreground">
          <p>
            1.
            本平台属于非商业性质的开源与社区公益服务。团队将尽商业上合理的技术努力保障高可用性与系统稳定，但<strong
              >不承诺服务 100% 不发生中断、延迟或不可用</strong
            >。
          </p>
          <p>
            2. <strong class="text-foreground">生命周期（TTL）机制：</strong>
            本平台并非永久冷存储网盘。所有上传的日志均受
            TTL（生存周期）策略管理，过期记录将由系统自动安全清理释放。如需长期存档，请用户自行下载保存在本地介质中。
          </p>
          <p>
            3.
            对于因不可抗力（包括但不限于自然灾害、政府管制、骨干网络故障、电力故障、上游云服务商中断等）导致的服务暂时中断或数据灭失，本平台在法律允许的最大范围内予以免责。
          </p>
        </div>
      </section>

      <!-- 七、协议修订与管辖法律 -->
      <section id="governing-law" class="scroll-mt-20 space-y-3">
        <h2
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground border-b border-border/60 pb-2"
        >
          <Scale weight="duotone" class="h-5 w-5 text-primary" />
          七、协议修订与管辖法律
        </h2>
        <p class="text-muted-foreground">
          本平台有权根据法律法规变更、业务升级或服务调整适时修订本协议。修订后的协议一旦公布即行生效，并替代原协议版本。您在协议更新后继续访问或使用本平台，即视为您接受经修订的协议。
        </p>
        <p class="text-muted-foreground">
          本协议之订立、生效、解释、修订、补充、终止及争议解决均适用中华人民共和国大陆地区法律法规。如发生争议，双方应友好协商解决；协商未果的，任何一方均可向平台运营主体所在地具有管辖权的人民法院提起诉讼。
        </p>
        <div
          class="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground"
        >
          <span>LogShare.CN 团队 保留所有解释权利</span>
          <RouterLink
            to="/privacy"
            class="inline-flex items-center gap-1 text-primary hover:underline"
          >
            阅读《隐私政策》
            <ExternalLink weight="duotone" class="h-3 w-3" />
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>
