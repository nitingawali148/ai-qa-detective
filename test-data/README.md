# Test Data — Cross-Industry Sample Failures

This folder documents 6 additional "Load Sample" scenarios for AI QA Detective, spanning **5 different fictional companies** across different industries — not just [ShopSphere](../docs/shopsphere/) (see that folder for the ShopSphere-specific scenarios and seeded history). They exist to exercise failure signatures the ShopSphere-only set doesn't cover, and to demonstrate that the AI's classification is driven by evidence patterns, not by memorizing one company's logs.

All 6 are wired into the app: they're in `server/src/data/sampleFailures.ts`'s `sampleScenarios` object and appear automatically in the **Load Sample ▾** dropdown on the Analyze Failure page (the dropdown is populated dynamically from that object — adding an entry there is the only code change needed to add a new one to the UI).

| # | Scenario | Fictional Company | Expected Classification | Difficulty |
|---|---|---|---|---|
| 1 | 🛒 E-Commerce — Payment Failure | ShopSphere | Application Defect | 🟢 Easy |
| 2 | 🔐 Banking — Login Authentication Failure | SecureBank Online | Application Defect (genuinely ambiguous — see below) | 🟡 Medium |
| 3 | 📦 Warehouse — Inventory API Timeout | SmartWarehouse | Environment Issue | 🟡 Medium |
| 4 | 🚕 Ride Booking — Business Logic Failure | QuickRide | Application Defect (business logic) | 🟡 Medium |
| 5 | 🏥 Healthcare — Database Connection Failure | MediCare Portal | Environment Issue | 🟢 Easy |
| 6 | 🧪 Playwright — Automation Failure | ShopSphere | **Test Automation Issue** | 🔴 Important |

**Scenario 6 is the most important one.** The API response explicitly confirms the order succeeded (`orderStatus: "CONFIRMED"`, `paymentStatus: "SUCCESS"`), but the UI automation timed out looking for the confirmation banner. A naive engine would see "test failed" and blame the application; AI QA Detective's mock rule engine specifically checks for this "backend succeeded, UI locator failed" combination and correctly attributes it to the automation, not the app — this is the clearest demonstration that the tool reasons about the *relationship* between pieces of evidence, not just their presence.

Every scenario below was verified against the actual mock rule engine (`server/src/ai/mock-analyzer.ts`) — see `server/tests/mock-analyzer.test.ts` for the automated regression tests that lock in these classifications.

---

## 1. 🛒 E-Commerce — Payment Failure

**Test Information**

| Field | Value |
|---|---|
| Test Name | Verify checkout using credit card |
| Test ID | TC-CHECKOUT-014 |
| Application | ShopSphere E-Commerce |
| Environment | QA |
| Browser | Chrome |
| Build Version | 2026.08.16.142 |

**Test Details**

- **Description:** Verify that a customer can successfully complete checkout using a valid credit card and receive an order confirmation after successful payment.
- **Steps:** Login → search for a product → add to cart → checkout → enter shipping info → select Credit Card → enter card details → Place Order → verify payment processed → verify order confirmation displayed.
- **Expected Result:** Payment should be processed successfully and the customer should see an order confirmation with a valid order ID.
- **Actual Result:** Payment API returned HTTP 500 and the checkout process failed. The payment response contained a null `transactionId`.

**Evidence**

```text
[INFO] Starting checkout test
[INFO] Product added to cart: SKU-IPHONE-15
[INFO] Cart total: 79999.00
[INFO] Payment method: CREDIT_CARD
[INFO] Sending payment request
[INFO] POST /api/v1/payments
[ERROR] Payment API returned status: 500
[ERROR] Payment processing failed
[INFO] Order status: PAYMENT_FAILED
[ERROR] Checkout test failed
```

```text
java.lang.NullPointerException: Cannot invoke "String.trim()" because "transactionId" is null
    at com.shopsphere.payment.PaymentService.processPayment(PaymentService.java:142)
    at com.shopsphere.checkout.CheckoutService.completeOrder(CheckoutService.java:287)
    at com.shopsphere.api.PaymentController.process(PaymentController.java:96)
```

