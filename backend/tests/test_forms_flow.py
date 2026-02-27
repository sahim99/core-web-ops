"""
Test Plan: Forms & Inbox Flow
Verifies:
1. Owner can create forms and fields
2. Public users can submit forms
3. Submissions appear in inbox
4. Submissions can be approved
"""

import httpx
import sys
import time

BASE_URL = "http://127.0.0.1:8000"

OWNER = {
    "email": "test_owner@example.com",
    "password": "Password@123",
    "full_name": "Test Owner",
    "phone": "5551234567",
    "workspace_name": "TestWorkspace",
}

passed = 0
failed = 0
client = httpx.Client(base_url=BASE_URL, timeout=30, follow_redirects=True)
csrf_token = ""

def check(label: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✅ {label}")
    else:
        failed += 1
        print(f"  ❌ {label}  →  {detail}")

def login_or_register():
    global csrf_token
    print("\n═══ 1. Authentication ═══")
    
    # Try login
    res = client.post("/auth/login", json={"email": OWNER["email"], "password": OWNER["password"]})
    if res.status_code == 200:
        print("  Log in successful")
        csrf_token = client.cookies.get("csrf_token") or res.cookies.get("csrf_token")
        return True
    
    # Try register
    print("  Registering new owner...")
    res = client.post("/auth/register", json=OWNER)
    if res.status_code == 201:
        print("  Registration successful")
        csrf_token = client.cookies.get("csrf_token") or res.cookies.get("csrf_token")
        return True
        
    print(f"  ❌ Auth failed: {res.status_code} {res.text}")
    return False

def test_form_lifecycle():
    global csrf_token
    
    # ── 2. Create Form ──
    print("\n═══ 2. Create Form ═══")
    form_payload = {
        "title": "Test Contact Form",
        "description": "A test form",
        "purpose": "contact",
        "fields": [] # We'll add fields separately or here
    }
    
    headers = {"X-CSRF-Token": csrf_token}
    
    res = client.post("/forms/", json=form_payload, headers=headers)
    check("Create Form (201)", res.status_code == 201, res.text)
    if res.status_code != 201: return
    
    form_id = res.json()["id"]
    public_slug = res.json()["public_slug"]
    print(f"  Form ID: {form_id}, Slug: {public_slug}")

    # ── 3. Add Fields ──
    print("\n═══ 3. Add Fields ═══")
    field_payload = {
        "label": "Your Name",
        "field_type": "text",
        "required": True,
        "field_order": 0
    }
    res = client.post(f"/forms/{form_id}/fields", json=field_payload, headers=headers)
    check("Add Field 1 (201)", res.status_code == 201, res.text)
    
    field2_payload = {
        "label": "Email Address",
        "field_type": "email",
        "required": True,
        "field_order": 1
    }
    res = client.post(f"/forms/{form_id}/fields", json=field2_payload, headers=headers)
    check("Add Field 2 (201)", res.status_code == 201, res.text)

    # ── 4. Public Submission ──
    print("\n═══ 4. Public Submission ═══")
    # Need to fetch the form first? No, we have field schemas, let's just submit.
    # Actually submitting requires field IDs in answers map.
    # Let's get the form public to see field IDs.
    res = client.get(f"/forms/public/{public_slug}")
    check("Get Public Form (200)", res.status_code == 200)
    public_form = res.json()
    field_map = {f["label"]: str(f["id"]) for f in public_form["fields"]}
    
    submission_payload = {
        "answers": {
            field_map["Your Name"]: "John Doe",
            field_map["Email Address"]: "john@example.com"
        }
    }
    
    res = client.post(f"/forms/public/{public_slug}/submit", json=submission_payload)
    check("Submit Form (201)", res.status_code == 201, res.text)
    if res.status_code != 201: return
    
    sub_data = res.json()
    submission_id = sub_data["submission_id"]
    print(f"  Submission ID: {submission_id}")

    # ── 5. Verify Inbox ──
    print("\n═══ 5. Verify Inbox ──")
    # Give a moment for async processing (though creating message is sync)
    time.sleep(1)
    
    res = client.get("/inbox/conversations", headers=headers)
    check("List Conversations (200)", res.status_code == 200)
    convs = res.json()
    
    # Find our conversation
    target_conv = None
    for c in convs:
        if c["contact_name"] == "John Doe":
            target_conv = c
            break
            
    check("Conversation found", target_conv is not None)
    if not target_conv: return
    
    # Get details
    res = client.get(f"/inbox/conversations/{target_conv['id']}", headers=headers)
    check("Get Conversation Detail (200)", res.status_code == 200)
    detail = res.json()
    
    # Check messages
    msgs = detail["messages"]
    check("Has messages", len(msgs) > 0)
    last_msg = msgs[-1]
    check("Message type is form_submission", last_msg["message_type"] == "form_submission", f"Got {last_msg['message_type']}")
    check("Metadata has form details", last_msg["metadata_"]["form_id"] == form_id, "Form ID mismatch in metadata")

    # ── 6. Approve Submission ──
    print("\n═══ 6. Approve Submission ═══")
    # Using the submission_id we got earlier
    res = client.post(f"/forms/{form_id}/submissions/{submission_id}/approve", headers=headers)
    check("Approve Submission (200)", res.status_code == 200, res.text)
    
    # ── 7. Verify Approval Status ──
    print("\n═══ 7. Verify Status ═══")
    res = client.get(f"/forms/{form_id}/submissions", headers=headers)
    check("List Submissions (200)", res.status_code == 200)
    subs = res.json()
    my_sub = next((s for s in subs if s["id"] == submission_id), None)
    check("Submission found in list", my_sub is not None)
    if my_sub:
        check("Status is approved", my_sub["status"] == "approved", f"Got {my_sub['status']}")

    # ── Summary ──
    print("\n" + "═" * 50)
    print(f"  RESULTS:  ✅ {passed} passed  |  ❌ {failed} failed")
    print("═" * 50)
    if failed > 0: sys.exit(1)

if __name__ == "__main__":
    if login_or_register():
        test_form_lifecycle()
