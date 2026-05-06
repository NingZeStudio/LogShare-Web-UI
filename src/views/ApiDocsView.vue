<script setup lang="ts">
import { ref } from 'vue'
import { t } from '@/lib/i18n'
import { Copy, Check } from 'lucide-vue-next'

const activeTab = ref<'overview' | 'endpoints' | 'sdks' | 'limits'>('overview')
const copiedEndpoint = ref('')

const copyEndpoint = async (endpoint: string) => {
  try {
    await navigator.clipboard.writeText(endpoint)
    copiedEndpoint.value = endpoint
    setTimeout(() => (copiedEndpoint.value = ''), 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const endpoints = [
  {
    method: 'POST',
    methodType: 'post',
    path: '/1/log',
    title: t('paste_log'),
    description:
      '提交新的日志数据进行分析，生成分享链接和分析结果。支持纯文本或 JSON 格式，支持 gzip/deflate/br 压缩。',
    contentType: 'text/plain 或 application/json',
    params: [
      { name: 'content', type: 'string', required: true, desc: '日志内容字符串（JSON 模式必需）' },
      {
        name: 'metadata',
        type: 'object',
        required: false,
        desc: '元数据对象，格式 { "key": "value" }'
      },
      { name: 'source', type: 'string', required: false, desc: '来源标识（最长 64 字符）' }
    ],
    response: {
      success: {
        code: 200,
        example: `{
    "success": true,
    "message": "Log submitted successfully",
    "data": {
        "id": "abc123",
        "url": "https://logshare.cn/abc123",
        "raw": "https://api.logshare.cn/1/raw/abc123",
        "token": "token_xxxxx"
    }
}`
      },
      error: {
        example: `{
    "success": false,
    "error": "请求参数错误"
}`
      }
    },
    examples: {
      js: `// JSON 模式
const response = await fetch('https://api.logshare.cn/1/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        content: "[Server thread/INFO]: Starting minecraft server",
        metadata: { "version": "1.20.1" },
        source: "web-upload"
    })
});
const data = await response.json();
console.log(data);

// 纯文本模式
const response = await fetch('https://api.logshare.cn/1/log', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: logContent
});`,
      php: `<?php
$data = [
    'content' => "[Server thread/INFO]: Starting minecraft server",
    'metadata' => ['version' => '1.20.1'],
    'source' => 'web-upload'
];
$ch = curl_init('https://api.logshare.cn/1/log');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);
print_r($result);`,
      curl: `# JSON 模式
curl -X POST https://api.logshare.cn/1/log \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "[Server thread/INFO]: Starting minecraft server",
    "metadata": {"version": "1.20.1"},
    "source": "cli-upload"
  }'

# 纯文本模式
curl -X POST https://api.logshare.cn/1/log \\
  -H "Content-Type: text/plain" \\
  -d @server.log`
    }
  },
  {
    method: 'POST',
    methodType: 'post',
    path: '/1/analyse',
    title: '分析日志（本地 Codex）',
    description:
      '提交日志内容进行本地分析，不会存储到数据库。返回分析结果包括服务器类型、版本和问题检测。',
    contentType: 'text/plain 或 application/json',
    params: [{ name: 'content', type: 'string', required: true, desc: '日志原始内容' }],
    response: {
      success: {
        code: 200,
        example: `{
    "success": true,
    "data": {
        "id": "log-id",
        "name": "Minecraft",
        "type": "ServerLog",
        "entries": [...],
        "insights": [...]
    }
}`
      },
      error: {
        example: `{
    "success": false,
    "error": "分析失败"
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/1/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: logContent
});
const data = await response.json();
console.log(data);`,
      php: `<?php
$ch = curl_init('https://api.logshare.cn/1/analyse');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $logContent);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain']);
$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);
print_r($result);`,
      curl: `curl -X POST https://api.logshare.cn/1/analyse \\
  -H "Content-Type: text/plain" \\
  -d @server.log`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/1/raw/{id}',
    title: t('get_raw_log'),
    description: '获取指定日志的原始内容。支持多个 ID 用逗号分隔。',
    params: [
      { name: 'id', type: 'string', required: true, desc: '日志 ID（支持多个 ID，用逗号分隔）' }
    ],
    response: {
      success: {
        code: 200,
        type: 'text/plain',
        example: `[Server thread/INFO]: Starting minecraft server version 1.20.1
[Server thread/INFO]: Loading properties
[Server thread/INFO]: Default game type: SURVIVAL`
      },
      error: {
        example: `{
    "success": false,
    "error": "Log not found."
}`
      }
    },
    examples: {
      js: `// 获取单个日志
const response = await fetch('https://api.logshare.cn/1/raw/abc1234');
const text = await response.text();
console.log(text);

// 获取多个日志
const response = await fetch('https://api.logshare.cn/1/raw/abc1234,def5678');`,
      php: `<?php
// 获取单个日志
$text = file_get_contents('https://api.logshare.cn/1/raw/abc1234');
echo $text;

// 获取多个日志
$text = file_get_contents('https://api.logshare.cn/1/raw/abc1234,def5678');`,
      curl: `# 获取单个日志
curl https://api.logshare.cn/1/raw/abc1234

# 获取多个日志
curl https://api.logshare.cn/1/raw/abc1234,def5678`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/1/insights/{id}',
    title: t('get_insights'),
    description: '获取已存储日志的分析洞察，包括服务器软件类型、版本和问题检测。',
    params: [{ name: 'id', type: 'string', required: true, desc: '日志 ID' }],
    response: {
      success: {
        code: 200,
        example: `{
    "success": true,
    "data": {
        "id": "log-id",
        "name": "Minecraft",
        "type": "ServerLog",
        "insights": [
            {
                "message": "错误描述",
                "level": "ERROR",
                "counter": 1,
                "tags": ["error", "crash"],
                "entry": {...}
            }
        ]
    }
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/1/insights/abc1234');
const data = await response.json();
console.log(data);`,
      php: `<?php
$data = json_decode(file_get_contents('https://api.logshare.cn/1/insights/abc1234'), true);
print_r($data);`,
      curl: `curl https://api.logshare.cn/1/insights/abc1234`
    }
  },
  {
    method: 'DELETE',
    methodType: 'delete',
    path: '/1/delete/{id}',
    title: t('delete_log'),
    description: '删除指定的日志（需要 Token 认证）。支持多个 ID 用逗号分隔。',
    params: [
      { name: 'id', type: 'string', required: true, desc: '日志 ID（支持多个 ID，用逗号分隔）' }
    ],
    headers: [{ name: 'Authorization', type: 'string', required: true, desc: 'Bearer {token}' }],
    response: {
      success: {
        code: 200,
        example: `{
    "success": true,
    "deleted": ["abc1234", "def5678"],
    "failed": [],
    "total": 2,
    "deletedCount": 2,
    "failedCount": 0
}`
      },
      error: {
        example: `{
    "success": false,
    "error": "Missing token in Authorization header."
}`
      }
    },
    examples: {
      js: `// 删除单个日志
const response = await fetch('https://api.logshare.cn/1/delete/abc1234', {
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'
    }
});
const data = await response.json();

// 删除多个日志
const response = await fetch('https://api.logshare.cn/1/delete/abc1234,def5678', {
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'
    }
});`,
      php: `<?php
// 删除单个日志
$ch = curl_init('https://api.logshare.cn/1/delete/abc1234');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
]);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);

// 删除多个日志
$ch = curl_init('https://api.logshare.cn/1/delete/abc1234,def5678');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
]);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);`,
      curl: `# 删除单个日志
curl -X DELETE https://api.logshare.cn/1/delete/abc1234 \\
  -H "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"

# 删除多个日志
curl -X DELETE https://api.logshare.cn/1/delete/abc1234,def5678 \\
  -H "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/1/limits',
    title: t('get_limits'),
    description: t('get_limits_desc'),
    params: [],
    response: {
      success: {
        code: 200,
        example: `{
    "success": true,
    "data": {
        "storageTime": 2592000,
        "maxLength": 1048576,
        "maxLines": 50000
    }
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/1/limits');
const data = await response.json();
console.log(data);`,
      php: `<?php
$data = json_decode(file_get_contents('https://api.logshare.cn/1/limits'), true);
print_r($data);`,
      curl: `curl https://api.logshare.cn/1/limits`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/1/filters',
    title: '获取过滤器信息',
    description: '获取当前启用的日志过滤器信息，包括隐私保护规则。',
    params: [],
    response: {
      success: {
        code: 200,
        example: `{
    "success": true,
    "data": {
        "filters": [
            { "type": "trim", "data": null },
            { "type": "limit-bytes", "data": { "limit": 1048576 } },
            { "type": "limit-lines", "data": { "limit": 50000 } },
            {
                "type": "regex",
                "data": {
                    "patterns": [
                        { "pattern": "IPv4", "replacement": "**.**.**.**" },
                        { "pattern": "IPv6", "replacement": "****:****:****:****:****:****:****:****" },
                        { "pattern": "Username", "replacement": "********" },
                        { "pattern": "AccessToken", "replacement": "********" }
                    ]
                }
            }
        ]
    }
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/1/filters');
const data = await response.json();
console.log(data);`,
      php: `<?php
$data = json_decode(file_get_contents('https://api.logshare.cn/1/filters'), true);
print_r($data);`,
      curl: `curl https://api.logshare.cn/1/filters`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/1/errors/rate',
    title: t('rate_limit_info'),
    description: '获取错误率限制信息（由 Cloudflare 提供）。',
    params: [],
    response: {
      success: {
        code: 429,
        example: `{
    "success": false,
    "error": "Unfortunately you have exceeded the rate limit for the current time period. Please try again later."
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/1/errors/rate');
const data = await response.json();
console.log(data);`,
      php: `<?php
$data = json_decode(file_get_contents('https://api.logshare.cn/1/errors/rate'), true);
print_r($data);`,
      curl: `curl https://api.logshare.cn/1/errors/rate`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/1/ai/{id}',
    title: 'AI 分析已存储日志 🔵',
    description:
      '读取已存储的日志，使用 AI 进行智能分析。SSE 流式输出，首次请求流式生成，5 分钟内相同请求直接返回缓存结果。',
    isSSE: true,
    params: [{ name: 'id', type: 'string', required: true, desc: '日志 ID' }],
    response: {
      success: {
        code: 200,
        example: `// SSE 流式数据（逐块返回）
data: {"choices":[{"delta":{"content":"{\"summary\":\"服务器启动失败..."}}]}

// 流结束后完整结果
{
    "success": true,
    "message": "AI analysis completed.",
    "data": {
        "analysis": {
            "summary": "问题摘要",
            "severity": "high",
            "issues": [
                {
                    "type": "问题类型",
                    "description": "问题描述",
                    "suggestion": "解决建议"
                }
            ],
            "recommendations": ["总体建议1", "总体建议2"]
        },
        "cached": false
    }
}

// 缓存命中（5 分钟内）
{
    "success": true,
    "message": "AI analysis completed (from cache).",
    "data": {
        "analysis": { ... },
        "cached": true
    }
}`
      },
      error: {
        example: `{
    "success": false,
    "error": "Log not found."
}`
      }
    },
    examples: {
      js: `// SSE 流式方式（推荐）
const response = await fetch('https://api.logshare.cn/1/ai/abc1234');
const reader = response.body.getReader();
const decoder = new TextDecoder();
let fullJson = '';

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    const lines = text.split('\\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '[DONE]') continue;
            const chunk = JSON.parse(data);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) fullJson += content;
        }
    }
}
const analysis = JSON.parse(fullJson);
console.log(analysis);`,
      php: `<?php
// PHP 不支持 SSE 客户端流式读取，建议使用 curl 直接获取
$ch = curl_init('https://api.logshare.cn/1/ai/abc1234');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);
print_r($data);`,
      curl: `# SSE 流式方式
curl -N https://api.logshare.cn/1/ai/abc1234

# 或直接等待完整结果
curl https://api.logshare.cn/1/ai/abc1234`
    }
  },
  {
    method: 'POST',
    methodType: 'post',
    path: '/1/ai/analyse',
    title: 'AI 分析日志内容 🔵',
    description:
      '直接提交日志内容，使用 AI 分析，不存储到数据库。SSE 流式输出，基于内容哈希缓存，相同内容 5 分钟内直接返回缓存结果。',
    isSSE: true,
    contentType: 'text/plain 或 application/json',
    params: [{ name: 'content', type: 'string', required: true, desc: '日志原始内容' }],
    response: {
      success: {
        code: 200,
        example: `// SSE 流式数据（逐块返回）
data: {"choices":[{"delta":{"content":"{\"summary\":\"服务器启动失败..."}}]}

// 流结束后完整结果
{
    "success": true,
    "message": "AI analysis completed.",
    "data": {
        "analysis": {
            "summary": "问题摘要",
            "severity": "high",
            "issues": [...],
            "recommendations": [...]
        },
        "cached": false
    }
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/1/ai/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        content: "[Server thread/ERROR]: Could not bind to port 25565..."
    })
});
const reader = response.body.getReader();
const decoder = new TextDecoder();
let fullJson = '';

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    // 解析 SSE 数据...
}
const analysis = JSON.parse(fullJson);`,
      php: `<?php
$data = ['content' => "[Server thread/ERROR]: Could not bind to port 25565..."];
$ch = curl_init('https://api.logshare.cn/1/ai/analyse');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);
print_r($result);`,
      curl: `curl -X POST https://api.logshare.cn/1/ai/analyse \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "[Server thread/ERROR]: Could not bind to port 25565..."
  }'`
    }
  }
]

const methodTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    post: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    get: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }
  return classes[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
}

const hasContentType = (endpoint: any) => {
  return endpoint.contentType !== undefined
}

const isSSEEndpoint = (endpoint: any) => {
  return endpoint.isSSE === true
}
</script>

<template>
  <div class="container mx-auto px-3 py-6 max-w-4xl">
    <!-- 页面标题 -->
    <header class="mb-8">
      <h1 class="text-2xl font-bold mb-2">
        {{ t('api_docs') }}
      </h1>
      <p class="text-sm text-muted-foreground leading-relaxed">
        {{ t('home_subtitle') }} <strong class="text-foreground">LogShare.CN</strong>
        {{ t('integration_text') }}
      </p>
    </header>

    <!-- 导航标签 -->
    <div class="flex flex-wrap gap-2 mb-8 border-b border-border">
      <button
        :class="[
          'px-3 py-2 text-sm font-medium transition-colors border-b-2',
          activeTab === 'overview'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        ]"
        @click="activeTab = 'overview'"
      >
        概述
      </button>
      <button
        :class="[
          'px-3 py-2 text-sm font-medium transition-colors border-b-2',
          activeTab === 'endpoints'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        ]"
        @click="activeTab = 'endpoints'"
      >
        API 端点
      </button>
      <button
        :class="[
          'px-3 py-2 text-sm font-medium transition-colors border-b-2',
          activeTab === 'sdks'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        ]"
        @click="activeTab = 'sdks'"
      >
        {{ t('local_sdks') }}
      </button>
      <button
        :class="[
          'px-3 py-2 text-sm font-medium transition-colors border-b-2',
          activeTab === 'limits'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        ]"
        @click="activeTab = 'limits'"
      >
        {{ t('api_limits') }}
      </button>
    </div>

    <!-- 概述 -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <section class="space-y-4">
        <h2 class="text-lg font-semibold">API 基础信息</h2>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="p-4 rounded-lg border border-border bg-card">
            <div class="text-xs text-muted-foreground mb-1">基础 URL</div>
            <div class="font-mono text-sm flex items-center justify-between">
              <span>https://api.logshare.cn</span>
              <button
                class="text-muted-foreground hover:text-foreground transition-colors"
                @click="copyEndpoint('https://api.logshare.cn')"
              >
                <Copy v-if="copiedEndpoint !== 'https://api.logshare.cn'" class="h-3.5 w-3.5" />
                <Check v-else class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div class="p-4 rounded-lg border border-border bg-card">
            <div class="text-xs text-muted-foreground mb-1">API 版本</div>
            <div class="font-mono text-sm">v1</div>
          </div>

          <div class="p-4 rounded-lg border border-border bg-card">
            <div class="text-xs text-muted-foreground mb-1">协议</div>
            <div class="text-sm">HTTPS</div>
          </div>

          <div class="p-4 rounded-lg border border-border bg-card">
            <div class="text-xs text-muted-foreground mb-1">认证</div>
            <div class="text-sm">无需认证（公共 API）</div>
          </div>
        </div>

        <div class="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <p class="text-sm text-amber-800 dark:text-amber-200">
            所有 API 请求均使用 HTTPS 协议，HTTP 请求会被自动重定向到 HTTPS。 速率限制为每分钟 60
            个请求（按 IP 计算）。
          </p>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold">可用端点</h2>
        <div class="rounded-lg border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-muted/50">
              <tr>
                <th class="p-3 text-left font-medium text-muted-foreground">方法</th>
                <th class="p-3 text-left font-medium text-muted-foreground">端点</th>
                <th class="p-3 text-left font-medium text-muted-foreground">描述</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('post')"
                    >POST</span
                  >
                </td>
                <td class="p-3 font-mono text-xs">/1/log</td>
                <td class="p-3 text-muted-foreground">提交日志</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('post')"
                    >POST</span
                  >
                </td>
                <td class="p-3 font-mono text-xs">/1/analyse</td>
                <td class="p-3 text-muted-foreground">分析日志（本地 Codex）</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 font-mono text-xs">/1/raw/{id}</td>
                <td class="p-3 text-muted-foreground">获取原始日志</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 font-mono text-xs">/1/insights/{id}</td>
                <td class="p-3 text-muted-foreground">获取日志分析结果</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span
                    class="px-2 py-1 rounded text-xs font-bold"
                    :class="methodTypeClass('delete')"
                    >DELETE</span
                  >
                </td>
                <td class="p-3 font-mono text-xs">/1/delete/{id}</td>
                <td class="p-3 text-muted-foreground">删除日志</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 font-mono text-xs">/1/limits</td>
                <td class="p-3 text-muted-foreground">获取限制信息</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 font-mono text-xs">/1/filters</td>
                <td class="p-3 text-muted-foreground">获取过滤器信息</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 font-mono text-xs">/1/ai/{id}</td>
                <td class="p-3 text-muted-foreground">AI 分析已存储日志（SSE 流式输出）</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('post')"
                    >POST</span
                  >
                </td>
                <td class="p-3 font-mono text-xs">/1/ai/analyse</td>
                <td class="p-3 text-muted-foreground">AI 分析日志内容（SSE 流式输出）</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- API 端点 -->
    <div v-if="activeTab === 'endpoints'" class="space-y-8">
      <div v-for="(endpoint, index) in endpoints" :key="index" class="space-y-4">
        <!-- 端点头部 -->
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <span
              class="px-2.5 py-1 rounded text-xs font-bold"
              :class="methodTypeClass(endpoint.methodType)"
            >
              {{ endpoint.method }}
            </span>
            <code class="text-sm font-mono">{{ endpoint.path }}</code>
          </div>
          <button
            class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            @click="copyEndpoint(`https://api.logshare.cn${endpoint.path}`)"
          >
            <Copy
              v-if="copiedEndpoint !== `https://api.logshare.cn${endpoint.path}`"
              class="h-3.5 w-3.5"
            />
            <Check v-else class="h-3.5 w-3.5" />
            {{
              copiedEndpoint === `https://api.logshare.cn${endpoint.path}` ? t('copied') : t('copy')
            }}
          </button>
        </div>

        <!-- 描述 -->
        <p class="text-sm text-muted-foreground">
          {{ endpoint.description }}
        </p>

        <!-- SSE 提示 -->
        <p v-if="isSSEEndpoint(endpoint)" class="text-sm text-blue-500">该接口为 SSE 流式输出</p>

        <!-- Content-Type 提示 -->
        <div
          v-if="hasContentType(endpoint)"
          class="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span class="font-medium">Content-Type:</span>
          <code class="bg-muted px-1.5 py-0.5 rounded">{{ endpoint.contentType }}</code>
        </div>

        <!-- 请求头 -->
        <div v-if="endpoint.headers && endpoint.headers.length > 0" class="space-y-2">
          <h3 class="text-sm font-semibold">请求头</h3>
          <div class="rounded-lg border border-border overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-muted/50">
                <tr>
                  <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">参数</th>
                  <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">类型</th>
                  <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">必需</th>
                  <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">描述</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="header in endpoint.headers"
                  :key="header.name"
                  class="border-t border-border"
                >
                  <td class="p-2.5 font-mono text-xs text-primary">{{ header.name }}</td>
                  <td class="p-2.5">
                    <code class="bg-muted px-1.5 py-0.5 rounded text-xs">{{ header.type }}</code>
                  </td>
                  <td class="p-2.5">
                    <span v-if="header.required" class="text-xs text-destructive font-medium"
                      >必需</span
                    >
                    <span v-else class="text-xs text-muted-foreground">可选</span>
                  </td>
                  <td class="p-2.5 text-xs text-muted-foreground">{{ header.desc }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 请求参数 -->
        <div v-if="endpoint.params.length > 0" class="space-y-2">
          <h3 class="text-sm font-semibold">请求参数</h3>
          <div class="rounded-lg border border-border overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-muted/50">
                <tr>
                  <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">参数</th>
                  <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">类型</th>
                  <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">必需</th>
                  <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">描述</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="param in endpoint.params"
                  :key="param.name"
                  class="border-t border-border"
                >
                  <td class="p-2.5 font-mono text-xs text-primary">{{ param.name }}</td>
                  <td class="p-2.5">
                    <code class="bg-muted px-1.5 py-0.5 rounded text-xs">{{ param.type }}</code>
                  </td>
                  <td class="p-2.5">
                    <span v-if="param.required" class="text-xs text-destructive font-medium"
                      >必需</span
                    >
                    <span v-else class="text-xs text-muted-foreground">可选</span>
                  </td>
                  <td class="p-2.5 text-xs text-muted-foreground">{{ param.desc }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 代码示例 -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">调用示例</h3>
          <div class="space-y-3">
            <!-- JavaScript -->
            <div class="rounded-lg border border-border overflow-hidden">
              <div
                class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border"
              >
                JavaScript
              </div>
              <pre
                class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
              ><code>{{ endpoint.examples.js }}</code></pre>
            </div>

            <!-- PHP -->
            <div class="rounded-lg border border-border overflow-hidden">
              <div
                class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border"
              >
                PHP
              </div>
              <pre
                class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
              ><code>{{ endpoint.examples.php }}</code></pre>
            </div>

            <!-- cURL -->
            <div class="rounded-lg border border-border overflow-hidden">
              <div
                class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border"
              >
                cURL
              </div>
              <pre
                class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
              ><code>{{ endpoint.examples.curl }}</code></pre>
            </div>
          </div>
        </div>

        <!-- 响应示例 -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">响应示例</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-border overflow-hidden">
              <div
                class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border flex items-center justify-between"
              >
                <span
                  >成功响应
                  {{
                    endpoint.response.success.code ? `(${endpoint.response.success.code} OK)` : ''
                  }}</span
                >
                <span v-if="endpoint.response.success.type" class="text-muted-foreground">{{
                  endpoint.response.success.type
                }}</span>
              </div>
              <pre
                class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
              ><code>{{ endpoint.response.success.example }}</code></pre>
            </div>
            <div
              v-if="endpoint.response.error"
              class="rounded-lg border border-border overflow-hidden"
            >
              <div
                class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border"
              >
                错误响应
              </div>
              <pre
                class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
              ><code>{{ endpoint.response.error.example }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SDKs -->
    <div v-if="activeTab === 'sdks'" class="space-y-6">
      <p class="text-sm text-muted-foreground">
        我们为您提供了开箱即用的本地 SDK，支持 SSE 流式 AI 分析，您可以直接下载并集成到您的项目中。
      </p>
      <div class="grid gap-4 sm:grid-cols-2">
        <a
          href="/sdk/logshare-php-sdk.zip"
          download
          class="group block p-5 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <div class="flex items-center justify-between mb-3">
            <div
              class="font-semibold group-hover:text-primary transition-colors flex items-center gap-2"
            >
              <span
                class="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold"
                >PHP</span
              >
              PHP SDK
              <span
                class="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold"
                >v2.0.0</span
              >
            </div>
            <span
              class="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold"
              >SSE</span
            >
          </div>
          <p class="text-sm text-muted-foreground mb-4">
            高性能 cURL 封装，支持 SSE 流式 AI 分析、批量上传、完整错误处理。PHP 7.4+
          </p>
          <div
            class="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all"
          >
            点击下载 logshare-php-sdk.zip
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-download"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </div>
        </a>
        <a
          href="/sdk/logshare-js-sdk.zip"
          download
          class="group block p-5 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <div class="flex items-center justify-between mb-3">
            <div
              class="font-semibold group-hover:text-primary transition-colors flex items-center gap-2"
            >
              <span
                class="w-8 h-8 rounded-md bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 text-xs font-bold"
                >JS</span
              >
              JavaScript SDK
              <span
                class="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold"
                >v2.0.0</span
              >
            </div>
            <span
              class="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold"
              >SSE</span
            >
          </div>
          <p class="text-sm text-muted-foreground mb-4">
            基于 Fetch API + ReadableStream，支持浏览器和 Node.js 环境，SSE 流式解析。
          </p>
          <div
            class="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all"
          >
            点击下载 logshare-js-sdk.zip
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-download"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </div>
        </a>
        <a
          href="/sdk/logshare-java-sdk.zip"
          download
          class="group block p-5 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <div class="flex items-center justify-between mb-3">
            <div
              class="font-semibold group-hover:text-primary transition-colors flex items-center gap-2"
            >
              <span
                class="w-8 h-8 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold"
                >JAVA</span
              >
              Java SDK
              <span
                class="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold"
                >v2.0.0</span
              >
            </div>
            <span
              class="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-bold"
              >SSE</span
            >
          </div>
          <p class="text-sm text-muted-foreground mb-4">
            基于 java.net.http.HttpClient，无第三方依赖，支持 SSE 流式 AI 分析。Java 11+
          </p>
          <div
            class="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all"
          >
            点击下载 logshare-java-sdk.zip
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-download"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </div>
        </a>
        <a
          href="/sdk/logshare-dotnet-sdk.zip"
          download
          class="group block p-5 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <div class="flex items-center justify-between mb-3">
            <div
              class="font-semibold group-hover:text-primary transition-colors flex items-center gap-2"
            >
              <span
                class="w-8 h-8 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold"
                >.NET</span
              >
              C# / .NET SDK
              <span
                class="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold"
                >v2.0.0</span
              >
            </div>
            <span
              class="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold"
              >SSE</span
            >
          </div>
          <p class="text-sm text-muted-foreground mb-4">
            基于 System.Net.Http.HttpClient，完整异步支持，SSE 流式解析。.NET 6+
          </p>
          <div
            class="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all"
          >
            点击下载 logshare-dotnet-sdk.zip
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-download"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </div>
        </a>
      </div>

      <!-- 快速使用示例 -->
      <section class="space-y-4 mt-6">
        <h2 class="text-lg font-semibold">快速使用示例</h2>

        <div class="space-y-4">
          <!-- PHP 示例 -->
          <div class="rounded-lg border border-border overflow-hidden">
            <div
              class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border flex items-center gap-2"
            >
              <span
                class="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold"
                >PHP</span
              >
              PHP SDK 使用示例
            </div>
            <pre
              class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
            ><code>&lt;?php
require_once 'mclogs.php';

use LogShare\LogShareSDK;

$sdk = new LogShareSDK([
    'timeout' => 120  // AI 分析需要更长时间
]);

// 上传日志
$result = $sdk->paste("[Server thread/INFO]: Starting minecraft server");
$id = $result['data']['id'];

// SSE 流式 AI 分析
$analysis = $sdk->streamAiAnalysis(
    $id,
    function ($chunk) {
        // 实时处理每个数据块
        echo $chunk['choices'][0]['delta']['content'] ?? '';
    },
    function ($fullJson) {
        // 分析完成
        echo "\n分析完成！\n";
    }
);</code></pre>
          </div>

          <!-- JavaScript 示例 -->
          <div class="rounded-lg border border-border overflow-hidden">
            <div
              class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border flex items-center gap-2"
            >
              <span
                class="w-5 h-5 rounded bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 text-[10px] font-bold"
                >JS</span
              >
              JavaScript SDK 使用示例
            </div>
            <pre
              class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
            ><code>import { LogShareSDK } from './mclogs.js';

const sdk = new LogShareSDK({ timeout: 120000 });

// 上传日志
const result = await sdk.paste('[Server thread/INFO]: Starting...');
const id = result.data.id;

// SSE 流式 AI 分析
const analysis = await sdk.streamAiAnalysis(id, {
    onChunk: (chunk) => {
        // 实时处理每个数据块
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) process.stdout.write(content);
    },
    onDone: (fullJson) => {
        console.log('\n分析完成！');
    },
    onError: (error) => {
        console.error('SSE 错误:', error);
    }
});</code></pre>
          </div>

          <!-- Java 示例 -->
          <div class="rounded-lg border border-border overflow-hidden">
            <div
              class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border flex items-center gap-2"
            >
              <span
                class="w-5 h-5 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 text-[10px] font-bold"
                >J</span
              >
              Java SDK 使用示例
            </div>
            <pre
              class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
            ><code>import cn.logshare.sdk.LogShareSDK;
import cn.logshare.sdk.LogShareException;
import java.util.*;

public class Example {
    public static void main(String[] args) {
        LogShareSDK sdk = new LogShareSDK();

        try {
            // 上传日志
            Map&lt;String, Object&gt; result = sdk.paste("[Server thread/INFO]: Starting...");
            Map&lt;String, Object&gt; data = (Map&lt;String, Object&gt;) result.get("data");
            String id = (String) data.get("id");

            // SSE 流式 AI 分析
            Map&lt;String, Object&gt; analysis = sdk.streamAiAnalysis(
                id,
                chunk -> {
                    // 实时处理每个数据块
                    System.out.print(extractContent(chunk));
                },
                fullJson -> {
                    System.out.println("\n分析完成！");
                },
                error -> {
                    System.err.println("SSE 错误: " + error);
                }
            );
        } catch (LogShareException e) {
            System.err.println("错误: " + e.getMessage());
        }
    }
}</code></pre>
          </div>

          <!-- .NET 示例 -->
          <div class="rounded-lg border border-border overflow-hidden">
            <div
              class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border flex items-center gap-2"
            >
              <span
                class="w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-[10px] font-bold"
                >.NET</span
              >
              C# SDK 使用示例
            </div>
            <pre
              class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
            ><code>using LogShare.CN.SDK;
using System;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var sdk = new LogShareSDK();

        try
        {
            // 上传日志
            var result = await sdk.PasteAsync("[Server thread/INFO]: Starting...");
            var id = result.GetProperty("data").GetProperty("id").GetString();

            // SSE 流式 AI 分析
            var analysis = await sdk.StreamAiAnalysisAsync(
                id,
                onChunk: chunk => {
                    // 实时处理每个数据块
                    var content = chunk.GetProperty("choices")[0]
                        .GetProperty("delta").GetProperty("content").GetString();
                    Console.Write(content);
                },
                onDone: fullJson => {
                    Console.WriteLine("\n分析完成！");
                },
                onError: error => {
                    Console.Error.WriteLine($"SSE 错误: {error}");
                }
            );
        }
        catch (LogShareException ex)
        {
            Console.Error.WriteLine($"错误: {ex.Message}");
        }
    }
}</code></pre>
          </div>
        </div>
      </section>
    </div>

    <!-- 限制 -->
    <div v-if="activeTab === 'limits'" class="space-y-6">
      <div class="rounded-lg border border-border bg-card p-5">
        <h2 class="text-lg font-semibold mb-4">{{ t('api_limits') }}</h2>
        <ul class="space-y-3 text-sm">
          <li class="flex items-start gap-3">
            <span class="text-primary font-medium min-w-fit">{{ t('rate_limit') }}：</span>
            <span class="text-muted-foreground"
              >每分钟 <strong class="text-foreground">60 个请求</strong>（按 IP 计算）</span
            >
          </li>
          <li class="flex items-start gap-3">
            <span class="text-primary font-medium min-w-fit">{{ t('content_limit') }}：</span>
            <span class="text-muted-foreground"
              >最大 <strong class="text-foreground">1 MiB</strong> 或
              <strong class="text-foreground">50,000 行</strong></span
            >
          </li>
          <li class="flex items-start gap-3">
            <span class="text-primary font-medium min-w-fit">{{ t('storage_time') }}：</span>
            <span class="text-muted-foreground"
              >日志在最后一次查看后至少保留
              <strong class="text-foreground">30 天</strong>（2,592,000 秒）</span
            >
          </li>
          <li class="flex items-start gap-3">
            <span class="text-primary font-medium min-w-fit">批量删除限制：</span>
            <span class="text-muted-foreground"
              >最多一次删除 <strong class="text-foreground">256 个日志</strong></span
            >
          </li>
          <li class="flex items-start gap-3">
            <span class="text-primary font-medium min-w-fit">Content-Type：</span>
            <span class="text-muted-foreground"
              ><code class="bg-muted px-1.5 py-0.5 rounded text-xs">text/plain</code> 或
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">application/json</code></span
            >
          </li>
          <li class="flex items-start gap-3">
            <span class="text-primary font-medium min-w-fit">压缩支持：</span>
            <span class="text-muted-foreground"
              >支持 <code class="bg-muted px-1.5 py-0.5 rounded text-xs">gzip</code>、<code
                class="bg-muted px-1.5 py-0.5 rounded text-xs"
                >deflate</code
              >、<code class="bg-muted px-1.5 py-0.5 rounded text-xs">br</code> 压缩上传</span
            >
          </li>
        </ul>
      </div>

      <div class="rounded-lg border border-border bg-card p-5">
        <h2 class="text-lg font-semibold mb-4">隐私保护过滤器</h2>
        <p class="text-sm text-muted-foreground mb-4">所有提交的日志会自动应用以下过滤器：</p>
        <ul class="space-y-2 text-sm">
          <li class="flex items-start gap-2">
            <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">IPv4 地址</strong> 替换为
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">**.**.**.**</code></span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">IPv6 地址</strong> 替换为
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs"
                >****:****:****:****:****:****:****:****</code
              ></span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">用户名</strong> 替换为
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">********</code></span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">访问令牌</strong> 替换为
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">********</code></span
            >
          </li>
        </ul>
      </div>

      <div class="rounded-lg border border-border bg-card p-5">
        <h2 class="text-lg font-semibold mb-4">错误码</h2>
        <div class="rounded-lg border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-muted/50">
              <tr>
                <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">错误码</th>
                <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">描述</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-border">
                <td class="p-2.5 font-mono text-xs">400</td>
                <td class="p-2.5 text-muted-foreground">请求参数错误</td>
              </tr>
              <tr class="border-t border-border">
                <td class="p-2.5 font-mono text-xs">403</td>
                <td class="p-2.5 text-muted-foreground">Token 无效或权限不足</td>
              </tr>
              <tr class="border-t border-border">
                <td class="p-2.5 font-mono text-xs">404</td>
                <td class="p-2.5 text-muted-foreground">资源未找到</td>
              </tr>
              <tr class="border-t border-border">
                <td class="p-2.5 font-mono text-xs">405</td>
                <td class="p-2.5 text-muted-foreground">方法不被允许</td>
              </tr>
              <tr class="border-t border-border">
                <td class="p-2.5 font-mono text-xs">413</td>
                <td class="p-2.5 text-muted-foreground">请求体过大</td>
              </tr>
              <tr class="border-t border-border">
                <td class="p-2.5 font-mono text-xs">415</td>
                <td class="p-2.5 text-muted-foreground">不支持的内容类型</td>
              </tr>
              <tr class="border-t border-border">
                <td class="p-2.5 font-mono text-xs">429</td>
                <td class="p-2.5 text-muted-foreground">请求频率超限</td>
              </tr>
              <tr class="border-t border-border">
                <td class="p-2.5 font-mono text-xs">500</td>
                <td class="p-2.5 text-muted-foreground">服务器内部错误</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
