// download manager Java script Rabbit browser

class DownloadManager {
    constructor() {
        this.downloads = new Map();
        this.downloadId = 0;
        this.maxConcurrentDownloads = 5;
        this.storageQuota = 1000 * 1024 * 1024 * 1024; // 1000GB (1TB)
        this.usedStorage = 0;
    }

    // Start a new download
    async startDownload(url, filename = null) {
        // Check storage quota
        if (this.usedStorage >= this.storageQuota) {
            this.showError('Storage quota exceeded! Please free up space.');
            return null;
        }

        // Check concurrent downloads
        const activeDownloads = Array.from(this.downloads.values())
            .filter(d => d.status === 'downloading');
        
        if (activeDownloads.length >= this.maxConcurrentDownloads) {
            this.showError('Too many active downloads. Please wait.');
            return null;
        }

        const downloadId = ++this.downloadId;
        
        // Extract filename from URL if not provided
        if (!filename) {
            filename = this.extractFilename(url);
        }

        const download = {
            id: downloadId,
            url: url,
            filename: filename,
            status: 'downloading',
            progress: 0,
            size: 0,
            downloaded: 0,
            speed: 0,
            startTime: Date.now(),
            error: null
        };

        this.downloads.set(downloadId, download);
        this.showDownloadManager();
        this.addDownloadToUI(download);

        // Start the actual download
        this.performDownload(downloadId);

        return downloadId;
    }

    // Perform the download using fetch with progress tracking
    async performDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download) return;

        try {
            const response = await fetch(download.url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Get content length
            const contentLength = response.headers.get('content-length');
            download.size = contentLength ? parseInt(contentLength) : 0;

            // Check if we have enough storage
            if (this.usedStorage + download.size > this.storageQuota) {
                throw new Error('Not enough storage space');
            }

            // Read the response as a stream
            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                chunks.push(value);
                download.downloaded += value.length;

                // Calculate progress
                if (download.size > 0) {
                    download.progress = (download.downloaded / download.size) * 100;
                }

                // Calculate speed (bytes per second)
                const elapsed = (Date.now() - download.startTime) / 1000;
                download.speed = download.downloaded / elapsed;

                // Update UI
                this.updateDownloadUI(download);
            }

            // Combine chunks into single Blob
            const blob = new Blob(chunks);
            
            // Update download status
            download.status = 'completed';
            download.progress = 100;
            download.blob = blob;
            
            // Update storage usage
            this.usedStorage += download.size;

            // Auto-save the file
            this.saveDownload(downloadId);

            // Update UI
            this.updateDownloadUI(download);

        } catch (error) {
            download.status = 'failed';
            download.error = error.message;
            this.updateDownloadUI(download);
            this.showError(`Download failed: ${error.message}`);
        }
    }

    // Save downloaded file to disk
    saveDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download || !download.blob) return;

        try {
            // Create download link
            const url = URL.createObjectURL(download.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = download.filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);

        } catch (error) {
            this.showError(`Save failed: ${error.message}`);
        }
    }

    // Cancel download
    cancelDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download) return;

        download.status = 'cancelled';
        this.updateDownloadUI(download);
    }

    // Pause download (simplified - in real app would need AbortController)
    pauseDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download) return;

        download.status = 'paused';
        this.updateDownloadUI(download);
    }

    // Resume download
    resumeDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download) return;

        download.status = 'downloading';
        this.performDownload(downloadId);
    }

    // Remove download from list
    removeDownload(downloadId) {
        this.downloads.delete(downloadId);
        const downloadElement = document.getElementById(`download-${downloadId}`);
        if (downloadElement) {
            downloadElement.remove();
        }

        // Hide download manager if no downloads
        if (this.downloads.size === 0) {
            this.hideDownloadManager();
        }
    }

    // UI Methods
    showDownloadManager() {
        const manager = document.getElementById('downloadManager');
        if (manager) {
            manager.classList.remove('hidden');
        }
    }

    hideDownloadManager() {
        const manager = document.getElementById('downloadManager');
        if (manager) {
            manager.classList.add('hidden');
        }
    }

    addDownloadToUI(download) {
        const downloadList = document.getElementById('downloadList');
        if (!downloadList) return;

        const downloadElement = document.createElement('div');
        downloadElement.id = `download-${download.id}`;
        downloadElement.className = 'download-item';
        downloadElement.innerHTML = `
            <div class="download-info">
                <div class="download-name">${this.escapeHtml(download.filename)}</div>
                <div class="download-size" id="size-${download.id}">
                    ${this.formatBytes(download.downloaded)} / ${this.formatBytes(download.size)}
                </div>
                <div class="download-speed" id="speed-${download.id}">
                    ${this.formatSpeed(download.speed)}
                </div>
                <div class="download-progress">
                    <div class="download-progress-bar" id="progress-${download.id}" style="width: 0%"></div>
                </div>
            </div>
            <div class="download-actions">
                <button onclick="downloadManager.cancelDownload(${download.id})" title="Cancel">×</button>
            </div>
        `;

        downloadList.appendChild(downloadElement);
    }

    updateDownloadUI(download) {
        const progressBar = document.getElementById(`progress-${download.id}`);
        const sizeElement = document.getElementById(`size-${download.id}`);
        const speedElement = document.getElementById(`speed-${download.id}`);

        if (progressBar) {
            progressBar.style.width = `${download.progress}%`;
        }

        if (sizeElement) {
            sizeElement.textContent = 
                `${this.formatBytes(download.downloaded)} / ${this.formatBytes(download.size)}`;
        }

        if (speedElement) {
            if (download.status === 'completed') {
                speedElement.textContent = '✓ Complete';
                speedElement.style.color = '#34a853';
            } else if (download.status === 'failed') {
                speedElement.textContent = `✗ Failed: ${download.error}`;
                speedElement.style.color = '#ea4335';
            } else if (download.status === 'cancelled') {
                speedElement.textContent = 'Cancelled';
                speedElement.style.color = '#5f6368';
            } else {
                speedElement.textContent = this.formatSpeed(download.speed);
            }
        }
    }

    // Utility Methods
    extractFilename(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            return filename || 'download';
        } catch {
            return 'download';
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatSpeed(bytesPerSecond) {
        return this.formatBytes(bytesPerSecond) + '/s';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        console.error(message);
        // Could show a toast notification here
    }

    // Get storage statistics
    getStorageStats() {
        return {
            total: this.storageQuota,
            used: this.usedStorage,
            available: this.storageQuota - this.usedStorage,
            percentage: (this.usedStorage / this.storageQuota) * 100
        };
    }

    // Clear completed downloads
    clearCompleted() {
        const completed = Array.from(this.downloads.entries())
            .filter(([id, download]) => download.status === 'completed')
            .map(([id]) => id);

        completed.forEach(id => this.removeDownload(id));
    }
}

// Global download manager instance
const downloadManager = new DownloadManager();

// Setup minimize button for download manager
document.addEventListener('DOMContentLoaded', function() {
    const minimizeBtn = document.querySelector('.minimize-downloads');
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', function() {
            const downloadList = document.getElementById('downloadList');
            if (downloadList) {
                downloadList.style.display = 
                    downloadList.style.display === 'none' ? 'block' : 'none';
                minimizeBtn.textContent = 
                    downloadList.style.display === 'none' ? '+' : '−';
            }
        });
    }
});

// Example: Trigger download from search results
function triggerDownload(url) {
    downloadManager.startDownload(url);
}
