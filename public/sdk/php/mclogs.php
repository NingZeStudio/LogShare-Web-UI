<?php

/**
 * LogShare.CNᴺᵉˣᵀ PHP SDK
 * 高性能 Minecraft/Hytale 日志分享与分析 API 封装
 * 
 * @version 2.0.0
 * @author LogShare.CN
 * @license MIT
 */

declare(strict_types=1);

namespace LogShare;

use Exception;
use RuntimeException;
use InvalidArgumentException;

/**
 * SDK 自定义异常类
 */
class LogShareException extends Exception
{
    private ?string $errorCode;
    private ?int $httpStatus;

    public function __construct(
        string $message = '',
        string $errorCode = null,
        int $httpStatus = null,
        int $code = 0,
        Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->errorCode = $errorCode;
        $this->httpStatus = $httpStatus;
    }

    public function getErrorCode(): ?string
    {
        return $this->errorCode;
    }

    public function getHttpStatus(): ?int
    {
        return $this->httpStatus;
    }

    public function toArray(): array
    {
        return [
            'success' => false,
            'error' => $this->getMessage(),
            'code' => $this->errorCode,
            'status' => $this->httpStatus,
            'timestamp' => date('c')
        ];
    }
}

/**
 * SSE 事件结构
 */
class SseEvent
{
    public ?string $id = null;
    public ?string $event = null;
    public string $data = '';
    public int $retry = 0;
}

/**
 * 主 SDK 类
 */
class LogShareSDK
{
    private string $baseUrl;
    private int $timeout;
    private int $connectTimeout;
    private ?callable $errorHandler;
    private array $defaultHeaders;
    private string $version = '2.0.0';

    /**
     * 创建 SDK 实例
     * 
     * @param array $options 配置选项
     *   - baseUrl: API 基础 URL (默认: https://api.logshare.cn)
     *   - timeout: 请求超时时间（秒）(默认: 120，AI 分析需要更长时间)
     *   - connectTimeout: 连接超时时间（秒）(默认: 10)
     *   - errorHandler: 全局错误处理回调函数
     *   - headers: 默认请求头
     */
    public function __construct(array $options = [])
    {
        $this->baseUrl = rtrim($options['baseUrl'] ?? 'https://api.logshare.cn', '/');
        $this->timeout = $options['timeout'] ?? 120;
        $this->connectTimeout = $options['connectTimeout'] ?? 10;
        $this->errorHandler = $options['errorHandler'] ?? null;
        $this->defaultHeaders = array_merge([
            'Accept' => 'application/json',
            'User-Agent' => "LogShare-PHP-SDK/{$this->version}"
        ], $options['headers'] ?? []);
    }

    // ==================== 核心 API 方法 ====================

    /**
     * 粘贴/上传日志文件
     * 
     * @param string $content 原始日志内容（最大 1MiB 或 50k 行）
     * @param array|null $metadata 可选元数据
     * @param string|null $source 可选来源标识
     * @return array {success: bool, data: {id: string, url: string, raw: string, token: string}}
     * @throws LogShareException
     */
    public function paste(string $content, ?array $metadata = null, ?string $source = null): array
    {
        $this->validateContent($content);

        // JSON 格式支持元数据
        if ($metadata !== null || $source !== null) {
            return $this->request('/1/log', 'POST', [
                'content' => $content,
                'metadata' => $metadata,
                'source' => $source
            ], [
                'Content-Type' => 'application/json'
            ]);
        }

        // 纯文本格式（向后兼容）
        return $this->request('/1/log', 'POST', ['content' => $content], [
            'Content-Type' => 'application/x-www-form-urlencoded'
        ]);
    }

    /**
     * 即时分析日志（本地 Codex，不保存到数据库）
     * 
     * @param string $content 原始日志内容
     * @return array {success: bool, data: {id: string, name: string, type: string, entries: array, insights: array}}
     * @throws LogShareException
     */
    public function analyse(string $content): array
    {
        $this->validateContent($content);

        return $this->request('/1/analyse', 'POST', ['content' => $content], [
            'Content-Type' => 'application/x-www-form-urlencoded'
        ]);
    }

