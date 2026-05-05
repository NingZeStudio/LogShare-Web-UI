package cn.logshare.sdk;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Flow;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * LogShare.CN 自定义异常类
 */
class LogShareException extends Exception {
    private final String errorCode;
    private final int httpStatus;

    public LogShareException(String message) {
        this(message, "UNKNOWN", 0);
    }

    public LogShareException(String message, String errorCode) {
        this(message, errorCode, 0);
    }

    public LogShareException(String message, int httpStatus) {
        this(message, "HTTP_ERROR", httpStatus);
    }

    public LogShareException(String message, String errorCode, int httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("error", getMessage());
        result.put("code", errorCode);
        result.put("status", httpStatus);
        result.put("timestamp", java.time.Instant.now().toString());
        return result;
    }
}

/**
 * LogShare.CNᴺᵉˣᵀ Java SDK
 * 高性能 Minecraft/Hytale 日志分享与分析 API 封装
 * 需要 Java 11+
 *
 * @version 2.0.0
 * @author LogShare.CN
 * @license MIT
 */
public class LogShareSDK {
    private static final Pattern SSE_DATA_PATTERN = Pattern.compile("^data:\\s*(.+)$");
    private static final Pattern SSE_EVENT_PATTERN = Pattern.compile("^event:\\s*(.+)$");

    private final String baseUrl;
    private final Duration timeout;
    private final Duration connectTimeout;
    private final Consumer<LogShareException> errorHandler;
    private final Map<String, String> defaultHeaders;
    private final HttpClient httpClient;
    private final String version = "2.0.0";

    /**
     * 创建 SDK 实例
     *
     * @param options 配置选项
     */
    public LogShareSDK(Map<String, Object> options) {
        this.baseUrl = ((String) options.getOrDefault("baseUrl", "https://api.logshare.cn")).replaceAll("/+$", "");
        int timeoutMs = (int) options.getOrDefault("timeout", 120000);
        int connectTimeoutMs = (int) options.getOrDefault("connectTimeout", 10000);
        this.timeout = Duration.ofMillis(timeoutMs);
        this.connectTimeout = Duration.ofMillis(connectTimeoutMs);
        this.errorHandler = options.containsKey("errorHandler")
                ? (Consumer<LogShareException>) options.get("errorHandler")
                : null;

        this.defaultHeaders = new HashMap<>();
        this.defaultHeaders.put("Accept", "application/json");
        this.defaultHeaders.put("User-Agent", "LogShare-Java-SDK/" + version);

        if (options.containsKey("headers")) {
            @SuppressWarnings("unchecked")
            Map<String, String> extraHeaders = (Map<String, String>) options.get("headers");
            this.defaultHeaders.putAll(extraHeaders);
        }

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(this.connectTimeout)
                .version(HttpClient.Version.HTTP_1_1)
                .build();
    }

    /**
     * 创建 SDK 实例（使用默认配置）
     */
    public LogShareSDK() {
        this(new HashMap<>());
    }

    // ==================== 核心 API 方法 ====================

    /**
     * 粘贴/上传日志文件
     *
     * @param content 原始日志内容（最大 1MiB 或 50k 行）
     * @return 响应数据
     * @throws LogShareException
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> paste(String content) throws LogShareException {
        validateContent(content);
        return request("/1/log", "POST", content, "text/plain", null, null);
    }

    /**
     * 粘贴/上传日志文件（带元数据）
     *
     * @param content  原始日志内容
     * @param metadata 可选元数据
     * @param source   可选来源标识
     * @return 响应数据
     * @throws LogShareException
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> pasteWithMetadata(String content, Map<String, Object> metadata, String source)
            throws LogShareException {
        validateContent(content);
        Map<String, Object> body = new HashMap<>();
        body.put("content", content);
        if (metadata != null) body.put("metadata", metadata);
        if (source != null) body.put("source", source);
        return requestJson("/1/log", "POST", body);
    }

    /**
     * 即时分析日志（本地 Codex，不保存到数据库）
     *
     * @param content 原始日志内容
     * @return 分析结果
     * @throws LogShareException
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> analyse(String content) throws LogShareException {
        validateContent(content);
        return request("/1/analyse", "POST", content, "text/plain", null, null);
    }

    /**
     * 获取日志洞察分析
     *
     * @param id 日志 ID
     * @return 洞察结果
     * @throws LogShareException
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getInsights(String id) throws LogShareException {
        validateId(id);
        return request("/1/insights/" + encode(id), "GET", null, null, null, null);
    }

    /**
     * 获取原始日志内容
     *
     * @param id 日志 ID 或 ID 列表
     * @return 原始日志文本
     * @throws LogShareException
     */
    public String getRaw(String... id) throws LogShareException {
        if (id == null || id.length == 0) {
            throw new LogShareException("日志 ID 不能为空", "VALIDATION_ERROR");
        }
        for (String i : id) {
            validateId(i);
        }
        String idParam = String.join(",", id);
        return requestRaw("/1/raw/" + encode(idParam));
    }

