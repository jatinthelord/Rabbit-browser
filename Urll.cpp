// fast url Checker Rabbit browser CPP code

#include <iostream>
#include <string>
#include <vector>
#include <regex>
#include <algorithm>
#include <cctype>
#include <set>

using namespace std;

class URLSafetyChecker {
private:
    // Dangerous domains and patterns
    vector<string> blacklistedDomains = {
        "malware.com", "virus.net", "phishing.org", "scam.site",
        "fake-bank.com", "suspicious.xyz", "hack.ru", "spam.cn"
    };
    
    vector<string> dangerousKeywords = {
        "malware", "virus", "trojan", "phishing", "scam", 
        "hack", "crack", "warez", "keygen", "exploit"
    };
    
    set<string> safeProtocols = {"http", "https", "ftp", "ftps"};

public:
    struct SafetyReport {
        bool isSafe;
        int riskScore;  // 0-100, higher = more dangerous
        string message;
        vector<string> warnings;
    };

    // Main safety check function
    SafetyReport checkURL(const string& url) {
        SafetyReport report;
        report.isSafe = true;
        report.riskScore = 0;
        
        // Check 1: Valid URL format
        if (!isValidURLFormat(url)) {
            report.isSafe = false;
            report.riskScore = 100;
            report.message = "Invalid URL format!";
            report.warnings.push_back("Malformed URL detected");
            return report;
        }
        
        // Check 2: Protocol validation
        string protocol = extractProtocol(url);
        if (!isProtocolSafe(protocol)) {
            report.isSafe = false;
            report.riskScore += 50;
            report.warnings.push_back("Unsafe protocol: " + protocol);
        }
        
        // Check 3: Blacklisted domains
        string domain = extractDomain(url);
        if (isDomainBlacklisted(domain)) {
            report.isSafe = false;
            report.riskScore = 100;
            report.message = "DANGER: Blacklisted domain detected!";
            report.warnings.push_back("Known malicious domain: " + domain);
            return report;
        }
        
        // Check 4: Suspicious patterns
        if (hasSuspiciousPatterns(url)) {
            report.riskScore += 30;
            report.warnings.push_back("Suspicious URL patterns detected");
        }
        
        // Check 5: IP address instead of domain (risky)
        if (isIPAddress(domain)) {
            report.riskScore += 20;
            report.warnings.push_back("Direct IP address used (potentially risky)");
        }
        
        // Check 6: Excessive subdomains (phishing technique)
        int subdomainCount = countSubdomains(domain);
        if (subdomainCount > 3) {
            report.riskScore += 25;
            report.warnings.push_back("Too many subdomains (possible phishing)");
        }
        
        // Check 7: Dangerous keywords in URL
        if (containsDangerousKeywords(url)) {
            report.riskScore += 40;
            report.warnings.push_back("Dangerous keywords found in URL");
        }
        
        // Check 8: URL obfuscation techniques
        if (isObfuscated(url)) {
            report.riskScore += 35;
            report.warnings.push_back("URL appears to be obfuscated");
        }
        
        // Final verdict
        if (report.riskScore >= 70) {
            report.isSafe = false;
            report.message = "DANGER: High-risk URL detected!";
        } else if (report.riskScore >= 40) {
            report.isSafe = false;
            report.message = "WARNING: Medium-risk URL";
        } else if (report.riskScore >= 20) {
            report.message = "CAUTION: Low-risk URL";
        } else {
            report.message = "URL appears safe";
        }
        
        return report;
    }

private:
    bool isValidURLFormat(const string& url) {
        // Basic URL regex pattern
        regex urlPattern(
            R"(^(https?|ftp)://[^\s/$.?#].[^\s]*$)",
            regex_constants::icase
        );
        return regex_match(url, urlPattern);
    }
    
    string extractProtocol(const string& url) {
        size_t pos = url.find("://");
        if (pos != string::npos) {
            string protocol = url.substr(0, pos);
            transform(protocol.begin(), protocol.end(), protocol.begin(), ::tolower);
            return protocol;
        }
        return "";
    }
    
    bool isProtocolSafe(const string& protocol) {
        return safeProtocols.find(protocol) != safeProtocols.end();
    }
    
    string extractDomain(const string& url) {
        size_t start = url.find("://");
        if (start == string::npos) return "";
        
        start += 3;  // Skip "://"
        size_t end = url.find("/", start);
        if (end == string::npos) end = url.length();
        
        string domain = url.substr(start, end - start);
        
        // Remove port if present
        size_t portPos = domain.find(":");
        if (portPos != string::npos) {
            domain = domain.substr(0, portPos);
        }
        
        transform(domain.begin(), domain.end(), domain.begin(), ::tolower);
        return domain;
    }
    
