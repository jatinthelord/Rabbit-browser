<?php

// Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'nhp_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('MAX_STORAGE_GB', 1000);

// CORS Headers for browser access
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class NHPServer {
    private $db;
    private $malicious_patterns = [
        'malware', 'virus', 'trojan', 'phishing', 'scam',
        'hack', 'crack', 'warez', 'keygen', 'exploit',
        'ransomware', 'spyware', 'rootkit'
    ];
    
    private $blacklisted_domains = [
        'malware.com', 'virus.net', 'phishing.org', 'scam.site',
        'suspicious.xyz', 'hack.ru', 'danger.zone'
    ];

    public function __construct() {
        $this->connectDatabase();
    }

    /**
     * Connect to MySQL database
     */
    private function connectDatabase() {
        try {
            $this->db = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            $this->sendResponse([
                'success' => false,
                'error' => 'Database connection failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Main request router
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $data = $this->getRequestData();

        // Route requests
        switch ($path) {
            case '/api/search':
                $this->handleSearch($data);
                break;
            
            case '/api/check-url':
                $this->handleURLCheck($data);
                break;
            
            case '/api/download':
                $this->handleDownload($data);
                break;
            
            case '/api/user/register':
                $this->handleUserRegister($data);
                break;
            
            case '/api/user/login':
                $this->handleUserLogin($data);
                break;
            
            case '/api/db/query':
                $this->handleDatabaseQuery($data);
                break;
            
            case '/api/storage/info':
                $this->handleStorageInfo();
                break;
            
            default:
                $this->sendResponse([
                    'success' => false,
                    'error' => 'Endpoint not found'
                ], 404);
        }
    }

    /**
     * Handle search requests
     */
    private function handleSearch($data) {
        $query = $data['query'] ?? '';
        
        if (empty($query)) {
            $this->sendResponse([
                'success' => false,
                'error' => 'Search query required'
            ], 400);
            return;
        }

        // Log search query
        $this->logSearch($query);

        // Fetch search results (in production, integrate with search API)
        $results = $this->fetchSearchResults($query);

        $this->sendResponse([
            'success' => true,
            'query' => $query,
            'results' => $results,
            'count' => count($results)
        ]);
    }

    /**
     * Fetch search results
     */
    private function fetchSearchResults($query) {
        // Mock implementation - integrate with real search engine API
        $results = [];
        
        for ($i = 1; $i <= 10; $i++) {
            $results[] = [
                'title' => "Result $i for: " . htmlspecialchars($query),
                'url' => "https://example{$i}.com/" . urlencode($query),
                'description' => "This is a detailed description for result $i about " . htmlspecialchars($query),
                'thumbnail' => null,
                'relevance_score' => 100 - ($i * 5)
            ];
        }

        return $results;
    }

    /**
     * Check URL safety
     */
    private function handleURLCheck($data) {
        $url = $data['url'] ?? '';
        
        if (empty($url)) {
            $this->sendResponse([
                'success' => false,
                'error' => 'URL required'
            ], 400);
            return;
        }

        $safety_report = $this->checkURLSafety($url);

        $this->sendResponse([
            'success' => true,
            'url' => $url,
            'safety' => $safety_report
        ]);
    }

    /**
     * Comprehensive URL safety check
     */
    private function checkURLSafety($url) {
        $report = [
            'is_safe' => true,
            'risk_score' => 0,
            'message' => '',
            'warnings' => []
        ];

        // Validate URL format
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            $report['is_safe'] = false;
            $report['risk_score'] = 100;
            $report['message'] = 'Invalid URL format';
            $report['warnings'][] = 'Malformed URL detected';
            return $report;
        }

        $parsed = parse_url($url);
        $domain = $parsed['host'] ?? '';
        $path = $parsed['path'] ?? '';

        // Check protocol
        if (!in_array($parsed['scheme'] ?? '', ['http', 'https', 'ftp'])) {
            $report['risk_score'] += 50;
            $report['warnings'][] = 'Unsafe protocol';
        }

        // Check blacklisted domains
        foreach ($this->blacklisted_domains as $blacklisted) {
            if (strpos($domain, $blacklisted) !== false) {
                $report['is_safe'] = false;
                $report['risk_score'] = 100;
                $report['message'] = 'Blacklisted domain detected';
                $report['warnings'][] = "Known malicious domain: $blacklisted";
                return $report;
            }
        }

        // Check for malicious patterns
        $full_url = strtolower($url);
        foreach ($this->malicious_patterns as $pattern) {
            if (strpos($full_url, $pattern) !== false) {
                $report['risk_score'] += 40;
                $report['warnings'][] = "Dangerous keyword found: $pattern";
            }
        }

        // Check for IP address (risky)
        if (preg_match('/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/', $domain)) {
            $report['risk_score'] += 20;
            $report['warnings'][] = 'Direct IP address (potentially risky)';
        }

        // Check subdomain count
        $subdomain_count = substr_count($domain, '.') - 1;
        if ($subdomain_count > 3) {
            $report['risk_score'] += 25;
            $report['warnings'][] = 'Too many subdomains (possible phishing)';
        }

        // Check for dangerous file extensions
        $dangerous_exts = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.msi'];
        foreach ($dangerous_exts as $ext) {
            if (substr($path, -strlen($ext)) === $ext) {
                $report['risk_score'] += 45;
                $report['warnings'][] = "Potentially dangerous file type: $ext";
            }
        }

        // Final verdict
        if ($report['risk_score'] >= 70) {
            $report['is_safe'] = false;
            $report['message'] = 'High-risk URL detected!';
        } elseif ($report['risk_score'] >= 40) {
            $report['is_safe'] = false;
            $report['message'] = 'Medium-risk URL';
        } elseif ($report['risk_score'] >= 20) {
            $report['message'] = 'Low-risk URL';
        } else {
            $report['message'] = 'URL appears safe';
        }

        return $report;
    }

    /**
     * Handle file downloads
     */
    private function handleDownload($data) {
        $url = $data['url'] ?? '';
        $filename = $data['filename'] ?? '';

        if (empty($url)) {
            $this->sendResponse([
                'success' => false,
                'error' => 'URL required'
            ], 400);
            return;
        }

        // Check URL safety first
        $safety = $this->checkURLSafety($url);
        if (!$safety['is_safe']) {
            $this->sendResponse([
                'success' => false,
                'error' => 'Unsafe URL - download blocked',
                'safety_report' => $safety
            ], 403);
            return;
        }

        // Initiate download (in production, stream the file)
        $this->sendResponse([
            'success' => true,
            'message' => 'Download initiated',
            'url' => $url,
            'filename' => $filename ?: basename($url)
        ]);
    }

    /**
     * User registration
     */
    private function handleUserRegister($data) {
        $username = $data['username'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        // Validation
        if (empty($username) || empty($email) || empty($password)) {
            $this->sendResponse([
                'success' => false,
                'error' => 'All fields required'
            ], 400);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->sendResponse([
                'success' => false,
                'error' => 'Invalid email format'
            ], 400);
            return;
        }

        // Hash password
        $hashed_password = password_hash($password, PASSWORD_BCRYPT);

        try {
            // Check if user exists
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
            $stmt->execute([$email, $username]);
            
            if ($stmt->fetch()) {
                $this->sendResponse([
                    'success' => false,
                    'error' => 'User already exists'
                ], 409);
                return;
            }

            // Create user
            $stmt = $this->db->prepare(
                "INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())"
            );
            $stmt->execute([$username, $email, $hashed_password]);

            $user_id = $this->db->lastInsertId();

            $this->sendResponse([
                'success' => true,
                'message' => 'User registered successfully',
                'user_id' => $user_id
            ]);

        } catch (PDOException $e) {
            $this->sendResponse([
                'success' => false,
                'error' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * User login
     */
    private function handleUserLogin($data) {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($email) || empty($password)) {
            $this->sendResponse([
                'success' => false,
                'error' => 'Email and password required'
            ], 400);
            return;
        }

        try {
            $stmt = $this->db->prepare("SELECT id, username, password FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !password_verify($password, $user['password'])) {
                $this->sendResponse([
                    'success' => false,
                    'error' => 'Invalid credentials'
                ], 401);
                return;
            }

            // Generate session token (simplified)
            $token = bin2hex(random_bytes(32));

            $this->sendResponse([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username']
                ],
                'token' => $token
            ]);

        } catch (PDOException $e) {
            $this->sendResponse([
                'success' => false,
                'error' => 'Login failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle NHP database queries
     */
    private function handleDatabaseQuery($data) {
        $query = $data['query'] ?? '';

        if (empty($query)) {
            $this->sendResponse([
                'success' => false,
                'error' => 'Query required'
            ], 400);
            return;
        }

        // Execute query (simplified - add proper parsing)
        $result = $this->executeNHPQuery($query);

        $this->sendResponse([
            'success' => true,
            'query' => $query,
            'result' => $result
        ]);
    }

    /**
     * Execute NHP database query
     */
    private function executeNHPQuery($query) {
        // This would parse and execute NHPLang queries
        // For now, return mock data
        return [
            'table' => 'customers',
            'rows' => 8,
            'data' => 'Query executed successfully'
        ];
    }

    /**
     * Get storage information
     */
    private function handleStorageInfo() {
        $total_gb = MAX_STORAGE_GB;
        $used_gb = $this->calculateUsedStorage();
        $available_gb = $total_gb - $used_gb;

        $this->sendResponse([
            'success' => true,
            'storage' => [
                'total_gb' => $total_gb,
                'used_gb' => $used_gb,
                'available_gb' => $available_gb,
                'percentage_used' => ($used_gb / $total_gb) * 100
            ]
        ]);
    }

    /**
     * Calculate used storage
     */
    private function calculateUsedStorage() {
        try {
            $stmt = $this->db->query("SELECT SUM(file_size) as total FROM downloads");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return round(($result['total'] ?? 0) / (1024 * 1024 * 1024), 2);
        } catch (PDOException $e) {
            return 0;
        }
    }

    /**
     * Log search query
     */
    private function logSearch($query) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO search_logs (query, timestamp) VALUES (?, NOW())"
            );
            $stmt->execute([$query]);
        } catch (PDOException $e) {
            // Silently fail
        }
    }

    /**
     * Get request data
     */
    private function getRequestData() {
        $raw_data = file_get_contents('php://input');
        $data = json_decode($raw_data, true);
        
        if ($data === null) {
            $data = $_REQUEST;
        }
        
        return $data;
    }

    /**
     * Send JSON response
     */
    private function sendResponse($data, $status_code = 200) {
        http_response_code($status_code);
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit;
    }
}

// Initialize and handle request
$server = new NHPServer();
$server->handleRequest();
?>
