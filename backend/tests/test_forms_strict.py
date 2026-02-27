"""
Test Plan: Strict Forms Flow
Verifies:
1. Form creation generates public_slug and public_url
2. Form activation fails without email/phone field
3. Form activation succeeds with email/phone field
4. Public submission creates contact, conversation, submission, and message
5. Duplicate submission reuses contact and conversation
6. Inbox message is created
"""

import httpx
import sys
import time
import secrets

BASE_URL = "http://127.0.0.1:8001"

OWNER = {
    "email": "strict_test_owner@example.com",
    "password": "Password@123",
    "full_name": "Strict Test Owner",
    "phone": "5551112233",
    "workspace_name": "StrictTestWorkspace",
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

def test_strict_flow():
    global csrf_token
    headers = {"X-CSRF-Token": csrf_token}
    
    # ── 2. Create Form & Verify Slug ──
    print("\n═══ 2. Create Form & Verify Slug ═══")
    form_title = f"Strict Form {secrets.token_hex(2)}"
    form_payload = {
        "title": form_title,
        "description": "Checking strict logic",
        "purpose": "contact",
    }
    
    res = client.post("/forms/", json=form_payload, headers=headers)
    check("Create Form (201)", res.status_code == 201, res.text)
    if res.status_code != 201: return
    
    form_data = res.json()
    form_id = form_data["id"]
    public_slug = form_data["public_slug"]
    public_url = form_data.get("public_url")
    
    check("public_slug generated", bool(public_slug), f"Got {public_slug}")
    check("public_url returned", bool(public_url), f"Got {public_url}")
    if public_url:
        check("public_url contains slug", public_slug in public_url)

    # ── 3. Activation Validation (Fail) ──
    print("\n═══ 3. Activation Validation (Fail) ═══")
    # Try to activate without fields
    res = client.put(f"/forms/{form_id}", json={"status": "active"}, headers=headers)
    check("Activate fail (400)", res.status_code == 400, res.text)
    check("Error message correct", "email" in res.text.lower() or "phone" in res.text.lower(), res.text)

    # ── 4. Add Fields & Activate (Success) ──
    print("\n═══ 4. Add Fields & Activate (Success) ═══")
    # Add email field
    res = client.post(f"/forms/{form_id}/fields", json={"label": "Email", "field_type": "email", "required": True}, headers=headers)
    check("Add Email Field (201)", res.status_code == 201)
    
    # Add name field
    res = client.post(f"/forms/{form_id}/fields", json={"label": "Name", "field_type": "text", "required": True}, headers=headers)
    check("Add Name Field (201)", res.status_code == 201)

    # Activate
    res = client.put(f"/forms/{form_id}", json={"status": "active"}, headers=headers)
    check("Activate success (200)", res.status_code == 200, res.text)

    # ── 5. Public Submission & Contact Creation ──
    print("\n═══ 5. Public Submission & Contact Creation ═══")
    # Get form to map fields
    res = client.get(f"/forms/public/{public_slug}")
    check("Get Public Form (200)", res.status_code == 200)
    public_form = res.json()
    field_map = {f["label"]: str(f["id"]) for f in public_form["fields"]}
    
    contact_email = f"user_{secrets.token_hex(4)}@example.com"
    submission_payload = {
        "answers": {
            field_map["Email"]: contact_email,
            field_map["Name"]: "Test User"
        }
    }
    
    res = client.post(f"/forms/public/{public_slug}/submit", json=submission_payload)
    check("Submit Form (201)", res.status_code == 201, res.text)
    sub_resp = res.json()
    if res.status_code != 201: return
    
    print(f"DEBUG Response: {sub_resp}")
    if "contact_id" not in sub_resp:
         print("WARNING: contact_id missing in response")
         # continue or exit?
         return 
    submission_id = sub_resp["submission_id"]
    contact_id = sub_resp["contact_id"]
    print(f"  Submission ID: {submission_id}, Contact ID: {contact_id}")

    # Verify Contact
    res = client.get(f"/contacts/{contact_id}", headers=headers)
    check("Contact created (200)", res.status_code == 200)
    contact = res.json()
    check("Contact email matches", contact["email"] == contact_email)
    check("Contact type is customer", contact["contact_type"] == "customer")

    # ── 6. Duplicate Submission (Reuse Contact) ──
    print("\n═══ 6. Duplicate Submission (Reuse Contact) ═══")
    # Submit same email again
    res = client.post(f"/forms/public/{public_slug}/submit", json=submission_payload)
    check("Submit Duplicate (201)", res.status_code == 201)
    dup_resp = res.json()
    check("Reused Contact ID", dup_resp["contact_id"] == contact_id, f"Expected {contact_id}, got {dup_resp['contact_id']}")

    # ── 7. Check Inbox & Automation ──
    print("\n═══ 7. Check Inbox & Automation ═══")
    # Check conversation
    res = client.get(f"/inbox/conversations?contact_id={contact_id}", headers=headers)
    # List all and find ours. API path is /inbox/
    res = client.get("/inbox/", headers=headers)
    check("List Conversations (200)", res.status_code == 200, res.text)
    if res.status_code != 200:
        print(f"  ERROR: Could not list conversations: {res.text}")
        return
        
    convs = res.json()
    print(f"  DEBUG Conversations: {convs}")
    
    # Ensure convs is a list
    if not isinstance(convs, list):
         print(f"  ERROR: Expected list of conversations, got {type(convs)}")
         return

    my_conv = next((c for c in convs if isinstance(c, dict) and c.get("contact_id") == contact_id), None)
    
    check("Conversation exists", my_conv is not None, f"Contact ID {contact_id} not found in {convs}")
    if my_conv:
        check("Conversation channel is form", my_conv.get("channel") == "form", f"Got {my_conv.get('channel')}")
        
        # Check messages. API path is /inbox/{id}
        res = client.get(f"/inbox/{my_conv['id']}", headers=headers)
        detail = res.json()
        msgs = detail["messages"]
        
        # Should have at least 2 submission messages (from our 2 submits)
        # And potentially automated replies if event processed fast enough
        submission_msgs = [m for m in msgs if m["message_type"] == "form_submission"]
        check("Submission messages found", len(submission_msgs) >= 2, f"Found {len(submission_msgs)}")
        
        # Check for automated reply (might need wait)
        print("  Waiting for event processing...")
        time.sleep(2)
        # Re-check for automated messages. API path is /inbox/{id}
        res = client.get(f"/inbox/{my_conv['id']}", headers=headers)
        msgs = res.json()["messages"]
        auto_msgs = [m for m in msgs if m["message_type"] == "automated"]
        check("Automated reply found", len(auto_msgs) > 0, f"Found {len(auto_msgs)}")

    # ── Summary ──
    print("\n" + "═" * 50)
    print(f"  RESULTS:  ✅ {passed} passed  |  ❌ {failed} failed")
    print("═" * 50)
    if failed > 0: sys.exit(1)

if __name__ == "__main__":
    if login_or_register():
        test_strict_flow()
