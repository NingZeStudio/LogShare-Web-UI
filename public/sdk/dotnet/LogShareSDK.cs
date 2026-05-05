using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace LogShare.CN.SDK
{
    /// <summary>
    /// LogShare 自定义异常类
    /// </summary>
    public class LogShareException : Exception
    {
        public string ErrorCode { get; }
        public int HttpStatus { get; }

        public LogShareException(string message, string errorCode = "UNKNOWN", int httpStatus = 0)
            : base(message)
        {
            ErrorCode = errorCode;
            HttpStatus = httpStatus;
        }

        public Dictionary<string, object> ToDictionary()
        {
            return new Dictionary<string, object>
            {
                ["success"] = false,
                ["error"] = Message,
                ["code"] = ErrorCode,
                ["status"] = HttpStatus,
                ["timestamp"] = DateTime.UtcNow.ToString("o")
            };
        }
    }

    /// <summary>
    /// SSE 事件结构
    /// </summary>
    public class SseEvent
    {
        public string Id { get; set; }
        public string Event { get; set; }
        public string Data { get; set; }
        public int Retry { get; set; }
    }

    /// <summary>
    /// SDK 配置选项
    /// </summary>
    public class LogShareOptions
    {
        public string BaseUrl { get; set; } = "https://api.logshare.cn";
        public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(120);
        public TimeSpan ConnectTimeout { get; set; } = TimeSpan.FromSeconds(10);
        public Action<LogShareException> ErrorHandler { get; set; }
        public Dictionary<string, string> Headers { get; set; } = new();
    }

    /// <summary>
    /// LogShare.CN Next C# SDK
    /// 高性能 Minecraft/Hytale 日志分享与分析 API 封装
    /// 需要 .NET 6+
    ///
    /// @version 2.0.0
    /// @author LogShare.CN
    /// @license MIT
    /// </summary>
    public class LogShareSDK : IDisposable
    {
        private readonly string _baseUrl;
        private readonly TimeSpan _timeout;
        private readonly Action<LogShareException> _errorHandler;
        private readonly Dictionary<string, string> _defaultHeaders;
        private readonly HttpClient _httpClient;
        private readonly string _version = "2.0.0";

        /// <summary>
        /// 创建 SDK 实例
        /// </summary>
        public LogShareSDK(LogShareOptions? options = null)
        {
            options ??= new LogShareOptions();
            _baseUrl = options.BaseUrl.TrimEnd('/');
            _timeout = options.Timeout;
            _errorHandler = options.ErrorHandler;

            _defaultHeaders = new Dictionary<string, string>
            {
                ["Accept"] = "application/json",
                ["User-Agent"] = $"LogShare-DotNet-SDK/{_version}"
            };

            foreach (var kv in options.Headers)
            {
                _defaultHeaders[kv.Key] = kv.Value;
            }

            var handler = new HttpClientHandler
            {
                AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate
            };

            _httpClient = new HttpClient(handler)
            {
                Timeout = _timeout
            };
        }

        // ==================== 核心 API 方法 ====================

        /// <summary>
        /// 粘贴/上传日志文件
        /// </summary>
        /// <param name="content">原始日志内容（最大 1MiB 或 50k 行）</param>
        /// <param name="metadata">可选元数据</param>
        /// <param name="source">可选来源标识</param>
        /// <returns>响应数据</returns>
        public async Task<JsonElement> PasteAsync(string content, Dictionary<string, object>? metadata = null, string? source = null)
        {
            ValidateContent(content);

            if (metadata != null || source != null)
            {
                var body = new Dictionary<string, object?> { ["content"] = content };
                if (metadata != null) body["metadata"] = metadata;
                if (source != null) body["source"] = source;
                return await RequestJsonAsync("/1/log", HttpMethod.Post, body);
            }

            return await RequestAsync("/1/log", HttpMethod.Post, new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("content", content)
            }));
        }

        /// <summary>
        /// 即时分析日志（本地 Codex，不保存到数据库）
        /// </summary>
        public async Task<JsonElement> AnalyseAsync(string content)
        {
            ValidateContent(content);
            return await RequestAsync("/1/analyse", HttpMethod.Post, new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("content", content)
            }));
        }

        /// <summary>
        /// 获取日志洞察分析
        /// </summary>
        public async Task<JsonElement> GetInsightsAsync(string id)
        {
            ValidateId(id);
            return await RequestAsync($"/1/insights/{Encode(id)}", HttpMethod.Get, null);
        }

        /// <summary>
        /// 获取原始日志内容
        /// </summary>
        /// <param name="ids">日志 ID 或 ID 数组</param>
        public async Task<string> GetRawAsync(params string[] ids)
        {
            if (ids == null || ids.Length == 0)
                throw new LogShareException("日志 ID 不能为空", "VALIDATION_ERROR");

            foreach (var id in ids) ValidateId(id);

            var idParam = string.Join(",", ids);
            return await RequestRawAsync($"/1/raw/{Encode(idParam)}");
        }

        /// <summary>
        /// 获取存储限制参数
        /// </summary>
        public async Task<JsonElement> GetLimitsAsync()
        {
            return await RequestAsync("/1/limits", HttpMethod.Get, null);
        }

        /// <summary>
        /// 获取过滤器信息
        /// </summary>
        public async Task<JsonElement> GetFiltersAsync()
        {
            return await RequestAsync("/1/filters", HttpMethod.Get, null);
        }

        /// <summary>
        /// 删除日志文件
        /// </summary>
        /// <param name="token">授权 Token（可选）</param>
        /// <param name="ids">日志 ID 或 ID 数组</param>
        public async Task<JsonElement> DeleteAsync(string? token = null, params string[] ids)
        {
            if (ids == null || ids.Length == 0)
                throw new LogShareException("日志 ID 不能为空", "VALIDATION_ERROR");

            foreach (var id in ids) ValidateId(id);

            var idParam = string.Join(",", ids);
            var request = new HttpRequestMessage(HttpMethod.Delete, BuildUrl($"/1/delete/{Encode(idParam)}"));

            if (!string.IsNullOrEmpty(token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            return await SendRequestAsync(request);
        }

        // ==================== AI 分析（SSE 流式） ====================

        /// <summary>
        /// 使用大模型智能分析已存储日志（SSE 流式）
        /// </summary>
        /// <param name="id">日志 ID</param>
        /// <param name="onChunk">每个 SSE 数据块回调</param>
        /// <param name="onDone">完成回调</param>
        /// <param name="onError">错误回调</param>
        /// <param name="cancellationToken">取消令牌</param>
        /// <returns>完整分析结果</returns>
        public async Task<JsonElement> StreamAiAnalysisAsync(
            string id,
            Action<JsonElement>? onChunk = null,
            Action<string>? onDone = null,
            Action<JsonElement>? onError = null,
            CancellationToken cancellationToken = default)
        {
            ValidateId(id);
            return await StreamSseAsync($"/1/ai/{Encode(id)}", HttpMethod.Get, null, onChunk, onDone, onError, cancellationToken);
        }

        /// <summary>
        /// 使用大模型智能分析日志内容（SSE 流式）
        /// </summary>
        public async Task<JsonElement> StreamAnalyseContentAsync(
            string content,
            Action<JsonElement>? onChunk = null,
            Action<string>? onDone = null,
            Action<JsonElement>? onError = null,
            CancellationToken cancellationToken = default)
        {
            ValidateContent(content);
            var body = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("content", content)
            });
            return await StreamSseAsync("/1/ai/analyse", HttpMethod.Post, body, onChunk, onDone, onError, cancellationToken);
        }

        /// <summary>
        /// 使用大模型智能分析日志（阻塞式，向后兼容）
        /// </summary>
        [Obsolete("使用 StreamAiAnalysisAsync() 获取实时流式输出")]
        public async Task<JsonElement> GetAIAnalysisAsync(string id)
        {
            return await StreamAiAnalysisAsync(id);
        }

        // ==================== 批量与工具方法 ====================

        /// <summary>
        /// 批量上传多个日志
        /// </summary>
        public async Task<List<BatchResult>> BatchPasteAsync(IEnumerable<BatchInput> logs)
        {
            var tasks = logs.Select(async log =>
            {
                try
                {
                    var result = await PasteAsync(log.Content);
                    return new BatchResult { Name = log.Name, Result = result, Error = null };
                }
                catch (Exception ex)
                {
                    return new BatchResult { Name = log.Name, Result = default, Error = ex };
                }
            });

            return (await Task.WhenAll(tasks)).ToList();
        }

        /// <summary>
        /// 完整分析流程：上传并获取 AI 分析
        /// </summary>
        public async Task<FullAnalysisResult> FullAnalysisAsync(string content, bool includeInsights = false, Action<JsonElement>? onChunk = null)
        {
            var upload = await PasteAsync(content);
            var id = string.Empty;

            if (upload.TryGetProperty("data", out var data) && data.TryGetProperty("id", out var idProp))
            {
                id = idProp.GetString() ?? "";
            }

            var aiAnalysis = await StreamAiAnalysisAsync(id, onChunk);

            JsonElement? insights = null;
            if (includeInsights)
            {
                insights = await GetInsightsAsync(id);
            }

            return new FullAnalysisResult
            {
                Upload = upload,
                AiAnalysis = aiAnalysis,
                Insights = insights
            };
        }

        /// <summary>
        /// 验证日志 ID 格式
        /// </summary>
        public static bool IsValidId(string id)
        {
            return !string.IsNullOrEmpty(id) && System.Text.RegularExpressions.Regex.IsMatch(id, "^[a-zA-Z0-9]{6,}$");
        }

        // ==================== 内部方法 ====================

        /// <summary>
        /// 流式 SSE 请求
        /// </summary>
        private async Task<JsonElement> StreamSseAsync(
            string endpoint,
            HttpMethod method,
            HttpContent? body,
            Action<JsonElement>? onChunk,
            Action<string>? onDone,
            Action<JsonElement>? onError,
            CancellationToken cancellationToken)
        {
            var request = new HttpRequestMessage(method, BuildUrl(endpoint));
            ApplyHeaders(request);

            if (body != null)
            {
                request.Content = body;
            }

            // 使用 HttpCompletionOption.ResponseHeadersRead 来支持流式读取
            var response = await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            // 处理速率限制
            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var errorDoc = JsonDocument.Parse(content);
                HandleError(new LogShareException(
                    errorDoc.RootElement.GetProperty("error").GetString() ?? "请求过于频繁",
                    "RATE_LIMIT_ERROR", 429));
            }

            if (!response.IsSuccessStatusCode)
            {
                HandleError(new LogShareException(
                    $"HTTP Error {(int)response.StatusCode}",
                    "HTTP_ERROR", (int)response.StatusCode));
            }

            // 检测是否为缓存响应（非 SSE）
            var contentType = response.Content.Headers.ContentType?.MediaType;
            if (contentType == null || !contentType.Contains("text/event-stream"))
            {
                // 缓存响应，直接读取 JSON
                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var result = JsonDocument.Parse(content);

                if (onDone != null)
                {
                    if (result.RootElement.TryGetProperty("data", out var data) &&
                        data.TryGetProperty("analysis", out var analysis))
                    {
                        onDone(analysis.GetRawText());
                    }
                }

                return result.RootElement.Clone();
            }

            // SSE 流式处理
            return await ParseSseStreamAsync(response, onChunk, onDone, onError, cancellationToken);
        }

        /// <summary>
        /// 解析 SSE 流
        /// </summary>
        private async Task<JsonElement> ParseSseStreamAsync(
            HttpResponseMessage response,
            Action<JsonElement>? onChunk,
            Action<string>? onDone,
            Action<JsonElement>? onError,
            CancellationToken cancellationToken)
        {
            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream, Encoding.UTF8);

            var fullJson = new StringBuilder();
            var buffer = new StringBuilder();
            string? eventType = null;

            while (!reader.EndOfStream)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var line = await reader.ReadLineAsync();
                if (line == null) break;

                line = line.Trim();

                // 空行表示事件结束
                if (string.IsNullOrEmpty(line))
                {
                    eventType = null;
                    continue;
                }

                // 注释行
                if (line.StartsWith(":"))
                {
                    continue;
                }

                // event: 字段
                if (line.StartsWith("event:"))
                {
                    eventType = line.Substring(6).Trim();
                    continue;
                }

                // data: 字段
                if (line.StartsWith("data:"))
                {
                    var data = line.Substring(5).Trim();

                    if (data == "[DONE]")
                        break;

                    if (eventType == "error")
                    {
                        try
                        {
                            var errorDoc = JsonDocument.Parse(data);
                            onError?.Invoke(errorDoc.RootElement.Clone());
                        }
                        catch { }
                        continue;
                    }

                    try
                    {
                        var chunk = JsonDocument.Parse(data);
                        var root = chunk.RootElement;

                        // 提取 content
                        if (root.TryGetProperty("choices", out var choices) &&
                            choices.GetArrayLength() > 0)
                        {
                            var firstChoice = choices[0];
                            if (firstChoice.TryGetProperty("delta", out var delta) &&
                                delta.TryGetProperty("content", out var contentProp))
                            {
                                var content = contentProp.GetString();
                                if (!string.IsNullOrEmpty(content))
                                {
                                    fullJson.Append(content);
                                }
                            }
                        }

                        onChunk?.Invoke(root.Clone());
                    }
                    catch { }

                    eventType = null;
                    continue;
                }
            }

            // 解析累积的 JSON
            JsonElement analysis;
            try
            {
                if (fullJson.Length > 0)
                {
                    analysis = JsonDocument.Parse(fullJson.ToString()).RootElement.Clone();
                }
                else
                {
                    using var emptyDoc = JsonDocument.Parse("{}");
                    analysis = emptyDoc.RootElement.Clone();
                }
            }
            catch
            {
                using var rawDoc = JsonDocument.Parse(
                    $"{{\"raw\":\"{fullJson.ToString().Replace("\"", "\\\"").Replace("\n", "\\n")}\"}}");
                analysis = rawDoc.RootElement.Clone();
            }

            // 构建返回结果
            var resultObj = new Dictionary<string, object>
            {
                ["success"] = true,
                ["data"] = new Dictionary<string, object>
                {
                    ["analysis"] = analysis,
                    ["cached"] = false
                }
            };

            onDone?.Invoke(fullJson.ToString());

            return JsonDocument.Parse(JsonSerializer.Serialize(resultObj)).RootElement.Clone();
        }

        /// <summary>
        /// 执行请求
        /// </summary>
        private async Task<JsonElement> RequestAsync(string endpoint, HttpMethod method, HttpContent? body)
        {
            var request = new HttpRequestMessage(method, BuildUrl(endpoint));
            ApplyHeaders(request);

            if (body != null)
            {
                request.Content = body;
            }

            return await SendRequestAsync(request);
        }

        /// <summary>
        /// 执行 JSON 请求
        /// </summary>
        private async Task<JsonElement> RequestJsonAsync(string endpoint, HttpMethod method, Dictionary<string, object?> body)
        {
            var json = JsonSerializer.Serialize(body);
            var request = new HttpRequestMessage(method, BuildUrl(endpoint))
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            return await SendRequestAsync(request);
        }

        /// <summary>
        /// 执行原始请求并返回文本
        /// </summary>
        private async Task<string> RequestRawAsync(string endpoint)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, BuildUrl(endpoint));
            ApplyHeaders(request);

            var response = await _httpClient.SendAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                var content = await response.Content.ReadAsStringAsync();
                HandleError(new LogShareException(
                    "请求过于频繁", "RATE_LIMIT_ERROR", 429));
            }

            if (!response.IsSuccessStatusCode)
            {
                HandleError(new LogShareException(
                    $"HTTP Error {(int)response.StatusCode}",
                    "HTTP_ERROR", (int)response.StatusCode));
            }

            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// 发送请求并解析 JSON 响应
        /// </summary>
        private async Task<JsonElement> SendRequestAsync(HttpRequestMessage request)
        {
            var response = await _httpClient.SendAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                var content = await response.Content.ReadAsStringAsync();
                try
                {
                    var errorDoc = JsonDocument.Parse(content);
                    HandleError(new LogShareException(
                        errorDoc.RootElement.GetProperty("error").GetString() ?? "请求过于频繁",
                        "RATE_LIMIT_ERROR", 429));
                }
                catch
                {
                    HandleError(new LogShareException("请求过于频繁", "RATE_LIMIT_ERROR", 429));
                }
            }

            if (!response.IsSuccessStatusCode)
            {
                HandleError(new LogShareException(
                    $"HTTP Error {(int)response.StatusCode}",
                    "HTTP_ERROR", (int)response.StatusCode));
            }

            var responseContent = await response.Content.ReadAsStringAsync();

            if (string.IsNullOrEmpty(responseContent))
            {
                HandleError(new LogShareException("服务器返回空响应", "EMPTY_RESPONSE"));
            }

            return JsonDocument.Parse(responseContent).RootElement.Clone();
        }

        /// <summary>
        /// 应用请求头
        /// </summary>
        private void ApplyHeaders(HttpRequestMessage request)
        {
            foreach (var kv in _defaultHeaders)
            {
                request.Headers.TryAddWithoutValidation(kv.Key, kv.Value);
            }
        }

        private string BuildUrl(string endpoint)
        {
            return $"{_baseUrl}{(endpoint.StartsWith("/") ? endpoint : "/" + endpoint)}";
        }

        private string Encode(string s)
        {
            return Uri.EscapeDataString(s);
        }

        private void ValidateContent(string content)
        {
            if (string.IsNullOrEmpty(content))
                throw new LogShareException("日志内容不能为空", "VALIDATION_ERROR");

            var size = Encoding.UTF8.GetByteCount(content);
            var lines = content.Split('\n').Length;

            if (size > 1024 * 1024)
                throw new LogShareException(
                    $"日志内容超过 1MiB 限制 (当前: {size / 1024.0 / 1024.0:F2} MiB)",
                    "VALIDATION_ERROR");

            if (lines > 50000)
                throw new LogShareException(
                    $"日志行数超过 50,000 行限制 (当前: {lines} 行)",
                    "VALIDATION_ERROR");
        }

        private void ValidateId(string id)
        {
            if (string.IsNullOrEmpty(id))
                throw new LogShareException("日志 ID 不能为空", "VALIDATION_ERROR");

            if (!IsValidId(id))
                throw new LogShareException("日志 ID 格式无效", "VALIDATION_ERROR");
        }

        private void HandleError(LogShareException exception)
        {
            _errorHandler?.Invoke(exception);
            throw exception;
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }

    // ==================== 辅助类 ====================

    /// <summary>
    /// 批量上传输入
    /// </summary>
    public class BatchInput
    {
        public string Name { get; set; } = "";
        public string Content { get; set; } = "";
    }

    /// <summary>
    /// 批量上传结果
    /// </summary>
    public class BatchResult
    {
        public string Name { get; set; } = "";
        public JsonElement? Result { get; set; }
        public Exception? Error { get; set; }
    }

    /// <summary>
    /// 完整分析结果
    /// </summary>
    public class FullAnalysisResult
    {
        public JsonElement Upload { get; set; }
        public JsonElement AiAnalysis { get; set; }
        public JsonElement? Insights { get; set; }
    }
}
