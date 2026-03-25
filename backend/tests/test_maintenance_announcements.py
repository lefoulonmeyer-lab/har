"""
Test suite for Maintenance and Announcements APIs
Tests the new features: maintenance mode system and announcements system
"""
import pytest
import requests
import os
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMaintenanceAPI:
    """Tests for maintenance mode endpoints"""
    
    def test_get_maintenance_status_public(self):
        """GET /api/settings/maintenance - Public endpoint should return maintenance status"""
        response = requests.get(f"{BASE_URL}/api/settings/maintenance")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "maintenance_mode" in data, "Response should contain maintenance_mode"
        assert "title" in data, "Response should contain title"
        assert "message" in data, "Response should contain message"
        assert "eta" in data, "Response should contain eta"
        print(f"✓ Maintenance status: {data}")
    
    def test_put_maintenance_requires_auth(self):
        """PUT /api/admin/settings/maintenance - Should require admin auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/maintenance",
            json={"enabled": False}
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Maintenance PUT requires authentication")


class TestAnnouncementsAPI:
    """Tests for announcements endpoints"""
    
    def test_get_active_announcements_public(self):
        """GET /api/announcements - Public endpoint should return active announcements"""
        response = requests.get(f"{BASE_URL}/api/announcements")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "announcements" in data, "Response should contain announcements array"
        assert isinstance(data["announcements"], list), "Announcements should be a list"
        print(f"✓ Active announcements: {len(data['announcements'])} found")
    
    def test_get_admin_announcements_requires_auth(self):
        """GET /api/admin/announcements - Should require admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/announcements")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Admin announcements GET requires authentication")
    
    def test_create_announcement_requires_auth(self):
        """POST /api/admin/announcements - Should require admin auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/announcements",
            json={
                "type": "banner",
                "title": "Test Announcement",
                "message": "This is a test",
                "style": "info"
            }
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Create announcement requires authentication")


class TestExistingAPIs:
    """Tests for existing APIs to ensure they still work"""
    
    def test_categories_api(self):
        """GET /api/categories - Should return forum categories (returns array directly)"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # API returns array directly
        assert isinstance(data, list), "Response should be a list of categories"
        assert len(data) > 0, "Should have at least one category"
        assert "category_id" in data[0], "Category should have category_id"
        print(f"✓ Categories: {len(data)} found")
    
    def test_topics_api(self):
        """GET /api/topics - Should return forum topics"""
        response = requests.get(f"{BASE_URL}/api/topics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "topics" in data, "Response should contain topics"
        print(f"✓ Topics: {len(data['topics'])} found")
    
    def test_public_stats(self):
        """GET /api/stats - Should return public stats"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "users_count" in data, "Response should contain users_count"
        assert "topics_count" in data, "Response should contain topics_count"
        assert "posts_count" in data, "Response should contain posts_count"
        print(f"✓ Public stats: {data}")
    
    def test_verification_badges(self):
        """GET /api/verification-badges - Should return badge types (returns object directly)"""
        response = requests.get(f"{BASE_URL}/api/verification-badges")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # API returns object with badge types as keys
        assert isinstance(data, dict), "Response should be a dict of badge types"
        assert "verified" in data, "Should have verified badge type"
        assert "official" in data, "Should have official badge type"
        print(f"✓ Verification badges: {len(data)} types")


class TestAuthProtectedEndpoints:
    """Tests to verify auth protection on admin endpoints"""
    
    def test_admin_users_requires_auth(self):
        """GET /api/admin/users - Should require admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Admin users endpoint protected")
    
    def test_admin_logs_requires_auth(self):
        """GET /api/admin/logs - Should require admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/logs")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Admin logs endpoint protected")
    
    def test_reports_requires_auth(self):
        """GET /api/reports - Should require auth"""
        response = requests.get(f"{BASE_URL}/api/reports")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Reports endpoint protected")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
