/*
/*
rabbit browser
\*

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdbool.h>

#define MAX_URL_LENGTH 2048
#define MAX_WARNINGS 50

typedef struct {
    bool is_safe;
    int risk_score;
    char message[256];
    char warnings[MAX_WARNINGS][128];
    int warning_count;
} SafetyReport;

/* Dangerous patterns to check */
const char* malicious_keywords[] = {
    "malware", "virus", "trojan", "phishing", "scam",
    "hack", "crack", "warez", "keygen", "exploit",
    "ransomware", "spyware", "rootkit", NULL
};

const char* blacklisted_domains[] = {
    "malware.com", "virus.net", "phishing.org", "scam.site",
    "suspicious.xyz", "hack.ru", "danger.zone", NULL
};

const char* dangerous_extensions[] = {
    ".exe", ".bat", ".cmd", ".scr", ".vbs", 
    ".msi", ".jar", ".apk", ".dmg", NULL
};

/* Function prototypes */
void scan_url(const char* url, SafetyReport* report);
bool is_valid_url_format(const char* url);
void extract_domain(const char* url, char* domain);
bool is_blacklisted(const char* domain);
bool contains_malicious_keywords(const char* url);
bool has_dangerous_extension(const char* url);
bool is_ip_address(const char* domain);
int count_subdomains(const char* domain);
bool is_obfuscated(const char* url);
void add_warning(SafetyReport* report, const char* warning);
void to_lowercase(char* str);

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printf("Usage: %s <url>\n", argv[0]);
        printf("Example: %s https://www.example.com\n", argv[0]);
        return 1;
    }

    SafetyReport report;
    memset(&report, 0, sizeof(SafetyReport));
    report.is_safe = true;

    /* Scan the URL */
    scan_url(argv[1], &report);

    /* Print report */
    printf("URL: %s\n", argv[1]);
    printf("Status: %s\n", report.is_safe ? "✓ SAFE" : "✗ UNSAFE");
    printf("Risk Score: %d/100\n", report.risk_score);
    printf("Message: %s\n", report.message);

    if (report.warning_count > 0) {
        printf("\nWarnings:\n");
        for (int i = 0; i < report.warning_count; i++) {
            printf("  • %s\n", report.warnings[i]);
        }
    }
    printf("=====================================\n");

    return report.is_safe ? 0 : 1;
}

void scan_url(const char* url, SafetyReport* report) {
    char domain[256] = {0};
    char url_lower[MAX_URL_LENGTH];
    
    /* Convert URL to lowercase for checking */
    strncpy(url_lower, url, MAX_URL_LENGTH - 1);
    to_lowercase(url_lower);

    /* Check 1: Valid URL format */
    if (!is_valid_url_format(url)) {
        report->is_safe = false;
        report->risk_score = 100;
        strcpy(report->message, "Invalid URL format");
        add_warning(report, "Malformed URL detected");
        return;
    }

    /* Check 2: Extract and validate domain */
    extract_domain(url_lower, domain);

    /* Check 3: Blacklisted domains */
    if (is_blacklisted(domain)) {
        report->is_safe = false;
        report->risk_score = 100;
        strcpy(report->message, "Blacklisted domain detected");
        add_warning(report, "Known malicious domain");
        return;
    }

    /* Check 4: Malicious keywords */
    if (contains_malicious_keywords(url_lower)) {
        report->risk_score += 40;
        add_warning(report, "Dangerous keywords found in URL");
    }

    /* Check 5: Dangerous file extensions */
    if (has_dangerous_extension(url_lower)) {
        report->risk_score += 45;
        add_warning(report, "Potentially dangerous file type");
    }

    /* Check 6: IP address instead of domain */
    if (is_ip_address(domain)) {
        report->risk_score += 20;
        add_warning(report, "Direct IP address (potentially risky)");
    }

    /* Check 7: Excessive subdomains */
    int subdomain_count = count_subdomains(domain);
    if (subdomain_count > 3) {
        report->risk_score += 25;
        add_warning(report, "Too many subdomains (possible phishing)");
    }

    /* Check 8: URL obfuscation */
    if (is_obfuscated(url)) {
        report->risk_score += 35;
        add_warning(report, "URL appears to be obfuscated");
    }

    /* Determine final verdict */
    if (report->risk_score >= 70) {
        report->is_safe = false;
        strcpy(report->message, "High-risk URL detected!");
    } else if (report->risk_score >= 40) {
        report->is_safe = false;
        strcpy(report->message, "Medium-risk URL");
    } else if (report->risk_score >= 20) {
        strcpy(report->message, "Low-risk URL");
    } else {
        strcpy(report->message, "URL appears safe");
    }
}

