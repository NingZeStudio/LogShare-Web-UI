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
        setTimeout(() => copiedEndpoint.value = '', 2000)
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
        description: '提交新的日志数据进行分析，生成分享链接和分析结果。',
        params: [
            { name: 'content', type: 'string', required: true, desc: '日志内容字符串（必需）' },
            { name: 'metadata', type: 'array', required: false, desc: '元数据数组，包含 key、value、label、visible 字段' },
            { name: 'source', type: 'string', required: false, desc: '来源标识（最长 64 字符）' }
        ],
        response: {
            success: {
                code: 200,
                example: `{
    "success": true,
    "message": "Log submitted successfully",
    "id": "abc1234",
    "url": "http://localhost:9300/abc1234",
    "raw": "http://localhost:9300/1/raw/abc1234",
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
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
            js: `const response = await fetch('https://api.logshare.cn/1/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        content: "[Server thread/INFO]: Starting minecraft server",
        metadata: [{ key: "version", value: "1.20.1", label: "服务器版本" }],
        source: "web-upload"
    })
});
const data = await response.json();
console.log(data);`,
            php: `<?php
$data = [
    'content' => "[Server thread/INFO]: Starting minecraft server",
    'metadata' => [['key' => 'version', 'value' => '1.20.1']],
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
            curl: `curl -X POST https://api.logshare.cn/1/log \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "[Server thread/INFO]: Starting minecraft server",
    "metadata": [{"key": "version", "value": "1.20.1"}],
    "source": "cli-upload"
  }'`
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
        params: [
            { name: 'id', type: 'string', required: true, desc: '日志 ID' }
        ],
        response: {
            success: {
                code: 200,
                example: `{
    "name": "Vanilla Server Log",
    "type": "minecraft",
    "software": "vanilla",
    "version": "1.20.1",
    "insights": [
        {
            "type": "version",
            "value": "1.20.1",
            "label": "Minecraft Version"
        }
    ]
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
        headers: [
            { name: 'Authorization', type: 'string', required: true, desc: 'Bearer {token}' }
        ],
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
        method: 'POST',
        methodType: 'post',
        path: '/1/bulk/log/delete',
        title: '批量删除日志',
        description: '使用 JSON 请求体批量删除多个日志。最多一次删除 256 个日志。',
        params: [
            { name: 'logs', type: 'array', required: true, desc: '日志数组，每个元素包含 id 和 token' }
        ],
        response: {
            success: {
                code: 200,
                example: `{
    "success": true,
    "results": {
        "abc1234": { "success": true },
        "def5678": { "success": false, "error": "Invalid token.", "code": 403 }
    }
}`
            }
        },
        examples: {
            js: `const response = await fetch('https://api.logshare.cn/1/bulk/log/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
        { id: "abc1234", token: "token1" },
        { id: "def5678", token: "token2" }
    ])
});
const data = await response.json();`,
            php: `<?php
