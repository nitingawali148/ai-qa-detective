# Test Data — Cross-Industry Sample Failures

This folder documents the additional "Load Sample" scenarios for AI QA Detective, on top of the [ShopSphere](../docs/shopsphere/)-only set — **25 scenarios total** here, spanning **6 fictional companies** and every failure category, so the classification logic proves itself against genuinely different evidence rather than memorizing one company's logs.

All of them are wired into the app: they're in `server/src/data/sampleFailures.ts`'s `sampleScenarios` object and appear automatically in the **Load Sample ▾** dropdown on the Analyze Failure page (the dropdown is populated dynamically from that object — adding an entry there is the only code change needed to add a new one to the UI), with a **Filter by Category** control to jump straight to a specific classification.

Every scenario in this folder — all 25 — was verified against the actual mock rule engine (`server/src/ai/mock-analyzer.ts`) before being documented, not just hand-classified: `server/tests/mock-analyzer.test.ts` runs each one through the real engine and fails loudly if a future rule change ever shifts its classification.

## Category coverage

Combined with the 6 ShopSphere-only scenarios in [docs/shopsphere/](../docs/shopsphere/), every one of the 6 failure categories now has **at least 5 sample scenarios** (31 total across both folders):

| Category | Count | Scenarios |
|---|---|---|
| Application Defect | 5 | `payment`, `cart`, `ecommercePaymentAdvanced`, `bankingLoginFailure`, `rideBookingLogicFailure` |
| Environment Issue | 6 | `login`, `productSearch`, `warehouseInventoryTimeout`, `healthcareDatabaseFailure`, `performanceLoadTest`, `databaseQueryPerformanceDegradation` |
| Test Automation Issue | 5 | `automation`, `playwrightAutomationFailure`, `mobileLocatorBroken`, `brokenCssSelector`, `brittleXpathBroken` |
| Flaky Test | 5 | `flaky`, `staleElementRace`, `intermittentAnimationTiming`, `ciNetworkFlake`, `raceConditionAssertion` |
| Configuration Issue | 5 | `featureFlagMisconfig`, `wrongApiEndpointMobile`, `dbConnectionStringWrongEnv`, `paymentGatewaySandboxMisconfig`, `timeoutConfigTooShort` |
| Data Issue | 5 | `duplicateCustomerRecord`, `missingTestDataUserDeleted`, `orphanedOrderReference`, `staleSeedDataMismatch`, `dbMigrationDataLoss` |

Configuration Issue and Data Issue previously had **zero** sample coverage — `configurationIssueRule` and `dataIssueRule` (in `mock-analyzer.ts`) were added specifically to give them real, verified classification logic rather than falling back to "insufficient evidence."

## The original 6 (detailed write-ups below)

| # | Scenario | Fictional Company | Expected Classification | Difficulty |
|---|---|---|---|---|
| 1 | 🛒 E-Commerce — Payment Failure | ShopSphere | Application Defect | 🟢 Easy |
| 2 | 🔐 Banking — Login Authentication Failure | SecureBank Online | Application Defect (genuinely ambiguous — see below) | 🟡 Medium |
| 3 | 📦 Warehouse — Inventory API Timeout | SmartWarehouse | Environment Issue | 🟡 Medium |
| 4 | 🚕 Ride Booking — Business Logic Failure | QuickRide | Application Defect (business logic) | 🟡 Medium |
| 5 | 🏥 Healthcare — Database Connection Failure | MediCare Portal | Environment Issue | 🟢 Easy |
| 6 | 🧪 Playwright — Automation Failure | ShopSphere | **Test Automation Issue** | 🔴 Important |

**Scenario 6 is the most important one.** The API response explicitly confirms the order succeeded (`orderStatus: "CONFIRMED"`, `paymentStatus: "SUCCESS"`), but the UI automation timed out looking for the confirmation banner. A naive engine would see "test failed" and blame the application; AI QA Detective's mock rule engine specifically checks for this "backend succeeded, UI locator failed" combination and correctly attributes it to the automation, not the app — this is the clearest demonstration that the tool reasons about the *relationship* between pieces of evidence, not just their presence.

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

## The 19 additional scenarios (Performance, Mobile, Database, and category-gap coverage)

Full evidence for each lives in `server/src/data/sampleFailures.ts`; this table is a reference index rather than a repeat of every log line.

### Performance & Database testing

