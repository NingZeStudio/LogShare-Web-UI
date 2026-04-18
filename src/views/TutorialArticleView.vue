<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const tutorialId = computed(() => route.params.id as string)

// 警告：教程数据硬编码在此文件中，扩展性差
onMounted(() => {
  const tutorial = tutorials[tutorialId.value]
  if (tutorial) {
    document.title = `${tutorial.title} - LogShare.CN`
  } else {
    document.title = '教程未找到 - LogShare.CN'
  }
})

const tutorials: Record<
  string,
  {
    title: string
    author: string
    content: {
      sections: Array<{
        title?: string
        type: string
        content?: string
        steps?: string[]
        note?: string
        code?: { lang: string; code: string }
        image?: { src: string; alt: string; caption: string }
        images?: Array<{ src: string; alt: string; caption: string }>
        conclusion?: string
      }>
    }
  }
> = {
  'mobileglues-setup': {
    title: 'Android 端 Minecraft 渲染器配置教程 - MobileGlues',
    author: '用户提供内容',
    content: {
      sections: [
        {
          type: 'warning',
          content:
            'MobileGlues（常简称为 MG 渲染器）是目前 Android 平台上性能表现最优、设备兼容性最佳的 OpenGL 转 OpenGL ES 兼容层方案。需要特别注意的是，该渲染器仅支持 Minecraft 1.17 及以上版本，低版本游戏无法正常运行。'
        },
        {
          type: 'section',
          title: '一、准备工作：下载并安装 MobileGlues',
          steps: [
            '使用浏览器（推荐使用 Chrome 或 Edge 以获得最佳兼容性）访问下载镜像站：https://mirror.lemwood.icu',
            '进入页面后，向下滚动浏览资源列表，找到 MobileGlues 项目条目，点击"下载最新版"按钮获取安装包。',
            '下载完成后，在系统提示时完成安装授权。'
          ],
          image: {
            src: 'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/e3ec6c3b38127fb6.jpg',
            alt: 'MobileGlues 下载页面示意',
            caption: 'MobileGlues 下载页面示意'
          }
        },
        {
          type: 'section',
          title: '二、ZalithLauncher 2 配置教程',
          note: 'ZalithLauncher 2 在玩家社区中也被称为 Zalith Launcher 或简称 ZL2，下文统一使用 ZL2 指代。',
          steps: [
            '完成 MobileGlues 的安装后，务必完全退出 ZL2 后台进程（即所谓"大退"，确保应用不在多任务列表中留存），然后重新启动应用。',
            '进入主界面后，点击页面右上角的设置图标（齿轮形状）进入系统设置。',
            '在设置菜单中找到"全局渲染器"选项，点击展开下拉列表，继续向下滚动浏览可用渲染器，直至找到 MobileGlues 并点击选中。'
          ],
          image: {
            src: 'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/d295ee43784912b8.jpg',
            alt: 'ZL2 渲染器设置界面',
            caption: 'ZL2 渲染器设置界面'
          },
          conclusion: '至此，ZL2 的渲染器配置已全部完成。'
        },
        {
          type: 'section',
          title: '三、FoldCraftLauncher 配置教程',
          note: 'FoldCraftLauncher 在玩家社区中常简称为 FCL，下文统一使用该简称。',
          steps: [
            '同样地，在安装好 MobileGlues 后，请先彻底关闭 FCL 后台进程，再重新打开应用以确保渲染器列表正确刷新。',
            '启动应用后，点击界面左下角的齿轮图标进入"全局游戏设置"页面。',
            '在设置列表中向下滚动，定位到"渲染器"配置项，点击该项右侧的齿轮按钮进入详细选择界面。',
            '此时会弹出渲染器选择菜单，在列表中向下滚动查找 MobileGlues 选项，点击即可完成切换。系统会自动保存设置，无需额外确认操作。'
          ],
          images: [
            {
              src: 'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/94df78d76b436a51.jpg',
              alt: 'FCL 设置入口位置',
              caption: 'FCL 设置入口位置'
            },
            {
              src: 'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/cf06c5fe5ef92300.jpg',
              alt: 'FCL 渲染器选择界面',
              caption: 'FCL 渲染器选择界面'
            }
          ]
        }
      ]
    }
  },
  'server-log-analysis': {
    title: '服务器日志分析与问题排查指南',
    author: 'Qwen 3.5 Plus',
    content: {
      sections: [
        {
          type: 'warning',
          content:
            '本教程适用于 Minecraft Java 版服务器管理员，涵盖 Spigot、Paper、Fabric 等主流服务端。在分析日志前，请确保您已获取完整的日志文件，而非仅最后几行内容。'
        },
        {
          type: 'section',
          title: '一、日志文件位置与获取',
          steps: [
            '服务器日志文件通常位于服务器根目录的 logs 文件夹中，最新日志文件名为 latest.log。',
            '历史日志会以日期命名并压缩为.gz 格式，例如 2024-01-15-1.log.gz。',
            '当服务器崩溃时，崩溃报告会生成在 crash-reports 文件夹中，文件名包含时间戳。',
            '如使用面板（如 Pterodactyl），可通过面板的文件管理功能直接查看或下载日志。'
          ]
        },
        {
          type: 'section',
          title: '二、日志结构解析',
          note: 'Minecraft 日志采用标准格式，每行包含时间戳、线程、日志级别和消息内容。',
          steps: [
            '时间戳格式：[HH:MM:SS] [Thread/Level] [级别] 消息内容',
            '常见日志级别：INFO（普通信息）、WARN（警告）、ERROR（错误）、DEBUG（调试信息）',
            '重点关注 ERROR 和 WARN 级别的日志，它们通常指示问题所在。',
            '崩溃报告包含完整的堆栈跟踪，是定位问题的关键依据。'
          ]
        },
        {
          type: 'section',
          title: '三、常见问题识别与解决',
          steps: [
            '内存不足错误（OutOfMemoryError）：增加 JVM 启动参数中的 -Xmx 值，建议设置为物理内存的 70-80%。',
            '插件冲突：查看日志中"Could not load plugin"或"Error occurred while enabling"相关报错，尝试更新或移除冲突插件。',
            '世界损坏：日志中出现"Corrupt chunk"或"RegionFile"相关错误，需从备份恢复或使用 MCA Selector 等工具修复。',
            '网络问题：出现"Connection timed out"或"Keepalive"相关警告，检查服务器端口映射和防火墙设置。',
            '模组加载失败：Fabric/Forge 启动时日志会显示模组加载进度，失败的模组会标注具体原因（版本不兼容、缺少依赖等）。'
          ]
        },
        {
          type: 'section',
          title: '四、使用 LogShare 进行智能分析',
          steps: [
            '访问 LogShare.CN 首页，点击"选择文件"上传日志文件或直接粘贴日志内容。',
            '系统会自动分析日志内容，识别服务器类型、版本和潜在问题。',
            'AI 分析功能会提供详细的问题诊断和解决方案建议。',
            '分析完成后可生成分享链接，便于向他人求助或存档记录。'
          ],
          conclusion:
            '通过 LogShare 的智能分析，即使是新手也能快速定位服务器问题并获得专业级的解决方案建议。'
        }
      ]
    }
  },
  'ask-questions-effectively': {
    title: '如何有效地提问求助指南',
    author: '社区经验总结',
    content: {
      sections: [
        {
          type: 'warning',
          content:
            '在游戏社区或技术群组中提问时，清晰、准确的问题描述能大大提高获得帮助的概率。本教程将教你如何成为一名优秀的提问者，以及如何正确地对待解答者的帮助。'
        },
        {
          type: 'section',
          title: '一、准备工作：收集必要信息',
          note: '在向他人求助前，请确保你已收集到足够的信息。解答者不是算命先生，他们只能根据你提供的信息来诊断问题。',
          steps: [
            '获取完整的日志文件：使用 LogShare.CN 或类似工具上传日志，获取分享链接。',
            '记录问题出现的具体场景：包括游戏版本、使用的启动器、安装的插件或模组列表。',
            '描述问题发生前的操作：你做了什么导致问题出现？是安装了新插件、修改了配置文件，还是其他操作？',
            '截图或录屏：如果问题涉及界面显示错误或性能问题，提供截图或短视频会更有帮助。'
          ],
          conclusion: '记住：信息越详细，解答者就能越快找到问题所在。'
        },
        {
          type: 'section',
          title: '二、如何描述问题',
          note: '一个清晰的问题描述应该包含"发生了什么"、"应该发生什么"以及"你尝试过什么"。',
          steps: [
            '明确的问题标题：不要用"求助"、"救命"等模糊的标题，应该用"服务器启动时报错 OutOfMemoryError"这样的具体描述。',
            '完整的错误信息：不要只说"报错了"，要粘贴完整的错误堆栈或错误代码。',
            '系统环境信息：包括操作系统、Java 版本、游戏版本、启动器版本等。',
            '你尝试过的解决方案：说明你已经尝试了哪些方法（重启、重装、更换配置等），这样解答者就不用重复推荐了。'
          ],
          code: {
            lang: 'text',
            code: `❌ 错示范例：
"我的服务器挂了，谁来帮我看看？"

✅ 正确示范：
"服务器启动时崩溃，已上传日志链接：https://logshare.cn/xxx
错误信息：java.lang.OutOfMemoryError: Java heap space
尝试过的方案：已将 -Xmx 增加到 8G，问题依然存在
系统环境：Ubuntu 22.04, Java 17, Paper 1.20.1"`
          }
        },
        {
          type: 'section',
          title: '三、如何获取和分享日志',
          note: '日志是诊断问题的最重要依据，没有日志的求助往往很难得到有效回应。',
          steps: [
            '服务器日志位置：logs/latest.log（最新日志）或 logs/日期.log.gz（历史日志）',
            '使用 LogShare.CN 上传：访问首页，点击"选择文件"上传日志文件。',
            '复制分享链接：上传后会自动生成分享链接，将这个链接发送给解答者。',
            '客户端日志：如果是客户端问题，日志通常在 .minecraft/logs/ 目录下。'
          ],
          conclusion: '不要只贴几行日志，完整的日志文件才能包含所有关键信息。'
        },
        {
          type: 'section',
          title: '四、理解解答者的立场',
          note: '社区中的解答者通常是志愿者，他们用自己的时间和专业知识帮助你，但他们也有自己的工作和生活。',
          steps: [
            '解答者不会算命：他们需要你提供的信息才能分析问题，信息不足时无法给出准确答案。',
            '解答者也有局限性：他们可能没遇到过你的问题，或者你的问题超出了他们的知识范围。',
            '解答者可能很忙：每个人都有自己的生活，不能指望他们随时随地秒回你的问题。',
            '解答者不是客服：社区成员没有义务为你服务，他们的帮助是基于热情和善意。'
          ]
        },
        {
          type: 'section',
          title: '五、正确的心态',
          note: '保持良好的心态和礼貌，这不仅是基本的社交礼仪，也能让你更容易获得帮助。',
          steps: [
            '帮你是情分，不帮是本分：不要因为没人回应就心生不满，这是社区的正常现象。',
            '不要道德绑架：不要用"我都等了这么久为什么没人理我"或"你们不是号称热心助人吗"这样的言语。',
            '做好冷场的准备：有些问题可能确实没人能解决，或者没人有时间，这是你需要接受的。',
            '保持耐心和礼貌：感谢每一位愿意回答你问题的人，即使他们的答案没有直接解决问题。'
          ],
          conclusion: '尊重他人，也是尊重自己。良好的社区氛围需要每个人的共同努力。'
        },
        {
          type: 'section',
          title: '六、提问之后',
          note: '提问不是结束，良好的互动能让问题更快解决。',
          steps: [
            '及时反馈：如果解答者的方案有效，请及时告知，这不仅是对帮助者的尊重，也能让其他遇到类似问题的人受益。',
            '提供补充信息：如果解答者要求更多信息，请尽快提供，不要让对话中断。',
            '分享最终解决方案：问题解决后，可以在群组或论坛分享你的解决过程，帮助后来者。',
            '感谢帮助者：一句简单的"谢谢"能让帮助者感到温暖，激励他们继续帮助他人。'
          ]
        },
        {
          type: 'section',
          title: '七、常见错误示例',
          note: '避免这些常见的提问错误，能大大提高你获得帮助的机会。',
          steps: [
            '信息不足：只说"报错了"但不提供任何错误信息或日志。',
            '态度恶劣：因为没有立即得到回应就发脾气或使用侮辱性语言。',
            '重复提问：在多个地方同时发相同的问题，且不说"已在他处提问"。',
            '拒绝提供信息：当解答者要求更多细节时，以"隐私"等理由拒绝。',
            '不做功课：问题在文档或搜索引擎中很容易找到答案，却不先自己查证。'
          ],
          conclusion: '避免这些错误，你的求助之路会更加顺畅。'
        }
      ]
    }
  },
  'api-integration': {
    title: 'LogShare API 集成指南',
    author: 'Qwen 3.5 Plus',
    content: {
      sections: [
        {
          type: 'warning',
          content:
            '本教程面向开发者，需要基本的编程知识。LogShare API 采用 RESTful 设计，所有请求和响应均使用 JSON 格式（除/raw 端点外）。建议在生产环境使用前先进行测试。'
        },
        {
          type: 'section',
          title: '一、API 基础信息',
          steps: [
            'API 基础地址：https://api.logshare.cn',
            '所有请求使用 HTTPS 协议，HTTP 请求会被自动重定向。',
            '当前 API 版本：v1，所有端点路径以/1/开头。',
            '速率限制：每个 IP 地址每分钟最多 60 次请求，超出会返回 429 错误。'
          ]
        },
        {
          type: 'section',
          title: '二、上传日志（POST /1/log）',
          note: '这是最常用的端点，用于上传日志并获取分享链接。',
          code: {
            lang: 'javascript',
            code: `// Node.js 示例
const fetch = require('node-fetch');

async function uploadLog(logContent) {
  const response = await fetch('https://api.logshare.cn/1/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      content: logContent
    })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('上传成功！');
    console.log('查看链接:', data.url);
    console.log('原始日志:', data.raw);
    console.log('日志 ID:', data.id);
  } else {
    console.error('上传失败:', data.error);
  }
}

// 使用示例
const fs = require('fs');
const logContent = fs.readFileSync('server.log', 'utf-8');
uploadLog(logContent);`
          },
          steps: [
            '请求方法：POST',
            'Content-Type：application/x-www-form-urlencoded',
            '请求参数：content（必需）- 日志文件内容字符串',
            '内容限制：最大 10MB，最多 25000 行，超出会被截断',
            '成功响应：返回 JSON 对象，包含 success、id、url、raw 字段'
          ]
        },
        {
          type: 'section',
          title: '三、获取分析结果（GET /1/insights/:id）',
          code: {
            lang: 'javascript',
            code: `// Node.js 示例
const fetch = require('node-fetch');

async function getInsights(logId) {
  const response = await fetch(\`https://api.logshare.cn/1/insights/\${logId}\`);
  
  const data = await response.json();
  if (response.ok) {
    console.log('分析结果:');
    console.log('服务器软件:', data.analysis.software);
    console.log('游戏版本:', data.analysis.version);
    console.log('检测到的问题:');
    data.analysis.issues.forEach((issue, index) => {
      console.log(\`  \${index + 1}. \${issue.message}\`);
      if (issue.solutions) {
        issue.solutions.forEach(solution => {
          console.log(\`     解决方案：\${solution.message}\`);
        });
      }
    });
  } else {
    console.error('获取失败:', data.error);
  }
}

// 使用示例
getInsights('8FlTowW');`
          },
          steps: [
            '请求方法：GET',
            '路径参数：id - 日志的唯一标识符',
            '成功响应：返回 analysis 对象，包含 software、version、issues 等字段',
            'issues 数组包含检测到的问题及解决方案建议'
          ]
        },
        {
          type: 'section',
          title: '四、获取原始日志（GET /1/raw/:id）',
          code: {
            lang: 'bash',
            code: `# 使用 curl 下载原始日志
curl -o server.log https://api.logshare.cn/1/raw/8FlTowW

# 或直接输出到终端
curl https://api.logshare.cn/1/raw/8FlTowW`
          },
          steps: [
            '请求方法：GET',
            '路径参数：id - 日志的唯一标识符',
            '响应类型：text/plain（纯文本）',
            '适用于需要下载日志进行本地分析的场景'
          ]
        },
        {
          type: 'section',
          title: '五、AI 智能分析（GET /1/ai-analysis/:id）',
          code: {
            lang: 'javascript',
            code: `// Node.js 示例
const fetch = require('node-fetch');

async function getAIAnalysis(logId) {
  const response = await fetch(\`https://api.logshare.cn/1/ai-analysis/\${logId}\`);
  
  const data = await response.json();
  if (data.success) {
    console.log('AI 分析报告:');
    console.log(data.analysis); // Markdown 格式的分析报告
  } else {
    console.error('分析失败:', data.error);
  }
}

// 使用示例
getAIAnalysis('8FlTowW');`
          },
          steps: [
            '请求方法：GET',
            '路径参数：id - 日志的唯一标识符',
            '成功响应：返回 Markdown 格式的详细分析报告',
            'AI 分析基于大语言模型，提供自然语言的问题诊断和解决方案',
            '分析内容包括：问题概述、原因分析、解决步骤、预防建议'
          ]
        },
        {
          type: 'section',
          title: '六、错误处理',
          steps: [
            '400 Bad Request：请求参数错误或缺少必需参数',
            '404 Not Found：指定的日志 ID 不存在',
            '429 Too Many Requests：请求频率超限，请等待后重试',
            '500 Internal Server Error：服务器内部错误，请稍后重试或联系管理员',
            '所有错误响应均包含 success: false 和 error 字段，error 字段包含错误描述'
          ]
        },
        {
          type: 'section',
          title: '七、最佳实践',
          steps: [
            '实现重试机制：遇到 429 或 500 错误时，使用指数退避策略重试（如 1s、2s、4s、8s）。',
            '本地缓存：对同一日志的分析结果进行本地缓存，避免重复请求。',
            '错误日志：记录 API 调用失败的日志，便于排查问题。',
            '用户提示：向用户展示友好的错误信息，而非直接显示 API 错误。',
            '敏感信息过滤：上传前自动过滤日志中的 IP 地址、密钥等敏感信息。'
          ],
          conclusion: '遵循以上最佳实践，可以确保您的集成稳定可靠，为用户提供流畅的使用体验。'
        }
      ]
    }
  }
}

