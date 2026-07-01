(() => {
  "use strict";

  const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  class MultipartVideoUploader {
    constructor(options) {
      this.endpoint = String(options.endpoint || "").replace(/\/+$/, "");
      this.accessToken = options.accessToken;
      this.chunkSize = options.chunkSize || 10 * 1024 * 1024;
      this.concurrency = options.concurrency || 3;
      this.maxRetries = options.maxRetries || 3;
      this.onProgress = options.onProgress || (() => {});
      this.signal = options.signal;
      this.upload = null;
      this.parts = [];
      this.uploadedBytes = 0;
      this.startedAt = 0;
    }

    async uploadFile(file) {
      this.startedAt = performance.now();
      this.uploadedBytes = 0;
      this.parts = [];
      this.report("creating", file, 0, 0);
      this.upload = await this.requestJson("/api/video/init", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        }),
      });
      if (this.upload.partSize) this.chunkSize = this.upload.partSize;

      const totalParts = Math.ceil(file.size / this.chunkSize);
      let nextPart = 1;
      const worker = async () => {
        while (nextPart <= totalParts) {
          this.throwIfAborted();
          const partNumber = nextPart;
          nextPart += 1;
          await this.uploadPartWithRetry(file, partNumber, totalParts);
        }
      };
      await Promise.all(Array.from({ length: Math.min(this.concurrency, totalParts) }, worker));
      this.report("completing", file, totalParts, totalParts);
      return this.requestJson("/api/video/complete", {
        method: "POST",
        body: JSON.stringify({
          key: this.upload.key,
          uploadId: this.upload.uploadId,
          parts: this.parts.sort((a, b) => a.partNumber - b.partNumber),
        }),
      });
    }

    async abort() {
      if (!this.upload) return;
      await this.requestJson("/api/video/abort", {
        method: "POST",
        body: JSON.stringify({ key: this.upload.key, uploadId: this.upload.uploadId }),
      }).catch(() => {});
    }

    async uploadPartWithRetry(file, partNumber, totalParts) {
      let attempt = 0;
      while (true) {
        this.throwIfAborted();
        try {
          const start = (partNumber - 1) * this.chunkSize;
          const end = Math.min(file.size, start + this.chunkSize);
          const body = file.slice(start, end);
          this.report(attempt ? "retrying" : "uploading", file, partNumber, totalParts);
          const response = await fetch(`${this.endpoint}/api/video/part?${new URLSearchParams({
            key: this.upload.key,
            uploadId: this.upload.uploadId,
            partNumber: String(partNumber),
          })}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${this.accessToken}` },
            body,
            signal: this.signal,
          });
          if (!response.ok) {
            const error = new Error(await response.text() || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
          }
          const result = await response.json();
          this.parts.push({ partNumber: result.partNumber, etag: result.etag });
          this.uploadedBytes += body.size;
          this.report("uploading", file, partNumber, totalParts);
          return;
        } catch (error) {
          if (!this.shouldRetry(error, attempt)) throw error;
          await wait(800 * 2 ** attempt);
          attempt += 1;
        }
      }
    }

    shouldRetry(error, attempt) {
      if (attempt >= this.maxRetries) return false;
      if (error?.name === "AbortError") return false;
      if (!("status" in error)) return true;
      return retryableStatuses.has(error.status);
    }

    async requestJson(path, options = {}) {
      this.throwIfAborted();
      const response = await fetch(`${this.endpoint}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        signal: this.signal,
      });
      if (!response.ok) throw new Error(await response.text() || `HTTP ${response.status}`);
      return response.json();
    }

    report(status, file, partNumber, totalParts) {
      const elapsed = Math.max(0.001, (performance.now() - this.startedAt) / 1000);
      const speed = this.uploadedBytes / elapsed;
      const remaining = speed > 0 ? (file.size - this.uploadedBytes) / speed : 0;
      this.onProgress({
        status,
        file,
        partNumber,
        totalParts,
        uploadedBytes: Math.min(this.uploadedBytes, file.size),
        totalBytes: file.size,
        percent: file.size ? Math.min(100, this.uploadedBytes / file.size * 100) : 0,
        speedBytesPerSecond: speed,
        remainingSeconds: remaining,
      });
    }

    throwIfAborted() {
      if (this.signal?.aborted) throw new DOMException("Upload aborted", "AbortError");
    }
  }

  window.MultipartVideoUploader = MultipartVideoUploader;
})();
