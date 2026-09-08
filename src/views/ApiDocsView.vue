<script setup lang="ts">
import { ref } from 'vue'
import { t } from '@/lib/i18n'
import {
  PhCopy as Copy,
  PhCheck as Check,
  PhBooks as BookOpen,
  PhPlugs as Plug,
  PhShieldCheck as Shield,
  PhListMagnifyingGlass as ListSearch,
  PhFileText as FileText,
  PhBrain as Brain,
  PhInfo as Info,
  PhEyeSlash as EyeSlash,
  PhWarningCircle as WarningCircle,
  PhPackage as Package,
  PhCode as Code
} from '@phosphor-icons/vue'

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
    path: '/v1/log',
    title: t('paste_log'),
    description:
      '提交新的日志数据进行分析，生成分享链接和分析结果。支持纯文本或 JSON 格式，支持 gzip/deflate/br 压缩。',
    contentType: 'text/plain 或 application/json',
    params: [
      {
        name: 'content',
        type: 'string',
        required: false,
        desc: '日志内容字符串（JSON 模式必需，提供 files 时可省略）。最大 10 MiB / 50,000 行'
      },
      {
        name: 'files',
        type: 'array',
        required: false,
        desc: '附加文件数组，每个元素 {name, content}。name 以 .zip 结尾时自动展开（≤200 个文件，解压后累计 ≤12MB）'
      },
      {
        name: 'metadata[]',
        type: 'array',
        required: false,
        desc: '元数据数组，每项 {key, value, label?, visible?}；value 为字符串时直接存储，其他类型会 JSON 序列化；单项最长 value 1024 / label 128 / key 64 字符'
      },
      {
        name: 'source',
        type: 'string',
        required: false,
        desc: '来源标识（最长 64 字符），建议填写启动器名/版本（如 fcl/1.2.0）。知识库按启动器生态组织了问题案例（FCL/ZL2/PGW/Amethyst/MobileGlues），该字段用于让 AI 分析优先匹配对应来源'
      }
    ],
    response: {
      success: {
        code: 200,
        example: `{
    "success": true,
    "message": "Log submitted successfully",
    "id": "abc123",
    "url": "https://logshare.cn/abc123",
    "raw": "https://api.logshare.cn/v1/raw/abc123",
    "token": "token_xxxxx"
}`
      },
      error: {
        example: `{
    "success": false,
    "error": "请求参数错误",
    "code": 400
}`
      }
    },
    examples: {
      js: `// JSON 模式
const response = await fetch('https://api.logshare.cn/v1/log', {
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
const response = await fetch('https://api.logshare.cn/v1/log', {
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
$ch = curl_init('https://api.logshare.cn/v1/log');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);
print_r($result);`,
      curl: `# JSON 模式
curl -X POST https://api.logshare.cn/v1/log \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "[Server thread/INFO]: Starting minecraft server",
    "metadata": {"version": "1.20.1"},
    "source": "cli-upload"
  }'

# 纯文本模式
curl -X POST https://api.logshare.cn/v1/log \\
  -H "Content-Type: text/plain" \\
  -d @server.log`
    }
  },
  {
    method: 'POST',
    methodType: 'post',
    path: '/v1/analyse',
    title: '分析日志（本地 Codex）',
    description:
      '提交日志内容进行本地分析，不会存储到数据库。返回分析结果包括服务器类型、版本和问题检测。',
    contentType: 'text/plain 或 application/json',
    params: [{ name: 'content', type: 'string', required: true, desc: '日志原始内容' }],
    response: {
      success: {
        code: 200,
        example: `{
    "id": "vanilla/server",
    "name": "Vanilla",
    "type": "server",
    "version": "1.21.9",
    "title": "Vanilla 1.21.9 server",
    "analysis": {
        "problems": [
            { "message": "...", "counter": 1, "solutions": ["..."] }
        ],
        "information": [
            { "message": "minecraft-version: 1.21.9", "counter": 1 }
        ]
    }
}`
      },
      error: {
        example: `{
    "success": false,
    "error": "分析失败",
    "code": 400
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/v1/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: logContent
});
const data = await response.json();
console.log(data);`,
      php: `<?php
$ch = curl_init('https://api.logshare.cn/v1/analyse');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $logContent);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain']);
$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);
print_r($result);`,
      curl: `curl -X POST https://api.logshare.cn/v1/analyse \\
  -H "Content-Type: text/plain" \\
  -d @server.log`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/v1/raw/{id}',
    title: t('get_raw_log'),
    description: '获取指定日志的原始内容（多文件日志返回主文件）。支持多个 ID 用逗号分隔。',
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
    "error": "Log not found.",
    "code": 404
}`
      }
    },
    examples: {
      js: `// 获取单个日志
const response = await fetch('https://api.logshare.cn/v1/raw/abc1234');
const text = await response.text();
console.log(text);

// 获取多个日志
const response = await fetch('https://api.logshare.cn/v1/raw/abc1234,def5678');`,
      php: `<?php
// 获取单个日志
$text = file_get_contents('https://api.logshare.cn/v1/raw/abc1234');
echo $text;

// 获取多个日志
$text = file_get_contents('https://api.logshare.cn/v1/raw/abc1234,def5678');`,
      curl: `# 获取单个日志
curl https://api.logshare.cn/v1/raw/abc1234

# 获取多个日志
curl https://api.logshare.cn/v1/raw/abc1234,def5678`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/v1/raw/{id}/{filename}',
    title: '获取附加文件',
    description:
      '获取日志附加文件的原文（text/plain）。filename 支持子路径并需 URL 编码；路径会做遍历防护（拒绝 ../ 与绝对路径）。文件不存在返回 404。',
    params: [
      { name: 'id', type: 'string', required: true, desc: '日志 ID' },
      { name: 'filename', type: 'string', required: true, desc: '文件名（含子路径，需 URL 编码）' }
    ],
    response: {
      success: {
        code: 200,
        type: 'text/plain',
        example: `---- Minecraft Crash Report ----
// Don't blame me for this crash report...`
      },
      error: {
        example: `{
    "success": false,
    "error": "File not found.",
    "code": 404
}`
      }
    },
    examples: {
      js: `const response = await fetch(
    'https://api.logshare.cn/v1/raw/abc1234/' +
    encodeURIComponent('crash-reports/crash-01.txt')
);
const text = await response.text();
console.log(text);`,
      php: `<?php
$text = file_get_contents(
    'https://api.logshare.cn/v1/raw/abc1234/' .
    urlencode('crash-reports/crash-01.txt')
);
echo $text;`,
      curl: `curl 'https://api.logshare.cn/v1/raw/abc1234/crash-reports/crash-01.txt'`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/v1/log/{id}',
    title: '获取日志元信息与文件列表',
    description:
      '获取日志元信息及附加文件列表（不含内容）。多文件上传时可通过 files 字段获知全部附加文件。',
    params: [{ name: 'id', type: 'string', required: true, desc: '日志 ID' }],
    response: {
      success: {
        code: 200,
        example: `{
    "success": true,
    "message": "Log metadata retrieved successfully",
    "id": "abc123",
    "size": 4096,
    "lines": 120,
    "created": 1755200000,
    "expires": 1755804800,
    "metadata": [],
    "source": "minecraft-server",
    "files": [
        { "name": "crash-reports/crash-01.txt", "size": 2048 }
    ],
    "raw": "https://api.logshare.cn/v1/raw/abc123"
}`
      },
      error: {
        example: `{
    "success": false,
    "error": "Log not found.",
    "code": 404
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/v1/log/abc1234');
const data = await response.json();
console.log(data.files);`,
      php: `<?php
$data = json_decode(file_get_contents('https://api.logshare.cn/v1/log/abc1234'), true);
print_r($data['files']);`,
      curl: `curl https://api.logshare.cn/v1/log/abc1234`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/v1/insights/{id}',
    title: t('get_insights'),
    description: '获取已存储日志的分析洞察，包括服务器软件类型、版本和问题检测。',
    params: [{ name: 'id', type: 'string', required: true, desc: '日志 ID' }],
    response: {
      success: {
        code: 200,
        example: `{
    "id": "vanilla/server",
    "name": "Vanilla",
    "type": "Server Log",
    "version": "1.21.9",
    "title": "Vanilla 1.21.9 Server Log",
    "analysis": {
        "problems": [
            { "message": "...", "counter": 1, "solutions": ["..."] }
        ],
        "information": [
            { "message": "Minecraft version: 1.21.9", "counter": 1, "label": "Minecraft version", "value": "1.21.9" }
        ]
    }
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/v1/insights/abc1234');
const data = await response.json();
console.log(data);`,
      php: `<?php
$data = json_decode(file_get_contents('https://api.logshare.cn/v1/insights/abc1234'), true);
print_r($data);`,
      curl: `curl https://api.logshare.cn/v1/insights/abc1234`
    }
  },
  {
    method: 'DELETE',
    methodType: 'delete',
    path: '/v1/log/{id}',
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
    "error": "Missing token in Authorization header.",
    "code": 401
}`
      }
    },
    examples: {
      js: `// 删除单个日志
const response = await fetch('https://api.logshare.cn/v1/log/abc1234', {
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'
    }
});
const data = await response.json();

// 删除多个日志
const response = await fetch('https://api.logshare.cn/v1/log/abc1234,def5678', {
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'
    }
});`,
      php: `<?php
// 删除单个日志
$ch = curl_init('https://api.logshare.cn/v1/log/abc1234');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
]);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);