$logs = [
    ['id' => 'abc1234', 'token' => 'token1'],
    ['id' => 'def5678', 'token' => 'token2']
];
$ch = curl_init('https://api.logshare.cn/1/bulk/log/delete');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($logs));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);`,
            curl: `curl -X POST https://api.logshare.cn/1/bulk/log/delete \\
  -H "Content-Type: application/json" \\
  -d '[
    {"id": "abc1234", "token": "token1"},
    {"id": "def5678", "token": "token2"}
  ]'`
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
    "storageTime": 7776000,
    "maxLength": 10485760,
    "maxLines": 25000
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
    "filters": [
        { "type": "trim", "data": null },
        { "type": "limit-bytes", "data": { "limit": 10485760 } },
        { "type": "limit-lines", "data": { "limit": 25000 } },
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
</script>

<template>
    <div class="container mx-auto px-3 py-6 max-w-4xl">
        <!-- 页面标题 -->
        <header class="mb-8">
            <h1 class="text-2xl font-bold mb-2">
                {{ t('api_docs') }}
            </h1>
            <p class="text-sm text-muted-foreground leading-relaxed">
                {{ t('home_subtitle') }} <strong class="text-foreground">LogShare.CN</strong> {{ t('integration_text') }}
            </p>
        </header>

        <!-- 导航标签 -->
        <div class="flex flex-wrap gap-2 mb-8 border-b border-border">
            <button
                @click="activeTab = 'overview'"
                :class="[
                    'px-3 py-2 text-sm font-medium transition-colors border-b-2',
                    activeTab === 'overview'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                ]"
            >
                概述
            </button>
            <button
                @click="activeTab = 'endpoints'"
                :class="[
                    'px-3 py-2 text-sm font-medium transition-colors border-b-2',
                    activeTab === 'endpoints'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                ]"
            >
                API 端点
            </button>
            <button
                @click="activeTab = 'sdks'"
                :class="[
                    'px-3 py-2 text-sm font-medium transition-colors border-b-2',
                    activeTab === 'sdks'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                ]"
            >
                {{ t('local_sdks') }}
            </button>
            <button
                @click="activeTab = 'limits'"
                :class="[
                    'px-3 py-2 text-sm font-medium transition-colors border-b-2',
                    activeTab === 'limits'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                ]"
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
                                @click="copyEndpoint('https://api.logshare.cn')"
                                class="text-muted-foreground hover:text-foreground transition-colors"
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
                        所有 API 请求均使用 HTTPS 协议，HTTP 请求会被自动重定向到 HTTPS。
                        速率限制为每分钟 60 个请求（按 IP 计算）。
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
                                    <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('post')">POST</span>
                                </td>
                                <td class="p-3 font-mono text-xs">/1/log</td>
                                <td class="p-3 text-muted-foreground">提交日志</td>
                            </tr>
                            <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')">GET</span>
                                </td>
                                <td class="p-3 font-mono text-xs">/1/raw/{id}</td>
                                <td class="p-3 text-muted-foreground">获取原始日志</td>
                            </tr>
                            <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')">GET</span>
                                </td>
                                <td class="p-3 font-mono text-xs">/1/insights/{id}</td>
                                <td class="p-3 text-muted-foreground">获取日志洞察</td>
                            </tr>
                            <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('delete')">DELETE</span>
                                </td>
                                <td class="p-3 font-mono text-xs">/1/delete/{id}</td>
                                <td class="p-3 text-muted-foreground">删除日志（需 Token）</td>
                            </tr>
                            <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('post')">POST</span>
                                </td>
                                <td class="p-3 font-mono text-xs">/1/bulk/log/delete</td>
                                <td class="p-3 text-muted-foreground">批量删除日志</td>
                            </tr>
                            <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')">GET</span>
                                </td>
                                <td class="p-3 font-mono text-xs">/1/limits</td>
                                <td class="p-3 text-muted-foreground">获取限制信息</td>
                            </tr>
                            <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')">GET</span>
                                </td>
                                <td class="p-3 font-mono text-xs">/1/filters</td>
                                <td class="p-3 text-muted-foreground">获取过滤器信息</td>
                            </tr>
                            <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')">GET</span>
                                </td>
                                <td class="p-3 font-mono text-xs">/1/errors/rate</td>
                                <td class="p-3 text-muted-foreground">速率限制错误</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        <!-- API 端点 -->
        <div v-if="activeTab === 'endpoints'" class="space-y-8">
            <div
                v-for="(endpoint, index) in endpoints"
                :key="index"
                class="space-y-4"
            >
                <!-- 端点头部 -->
                <div class="flex items-start justify-between flex-wrap gap-4">
                    <div class="flex items-center gap-3">
                        <span class="px-2.5 py-1 rounded text-xs font-bold" :class="methodTypeClass(endpoint.methodType)">
                            {{ endpoint.method }}
                        </span>
                        <code class="text-sm font-mono">{{ endpoint.path }}</code>
                    </div>
                    <button
                        @click="copyEndpoint(`https://api.logshare.cn${endpoint.path}`)"
                        class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Copy v-if="copiedEndpoint !== `https://api.logshare.cn${endpoint.path}`" class="h-3.5 w-3.5" />
                        <Check v-else class="h-3.5 w-3.5" />
                        {{ copiedEndpoint === `https://api.logshare.cn${endpoint.path}` ? t('copied') : t('copy') }}
                    </button>
                </div>

                <!-- 描述 -->
                <p class="text-sm text-muted-foreground">
                    {{ endpoint.description }}
                </p>

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
                                    <td class="p-2.5"><code class="bg-muted px-1.5 py-0.5 rounded text-xs">{{ header.type }}</code></td>
                                    <td class="p-2.5">
                                        <span v-if="header.required" class="text-xs text-destructive font-medium">必需</span>
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
                                    <td class="p-2.5"><code class="bg-muted px-1.5 py-0.5 rounded text-xs">{{ param.type }}</code></td>
                                    <td class="p-2.5">
                                        <span v-if="param.required" class="text-xs text-destructive font-medium">必需</span>
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
                            <div class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border">
                                JavaScript
                            </div>
                            <pre class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"><code>{{ endpoint.examples.js }}</code></pre>
                        </div>

                        <!-- PHP -->
                        <div class="rounded-lg border border-border overflow-hidden">
                            <div class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border">
                                PHP
                            </div>
                            <pre class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"><code>{{ endpoint.examples.php }}</code></pre>
                        </div>

                        <!-- cURL -->
                        <div class="rounded-lg border border-border overflow-hidden">
                            <div class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border">
                                cURL
                            </div>
                            <pre class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"><code>{{ endpoint.examples.curl }}</code></pre>
                        </div>
                    </div>
                </div>

                <!-- 响应示例 -->
                <div class="space-y-2">
                    <h3 class="text-sm font-semibold">响应示例</h3>
                    <div class="grid gap-3 sm:grid-cols-2">
                        <div class="rounded-lg border border-border overflow-hidden">
                            <div class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border flex items-center justify-between">
                                <span>成功响应 {{ endpoint.response.success.code ? `(${endpoint.response.success.code} OK)` : '' }}</span>
                                <span v-if="endpoint.response.success.type" class="text-muted-foreground">{{ endpoint.response.success.type }}</span>
                            </div>
                            <pre class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"><code>{{ endpoint.response.success.example }}</code></pre>
                        </div>
                        <div v-if="endpoint.response.error" class="rounded-lg border border-border overflow-hidden">
                            <div class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border">
                                错误响应
                            </div>
                            <pre class="bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"><code>{{ endpoint.response.error.example }}</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- SDKs -->
        <div v-if="activeTab === 'sdks'" class="space-y-6">
            <p class="text-sm text-muted-foreground">
                我们为您提供了开箱即用的本地 SDK，您可以直接下载并集成到您的项目中。
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
                <a
                    href="/sdk/mclogs-php-sdk.zip"
                    download
                    class="group block p-5 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                    <div class="flex items-center justify-between mb-3">
                        <div class="font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                            <span class="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">PHP</span>
                            PHP SDK
                        </div>
                        <span class="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">LOCAL</span>
                    </div>
                    <p class="text-sm text-muted-foreground mb-4">轻量级 cURL 封装，支持粘贴、读取及分析日志。</p>
                    <div class="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        点击下载 mclogs-php-sdk.zip
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </div>
                </a>
                <a
                    href="/sdk/mclogs-js-sdk.zip"
                    download
                    class="group block p-5 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                    <div class="flex items-center justify-between mb-3">
                        <div class="font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                            <span class="w-8 h-8 rounded-md bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 text-xs font-bold">JS</span>
                            JavaScript SDK
                        </div>
                        <span class="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold">LOCAL</span>
                    </div>
                    <p class="text-sm text-muted-foreground mb-4">基于 Fetch API，适用于浏览器或 Node.js 环境。</p>
                    <div class="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        点击下载 mclogs-js-sdk.zip
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </div>
                </a>
            </div>
        </div>

        <!-- 限制 -->
        <div v-if="activeTab === 'limits'" class="space-y-6">
            <div class="rounded-lg border border-border bg-card p-5">
                <h2 class="text-lg font-semibold mb-4">{{ t('api_limits') }}</h2>
                <ul class="space-y-3 text-sm">
                    <li class="flex items-start gap-3">
                        <span class="text-primary font-medium min-w-fit">{{ t('rate_limit') }}：</span>
                        <span class="text-muted-foreground">每分钟 <strong class="text-foreground">60 个请求</strong>（按 IP 计算）</span>
                    </li>
                    <li class="flex items-start gap-3">
                        <span class="text-primary font-medium min-w-fit">{{ t('content_limit') }}：</span>
                        <span class="text-muted-foreground">最大 <strong class="text-foreground">10 MiB</strong> 或 <strong class="text-foreground">25,000 行</strong></span>
                    </li>
                    <li class="flex items-start gap-3">
                        <span class="text-primary font-medium min-w-fit">{{ t('storage_time') }}：</span>
                        <span class="text-muted-foreground">日志在最后一次查看后至少保留 <strong class="text-foreground">90 天</strong>（7,776,000 秒）</span>
                    </li>
                    <li class="flex items-start gap-3">
                        <span class="text-primary font-medium min-w-fit">批量删除限制：</span>
                        <span class="text-muted-foreground">最多一次删除 <strong class="text-foreground">256 个日志</strong></span>
                    </li>
                    <li class="flex items-start gap-3">
                        <span class="text-primary font-medium min-w-fit">Content-Type：</span>
                        <span class="text-muted-foreground"><code class="bg-muted px-1.5 py-0.5 rounded text-xs">application/json</code></span>
                    </li>
                </ul>
            </div>

            <div class="rounded-lg border border-border bg-card p-5">
                <h2 class="text-lg font-semibold mb-4">隐私保护过滤器</h2>
                <p class="text-sm text-muted-foreground mb-4">所有提交的日志会自动应用以下过滤器：</p>
                <ul class="space-y-2 text-sm">
                    <li class="flex items-start gap-2">
                        <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span class="text-muted-foreground"><strong class="text-foreground">IPv4 地址</strong> 替换为 <code class="bg-muted px-1.5 py-0.5 rounded text-xs">**.**.**.**</code></span>
                    </li>
                    <li class="flex items-start gap-2">
                        <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span class="text-muted-foreground"><strong class="text-foreground">IPv6 地址</strong> 替换为 <code class="bg-muted px-1.5 py-0.5 rounded text-xs">****:****:****:****:****:****:****:****</code></span>
                    </li>
                    <li class="flex items-start gap-2">
                        <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span class="text-muted-foreground"><strong class="text-foreground">用户名</strong> 替换为 <code class="bg-muted px-1.5 py-0.5 rounded text-xs">********</code></span>
                    </li>
                    <li class="flex items-start gap-2">
                        <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span class="text-muted-foreground"><strong class="text-foreground">访问令牌</strong> 替换为 <code class="bg-muted px-1.5 py-0.5 rounded text-xs">********</code></span>
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