```json
{ "status": 500, "error": "Internal Server Error", "message": "Payment processing failed", "paymentStatus": "FAILED", "transactionId": null }
```

**AI verdict:** Application Defect · Critical · P1 · 94% confidence — matched by `paymentNullPointerRule`.

---

## 2. 🔐 Banking — Login Authentication Failure

**Test Information**

| Field | Value |
|---|---|
| Test Name | Verify login with valid credentials |
| Test ID | TC-AUTH-007 |
| Application | SecureBank Online |
| Environment | Staging |
| Browser | Chrome |
| Build Version | 2026.08.16.205 |

**Test Details**

- **Description:** Verify that a registered banking customer can log in successfully using valid credentials and access the account dashboard.
- **Expected Result:** The user should be authenticated successfully and redirected to the account dashboard.
- **Actual Result:** The login request returned HTTP 401 Unauthorized even though valid test credentials were used.

**Evidence**

```text
[INFO] Starting login test
[INFO] Sending authentication request
[INFO] POST /api/v2/auth/login
[INFO] Response received: 401
[ERROR] Expected HTTP 200 but received HTTP 401
```

```text
org.opentest4j.AssertionFailedError:
Expected: 200
Actual: 401
```

```json
{ "status": 401, "error": "Unauthorized", "message": "Invalid authentication token", "code": "AUTH_TOKEN_INVALID" }
```

**AI verdict:** Application Defect (tentative) · Medium · P3 · **45% confidence, flagged `insufficient_evidence`**. This is intentional: a 401 with no service-down signal *and* no specific code defect is genuinely ambiguous — it could be an app bug, expired test credentials, or an environment/config issue. The engine deliberately refuses to guess and asks for more evidence rather than confidently misclassifying. (Matched by `authUnauthorizedAmbiguousRule`, distinct from the auth-service-is-down case in scenario handling for `login` above.)

---

## 3. 📦 Warehouse — Inventory API Timeout

**Test Information**

| Field | Value |
|---|---|
| Test Name | Verify product inventory availability |
| Test ID | TC-INVENTORY-021 |
| Application | SmartWarehouse |
| Environment | QA |
| Browser | Chrome |
| Build Version | 2026.08.16.118 |

**Test Details**

- **Expected Result:** The inventory service should return the current stock quantity within the configured response timeout.
- **Actual Result:** The inventory API did not respond within 3000 milliseconds. The request timed out after two retry attempts and returned HTTP 504.

**Evidence**

```text
[INFO] GET /api/v1/inventory/SKU-98421
[INFO] Request timeout configured: 3000ms
[WARN] Inventory API did not respond within timeout
[ERROR] Request failed after 2 retries
```

```text
java.net.SocketTimeoutException: Read timed out after 3000ms
    at com.warehouse.inventory.InventoryClient.getInventory(InventoryClient.java:74)
```

```json
{ "status": 504, "error": "Gateway Timeout", "message": "Inventory service did not respond within the configured timeout", "service": "inventory-service" }
```

**AI verdict:** Environment Issue · High · P2 · 80% confidence — matched by `apiTimeoutRule`.

---

## 4. 🚕 Ride Booking — Business Logic Failure

**Test Information**

| Field | Value |
|---|---|
| Test Name | Verify ride booking confirmation |
| Test ID | TC-RIDE-032 |
| Application | QuickRide |
| Environment | Staging |
| Browser | Chrome |
| Build Version | 2026.08.16.087 |

**Test Details**

- **Expected Result:** `CONFIRMED`
- **Actual Result:** `PENDING`

**Evidence**

```text
[INFO] POST /api/v1/rides
[INFO] Response status: 201
[INFO] Ride created successfully
[ERROR] Expected ride status: CONFIRMED
[ERROR] Actual ride status: PENDING
```

