#!/usr/bin/env python3
"""
Simple test script to verify backend functionality
"""
import requests
import json
import time

BASE_URL = 'http://localhost:5000'

def test_health():
    """Test health endpoint"""
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get(f'{BASE_URL}/api/health')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_chat_flow():
    """Test complete chat flow"""
    print("\n💬 Testing chat flow...")
    
    # Start session
    print("1. Starting chat session...")
    try:
        start_response = requests.post(f'{BASE_URL}/api/chat/start', 
            json={'userEmail': 'test@example.com'})
        print(f"Start Status: {start_response.status_code}")
        
        if start_response.status_code != 200:
            print(f"❌ Start failed: {start_response.text}")
            return False
        
        start_data = start_response.json()
        session_id = start_data['session_id']
        print(f"Session ID: {session_id}")
        print(f"Welcome: {start_data['welcome_message'][:100]}...")
        
    except Exception as e:
        print(f"❌ Session start failed: {e}")
        return False
    
    # Send message
    print("\n2. Sending test message...")
    try:
        message_response = requests.post(f'{BASE_URL}/api/chat/message', 
            json={
                'session_id': session_id,
                'message': '¿Cuál es el PDV con mejor revenue?'
            })
        print(f"Message Status: {message_response.status_code}")
        
        if message_response.status_code != 200:
            print(f"❌ Message failed: {message_response.text}")
            return False
        
        message_data = message_response.json()
        print(f"Response preview: {message_data['response']['text'][:200]}...")
        print(f"SQL executed: {message_data['response']['sql_executed']}")
        print(f"Execution time: {message_data['response']['execution_time']}ms")
        
    except Exception as e:
        print(f"❌ Message send failed: {e}")
        return False
    
    # Get history
    print("\n3. Getting chat history...")
    try:
        history_response = requests.get(f'{BASE_URL}/api/chat/history/{session_id}')
        print(f"History Status: {history_response.status_code}")
        
        if history_response.status_code == 200:
            history_data = history_response.json()
            print(f"History entries: {len(history_data.get('history', []))}")
        
    except Exception as e:
        print(f"⚠️ History failed (non-critical): {e}")
    
    return True

def test_analytics():
    """Test analytics endpoint"""
    print("\n📊 Testing analytics...")
    try:
        response = requests.get(f'{BASE_URL}/api/analytics/sessions')
        print(f"Analytics Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Active sessions: {data['analytics']['sessions']['active_sessions']}")
            print(f"Cache hit rate: {data['analytics']['cache']['cache_hit_rate']}%")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Analytics failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting backend tests...\n")
    
    tests = [
        ("Health Check", test_health),
        ("Chat Flow", test_chat_flow),
        ("Analytics", test_analytics)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        result = test_func()
        results[test_name] = result
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\n{'='*50}")
    print("📋 Test Results Summary:")
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    all_passed = all(results.values())
    print(f"\n🎯 Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    return all_passed

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)