    bool isDomainBlacklisted(const string& domain) {
        for (const auto& blacklisted : blacklistedDomains) {
            if (domain.find(blacklisted) != string::npos) {
                return true;
            }
        }
        return false;
    }
    
    bool hasSuspiciousPatterns(const string& url) {
        // Check for double extensions
        if (url.find(".exe.") != string::npos || 
            url.find(".zip.") != string::npos ||
            url.find(".scr.") != string::npos) {
            return true;
        }
        
        // Check for @ symbol (URL obfuscation)
        if (url.find("@") != string::npos) {
            return true;
        }
        
        // Excessive special characters
        int specialCharCount = 0;
        for (char c : url) {
            if (!isalnum(c) && c != '.' && c != '/' && c != ':' && c != '-' && c != '_') {
                specialCharCount++;
            }
        }
        if (specialCharCount > 10) return true;
        
        return false;
    }
    
    bool isIPAddress(const string& domain) {
        regex ipPattern(R"(^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$)");
        return regex_match(domain, ipPattern);
    }
    
    int countSubdomains(const string& domain) {
        int count = 0;
        for (char c : domain) {
            if (c == '.') count++;
        }
        return count - 1;  // Subtract 1 for the TLD dot
    }
    
    bool containsDangerousKeywords(const string& url) {
        string lowerUrl = url;
        transform(lowerUrl.begin(), lowerUrl.end(), lowerUrl.begin(), ::tolower);
        
        for (const auto& keyword : dangerousKeywords) {
            if (lowerUrl.find(keyword) != string::npos) {
                return true;
            }
        }
        return false;
    }
    
    bool isObfuscated(const string& url) {
        // Check for URL encoding abuse (excessive %XX patterns)
        int encodedChars = 0;
        for (size_t i = 0; i < url.length() - 2; i++) {
            if (url[i] == '%' && isxdigit(url[i+1]) && isxdigit(url[i+2])) {
                encodedChars++;
            }
        }
        if (encodedChars > 5) return true;
        
        // Check for homograph attacks (mixed scripts)
        // Simplified check - in production, use ICU library
        bool hasLatin = false, hasCyrillic = false;
        for (unsigned char c : url) {
            if (c >= 'a' && c <= 'z') hasLatin = true;
            if (c >= 0x0410 && c <= 0x044F) hasCyrillic = true;
        }
        if (hasLatin && hasCyrillic) return true;
        
        return false;
    }
};

// JavaScript interface wrapper
extern "C" {
    URLSafetyChecker* createChecker() {
        return new URLSafetyChecker();
    }
    
    bool checkURLSafety(URLSafetyChecker* checker, const char* url, 
                        char* message, int messageSize) {
        auto report = checker->checkURL(url);
        
        string fullMessage = report.message;
        if (!report.warnings.empty()) {
            fullMessage += "\n\nWarnings:\n";
            for (const auto& warning : report.warnings) {
                fullMessage += "- " + warning + "\n";
            }
        }
        fullMessage += "\nRisk Score: " + to_string(report.riskScore) + "/100";
        
        strncpy(message, fullMessage.c_str(), messageSize - 1);
        message[messageSize - 1] = '\0';
        
        return report.isSafe;
    }
    
    void destroyChecker(URLSafetyChecker* checker) {
        delete checker;
    }
}

// Standalone testing
int main() {
    URLSafetyChecker checker;
    
    vector<string> testURLs = {
        "https://www.google.com",
        "http://malware.com/download.exe",
        "https://bank-secure.phishing.org/login",
        "http://192.168.1.1/admin",
        "https://legitimate-site.com",
        "http://www.very.long.subdomain.chain.suspicious.xyz",
        "https://download.virus.trojan.malware.com",
        "https://gооgle.com",  // Homograph attack (Cyrillic 'о')
        "http://example.com/path%20with%20spaces",
        "ftp://files.safe-server.org"
    };

    
    for (const auto& url : testURLs) {
        auto report = checker.checkURL(url);
        
        cout << "URL: " << url << "\n";
        cout << "Status: " << (report.isSafe ? "✓ SAFE" : "✗ UNSAFE") << "\n";
        cout << "Risk Score: " << report.riskScore << "/100\n";
        cout << "Message: " << report.message << "\n";
        
        if (!report.warnings.empty()) {
            cout << "Warnings:\n";
            for (const auto& warning : report.warnings) {
                cout << "  - " << warning << "\n";
            }
        }
        cout << "----------------------------------------\n\n";
    }
    
    return 0;