const tutorial = computed(() => tutorials[tutorialId.value])

// 格式化步骤文本，将 URL 转换为链接
const formatStep = (step: string) => {
  return step.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline break-all">$1</a>'
  )
}
</script>

<template>
  <div class="container mx-auto px-3 py-6 max-w-3xl">
    <!-- 返回按钮 -->
    <div class="mb-6">
      <RouterLink
        to="/tutorials"
        class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        返回教程中心
      </RouterLink>
    </div>

    <!-- 教程内容 -->
    <div v-if="tutorial" class="space-y-6">
      <!-- 作者信息 -->
      <div class="text-xs text-muted-foreground">
        本文由 <span class="text-primary font-medium">{{ tutorial.author }}</span> 生成
      </div>

      <div v-for="(section, index) in tutorial.content.sections" :key="index" class="space-y-3">
        <!-- 警告/提示框 -->
        <div
          v-if="section.type === 'warning'"
          class="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-3 rounded-r"
        >
          <p class="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
            {{ section.content }}
          </p>
        </div>

        <!-- 普通章节 -->
        <template v-else-if="section.type === 'section'">
          <h2
            class="text-base font-semibold pt-2 border-t border-border first:pt-0 first:border-t-0"
          >
            {{ section.title }}
          </h2>

          <!-- 说明注释 -->
          <div v-if="section.note" class="bg-muted p-2 rounded text-xs text-muted-foreground">
            <strong>说明：</strong>{{ section.note }}
          </div>

          <!-- 代码块 -->
          <div v-if="section.code" class="my-3 rounded-lg overflow-hidden border border-border">
            <div
              class="bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground border-b border-border flex items-center justify-between"
            >
              <span>{{ section.code.lang }}</span>
            </div>
            <pre
              class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
            ><code>{{ section.code.code }}</code></pre>
          </div>

          <!-- 步骤段落 -->
          <div class="space-y-2 text-sm leading-relaxed">
            <p
              v-for="(step, stepIndex) in section.steps"
              :key="stepIndex"
              v-html="formatStep(step)"
            />
          </div>

          <!-- 单张图片 -->
          <figure v-if="section.image" class="my-3">
            <img
              :src="section.image.src"
              :alt="section.image.alt"
              class="rounded border border-border max-w-full h-auto"
            />
            <figcaption class="text-center text-xs text-muted-foreground mt-1.5">
              {{ section.image.caption }}
            </figcaption>
          </figure>

          <!-- 多张图片 -->
          <figure v-for="(img, imgIndex) in section.images || []" :key="imgIndex" class="my-3">
            <img
              :src="img.src"
              :alt="img.alt"
              class="rounded border border-border max-w-full h-auto"
            />
            <figcaption class="text-center text-xs text-muted-foreground mt-1.5">
              {{ img.caption }}
            </figcaption>
          </figure>

          <!-- 结论 -->
          <p v-if="section.conclusion" class="text-sm leading-relaxed">
            {{ section.conclusion }}
          </p>
        </template>
      </div>
    </div>

    <!-- 未找到教程 -->
    <div v-else class="bg-card border border-border rounded-lg p-6 text-center">
      <h2 class="text-base font-semibold mb-2">教程未找到</h2>
      <p class="text-muted-foreground text-sm mb-4">您访问的教程页面不存在或已被移除。</p>
      <RouterLink
        to="/tutorials"
        class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        返回教程中心
      </RouterLink>
    </div>
  </div>
</template>
