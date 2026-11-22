# macOS companion — investigation required

No virtual HID backend is implemented. Investigate DriverKit/HIDDriverKit user-space extensions with supported entitlements, signing and notarization. Availability of virtual game controller presentation and compatibility with target games must be established before implementation. Apple entitlement approvals may be required; do not promise universal gamepad emulation or claim a browser can supply it.

Keep native transport, pairing and mapping separate from the platform backend. No build/installation commands exist for this planned target.
