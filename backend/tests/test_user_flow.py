"""
Test Plan: Owner Registration, Login, and Staff Management.
Verifies credentials are saved to database and permissions work correctly.
"""

import httpx
import sys

BASE_URL = "http://127.0.0.1:8000"

# ── Test Data ──────────────────────────────────────────────────────
OWNER = {
    "email": "sahim9733@gmail.com",
    "password": "Sahim@2026",
    "full_name": "sahim",
    "phone": "8514887095",
    "workspace_name": "ComboOps",
}

STAFF_1 = {
    "email": "sam@gmail.com",
    "password": "Staff1@2026",
    "full_name": "Sam",
    "phone": "9933055605",
    "permissions": {
        "inbox": True,
        "bookings": True,
        "forms": True,
        "inventory": True,
    },
}

STAFF_2 = {
    "email": "ram@gmail.com",
    "password": "Staff2@2026",
    "full_name": "Ram",
    "phone": "7001094020",
    "permissions": {
        "inbox": True,
        "bookings": True,
        "forms": False,
        "inventory": False,
    },
}

passed = 0
failed = 0


def check(label: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✅ {label}")
    else:
        failed += 1
        print(f"  ❌ {label}  →  {detail}")


def main():
    global passed, failed
    client = httpx.Client(base_url=BASE_URL, timeout=15, follow_redirects=True)

    # ────────────────────────────────────────────────────────────────
    # STEP 1: Register Owner
    # ────────────────────────────────────────────────────────────────
    print("\n═══ STEP 1: Register Owner ═══")
    res = client.post("/auth/register", json=OWNER)
    check("Registration status 201", res.status_code == 201, f"Got {res.status_code}: {res.text}")

    if res.status_code == 201:
        data = res.json()
        user = data.get("user", {})
        check("Owner name matches", user.get("full_name") == "sahim", f"Got {user.get('full_name')}")
        check("Owner email matches", user.get("email") == "sahim9733@gmail.com", f"Got {user.get('email')}")
        check("Owner phone matches", user.get("phone") == "8514887095", f"Got {user.get('phone')}")
        check("Owner role is OWNER", user.get("role") == "owner", f"Got {user.get('role')}")
        check("Workspace ID present", user.get("workspace_id") is not None, "Missing workspace_id")
        check("Cookie set", "access_token" in res.cookies or "access_token" in dict(res.headers), "No cookie")
    elif res.status_code == 409:
        print("  ⚠️  Owner already registered, skipping registration checks.")
    else:
        print(f"  ❌ Registration failed unexpectedly: {res.text}")

    # ────────────────────────────────────────────────────────────────
    # STEP 2: Login Owner
    # ────────────────────────────────────────────────────────────────
    print("\n═══ STEP 2: Login Owner ═══")
    login_payload = {"email": OWNER["email"], "password": OWNER["password"]}
    res = client.post("/auth/login", json=login_payload)
    check("Login status 200", res.status_code == 200, f"Got {res.status_code}: {res.text}")

    if res.status_code == 200:
        data = res.json()
        user = data.get("user", {})
        check("Login returns correct email", user.get("email") == "sahim9733@gmail.com")
        check("Login returns phone", user.get("phone") == "8514887095", f"Got {user.get('phone')}")
        check("Session cookie set", "access_token" in res.cookies or "access_token" in client.cookies, "No cookie")
    else:
        print("  ❌ Cannot proceed without login. Aborting.")
        return

    # ────────────────────────────────────────────────────────────────
    # STEP 3: Add Staff 1 (Sam – ALL permissions)
    # ────────────────────────────────────────────────────────────────
    print("\n═══ STEP 3: Add Staff 1 – Sam (All Permissions) ═══")
    staff1_payload = {
        "email": STAFF_1["email"],
        "password": STAFF_1["password"],
        "full_name": STAFF_1["full_name"],
        "phone": STAFF_1["phone"],
        "permissions": STAFF_1["permissions"],
    }

    # Get CSRF token from cookies
    csrf_token = client.cookies.get("csrf_token", "")

    res = client.post("/staff", json=staff1_payload, headers={"X-CSRF-Token": csrf_token})
    check("Staff 1 creation status 201", res.status_code == 201, f"Got {res.status_code}: {res.text}")

    if res.status_code == 201:
        s1 = res.json()
        check("Staff 1 name = Sam", s1.get("full_name") == "Sam", f"Got {s1.get('full_name')}")
        check("Staff 1 email = sam@gmail.com", s1.get("email") == "sam@gmail.com")
        check("Staff 1 phone = 9933055605", s1.get("phone") == "9933055605", f"Got {s1.get('phone')}")
        check("Staff 1 role = staff", s1.get("role") == "staff", f"Got {s1.get('role')}")
        perms = s1.get("permissions", {})
        check("Staff 1 perm: inbox=True", perms.get("inbox") is True)
        check("Staff 1 perm: bookings=True", perms.get("bookings") is True)
        check("Staff 1 perm: forms=True", perms.get("forms") is True)
        check("Staff 1 perm: inventory=True", perms.get("inventory") is True)
    elif res.status_code == 409:
        print("  ⚠️  Staff 1 already exists, skipping creation checks.")

    # ────────────────────────────────────────────────────────────────
    # STEP 4: Add Staff 2 (Ram – 2 permissions: inbox + bookings)
    # ────────────────────────────────────────────────────────────────
    print("\n═══ STEP 4: Add Staff 2 – Ram (Inbox + Bookings) ═══")
    staff2_payload = {
        "email": STAFF_2["email"],
        "password": STAFF_2["password"],
        "full_name": STAFF_2["full_name"],
        "phone": STAFF_2["phone"],
        "permissions": STAFF_2["permissions"],
    }

    res = client.post("/staff", json=staff2_payload, headers={"X-CSRF-Token": csrf_token})
    check("Staff 2 creation status 201", res.status_code == 201, f"Got {res.status_code}: {res.text}")

    if res.status_code == 201:
        s2 = res.json()
        check("Staff 2 name = Ram", s2.get("full_name") == "Ram", f"Got {s2.get('full_name')}")
        check("Staff 2 email = ram@gmail.com", s2.get("email") == "ram@gmail.com")
        check("Staff 2 phone = 7001094020", s2.get("phone") == "7001094020", f"Got {s2.get('phone')}")
        check("Staff 2 role = staff", s2.get("role") == "staff", f"Got {s2.get('role')}")
        perms = s2.get("permissions", {})
        check("Staff 2 perm: inbox=True", perms.get("inbox") is True)
        check("Staff 2 perm: bookings=True", perms.get("bookings") is True)
        check("Staff 2 perm: forms=False", perms.get("forms") is False)
        check("Staff 2 perm: inventory=False", perms.get("inventory") is False)
    elif res.status_code == 409:
        print("  ⚠️  Staff 2 already exists, skipping creation checks.")

    # ────────────────────────────────────────────────────────────────
    # STEP 5: Verify staff list from DB via API
    # ────────────────────────────────────────────────────────────────
    print("\n═══ STEP 5: Verify Staff List (DB Check via API) ═══")
    res = client.get("/staff", headers={"X-CSRF-Token": csrf_token})
    check("Staff list status 200", res.status_code == 200, f"Got {res.status_code}: {res.text}")

    if res.status_code == 200:
        staff_list = res.json()
        emails = [s["email"] for s in staff_list]
        check("Sam in staff list", "sam@gmail.com" in emails, f"Found: {emails}")
        check("Ram in staff list", "ram@gmail.com" in emails, f"Found: {emails}")
        check("Staff count >= 2", len(staff_list) >= 2, f"Count: {len(staff_list)}")

    # ────────────────────────────────────────────────────────────────
    # STEP 6: Verify current user (database session check)
    # ────────────────────────────────────────────────────────────────
    print("\n═══ STEP 6: Verify DB Session (/auth/me) ═══")
    res = client.get("/auth/me")
    check("GET /auth/me status 200", res.status_code == 200, f"Got {res.status_code}: {res.text}")

    if res.status_code == 200:
        me = res.json()
        check("Session user = sahim9733@gmail.com", me.get("email") == "sahim9733@gmail.com")
        check("Session phone = 8514887095", me.get("phone") == "8514887095", f"Got {me.get('phone')}")

    # ────────────────────────────────────────────────────────────────
    # STEP 7: Security Check – no password hash leakage
    # ────────────────────────────────────────────────────────────────
    print("\n═══ STEP 7: Security Verification ═══")
    res = client.get("/auth/me")
    if res.status_code == 200:
        body = res.text
        check("No hashed_password in response", "hashed_password" not in body)
        check("No password field in response", '"password"' not in body)

    # ── Summary ────────────────────────────────────────────────────
    print("\n" + "═" * 50)
    print(f"  RESULTS:  ✅ {passed} passed  |  ❌ {failed} failed")
    print("═" * 50)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