// 删除多个日志
$ch = curl_init('https://api.logshare.cn/v1/log/abc1234,def5678');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
]);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);`,
      curl: `# 删除单个日志
curl -X DELETE https://api.logshare.cn/v1/log/abc1234 \\
  -H "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"

# 删除多个日志
curl -X DELETE https://api.logshare.cn/v1/log/abc1234,def5678 \\
  -H "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/v1/limits',
    title: t('get_limits'),
    description: t('get_limits_desc'),
    params: [],
    response: {
      success: {
        code: 200,
        example: `{
    "maxLength": 10485760,
    "maxLines": 50000,
    "storageTime": 604800
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/v1/limits');
const data = await response.json();
console.log(data);`,
      php: `<?php
$data = json_decode(file_get_contents('https://api.logshare.cn/v1/limits'), true);
print_r($data);`,
      curl: `curl https://api.logshare.cn/v1/limits`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/v1/filters',
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
        { "type": "limit-lines", "data": { "limit": 50000 } },
        {
            "type": "regex",
            "data": {
                "patterns": [
                    { "pattern": "IPv4", "replacement": "**.**.**.**" },
                    { "pattern": "IPv6", "replacement": "****:****:****:****:****:****:****:****" },
                    { "pattern": "IPv6Short", "replacement": "****:****:****:****:****:****:****:****" },
                    { "pattern": "Uuid", "replacement": "********-****-****-****-************" },
                    { "pattern": "Xuid", "replacement": "xuid:\\"****************\\"" },
                    { "pattern": "SessionToken", "replacement": "accessToken:\\"********\\"" },
                    { "pattern": "ClientId", "replacement": "clientId:\\"********\\"" },
                    { "pattern": "Coordinate", "replacement": "BlockPos(*****, *****, *****)" },
                    { "pattern": "Username", "replacement": "C:\\\\Users\\\\********\\\\" },
                    { "pattern": "AccessToken", "replacement": "accessToken:\\"********\\"" }
                ]
            }
        }
    ]
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/v1/filters');
const data = await response.json();
console.log(data);`,
      php: `<?php
$data = json_decode(file_get_contents('https://api.logshare.cn/v1/filters'), true);
print_r($data);`,
      curl: `curl https://api.logshare.cn/v1/filters`
    }
  },
  {
    method: 'GET',
    methodType: 'get',
    path: '/v1/ai/{id}',
    title: 'AI 分析已存储日志',
    description:
      '读取已存储的日志，使用 AI 进行智能分析。SSE 流式输出：data: 为正文增量（OpenAI 兼容格式），event: status 推送排队、思维链与工具调用事件，event: done 结束。AI 关闭时统一返回 HTTP 404。分析结论按日志 ID 缓存 30 分钟，重复请求直接返回缓存结论。服务端启用分析队列时，流首帧为 queued 状态（含排队位置），队列满时在 SSE 开始前返回 HTTP 429 + Retry-After。推荐先调用 /v1/insights/{id} 展示结构化摘要（不消耗 AI 资源），用户主动触发时再调用本接口。',
    isSSE: true,
    params: [{ name: 'id', type: 'string', required: true, desc: '日志 ID' }],
    response: {
      success: {
        code: 200,
        example: `// 正文增量（OpenAI 兼容格式）
data: {"choices":[{"delta":{"content":"# 分析结果\\n..."}}]}

// 队列模式首帧：任务已入队，position 为近似排队深度
event: status
data: {"type":"queued","position":3}

// LogAgent 模式额外输出 status 事件
event: status
data: {"type":"thinking","delta":"用户日志显示端口被占用..."}
event: status
data: {"type":"tool","name":"web_search_exa","arguments":{"query":"..."}}
event: status
data: {"type":"tool_result","name":"web_search_exa","summary":"...","truncated":true}

// 流结束
event: done
data: {"status":"completed"}`
      },
      error: {
        example: `{
    "success": false,
    "error": "AI analysis is disabled.",
    "code": 404
}

// 队列满（SSE 开始前，带 Retry-After: 30 头）
{
    "success": false,
    "error": "AI 分析队列已满，请稍后重试。",
    "code": 429
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/v1/ai/abc1234');
const reader = response.body.getReader();
const decoder = new TextDecoder();
let fullText = '';
let currentEvent = '';

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\\n')) {
        if (line.startsWith('event:')) { currentEvent = line.slice(6).trim(); continue; }
        if (currentEvent === 'done') break;
        if (!line.startsWith('data: ')) continue;
        const payload = JSON.parse(line.slice(6));
        if (currentEvent === 'status') { console.log('status:', payload); continue; }
        fullText += payload.choices?.[0]?.delta?.content || '';
    }
}
console.log(fullText);`,
      php: `<?php
// PHP 不支持 SSE 客户端流式读取，建议使用 curl -N 直接查看
$ch = curl_init('https://api.logshare.cn/v1/ai/abc1234');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      curl: `# SSE 流式方式
curl -N https://api.logshare.cn/v1/ai/abc1234`
    }
  },
  {
    method: 'POST',
    methodType: 'post',
    path: '/v1/ai/analyse',
    title: 'AI 分析日志内容',
    description:
      '直接提交内容给 AI 分析，不落盘。SSE 流式输出（协议同上，队列模式含 queued 首帧与 429 队列满），缓存基于内容哈希（30 分钟 TTL）。可选传 id 绑定已存在日志：Agent 获得该日志附加文件的访问权（可用于多文件对比），content 可省略。注意：直传内容不经过脱敏过滤链，原文直接发送给 AI 网关；含敏感信息（token、IP 等）的日志建议先走 POST /v1/log 再分析。',
    isSSE: true,
    contentType: 'application/json',
    params: [
      {
        name: 'content',
        type: 'string',
        required: false,
        desc: '日志内容（传入 id 时可省略，缺省读取该 ID 主文件）'
      },
      {
        name: 'id',
        type: 'string',
        required: false,
        desc: '已存在的日志 ID，绑定后 Agent 可读取其附加文件'
      }
    ],
    response: {
      success: {
        code: 200,
        example: `// SSE 流式数据，协议同 GET /v1/ai/{id}
data: {"choices":[{"delta":{"content":"# 崩溃分析..."}}]}

event: done
data: {"status":"completed"}`
      },
      error: {
        example: `{
    "success": false,
    "error": "AI analysis is disabled.",
    "code": 404
}`
      }
    },
    examples: {
      js: `const response = await fetch('https://api.logshare.cn/v1/ai/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        content: "[Server thread/ERROR]: Could not bind to port 25565..."
    })
});
// SSE 流式读取同 GET /v1/ai/{id}`,
      php: `<?php
$data = ['content' => "[Server thread/ERROR]: Could not bind to port 25565..."];
$ch = curl_init('https://api.logshare.cn/v1/ai/analyse');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      curl: `curl -N -X POST https://api.logshare.cn/v1/ai/analyse \\
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

// 端点分组：端点卡片按业务域聚合，替代线性平铺
const endpointGroups = [
  { group: '日志核心', match: ['/v1/log', '/v1/analyse', '/v1/raw/{id}', '/v1/raw/{id}/{filename}', '/v1/log/{id}'] },
  { group: 'AI 分析', match: ['/v1/insights/{id}', '/v1/ai/{id}', '/v1/ai/analyse'] },
  { group: '站点信息', match: ['/v1/limits', '/v1/filters'] }
]

const groupedEndpoints = endpointGroups
  .map(g => ({
    group: g.group,
    items: endpoints.filter(ep => g.match.includes(ep.path))
  }))
  .filter(g => g.items.length > 0)

// 分组标题图标：与 lemwood 文档页一致的「标题 + duotone 图标」风格
const groupIcon = (name: string) =>
  name === 'AI 分析' ? Brain : name === '站点信息' ? Info : FileText

const hasContentType = (endpoint: any) => {
  return endpoint.contentType !== undefined
}

const isSSEEndpoint = (endpoint: any) => {
  return endpoint.isSSE === true
}
</script>

<template>
  <!-- min-w-0 + overflow-x-clip：移动端兜底，防止表格/代码块把页面撑出横向滚动 -->
  <div class="container mx-auto min-w-0 max-w-4xl overflow-x-clip px-3 py-6">
    <!-- 页面标题 -->
    <header class="mb-8">
      <h1 class="text-3xl font-bold mb-2">
        {{ t('api_docs') }}
      </h1>
      <p class="text-sm text-muted-foreground leading-relaxed">
        {{ t('home_subtitle') }} <strong class="text-foreground">LogShare.CN</strong>
        {{ t('integration_text') }}
      </p>
    </header>

    <!-- 导航标签 -->
    <div class="mb-8 flex flex-wrap gap-2 border-b border-border">
      <button
        v-for="tab in [
          { key: 'overview', label: '概述' },
          { key: 'endpoints', label: 'API 端点' },
          { key: 'sdks', label: t('local_sdks') },
          { key: 'limits', label: t('api_limits') }
        ] as const"
        :key="tab.key"
        :class="[
          'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          activeTab === tab.key
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 概述 -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <section class="space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <BookOpen weight="duotone" class="h-5 w-5 text-primary" />
          快速接入
        </h2>
        <p class="text-sm text-muted-foreground">
          接入「日志上传 + AI 分析」的最小流程：上传后使用返回的
          <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">token</code>
          删除日志（丢失无法找回，请自行持久化）；移动端建议开启 gzip 上传；客户端读超时建议 300
          秒以上（Agent 多轮工具分析可能持续数十秒）。
        </p>
        <div class="rounded-lg border border-border overflow-x-auto">
          <div class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border">
            cURL
          </div>
          <pre
            class="max-w-full bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
          ><code>{{ `# 1. 上传日志（source 填启动器名/版本，用于匹配对应生态的知识库）
curl -X POST https://api.logshare.cn/v1/log \
     -H 'Content-Type: application/json' \
     -d '{"content":"<日志全文>","source":"your-launcher/1.0.0"}'
# → {"success":true,"id":"sAbCdEf","token":"...","raw":"...","url":"..."}

# 2. 获取原始日志或结构化解析（可选）
curl https://api.logshare.cn/v1/raw/sAbCdEf          # 日志原文
curl https://api.logshare.cn/v1/insights/sAbCdEf     # Codex 结构化分析

# 3. AI 深度分析（SSE 流式，读超时建议 ≥300s）
curl -N https://api.logshare.cn/v1/ai/sAbCdEf` }}</code></pre>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <Plug weight="duotone" class="h-5 w-5 text-primary" />
          API 基础信息
        </h2>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="p-4 rounded-lg border border-border bg-card">
            <div class="text-xs text-muted-foreground mb-1">基础 URL</div>
            <div class="font-mono text-sm flex items-center justify-between">
              <span>https://api.logshare.cn</span>
              <button
                class="text-muted-foreground hover:text-foreground transition-colors"
                @click="copyEndpoint('https://api.logshare.cn')"
              >
                <Copy
                  v-if="copiedEndpoint !== 'https://api.logshare.cn'"
                  weight="duotone"
                  class="h-3.5 w-3.5"
                />
                <Check v-else weight="duotone" class="h-3.5 w-3.5" />
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
            所有 API 请求均使用 HTTPS 协议，HTTP 请求会被自动重定向到 HTTPS。全局限流按 IP + 方法 +
            归一化路径计数，默认每 IP 每方法每路径 36,000 次/60 秒，触发返回 HTTP 429。
          </p>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <ListSearch weight="duotone" class="h-5 w-5 text-primary" />
          可用端点
        </h2>
        <div class="rounded-lg border border-border overflow-x-auto">
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
                <td class="p-3 break-all font-mono text-xs">/v1/log</td>
                <td class="p-3 text-muted-foreground">提交日志</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('post')"
                    >POST</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/analyse</td>
                <td class="p-3 text-muted-foreground">分析日志（本地 Codex）</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/raw/{id}</td>
                <td class="p-3 text-muted-foreground">获取原始日志</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/insights/{id}</td>
                <td class="p-3 text-muted-foreground">获取日志分析结果</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/raw/{id}/{filename}</td>
                <td class="p-3 text-muted-foreground">获取日志附加文件</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/log/{id}</td>
                <td class="p-3 text-muted-foreground">获取日志元信息与文件列表</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span
                    class="px-2 py-1 rounded text-xs font-bold"
                    :class="methodTypeClass('delete')"
                    >DELETE</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/log/{id}</td>
                <td class="p-3 text-muted-foreground">删除日志</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/limits</td>
                <td class="p-3 text-muted-foreground">获取限制信息</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/filters</td>
                <td class="p-3 text-muted-foreground">获取过滤器信息</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('get')"
                    >GET</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/ai/{id}</td>
                <td class="p-3 text-muted-foreground">AI 分析已存储日志（SSE 流式输出）</td>
              </tr>
              <tr class="border-t border-border hover:bg-muted/30 transition-colors">
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold" :class="methodTypeClass('post')"
                    >POST</span
                  >
                </td>
                <td class="p-3 break-all font-mono text-xs">/v1/ai/analyse</td>
                <td class="p-3 text-muted-foreground">AI 分析日志内容（SSE 流式输出）</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- API 端点 -->
    <div v-if="activeTab === 'endpoints'" class="space-y-10">
      <section v-for="group in groupedEndpoints" :key="group.group" class="space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <component :is="groupIcon(group.group)" weight="duotone" class="h-5 w-5 text-primary" />
          {{ group.group }}
        </h2>

        <div v-for="endpoint in group.items" :key="endpoint.path" class="space-y-4">
          <div class="rounded-lg border border-border bg-card">
            <!-- 端点头：method 徽标 + 路径 + 复制 -->
            <div
              class="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3"
            >
              <div class="flex min-w-0 flex-wrap items-center gap-2.5">
                <span
                  class="shrink-0 px-2.5 py-1 rounded text-xs font-bold"
                  :class="methodTypeClass(endpoint.methodType)"
                >
                  {{ endpoint.method }}
                </span>
                <code class="break-all text-sm font-mono">{{ endpoint.path }}</code>
              </div>
              <button
                class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                @click="copyEndpoint(`https://api.logshare.cn${endpoint.path}`)"
              >
                <Copy
                  v-if="copiedEndpoint !== `https://api.logshare.cn${endpoint.path}`"
                  weight="duotone"
                  class="h-3.5 w-3.5"
                />
                <Check v-else weight="duotone" class="h-3.5 w-3.5" />
                {{
                  copiedEndpoint === `https://api.logshare.cn${endpoint.path}`
                    ? t('copied')
                    : t('copy')
                }}
              </button>
            </div>

            <div class="space-y-4 p-4">
              <!-- 描述 -->
              <p class="text-sm leading-relaxed text-muted-foreground">
                {{ endpoint.description }}
              </p>

              <!-- SSE 提示 -->
              <p v-if="isSSEEndpoint(endpoint)" class="text-sm text-blue-500">
                该接口为 SSE 流式输出
              </p>

              <!-- Content-Type 提示 -->
              <div
                v-if="hasContentType(endpoint)"
                class="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span class="font-medium">Content-Type:</span>
                <code class="bg-muted px-1.5 py-0.5 rounded break-all">{{ endpoint.contentType }}</code>
              </div>

              <!-- 请求头 -->
              <div v-if="endpoint.headers && endpoint.headers.length > 0" class="space-y-2">
                <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  请求头
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="header in endpoint.headers"
                    :key="header.name"
                    class="rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <code class="break-all font-mono text-xs font-semibold text-primary">{{
                        header.name
                      }}</code>
                      <code class="bg-muted px-1.5 py-0.5 rounded text-[10px]">{{ header.type }}</code>
                      <span v-if="header.required" class="text-[10px] font-medium text-destructive"
                        >必需</span
                      >
                      <span v-else class="text-[10px] text-muted-foreground">可选</span>
                    </div>
                    <p class="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                      {{ header.desc }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 请求参数 -->
              <div v-if="endpoint.params.length > 0" class="space-y-2">
                <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  请求参数
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="param in endpoint.params"
                    :key="param.name"
                    class="rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <code class="break-all font-mono text-xs font-semibold text-primary">{{
                        param.name
                      }}</code>
                      <code class="bg-muted px-1.5 py-0.5 rounded text-[10px]">{{ param.type }}</code>
                      <span v-if="param.required" class="text-[10px] font-medium text-destructive"
                        >必需</span
                      >
                      <span v-else class="text-[10px] text-muted-foreground">可选</span>
                    </div>
                    <p class="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                      {{ param.desc }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 代码示例 -->
              <div class="min-w-0 space-y-1.5">
                <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  调用示例
                </h4>
                <div class="space-y-3">
                  <div class="min-w-0 overflow-hidden rounded-lg border border-border">
                    <div
                      class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border"
                    >
                      JavaScript
                    </div>
                    <pre
                      class="max-w-full bg-slate-950 text-slate-50 p-3.5 text-xs overflow-x-auto whitespace-pre leading-relaxed"
                    ><code>{{ endpoint.examples.js }}</code></pre>
                  </div>

                  <div class="min-w-0 overflow-hidden rounded-lg border border-border">
                    <div
                      class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border"
                    >
                      cURL
                    </div>
                    <pre
                      class="max-w-full bg-slate-950 text-slate-50 p-3.5 text-xs overflow-x-auto whitespace-pre leading-relaxed"
                    ><code>{{ endpoint.examples.curl }}</code></pre>
                  </div>
                </div>
              </div>

              <!-- 响应示例 -->
              <div class="min-w-0 space-y-1.5">
                <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  响应示例
                </h4>
                <div class="space-y-3">
                  <div class="min-w-0 overflow-hidden rounded-lg border border-border">
                    <div
                      class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border flex items-center justify-between"
                    >
                      <span
                        >成功响应
                        {{
                          endpoint.response.success.code
                            ? `(${endpoint.response.success.code} OK)`
                            : ''
                        }}</span
                      >
                      <span v-if="endpoint.response.success.type" class="break-all">{{
                        endpoint.response.success.type
                      }}</span>
                    </div>
                    <pre
                      class="max-w-full bg-slate-950 text-slate-50 p-3.5 text-xs overflow-x-auto whitespace-pre leading-relaxed"
                    ><code>{{ endpoint.response.success.example }}</code></pre>
                  </div>
                  <div
                    v-if="endpoint.response.error"
                    class="min-w-0 overflow-hidden rounded-lg border border-border"
                  >
                    <div
                      class="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border"
                    >
                      错误响应
                    </div>
                    <pre
                      class="max-w-full bg-slate-950 text-slate-50 p-3.5 text-xs overflow-x-auto whitespace-pre leading-relaxed"
                    ><code>{{ endpoint.response.error.example }}</code></pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- SDKs -->
    <div v-if="activeTab === 'sdks'" class="space-y-6">
      <h2 class="flex items-center gap-2 text-lg font-semibold">
        <Package weight="duotone" class="h-5 w-5 text-primary" />
        {{ t('local_sdks') }}
      </h2>
      <p class="text-sm text-muted-foreground">
        我们为您提供了开箱即用的本地 SDK，您可以直接下载并集成到您的项目中。
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
            高性能 cURL 封装，支持批量上传、完整错误处理。PHP 7.4+
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
            基于 Fetch API + ReadableStream，支持浏览器和 Node.js 环境。
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
            基于 java.net.http.HttpClient，无第三方依赖。Java 11+
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
            基于 System.Net.Http.HttpClient，完整异步支持。.NET 6+
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
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <Code weight="duotone" class="h-5 w-5 text-primary" />
          快速使用示例
        </h2>

        <div class="space-y-4">
          <!-- PHP 示例 -->
          <div class="rounded-lg border border-border overflow-x-auto">
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
              class="max-w-full bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
            ><code>&lt;?php