    /**
     * 获取日志洞察分析
     * 
     * @param string $id 日志 ID
     * @return array {success: bool, data: {id: string, name: string, type: string, insights: array}}
     * @throws LogShareException
     */
    public function getInsights(string $id): array
    {
        $this->validateId($id);

        return $this->request('/1/insights/' . urlencode($id));
    }

    /**
     * 获取原始日志内容
     * 
     * @param string|array $id 日志 ID 或 ID 数组
     * @return string 原始日志文本
     * @throws LogShareException
     */
    public function getRaw($id): string
    {
        if (is_array($id)) {
            $id = implode(',', array_map(function($i) { $this->validateId($i); return $i; }, $id));
        } else {
            $this->validateId($id);
        }

        return $this->requestRaw('/1/raw/' . urlencode($id));
    }

    /**
     * 获取存储限制参数
     * 
     * @return array {success: bool, data: {storageTime: int, maxLength: int, maxLines: int}}
     * @throws LogShareException
     */
    public function getLimits(): array
    {
        return $this->request('/1/limits');
    }

    /**
     * 获取过滤器信息
     * 
     * @return array {success: bool, data: {filters: array}}
     * @throws LogShareException
     */
    public function getFilters(): array
    {
        return $this->request('/1/filters');
    }

    /**
     * 删除日志文件
     * 
     * @param string|array $id 日志 ID 或 ID 数组
     * @param string|null $token 授权 Token
     * @return array {success: bool, deleted: array, failed: array, total: int, deletedCount: int, failedCount: int}
     * @throws LogShareException
     */
    public function delete($id, ?string $token = null): array
    {
        if (is_array($id)) {
            $id = implode(',', array_map(function($i) { $this->validateId($i); return $i; }, $id));
        } else {
            $this->validateId($id);
        }

        $headers = ['Content-Type' => 'application/json'];
        if ($token !== null) {
            $headers['Authorization'] = "Bearer $token";
        }

        return $this->request('/1/delete/' . urlencode($id), 'DELETE', [], $headers);
    }

    // ==================== AI 分析（SSE 流式） ====================

