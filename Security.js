// rabbit browser Security

class URLSafetyChecker {
    constructor() {
        this.blacklistedDomains = [
            'malware.com', 'virus.net', 'phishing.org', 'scam.site',
            'fake-bank.com', 'suspicious.xyz', 'hack.ru', 'spam.cn',
            'malicious.download', 'badsite.io', 'danger.zone'
        ];
        
        this.dangerousKeywords = [
            'malware', 'virus', 'trojan', 'phishing', 'scam', 
            'hack', 'crack', 'warez', 'keygen', 'exploit',
            'rootkit', 'ransomware', 'spyware'
        ];
        
        this.dangerousExtensions = [
            '.exe', '.bat', '.cmd', '.scr', '.vbs', '.js',
            '.jar', '.msi', '.apk', '.dmg'
        ];
    }

    checkURL(url) {
        const report = {
            isSafe: true,
            riskScore: 0,
            message: '',
            warnings: []
        };

        // Check 1: Valid URL format
        if (!this.isValidURLFormat(url)) {
            report.isSafe = false;
            report.riskScore = 100;
            report.message = 'Invalid URL format!';
            report.warnings.push('Malformed URL detected');
            return report;
        }

        // Check 2: Protocol validation
        const protocol = this.extractProtocol(url);
        if (!this.isProtocolSafe(protocol)) {
            report.isSafe = false;
            report.riskScore += 50;
            report.warnings.push(`Unsafe protocol: ${protocol}`);
        }

        // Check 3: Blacklisted domains
        const domain = this.extractDomain(url);
        if (this.isDomainBlacklisted(domain)) {
            report.isSafe = false;
            report.riskScore = 100;
            report.message = '⚠️ DANGER: Blacklisted domain detected!';
            report.warnings.push(`Known malicious domain: ${domain}`);
            return report;
        }

        // Check 4: Suspicious patterns
        if (this.hasSuspiciousPatterns(url)) {
            report.riskScore += 30;
            report.warnings.push('Suspicious URL patterns detected');
        }

        // Check 5: IP address instead of domain
        if (this.isIPAddress(domain)) {
            report.riskScore += 20;
            report.warnings.push('Direct IP address used (potentially risky)');
        }

        // Check 6: Excessive subdomains
        const subdomainCount = this.countSubdomains(domain);
        if (subdomainCount > 3) {
            report.riskScore += 25;
            report.warnings.push('Too many subdomains (possible phishing)');
        }

        // Check 7: Dangerous keywords
        if (this.containsDangerousKeywords(url)) {
            report.riskScore += 40;
            report.warnings.push('Dangerous keywords found in URL');
        }

        // Check 8: Dangerous file extensions
        if (this.hasDangerousExtension(url)) {
            report.riskScore += 45;
            report.warnings.push('Potentially dangerous file type');
        }

        // Check 9: URL obfuscation
        if (this.isObfuscated(url)) {
            report.riskScore += 35;
            report.warnings.push('URL appears to be obfuscated');
        }

        // Final verdict
        if (report.riskScore >= 70) {
            report.isSafe = false;
            report.message = '🛑 DANGER: High-risk URL detected!';
        } else if (report.riskScore >= 40) {
            report.isSafe = false;
            report.message = '⚠️ WARNING: Medium-risk URL';
        } else if (report.riskScore >= 20) {
            report.message = '⚡ CAUTION: Low-risk URL';
        } else {
            report.message = '✓ URL appears safe';
        }

        return report;
    }

    isValidURLFormat(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    extractProtocol(url) {
        const match = url.match(/^(\w+):\/\//);
        return match ? match[1].toLowerCase() : '';
    }

    isProtocolSafe(protocol) {
        const safeProtocols = ['http', 'https', 'ftp', 'ftps'];
        return safeProtocols.includes(protocol);
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.toLowerCase();
        } catch {
            return '';
        }
    }

    isDomainBlacklisted(domain) {
        return this.blacklistedDomains.some(blacklisted => 
            domain.includes(blacklisted)
        );
    }

    hasSuspiciousPatterns(url) {
        // Double extensions
        if (/\.(exe|zip|scr)\./i.test(url)) return true;
        
        // @ symbol (URL obfuscation)
        if (url.includes('@')) return true;
        
        // Excessive special characters
        const specialChars = url.match(/[^a-zA-Z0-9./:_-]/g);
        if (specialChars && specialChars.length > 10) return true;
        
        return false;
    }

    isIPAddress(domain) {
        return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain);
    }

    countSubdomains(domain) {
        const parts = domain.split('.');
        return Math.max(0, parts.length - 2);
    }

    containsDangerousKeywords(url) {
        const lowerUrl = url.toLowerCase();
        return this.dangerousKeywords.some(keyword => 
            lowerUrl.includes(keyword)
        );
    }

    hasDangerousExtension(url) {
        const lowerUrl = url.toLowerCase();
        return this.dangerousExtensions.some(ext => 
            lowerUrl.endsWith(ext)
        );
    }

    isObfuscated(url) {
        // Excessive URL encoding
        const encodedChars = (url.match(/%[0-9A-F]{2}/gi) || []).length;
        if (encodedChars > 5) return true;
        
        // Suspicious character combinations
        if (/[а-яА-Я]/.test(url) && /[a-zA-Z]/.test(url)) return true;
        
        return false;
    }
}

// Global checker instance
const urlChecker = new URLSafetyChecker();

// Main function used by search engine
function checkURLSafety(url) {
    const report = urlChecker.checkURL(url);
    
    // Log to console for debugging
    console.log('URL Safety Check:', {
        url: url,
        safe: report.isSafe,
        score: report.riskScore,
        message: report.message,
        warnings: report.warnings
    });
    
    return report.isSafe;
}

// Detailed check function
function getURLSafetyReport(url) {
    return urlChecker.checkURL(url);
}

// Display safety report
function displaySafetyReport(url) {
    const report = urlChecker.checkURL(url);
    
    let message = `URL: ${url}\n\n`;
    message += `Status: ${report.isSafe ? '✓ SAFE' : '✗ UNSAFE'}\n`;
    message += `Risk Score: ${report.riskScore}/100\n`;
    message += `${report.message}\n`;
    
    if (report.warnings.length > 0) {
        message += '\nWarnings:\n';
        report.warnings.forEach(warning => {
            message += `  • ${warning}\n`;
        });
    }
    
    return message;
}
