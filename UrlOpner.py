#!/usr/bin/env python3
"""
NHP URL Opener - Python Module
Opens URLs, handles web requests, and downloads content
"""

import webbrowser
import urllib.request
import urllib.parse
import urllib.error
import socket
import ssl
import json
import os
import sys
from typing import Dict, List, Optional, Tuple
import hashlib
import mimetypes

class NHPURLOpener:
    """Advanced URL opener with safety checks and download capabilities"""
    
    def __init__(self):
        self.timeout = 10
        self.user_agent = 'NHP-Search-Engine/1.0'
        self.download_dir = './downloads'
        self.max_file_size = 1024 * 1024 * 1024  # 1GB max download
        
        # Create downloads directory
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)
    
    def open_url(self, url: str, new_tab: bool = True) -> bool:
        """
        Open URL in default browser
        
        Args:
            url: The URL to open
            new_tab: Whether to open in new tab (True) or new window (False)
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if new_tab:
                webbrowser.open_new_tab(url)
            else:
                webbrowser.open_new(url)
            
            print(f"✓ Successfully opened: {url}")
            return True
            
        except Exception as e:
            print(f"✗ Error opening URL: {e}")
            return False
    
    def fetch_url_content(self, url: str) -> Optional[str]:
        """
        Fetch content from URL
        
        Args:
            url: The URL to fetch
        
        Returns:
            str: The content if successful, None otherwise
        """
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': self.user_agent}
            )
            
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                content = response.read().decode('utf-8')
                print(f"✓ Successfully fetched {len(content)} bytes from {url}")
                return content
                
        except urllib.error.HTTPError as e:
            print(f"✗ HTTP Error {e.code}: {e.reason}")
            return None
            
        except urllib.error.URLError as e:
            print(f"✗ URL Error: {e.reason}")
            return None
            
        except Exception as e:
            print(f"✗ Error fetching URL: {e}")
            return None
    
    def download_file(self, url: str, filename: Optional[str] = None) -> Tuple[bool, str]:
        """
        Download file from URL
        
        Args:
            url: The URL to download from
            filename: Optional custom filename
        
        Returns:
            Tuple[bool, str]: (Success status, filepath or error message)
        """
        try:
            # Extract filename from URL if not provided
            if not filename:
                parsed_url = urllib.parse.urlparse(url)
                filename = os.path.basename(parsed_url.path) or 'download'
            
            filepath = os.path.join(self.download_dir, filename)
            
            # Create request with headers
            req = urllib.request.Request(
                url,
                headers={'User-Agent': self.user_agent}
            )
            
            print(f"📥 Downloading: {url}")
            print(f"📁 Saving to: {filepath}")
            
            # Download with progress tracking
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                # Check file size
                file_size = int(response.headers.get('Content-Length', 0))
                
                if file_size > self.max_file_size:
                    return False, f"File too large: {file_size / (1024*1024):.2f}MB"
                
                # Download in chunks
                chunk_size = 8192
                downloaded = 0
                
                with open(filepath, 'wb') as f:
                    while True:
                        chunk = response.read(chunk_size)
                        if not chunk:
                            break
                        
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Progress indicator
                        if file_size > 0:
                            progress = (downloaded / file_size) * 100
                            print(f"\rProgress: {progress:.1f}%", end='')
                
                print(f"\n✓ Download complete: {filepath}")
                return True, filepath
                
        except Exception as e:
            error_msg = f"Download failed: {e}"
            print(f"✗ {error_msg}")
            return False, error_msg
    
    def get_url_info(self, url: str) -> Dict:
        """
        Get information about URL without downloading
        
        Args:
            url: The URL to check
        
        Returns:
            dict: URL information including headers, size, type, etc.
        """
        info = {
            'url': url,
            'reachable': False,
            'status_code': None,
            'content_type': None,
            'content_length': 0,
            'server': None,
            'last_modified': None
        }
        
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': self.user_agent},
                method='HEAD'  # HEAD request to get headers only
            )
            
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                info['reachable'] = True
                info['status_code'] = response.status
                info['content_type'] = response.headers.get('Content-Type')
                info['content_length'] = int(response.headers.get('Content-Length', 0))
                info['server'] = response.headers.get('Server')
                info['last_modified'] = response.headers.get('Last-Modified')
                
        except Exception as e:
            info['error'] = str(e)
        
        return info
    
    def validate_url(self, url: str) -> Tuple[bool, str]:
        """
        Validate URL format and accessibility
        
        Args:
            url: The URL to validate
        
        Returns:
            Tuple[bool, str]: (Valid status, message)
        """
        # Check URL format
        try:
            result = urllib.parse.urlparse(url)
            if not all([result.scheme, result.netloc]):
                return False, "Invalid URL format"
        except Exception as e:
            return False, f"URL parsing error: {e}"
        
        # Check if URL is reachable
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': self.user_agent},
                method='HEAD'
            )
            
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    return True, "URL is valid and reachable"
                else:
                    return True, f"URL reachable (Status: {response.status})"
                    
        except urllib.error.HTTPError as e:
            return False, f"HTTP Error {e.code}: {e.reason}"
            
        except urllib.error.URLError as e:
            return False, f"Cannot reach URL: {e.reason}"
            
        except Exception as e:
            return False, f"Validation error: {e}"
    
    def calculate_file_hash(self, filepath: str, algorithm: str = 'sha256') -> str:
        """Calculate hash of downloaded file for verification"""
        hash_func = hashlib.new(algorithm)
        
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                hash_func.update(chunk)
        
        return hash_func.hexdigest()
    
    def get_mime_type(self, url: str) -> str:
        """Get MIME type of URL content"""
        mime_type, _ = mimetypes.guess_type(url)
        return mime_type or 'application/octet-stream'


def main():
    """Command-line interface for URL opener"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python url_opener.py <url>                    # Open URL")
        print("  python url_opener.py download <url>           # Download file")
        print("  python url_opener.py info <url>               # Get URL info")
        print("  python url_opener.py validate <url>           # Validate URL")
        return
    
    opener = NHPURLOpener()
    
    command = sys.argv[1]
    
    if command == 'download' and len(sys.argv) >= 3:
        url = sys.argv[2]
        success, result = opener.download_file(url)
        if success:
            print(f"\n✓ File saved: {result}")
            hash_value = opener.calculate_file_hash(result)
            print(f"SHA256: {hash_value}")
        else:
            print(f"\n✗ {result}")
    
    elif command == 'info' and len(sys.argv) >= 3:
        url = sys.argv[2]
        info = opener.get_url_info(url)
        print("\n" + "="*50)
        print("URL INFORMATION")
        print("="*50)
        for key, value in info.items():
            print(f"{key.capitalize()}: {value}")
        print("="*50)
    
    elif command == 'validate' and len(sys.argv) >= 3:
        url = sys.argv[2]
        is_valid, message = opener.validate_url(url)
        print(f"\n{'✓' if is_valid else '✗'} {message}")
    
    else:
        # Default: open URL
        url = command
        opener.open_url(url)


if __name__ == '__main__':
    main()
