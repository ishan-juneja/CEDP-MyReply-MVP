#!/usr/bin/env python3
"""
Test script to demonstrate the complete webhook pipeline.

This simulates a Formbricks survey response and tests the full pipeline:
1. Webhook receives survey data
2. OCR processes uploaded eviction notice
3. LLM generates legal arguments
4. PDF would be generated (placeholder)
"""

import json
import requests
import time

def test_webhook_pipeline():
    """Test the complete webhook pipeline with mock survey data."""

    print("🚀 Testing Complete Webhook Pipeline")
    print("=" * 50)

    # Mock survey response data (simulating Formbricks webhook payload)
    mock_survey_response = {
        "event": "responseFinished",
        "data": {
            "id": "test_response_123",
            "surveyId": "test_survey_456",
            "finished": True,
            "data": {
                # Colorado residency - Yes
                "q8hh9qo5haoqb77rzaz39tlx": "Yes",
                # File upload - mock eviction notice
                "qf9u4fbpr78dqhvxb1ujpmuo": "mock_eviction_notice_url",
                # Payment status - Paid full amount
                "g0rznhregilhqyvdoql0lwch": "tjif4flki2vwxeonh887bp90"  # PAID_FULL option ID
            }
        }
    }

    print("📝 Mock Survey Response:")
    print(json.dumps(mock_survey_response, indent=2))
    print()

    # Step 1: Test OCR endpoint directly
    print("🔍 Step 1: Testing OCR Endpoint")
    try:
        ocr_response = requests.post("http://localhost:8000/ocr", json={
            "url": "mock_eviction_notice_url"
        }, timeout=10)

        if ocr_response.status_code == 200:
            ocr_data = ocr_response.json()
            print("✅ OCR Success:", json.dumps(ocr_data, indent=2))
        else:
            print("❌ OCR Failed:", ocr_response.status_code, ocr_response.text)

    except requests.exceptions.RequestException as e:
        print("❌ OCR Request Failed:", str(e))

    print()

    # Step 2: Test LLM endpoint directly
    print("🤖 Step 2: Testing LLM Arguments Endpoint")
    try:
        llm_response = requests.post("http://localhost:8000/generate-arguments", json={
            "up_codes": ["UP003", "UP001"],
            "tenant_context": {
                "state": "Colorado",
                "eviction_type": "Nonpayment of Rent",
                "notice_days": 3,
                "served_at": "2024-01-01",
                "expires_at": "2024-01-04"
            }
        }, timeout=10)

        if llm_response.status_code == 200:
            llm_data = llm_response.json()
            print("✅ LLM Success:")
            print(llm_data.get("argument_text", "")[:300] + "...")
        else:
            print("❌ LLM Failed:", llm_response.status_code, llm_response.text)

    except requests.exceptions.RequestException as e:
        print("❌ LLM Request Failed:", str(e))

    print()

    # Step 3: Test webhook endpoint
    print("🔗 Step 3: Testing Complete Webhook Pipeline")
    try:
        webhook_response = requests.post(
            "http://localhost:3000/api/myreply-webhook",
            json=mock_survey_response,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"📡 Webhook Response Status: {webhook_response.status_code}")
        if webhook_response.status_code == 200:
            result = webhook_response.json()
            print("✅ Webhook Success:", json.dumps(result, indent=2))
        else:
            print("❌ Webhook Response:", webhook_response.text)

    except requests.exceptions.RequestException as e:
        print("❌ Webhook Request Failed:", str(e))

    print()
    print("🎉 Pipeline Test Complete!")
    print("=" * 50)

if __name__ == "__main__":
    test_webhook_pipeline()
