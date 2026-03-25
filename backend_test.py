#!/usr/bin/env python3
"""
Backend API Testing for Astuceson Forum
Tests all critical API endpoints for the MVP implementation
"""

import requests
import sys
import json
from datetime import datetime

class AstuceonAPITester:
    def __init__(self, base_url="https://creator-connect-221.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if not success and expected_status and actual_status:
            print(f"    Expected: {expected_status}, Got: {actual_status}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True, f"Response received successfully", expected_status, response.status_code)
                    return True, response_data
                except:
                    self.log_test(name, True, f"Response received (non-JSON)", expected_status, response.status_code)
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    self.log_test(name, False, f"Error: {error_data.get('detail', 'Unknown error')}", expected_status, response.status_code)
                except:
                    self.log_test(name, False, f"HTTP Error: {response.text[:100]}", expected_status, response.status_code)
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout (30s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "Connection error - server may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_categories(self):
        """Test categories endpoint"""
        success, data = self.run_test("Get Categories", "GET", "categories", 200)
        if success and isinstance(data, list):
            expected_categories = ["Général", "TikTok", "Twitch", "YouTube", "Setup & Matos", "Events & IRL"]
            found_categories = [cat.get('name') for cat in data]
            
            for expected in expected_categories:
                if expected in found_categories:
                    self.log_test(f"Category '{expected}' exists", True)
                else:
                    self.log_test(f"Category '{expected}' missing", False, f"Found: {found_categories}")
            
            return len(data) >= 6
        return False

    def test_stats(self):
        """Test public stats endpoint"""
        success, data = self.run_test("Get Public Stats", "GET", "stats", 200)
        if success:
            required_fields = ['users_count', 'topics_count', 'posts_count']
            for field in required_fields:
                if field in data:
                    self.log_test(f"Stats field '{field}' present", True, f"Value: {data[field]}")
                else:
                    self.log_test(f"Stats field '{field}' missing", False)
        return success

    def test_topics(self):
        """Test topics endpoint"""
        success, data = self.run_test("Get Topics", "GET", "topics", 200)
        if success:
            if 'topics' in data and 'total' in data:
                self.log_test("Topics response structure valid", True, f"Found {len(data['topics'])} topics")
                return True
            else:
                self.log_test("Topics response structure invalid", False, f"Missing 'topics' or 'total' field")
        return False

    def test_search(self):
        """Test search endpoint"""
        return self.run_test("Search API", "GET", "search?q=test", 200)

    def test_auth_endpoints_without_auth(self):
        """Test auth endpoints without authentication (should fail)"""
        self.run_test("Auth Me (No Token)", "GET", "auth/me", 401)
        self.run_test("Notifications (No Token)", "GET", "notifications", 401)

    def test_cors_headers(self):
        """Test CORS configuration"""
        try:
            response = requests.options(f"{self.base_url}/api/categories", timeout=10)
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if cors_headers['Access-Control-Allow-Origin']:
                self.log_test("CORS Headers Present", True, f"Origin: {cors_headers['Access-Control-Allow-Origin']}")
            else:
                self.log_test("CORS Headers Missing", False)
                
        except Exception as e:
            self.log_test("CORS Test Failed", False, str(e))

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Astuceson Forum Backend API Tests")
        print(f"📍 Testing: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity
        self.test_health_check()
        
        # Public endpoints
        self.test_categories()
        self.test_stats()
        self.test_topics()
        self.test_search()
        
        # Auth endpoints (should fail without token)
        self.test_auth_endpoints_without_auth()
        
        # CORS
        self.test_cors_headers()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

    def get_test_summary(self):
        """Get test summary for reporting"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = AstuceonAPITester()
    exit_code = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(tester.get_test_summary(), f, indent=2)
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())