```text
org.opentest4j.AssertionFailedError:
Ride status mismatch
Expected: CONFIRMED
Actual: PENDING
```

```json
{ "status": 201, "rideId": "RIDE-72891", "rideStatus": "PENDING", "driverAssigned": false, "message": "Ride created successfully" }
```

**AI verdict:** Application Defect · High · P2 · 75% confidence — matched by `businessLogicMismatchRule`, which specifically looks for "HTTP succeeded (2xx) but the resulting state doesn't match" — distinguishing a real business-logic defect from a failed request.

---

## 5. 🏥 Healthcare — Database Connection Failure

**Test Information**

| Field | Value |
|---|---|
| Test Name | Verify patient registration |
| Test ID | TC-PATIENT-011 |
| Application | MediCare Portal |
| Environment | QA |
| Browser | Edge |
| Build Version | 2026.08.16.056 |

**Test Details**

- **Expected Result:** The patient should be registered successfully and the patient record should be stored in the database.
- **Actual Result:** Patient registration failed with HTTP 503. The Patient Service could not establish a connection to the PostgreSQL database.

**Evidence**

```text
[INFO] POST /api/v1/patients
[ERROR] Database connection failed
[ERROR] HTTP 503 returned by Patient Service
```

```text
org.springframework.jdbc.CannotGetJdbcConnectionException: Failed to obtain JDBC Connection
Caused by: java.net.ConnectException: Connection refused: database-host:5432
```

```json
{ "status": 503, "error": "Service Unavailable", "message": "Patient service is temporarily unavailable", "dependency": "postgresql" }
```

**AI verdict:** Environment Issue · Critical · P1 · 87% confidence — matched by `databaseConnectionRefusedRule`.

---

## 6. 🧪 Playwright — Automation Failure ⭐

**Test Information**

| Field | Value |
|---|---|
| Test Name | Verify order confirmation banner |
| Test ID | TC-CHECKOUT-019 |
| Application | ShopSphere E-Commerce |
| Environment | QA |
| Browser | Chrome |
| Build Version | 2026.08.16.142 |

**Test Details**

- **Expected Result:** After successful order submission, the order confirmation banner should be displayed with the generated order ID.
- **Actual Result:** The order was successfully created and the payment was successful according to the API response, but the automation test could not find the order confirmation banner within 5000 milliseconds.

**Evidence**

```text
[INFO] Order submitted successfully
[INFO] Waiting for confirmation banner
[INFO] Locator: .order-confirmation-banner
[ERROR] Element not found
[ERROR] Timeout after 5000ms
```

```text
playwright._impl._errors.TimeoutError:
Timeout 5000ms exceeded.
waiting for locator(".order-confirmation-banner")
- locator resolved to 0 elements
```

```json
{ "status": 201, "orderId": "ORD-88213", "orderStatus": "CONFIRMED", "paymentStatus": "SUCCESS", "message": "Order submitted successfully" }
```

**AI verdict:** **Test Automation Issue** · Medium · P3 · 85% confidence — matched by `successApiButAutomationTimeoutRule`, which specifically requires both a confirmed-success signal *in the API response* and a UI element/locator timeout. Correctly does **not** flag this as an Application Defect, even though the test failed — because the backend evidence shows the operation actually succeeded.

---

## Extending this further

To add another scenario:

1. Add an entry to `sampleScenarios` in `server/src/data/sampleFailures.ts` — it will automatically appear in the "Load Sample ▾" dropdown, no frontend changes needed.
2. Check it against the rules in `server/src/ai/mock-analyzer.ts` (`RULES` array, checked in order, first match wins). If it's a genuinely new failure signature, add a new rule rather than stretching an existing one.
3. Add a regression test to `server/tests/mock-analyzer.test.ts` asserting the expected classification.
4. Document it here, following the format above.

See also **[flow.md](../flow.md)** (§4.2) for the full rule decision-tree diagram, and **[docs/shopsphere/](../docs/shopsphere/)** for the ShopSphere-specific scenarios and seeded failure history.