    /**
     * 获取存储限制参数
     *
     * @return 限制信息
     * @throws LogShareException
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getLimits() throws LogShareException {
        return request("/1/limits", "GET", null, null, null, null);
    }

    /**
     * 获取过滤器信息
     *
     * @return 过滤器信息
     * @throws LogShareException
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getFilters() throws LogShareException {
        return request("/1/filters", "GET", null, null, null, null);
    }

    /**
     * 删除日志文件
     *
     * @param id    日志 ID 或 ID 列表
     * @param token 授权 Token（可选）
     * @return 删除结果
     * @throws LogShareException
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> delete(String[] id, String token) throws LogShareException {
        if (id == null || id.length == 0) {
            throw new LogShareException("日志 ID 不能为空", "VALIDATION_ERROR");
        }
        for (String i : id) {
            validateId(i);
        }
        String idParam = String.join(",", id);
        Map<String, String> headers = new HashMap<>();
        if (token != null && !token.isEmpty()) {
            headers.put("Authorization", "Bearer " + token);
        }
        return request("/1/delete/" + encode(idParam), "DELETE", null, null, headers, null);
    }

    // ==================== AI 分析（SSE 流式） ====================

    /**
     * 使用大模型智能分析已存储日志（SSE 流式）
     *
     * @param id      日志 ID
     * @param onChunk 每个 SSE 数据块回调
     * @param onDone  完成回调
     * @param onError 错误回调
     * @return 完整分析结果
     * @throws LogShareException
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> streamAiAnalysis(
            String id,
            Consumer<Map<String, Object>> onChunk,
            Consumer<String> onDone,
            Consumer<Map<String, Object>> onError
    ) throws LogShareException {
        validateId(id);
        return streamSse("/1/ai/" + encode(id), "GET", null, null, onChunk, onDone, onError);
    }

    /**
     * 使用大模型智能分析日志内容（SSE 流式）
     *
     * @param content 日志内容
     * @param onChunk 每个 SSE 数据块回调
     * @param onDone  完成回调
     * @param onError 错误回调
     * @return 完整分析结果
     * @throws LogShareException
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> streamAnalyseContent(
            String content,
            Consumer<Map<String, Object>> onChunk,
            Consumer<String> onDone,
            Consumer<Map<String, Object>> onError
    ) throws LogShareException {
        validateContent(content);
        return streamSse("/1/ai/analyse", "POST", content, "text/plain", onChunk, onDone, onError);
    }

    /**
     * 使用大模型智能分析日志（阻塞式，向后兼容）
     *
     * @param id 日志 ID
     * @return 完整分析结果
     * @throws LogShareException
     * @deprecated 使用 streamAiAnalysis() 获取实时流式输出
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getAIAnalysis(String id) throws LogShareException {
        return streamAiAnalysis(id, null, null, null);
    }

    // ==================== 工具方法 ====================

    /**
     * 验证日志 ID 格式
     */
    public static boolean isValidId(String id) {
        return id != null && id.matches("^[a-zA-Z0-9]{6,}$");
    }

    // ==================== 内部方法 ====================