require_once 'mclogs.php';

use LogShare\LogShareSDK;

$sdk = new LogShareSDK([
    'timeout' => 120
]);

// 上传日志
$result = $sdk->paste("[Server thread/INFO]: Starting minecraft server");
$id = $result['id'];</code></pre>
          </div>

          <!-- JavaScript 示例 -->
          <div class="rounded-lg border border-border overflow-x-auto">
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
              class="max-w-full bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
            ><code>import { LogShareSDK } from './mclogs.js';

const sdk = new LogShareSDK({ timeout: 120000 });

// 上传日志
const result = await sdk.paste('[Server thread/INFO]: Starting...');
const id = result.id;</code></pre>
          </div>

          <!-- Java 示例 -->
          <div class="rounded-lg border border-border overflow-x-auto">
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
              class="max-w-full bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
            ><code>import cn.logshare.sdk.LogShareSDK;
import cn.logshare.sdk.LogShareException;
import java.util.*;

public class Example {
    public static void main(String[] args) {
        LogShareSDK sdk = new LogShareSDK();

        try {
            // 上传日志
            Map&lt;String, Object&gt; result = sdk.paste("[Server thread/INFO]: Starting...");
            String id = (String) result.get("id");
        } catch (LogShareException e) {
            System.err.println("错误: " + e.getMessage());
        }
    }
}</code></pre>
          </div>

          <!-- .NET 示例 -->
          <div class="rounded-lg border border-border overflow-x-auto">
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
              class="max-w-full bg-slate-950 text-slate-50 p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed"
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
            var id = result.GetProperty("id").GetString();
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
        <h2 class="flex items-center gap-2 text-lg font-semibold mb-4">
          <Shield weight="duotone" class="h-5 w-5 text-primary" />
          {{ t('api_limits') }}
        </h2>
        <ul class="space-y-3 text-sm">
          <li class="flex items-start gap-3">
            <span class="text-primary font-medium min-w-fit">{{ t('rate_limit') }}：</span>
            <span class="text-muted-foreground"
              >每 IP 每方法每路径
              <strong class="text-foreground">36,000 次/60 秒</strong>（动态资源段如 /v1/raw/{id}
              共享同一桶），触发返回 HTTP 429</span
            >
          </li>
          <li class="flex items-start gap-3">
            <span class="text-primary font-medium min-w-fit">{{ t('content_limit') }}：</span>
            <span class="text-muted-foreground"
              >最大 <strong class="text-foreground">10 MiB</strong> 或
              <strong class="text-foreground">50,000 行</strong></span
            >
          </li>
          <li class="flex items-start gap-3">
            <span class="text-primary font-medium min-w-fit">{{ t('storage_time') }}：</span>
            <span class="text-muted-foreground"
              >日志保留 <strong class="text-foreground">7 天</strong>（604,800 秒）</span
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
        <h2 class="flex items-center gap-2 text-lg font-semibold mb-4">
          <EyeSlash weight="duotone" class="h-5 w-5 text-primary" />
          隐私保护过滤器
        </h2>
        <p class="text-sm text-muted-foreground mb-4">
          所有提交的日志会自动应用以下过滤器（按执行顺序）：
        </p>
        <ul class="space-y-2 text-sm">
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">Trim</strong> — 去除日志首尾空白</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">LimitBytes</strong> — 超过 10 MiB 拒绝上传</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">LimitLines</strong> — 超过 50,000 行拒绝上传</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">IPv4</strong> — 替换为
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">**.**.**.**</code>（豁免
              127.x、0.0.0.0、1.x、8.8.8.8）</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">IPv6</strong> — 完整 IPv6 替换为
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs"
                >****:****:****:****:****:****:****:****</code
              >（豁免 ::1、::）</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">IPv6Short</strong> — 简写 IPv6（含 ::ffff:
              映射）替换为
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs"
                >****:****:****:****:****:****:****:****</code
              ></span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">UUID</strong> — 替换标准/无连字符/花括号/urn:uuid
              格式为
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs"
                >********-****-****-****-************</code
              ></span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">XUID</strong> — 替换 Xbox User ID 为
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">****************</code></span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">SessionToken</strong> — 替换 access token、Bearer
              token、session ID</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">ClientId</strong> — 替换 clientId / deviceId /
              instanceId / launcherId</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">Coordinate</strong> — 替换 Minecraft 坐标（BlockPos /
              Vec3d / at() 等）</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">Username</strong> — 替换用户路径中的用户名及
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">USERNAME=</code> 环境变量</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Check weight="duotone" class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-muted-foreground"
              ><strong class="text-foreground">AccessToken</strong> — 替换
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">accessToken</code> /
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">access_token</code> 字段值及
              <code class="bg-muted px-1.5 py-0.5 rounded text-xs">X-Access-Token</code>
              请求头</span
            >
          </li>
        </ul>
      </div>

      <div class="rounded-lg border border-border bg-card p-5">
        <h2 class="flex items-center gap-2 text-lg font-semibold mb-4">
          <WarningCircle weight="duotone" class="h-5 w-5 text-primary" />
          错误码
        </h2>
        <div class="rounded-lg border border-border overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50">
              <tr>
                <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">错误码</th>
                <th class="p-2.5 text-left font-medium text-muted-foreground text-xs">描述</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-border transition-colors hover:bg-muted/30">
                <td class="p-2.5 font-mono text-xs">400</td>
                <td class="p-2.5 text-muted-foreground">请求参数错误</td>
              </tr>
              <tr class="border-t border-border transition-colors hover:bg-muted/30">
                <td class="p-2.5 font-mono text-xs">403</td>
                <td class="p-2.5 text-muted-foreground">Token 无效或权限不足</td>
              </tr>
              <tr class="border-t border-border transition-colors hover:bg-muted/30">
                <td class="p-2.5 font-mono text-xs">404</td>
                <td class="p-2.5 text-muted-foreground">资源未找到</td>
              </tr>
              <tr class="border-t border-border transition-colors hover:bg-muted/30">
                <td class="p-2.5 font-mono text-xs">405</td>
                <td class="p-2.5 text-muted-foreground">方法不被允许</td>
              </tr>
              <tr class="border-t border-border transition-colors hover:bg-muted/30">
                <td class="p-2.5 font-mono text-xs">413</td>
                <td class="p-2.5 text-muted-foreground">请求体过大</td>
              </tr>
              <tr class="border-t border-border transition-colors hover:bg-muted/30">
                <td class="p-2.5 font-mono text-xs">415</td>
                <td class="p-2.5 text-muted-foreground">不支持的内容类型</td>
              </tr>
              <tr class="border-t border-border transition-colors hover:bg-muted/30">
                <td class="p-2.5 font-mono text-xs">429</td>
                <td class="p-2.5 text-muted-foreground">请求频率超限</td>
              </tr>
              <tr class="border-t border-border transition-colors hover:bg-muted/30">
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