    /**
     * 使用大模型智能分析已存储日志（SSE 流式）
     * 
     * @param string $id 日志 ID
     * @param callable|null $onChunk 每个 SSE 数据块回调: function(array $chunk): void
     * @param callable|null $onDone 完成回调: function(string $fullAnalysis): void
     * @param callable|null $onError 错误回调: function(array $error): void
     * @return array 完整分析结果（阻塞直到流结束）
     * @throws LogShareException
     */
    public function streamAiAnalysis(
        string $id,
        ?callable $onChunk = null,
        ?callable $onDone = null,
        ?callable $onError = null
    ): array {
        $this->validateId($id);

        $fullJson = '';
        $isCached = false;

        $ch = $this->createSseCurlHandle("/1/ai/" . urlencode($id));

        // 检测是否为缓存响应（非 SSE）
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $header) use (&$isCached) {
            if (stripos($header, 'Content-Type:') !== false) {
                if (stripos($header, 'text/event-stream') === false) {
                    $isCached = true;
                }
            }
            return strlen($header);
        });

        // SSE 数据缓冲
        $sseBuffer = '';

        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) use (
            &$sseBuffer, &$fullJson, $onChunk, $onError, $isCached
        ) {
            // 如果是缓存响应，直接累积
            $sseBuffer .= $data;
            return strlen($data);
        });

        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            $this->handleError(new LogShareException("cURL Error: $curlError", 'CURL_ERROR'));
        }

        if ($httpCode >= 400) {
            $this->handleError(new LogShareException("HTTP Error $httpCode", 'HTTP_ERROR', $httpCode));
        }

        // 处理缓存响应（完整 JSON）
        if ($isCached) {
            $decoded = json_decode($sseBuffer, true);
            if ($decoded === null) {
                $this->handleError(new LogShareException('Invalid JSON response', 'JSON_ERROR'));
            }
            if ($onDone !== null) {
                $onDone(json_encode($decoded['data']['analysis'] ?? []));
            }
            return $decoded;
        }

        // 解析 SSE 流
        return $this->parseSseStream($sseBuffer, $onChunk, $onDone, $onError);
    }

    /**
     * 使用大模型智能分析日志内容（SSE 流式）
     * 
     * @param string $content 日志内容
     * @param callable|null $onChunk 每个 SSE 数据块回调: function(array $chunk): void
     * @param callable|null $onDone 完成回调: function(string $fullAnalysis): void
     * @param callable|null $onError 错误回调: function(array $error): void
     * @return array 完整分析结果（阻塞直到流结束）
     * @throws LogShareException
     */
    public function streamAnalyseContent(
        string $content,
        ?callable $onChunk = null,
        ?callable $onDone = null,
        ?callable $onError = null
    ): array {
        $this->validateContent($content);

        $fullJson = '';
        $isCached = false;

        $ch = $this->createSseCurlHandle('/1/ai/analyse', 'POST', ['content' => $content], [
            'Content-Type' => 'application/x-www-form-urlencoded'
        ]);

        // 检测是否为缓存响应（非 SSE）
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $header) use (&$isCached) {
            if (stripos($header, 'Content-Type:') !== false) {
                if (stripos($header, 'text/event-stream') === false) {
                    $isCached = true;
                }
            }
            return strlen($header);
        });

        $sseBuffer = '';

        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) use (&$sseBuffer) {
            $sseBuffer .= $data;
            return strlen($data);
        });

        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            $this->handleError(new LogShareException("cURL Error: $curlError", 'CURL_ERROR'));
        }

        if ($httpCode >= 400) {
            $this->handleError(new LogShareException("HTTP Error $httpCode", 'HTTP_ERROR', $httpCode));
        }

        // 处理缓存响应
        if ($isCached) {
            $decoded = json_decode($sseBuffer, true);
            if ($decoded === null) {
                $this->handleError(new LogShareException('Invalid JSON response', 'JSON_ERROR'));
            }
            if ($onDone !== null) {
                $onDone(json_encode($decoded['data']['analysis'] ?? []));
            }
            return $decoded;
        }

        // 解析 SSE 流
        return $this->parseSseStream($sseBuffer, $onChunk, $onDone, $onError);
    }

    /**
     * 使用大模型智能分析日志（阻塞式，向后兼容）
     * 
     * @deprecated 使用 streamAiAnalysis() 获取实时流式输出
     * @param string $id 日志 ID
     * @return array 完整分析结果
     * @throws LogShareException
     */
    public function getAIAnalysis(string $id): array
    {
        return $this->streamAiAnalysis($id);
    }

    // ==================== 批量与工具方法 ====================

    /**
     * 批量上传多个日志
     * 
     * @param array $logs 日志数组，每个元素包含 name 和 content
     * @return array 上传结果数组
     */
    public function batchPaste(array $logs): array
    {
        $results = [];
        $multiHandle = curl_multi_init();
        $handles = [];

        foreach ($logs as $index => $log) {
            if (!isset($log['content'])) {
                $results[$index] = [
                    'name' => $log['name'] ?? "log_$index",
                    'result' => null,
                    'error' => 'Missing content field'
                ];
                continue;
            }

            $ch = $this->createCurlHandle('/1/log', 'POST', ['content' => $log['content']], [
                'Content-Type' => 'application/x-www-form-urlencoded'
            ]);
            
            curl_multi_add_handle($multiHandle, $ch);
            $handles[$index] = [
                'handle' => $ch,
                'name' => $log['name'] ?? "log_$index"
            ];
        }

        $running = null;
        do {
            curl_multi_exec($multiHandle, $running);
            curl_multi_select($multiHandle);
        } while ($running > 0);

        foreach ($handles as $index => $info) {
            $ch = $info['handle'];
            $response = curl_multi_getcontent($ch);
            $error = curl_error($ch);
            
            if ($error) {
                $results[$index] = [
                    'name' => $info['name'],
                    'result' => null,
                    'error' => $error
                ];
            } else {
                $decoded = json_decode($response, true);
                $results[$index] = [
                    'name' => $info['name'],
                    'result' => $decoded,
                    'error' => json_last_error() !== JSON_ERROR_NONE ? 'Invalid JSON' : null
                ];
            }
            
            curl_multi_remove_handle($multiHandle, $ch);
            curl_close($ch);
        }

        curl_multi_close($multiHandle);
        return $results;
    }

    /**
     * 完整分析流程：上传并获取 AI 分析
     * 
     * @param string $content 日志内容
     * @param array $options 选项
     *   - includeInsights: 是否同时获取基础洞察 (默认: false)
     *   - streaming: 是否使用 SSE 流式 (默认: false)
     *   - onChunk: 流式数据块回调
     * @return array {upload: array, aiAnalysis: array, insights?: array}
     * @throws LogShareException
     */
    public function fullAnalysis(string $content, array $options = []): array
    {
        $upload = $this->paste($content);
        
        if (!($upload['success'] ?? false)) {
            throw new LogShareException('上传失败', 'UPLOAD_ERROR');
        }

        $id = $upload['data']['id'] ?? $upload['id'] ?? '';
        $includeInsights = $options['includeInsights'] ?? false;
        $streaming = $options['streaming'] ?? false;
        $onChunk = $options['onChunk'] ?? null;

        if ($streaming) {
            $aiAnalysis = $this->streamAiAnalysis($id, $onChunk);
        } else {
            $aiAnalysis = $this->streamAiAnalysis($id);
        }

        if ($includeInsights) {
            $insights = $this->getInsights($id);
            return [
                'upload' => $upload,
                'aiAnalysis' => $aiAnalysis,
                'insights' => $insights
            ];
        }

        return [
            'upload' => $upload,
            'aiAnalysis' => $aiAnalysis
        ];
    }

    /**
     * 验证日志 ID 格式
     */
    public static function isValidId(string $id): bool
    {
        return preg_match('/^[a-zA-Z0-9]{6,}$/', $id) === 1;
    }

    // ==================== 内部方法 ====================

    /**
     * 解析 SSE 流数据
     */
    private function parseSseStream(
        string $raw,
        ?callable $onChunk,
        ?callable $onDone,
        ?callable $onError
    ): array {
        $fullJson = '';
        $lines = preg_split('/\r\n|\n/', $raw);
        $eventType = 'message';

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, ':')) {
                continue;
            }

            if (str_starts_with($line, 'event: ')) {
                $eventType = substr($line, 7);
                continue;
            }

            if (str_starts_with($line, 'data: ')) {
                $data = substr($line, 6);

                if ($data === '[DONE]') {
                    break;
                }

                if ($eventType === 'error') {
                    $error = json_decode($data, true);
                    if ($onError !== null) {
                        $onError($error ?? ['error' => 'Unknown SSE error']);
                    }
                    continue;
                }

                $chunk = json_decode($data, true);
                if ($chunk !== null) {
                    // 提取 content 字段
                    $content = $chunk['choices'][0]['delta']['content'] ?? '';
                    if ($content !== '') {
                        $fullJson .= $content;
                    }

                    if ($onChunk !== null) {
                        $onChunk($chunk);
                    }
                }

                $eventType = 'message';
            }
        }

        // 解析累积的 JSON
        $analysis = json_decode($fullJson, true);
        if ($analysis === null && !empty($fullJson)) {
            $analysis = ['raw' => $fullJson];
        }

        $result = [
            'success' => true,
            'data' => [
                'analysis' => $analysis,
                'cached' => false
            ]
        ];

        if ($onDone !== null) {
            $onDone($fullJson);
        }

        return $result;
    }

    /**
     * 创建 SSE cURL 句柄（禁用压缩，启用流式）
     */
    private function createSseCurlHandle(
        string $endpoint,
        string $method = 'GET',
        array $data = [],
        array $headers = []
    ): \CurlHandle {
        $ch = $this->createCurlHandle($endpoint, $method, $data, $headers);

        // SSE 需要禁用压缩和保持连接
        curl_setopt_array($ch, [
            CURLOPT_ENCODING => '',
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_TCP_KEEPALIVE => 1,
        ]);

        return $ch;
    }

    /**
     * 创建 cURL 句柄
     */
    private function createCurlHandle(
        string $endpoint,
        string $method = 'GET',
        array $data = [],
        array $headers = []
    ): \CurlHandle {
        $url = $this->baseUrl . $endpoint;
        $ch = curl_init($url);

        $allHeaders = array_merge($this->defaultHeaders, $headers);
        $headerArray = [];
        foreach ($allHeaders as $key => $value) {
            $headerArray[] = "$key: $value";
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => $this->connectTimeout,
            CURLOPT_HTTPHEADER => $headerArray,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_ENCODING => 'gzip,deflate'
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if (isset($headers['Content-Type']) && $headers['Content-Type'] === 'application/x-www-form-urlencoded') {
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
            } else {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
            if (!empty($data)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }

        return $ch;
    }

    /**
     * 执行 JSON 请求
     * 
     * @throws LogShareException
     */
    private function request(
        string $endpoint,
        string $method = 'GET',
        array $data = [],
        array $headers = []
    ): array {
        $response = $this->requestRaw($endpoint, $method, $data, $headers);
        
        $decoded = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new LogShareException(
                'Invalid JSON response: ' . json_last_error_msg(),
                'JSON_ERROR'
            );
        }

        // 处理 API 返回的错误
        if (isset($decoded['success']) && $decoded['success'] === false) {
            throw new LogShareException(
                $decoded['error'] ?? 'Unknown API error',
                'API_ERROR'
            );
        }

        return $decoded;
    }

    /**
     * 执行原始请求
     * 
     * @throws LogShareException
     */
    private function requestRaw(
        string $endpoint,
        string $method = 'GET',
        array $data = [],
        array $headers = []
    ): string {
        $ch = $this->createCurlHandle($endpoint, $method, $data, $headers);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        $errno = curl_errno($ch);
        
        curl_close($ch);

        if ($errno !== 0) {
            $this->handleError(new LogShareException(
                "cURL Error ($errno): $error",
                'CURL_ERROR'
            ));
        }

        if ($httpCode === 429) {
            $decoded = json_decode($response, true);
            $this->handleError(new LogShareException(
                $decoded['error'] ?? 'Rate limit exceeded',
                'RATE_LIMIT_ERROR',
                429
            ));
        }

        if ($httpCode >= 400) {
            $this->handleError(new LogShareException(
                "HTTP Error $httpCode",
                'HTTP_ERROR',
                $httpCode
            ));
        }

        if ($response === false || $response === null) {
            $this->handleError(new LogShareException(
                'Empty response from server',
                'EMPTY_RESPONSE'
            ));
        }

        return $response;
    }

    /**
     * 并行执行多个请求
     */
    private function parallelRequests(array $requests): array
    {
        $multiHandle = curl_multi_init();
        $handles = [];
        $results = [];

        foreach ($requests as $key => $config) {
            $ch = $this->createCurlHandle(
                $config['endpoint'],
                $config['method'] ?? 'GET',
                $config['data'] ?? [],
                $config['headers'] ?? []
            );
            curl_multi_add_handle($multiHandle, $ch);
            $handles[$key] = $ch;
        }

        $running = null;
        do {
            curl_multi_exec($multiHandle, $running);
            curl_multi_select($multiHandle);
        } while ($running > 0);

        foreach ($handles as $key => $ch) {
            $response = curl_multi_getcontent($ch);
            $results[$key] = json_decode($response, true) ?? ['error' => 'Invalid JSON'];
            curl_multi_remove_handle($multiHandle, $ch);
            curl_close($ch);
        }

        curl_multi_close($multiHandle);
        return $results;
    }

    /**
     * 验证日志内容
     * 
     * @throws InvalidArgumentException
     */
    private function validateContent(string $content): void
    {
        if (empty($content)) {
            throw new InvalidArgumentException('日志内容不能为空');
        }

        $size = strlen($content);
        $lines = substr_count($content, "\n") + 1;

        if ($size > 1024 * 1024) {
            throw new InvalidArgumentException(
                "日志内容超过 1MiB 限制 (当前: " . round($size / 1024 / 1024, 2) . " MiB)"
            );
        }

        if ($lines > 50000) {
            throw new InvalidArgumentException(
                "日志行数超过 50,000 行限制 (当前: $lines 行)"
            );
        }
    }

    /**
     * 验证日志 ID
     * 
     * @throws InvalidArgumentException
     */
    private function validateId(string $id): void
    {
        if (empty($id)) {
            throw new InvalidArgumentException('日志 ID 不能为空');
        }

        if (!self::isValidId($id)) {
            throw new InvalidArgumentException('日志 ID 格式无效');
        }
    }

    /**
     * 统一错误处理
     * 
     * @throws LogShareException
     */
    private function handleError(LogShareException $exception): void
    {
        if ($this->errorHandler !== null) {
            ($this->errorHandler)($exception);
        }
        throw $exception;
    }
}