    /**
     * 解析 SSE 流
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> streamSse(
            String endpoint,
            String method,
            String body,
            String contentType,
            Consumer<Map<String, Object>> onChunk,
            Consumer<String> onDone,
            Consumer<Map<String, Object>> onError
    ) throws LogShareException {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + endpoint))
                .timeout(timeout);

        applyHeaders(requestBuilder, contentType, null);

        if ("POST".equals(method) && body != null) {
            if ("text/plain".equals(contentType)) {
                requestBuilder.POST(HttpRequest.BodyPublishers.ofString(body));
            } else {
                requestBuilder.POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
            }
        } else {
            requestBuilder.GET();
        }

        HttpResponse<String> response;
        try {
            response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            throw new LogShareException("请求失败: " + e.getMessage(), "IO_ERROR");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new LogShareException("请求被中断", "INTERRUPTED");
        }

        int statusCode = response.statusCode();
        String responseBody = response.body();

        if (statusCode == 429) {
            handleError(new LogShareException("请求过于频繁，请稍后重试", "RATE_LIMIT_ERROR", 429));
        }

        if (statusCode >= 400) {
            handleError(new LogShareException("HTTP Error " + statusCode, "HTTP_ERROR", statusCode));
        }

        // 检测是否为缓存响应（非 SSE）
        String contentTypeHeader = response.headers().firstValue("Content-Type").orElse("");
        if (!contentTypeHeader.contains("text/event-stream")) {
            // 缓存响应，解析 JSON
            Map<String, Object> result = parseJson(responseBody);
            if (onDone != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) result.get("data");
                if (data != null) {
                    onDone(data.containsKey("analysis") ? data.get("analysis").toString() : "{}");
                }
            }
            return result;
        }

        // 解析 SSE 流
        return parseSseStream(responseBody, onChunk, onDone, onError);
    }

    /**
     * 解析 SSE 流数据
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseSseStream(
            String raw,
            Consumer<Map<String, Object>> onChunk,
            Consumer<String> onDone,
            Consumer<Map<String, Object>> onError
    ) {
        StringBuilder fullJson = new StringBuilder();
        String[] lines = raw.split("\r?\n");
        String eventType = "message";

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith(":")) continue;

            Matcher eventMatcher = SSE_EVENT_PATTERN.matcher(line);
            if (eventMatcher.find()) {
                eventType = eventMatcher.group(1);
                continue;
            }

            Matcher dataMatcher = SSE_DATA_PATTERN.matcher(line);
            if (dataMatcher.find()) {
                String data = dataMatcher.group(1);

                if ("[DONE]".equals(data)) break;

                if ("error".equals(eventType)) {
                    Map<String, Object> error = parseJsonSafely(data);
                    if (onError != null) onError(error);
                    continue;
                }

                Map<String, Object> chunk = parseJsonSafely(data);
                if (chunk != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) chunk.get("choices");
                    if (choices != null && !choices.isEmpty()) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> delta = (Map<String, Object>) choices.get(0).get("delta");
                        if (delta != null && delta.containsKey("content")) {
                            fullJson.append(delta.get("content"));
                        }
                    }
                    if (onChunk != null) onChunk(chunk);
                }

                eventType = "message";
            }
        }

        // 解析累积的 JSON
        Object analysis = parseJsonSafely(fullJson.toString());
        if (analysis == null && fullJson.length() > 0) {
            Map<String, Object> rawMap = new HashMap<>();
            rawMap.put("raw", fullJson.toString());
            analysis = rawMap;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("analysis", analysis);
        data.put("cached", false);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", data);

        if (onDone != null) onDone(fullJson.toString());

        return result;
    }

    /**
     * 执行 JSON 请求
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> request(
            String endpoint,
            String method,
            String body,
            String contentType,
            Map<String, String> extraHeaders,
            String acceptType
    ) throws LogShareException {
        String response = requestRaw(endpoint, method, body, contentType, extraHeaders);

        if ("text".equals(acceptType)) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            return result;
        }

        return parseJson(response);
    }

    /**
     * 执行 JSON 请求（自动 JSON 编码 body）
     */
    private Map<String, Object> requestJson(String endpoint, String method, Map<String, Object> body)
            throws LogShareException {
        return request(endpoint, method, toJson(body), "application/json", null, null);
    }