| Scenario key | Test | Company | Signature | Verdict |
|---|---|---|---|---|
| `performanceLoadTest` | Verify checkout API meets performance SLA under peak load | ShopSphere | k6 load test — p95 latency 8500ms vs. 2000ms SLA, 12% requests timed out | Environment Issue · High · P2 · 80% |
| `databaseQueryPerformanceDegradation` | Verify inventory search returns within SLA | SmartWarehouse | Full table scan + N+1 query pattern, request timed out after 20s | Environment Issue · High · P2 · 80% |
| `dbConnectionStringWrongEnv` | Verify staging environment uses staging database | MediCare Portal | `DATABASE_URL` misconfigured to point at production, not staging | Configuration Issue · Medium · P3 · 78% |
| `duplicateCustomerRecord` | Verify new customer registration succeeds | ShopSphere | Leftover test record triggers a unique-constraint violation | Data Issue · Medium · P3 · 76% |
| `orphanedOrderReference` | Verify order history displays product details | ShopSphere | Order references a deleted product ID (referential integrity) | Data Issue · Medium · P3 · 76% |
| `dbMigrationDataLoss` | Verify database migration completes without data loss | MediCare Portal | Post-migration row count is 204 records lower than pre-migration | Data Issue · Medium · P3 · 76% |

### Mobile testing

| Scenario key | Test | Company | Signature | Verdict |
|---|---|---|---|---|
| `mobileLocatorBroken` | Verify user can add item to cart on mobile app | ShopSphere Mobile (Android/Appium) | `NoSuchElementException` after a UI redesign moved the Add to Cart button | Test Automation Issue · Medium · P3 · 82% |
| `wrongApiEndpointMobile` | Verify mobile app connects to QA backend | ShopSphere Mobile (iOS/XCUITest) | `API_BASE_URL` env var misconfigured, app hit production instead of QA | Configuration Issue · Medium · P3 · 78% |

### Test Automation Issue (locator/selector breakage)

| Scenario key | Test | Company | Signature |
|---|---|---|---|
| `brokenCssSelector` | Verify promo code banner displays on cart page | ShopSphere | CSS class renamed in a frontend release; old selector no longer matches |
| `brittleXpathBroken` | Verify transaction history loads | SecureBank Online | Absolute XPath broke after a dashboard layout change |

### Flaky Test (timing/race conditions)

| Scenario key | Test | Company | Signature |
|---|---|---|---|
| `staleElementRace` | Verify quantity selector updates cart total | ShopSphere | `StaleElementReferenceException` — DOM re-rendered mid-interaction |
| `intermittentAnimationTiming` | Verify ride status updates in real time | QuickRide | Assertion ran mid-CSS-transition, element momentarily not visible |
| `ciNetworkFlake` | Verify dashboard widgets load | SmartWarehouse | Timed out waiting for a widget on one CI run; passed on immediate retry |
| `raceConditionAssertion` | Verify cart badge count updates immediately | ShopSphere | Assertion ran before the UI finished re-rendering the badge |

### Configuration Issue (setting is wrong, not the code)

| Scenario key | Test | Company | Signature |
|---|---|---|---|
| `featureFlagMisconfig` | Verify new checkout flow is enabled in QA | ShopSphere | `new-checkout-flow` feature flag left disabled in QA config |
| `paymentGatewaySandboxMisconfig` | Verify payment gateway uses sandbox credentials in QA | SecureBank Online | Live-mode credentials configured instead of sandbox mode |
| `timeoutConfigTooShort` | Verify API client timeout is configured correctly | SmartWarehouse | `HTTP_CLIENT_TIMEOUT_MS` set to 500 instead of 5000, causing spurious timeouts suite-wide |

### Data Issue (data state is wrong, not the app)

| Scenario key | Test | Company | Signature |
|---|---|---|---|
| `missingTestDataUserDeleted` | Verify user can log in with existing test account | SecureBank Online | Nightly cleanup job deleted the test account before the run |
| `staleSeedDataMismatch` | Verify fare estimate matches confirmed fare | QuickRide | QA pricing seed data not refreshed after a production pricing update |

---

## Extending this further

To add another scenario:

1. Add an entry to `sampleScenarios` in `server/src/data/sampleFailures.ts` — it will automatically appear in the "Load Sample ▾" dropdown, no frontend changes needed.
2. Check it against the rules in `server/src/ai/mock-analyzer.ts` (`RULES` array, checked in order, first match wins). If it's a genuinely new failure signature, add a new rule rather than stretching an existing one.
3. Add a regression test to `server/tests/mock-analyzer.test.ts` asserting the expected classification.
4. Document it here, following the format above.

See also **[flow.md](../flow.md)** (§4.2) for the full rule decision-tree diagram, and **[docs/shopsphere/](../docs/shopsphere/)** for the ShopSphere-specific scenarios and seeded failure history.