bool is_valid_url_format(const char* url) {
    /* Check for basic URL format: protocol://domain */
    const char* protocol_end = strstr(url, "://");
    if (!protocol_end) {
        return false;
    }

    /* Check protocol */
    size_t protocol_len = protocol_end - url;
    if (protocol_len == 0 || protocol_len > 10) {
        return false;
    }

    /* Check domain exists */
    const char* domain_start = protocol_end + 3;
    if (strlen(domain_start) == 0) {
        return false;
    }

    return true;
}

void extract_domain(const char* url, char* domain) {
    const char* start = strstr(url, "://");
    if (!start) {
        strcpy(domain, "");
        return;
    }

    start += 3; /* Skip "://" */

    /* Find end of domain (/, :, or end of string) */
    const char* end = start;
    while (*end && *end != '/' && *end != ':') {
        end++;
    }

    /* Copy domain */
    size_t len = end - start;
    if (len >= 256) len = 255;
    strncpy(domain, start, len);
    domain[len] = '\0';
}

bool is_blacklisted(const char* domain) {
    for (int i = 0; blacklisted_domains[i] != NULL; i++) {
        if (strstr(domain, blacklisted_domains[i]) != NULL) {
            return true;
        }
    }
    return false;
}

bool contains_malicious_keywords(const char* url) {
    for (int i = 0; malicious_keywords[i] != NULL; i++) {
        if (strstr(url, malicious_keywords[i]) != NULL) {
            return true;
        }
    }
    return false;
}

bool has_dangerous_extension(const char* url) {
    for (int i = 0; dangerous_extensions[i] != NULL; i++) {
        size_t ext_len = strlen(dangerous_extensions[i]);
        size_t url_len = strlen(url);
        
        if (url_len >= ext_len) {
            const char* url_end = url + url_len - ext_len;
            if (strcmp(url_end, dangerous_extensions[i]) == 0) {
                return true;
            }
        }
    }
    return false;
}

bool is_ip_address(const char* domain) {
    int dots = 0;
    int digits = 0;
    
    for (const char* p = domain; *p; p++) {
        if (*p == '.') {
            dots++;
            if (digits == 0 || digits > 3) return false;
            digits = 0;
        } else if (isdigit(*p)) {
            digits++;
        } else {
            return false;
        }
    }
    
    return (dots == 3 && digits > 0 && digits <= 3);
}

int count_subdomains(const char* domain) {
    int count = 0;
    for (const char* p = domain; *p; p++) {
        if (*p == '.') count++;
    }
    return count > 0 ? count - 1 : 0;
}

bool is_obfuscated(const char* url) {
    /* Count URL-encoded characters (%XX) */
    int encoded_count = 0;
    const char* p = url;
    
    while (*p) {
        if (*p == '%' && isxdigit(*(p+1)) && isxdigit(*(p+2))) {
            encoded_count++;
            p += 3;
        } else {
            p++;
        }
    }
    
    /* More than 5 encoded characters is suspicious */
    if (encoded_count > 5) {
        return true;
    }

    /* Check for @ symbol (URL obfuscation technique) */
    if (strchr(url, '@') != NULL) {
        return true;
    }

    return false;
}

void add_warning(SafetyReport* report, const char* warning) {
    if (report->warning_count < MAX_WARNINGS) {
        strncpy(report->warnings[report->warning_count], warning, 127);
        report->warnings[report->warning_count][127] = '\0';
        report->warning_count++;
    }
}

void to_lowercase(char* str) {
    for (char* p = str; *p; p++) {
        *p = tolower((unsigned char)*p);
    }
}