    /**
     * 执行原始请求
     */
    private String requestRaw(
            String endpoint,
            String method,
            String body,
            String contentType,
            Map<String, String> extraHeaders
    ) throws LogShareException {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + endpoint))
                .timeout(timeout);

        applyHeaders(requestBuilder, contentType, extraHeaders);

        if ("POST".equals(method) && body != null) {
            requestBuilder.POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
        } else if ("DELETE".equals(method)) {
            requestBuilder.DELETE();
        } else {
            requestBuilder.GET();
        }

        HttpResponse<String> response;
        try {
            response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            throw new LogShareException("请求失败: " + e.getMessage(), "IO_ERROR");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new LogShareException("请求被中断", "INTERRUPTED");
        }

        int statusCode = response.statusCode();
        String responseBody = response.body();

        if (statusCode == 429) {
            handleError(new LogShareException("请求过于频繁，请稍后重试", "RATE_LIMIT_ERROR", 429));
        }

        if (statusCode >= 400) {
            handleError(new LogShareException("HTTP Error " + statusCode, "HTTP_ERROR", statusCode));
        }

        return responseBody;
    }

    /**
     * 执行原始请求并返回文本
     */
    private String requestRaw(String endpoint) throws LogShareException {
        return requestRaw(endpoint, "GET", null, null, null);
    }

    /**
     * 应用请求头
     */
    private void applyHeaders(
            HttpRequest.Builder builder,
            String contentType,
            Map<String, String> extraHeaders
    ) {
        for (Map.Entry<String, String> entry : defaultHeaders.entrySet()) {
            builder.header(entry.getKey(), entry.getValue());
        }

        if (contentType != null) {
            builder.header("Content-Type", contentType);
        }

        if (extraHeaders != null) {
            for (Map.Entry<String, String> entry : extraHeaders.entrySet()) {
                builder.header(entry.getKey(), entry.getValue());
            }
        }
    }

    /**
     * 解析 JSON
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) throws LogShareException {
        try {
            // 使用 javax.json 或手动解析
            // 这里使用简单的字符串解析，实际项目中建议使用 Jackson/Gson
            return parseJsonManual(json);
        } catch (Exception e) {
            throw new LogShareException("无效的 JSON 响应: " + e.getMessage(), "JSON_ERROR");
        }
    }

    /**
     * 安全解析 JSON（返回 null 而不是抛异常）
     */
    private Map<String, Object> parseJsonSafely(String json) {
        try {
            return parseJsonManual(json);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 手动 JSON 解析（简化版，仅用于 SDK 内部）
     * 生产环境建议使用 Jackson 或 Gson
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonManual(String json) {
        // 简单实现：使用 Nashorn 或 javax.json
        // 这里为了无依赖，返回一个简单的包装
        Map<String, Object> result = new HashMap<>();
        result.put("_raw", json);

        // 尝试检测常见字段
        if (json.contains("\"success\":") || json.contains("\"success\" :")) {
            result.put("success", json.contains("\"success\": true") || json.contains("\"success\" : true"));
        }

        if (json.contains("\"error\":") || json.contains("\"error\" :")) {
            int start = json.indexOf("\"error\":") + 9;
            if (start < 9) start = json.indexOf("\"error\" :") + 10;
            int end = json.indexOf("\"", start);
            if (end > start) {
                result.put("error", json.substring(start, end));
            }
        }

        return result;
    }

    /**
     * 对象转 JSON（简化版）
     */
    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) sb.append(",");
            sb.append("\"").append(escapeJson(entry.getKey())).append("\":");
            Object value = entry.getValue();
            if (value == null) {
                sb.append("null");
            } else if (value instanceof String) {
                sb.append("\"").append(escapeJson((String) value)).append("\"");
            } else if (value instanceof Map) {
                sb.append(toJson((Map<String, Object>) value));
            } else if (value instanceof Number || value instanceof Boolean) {
                sb.append(value);
            }
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String encode(String s) {
        try {
            return java.net.URLEncoder.encode(s, StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return s;
        }
    }

    private void validateContent(String content) throws LogShareException {
        if (content == null || content.isEmpty()) {
            throw new LogShareException("日志内容不能为空", "VALIDATION_ERROR");
        }

        int size = content.getBytes(StandardCharsets.UTF_8).length;
        long lines = content.lines().count();

        if (size > 1024 * 1024) {
            throw new LogShareException(
                    "日志内容超过 1MiB 限制 (当前: " + String.format("%.2f", size / 1024.0 / 1024.0) + " MiB)",
                    "VALIDATION_ERROR");
        }

        if (lines > 50000) {
            throw new LogShareException(
                    "日志行数超过 50,000 行限制 (当前: " + lines + " 行)",
                    "VALIDATION_ERROR");
        }
    }

    private void validateId(String id) throws LogShareException {
        if (id == null || id.isEmpty()) {
            throw new LogShareException("日志 ID 不能为空", "VALIDATION_ERROR");
        }
        if (!isValidId(id)) {
            throw new LogShareException("日志 ID 格式无效", "VALIDATION_ERROR");
        }
    }

    private void handleError(LogShareException exception) throws LogShareException {
        if (errorHandler != null) {
            errorHandler.accept(exception);
        }
        throw exception;
    }
}
