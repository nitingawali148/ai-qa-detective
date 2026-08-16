import type { AnalyzeFailureRequest, FailureAnalysis } from "../schemas/index.js";
import type { StoredFailure } from "../store/historyStore.js";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

/**
 * The featured, one-click "Demo Mode" scenario (Section 18 of the spec):
 * a realistic ShopSphere checkout/payment failure with a full log trail.
 */
export const demoScenario: AnalyzeFailureRequest = {
  testInfo: {
    testName: "Verify successful checkout using credit card",
    testId: "TC-CHECKOUT-014",
    application: "ShopSphere E-Commerce",
    environment: "QA",
    browser: "Chrome",
    buildVersion: "2026.08.16.142",
    executionTime: new Date().toISOString(),
  },
  testDetails: {
    description: "Validates that a customer can complete checkout for a cart using a credit card payment method.",
    steps:
      "1. Add product to cart\n2. Proceed to checkout\n3. Select CREDIT_CARD as payment method\n4. Submit payment\n5. Verify order confirmation is displayed",
    expectedResult: "Payment should complete successfully and order confirmation should be displayed.",
    actualResult: "Checkout failed with HTTP 500.",
  },
  evidence: {
    logs: `[INFO] Starting checkout test
[INFO] Product added to cart
[INFO] Cart total calculated: 1499.00
[INFO] Applying payment method: CREDIT_CARD
[INFO] POST /api/payment
[ERROR] Response status: 500
[ERROR] PaymentService exception
[ERROR] java.lang.NullPointerException
[ERROR] PaymentService.java:142
[ERROR] transactionId is null
[ERROR] Checkout failed`,
    stackTrace: `java.lang.NullPointerException: Cannot invoke "String.length()" because "transactionId" is null
    at com.shopsphere.payment.PaymentService.confirmTransaction(PaymentService.java:142)
    at com.shopsphere.payment.PaymentController.processPayment(PaymentController.java:58)`,
    apiResponse: `POST /api/payment
Status: 500 Internal Server Error
Body: { "error": "Internal Server Error", "path": "/api/payment" }`,
    consoleLogs: `Uncaught (in promise) Error: Request failed with status code 500
  at handleCheckoutSubmit (checkout.tsx:88)`,
  },
};

/** Additional realistic sample scenarios covering the failure taxonomy (Section 26). */
export const sampleScenarios: Record<string, AnalyzeFailureRequest> = {
  payment: demoScenario,
  login: {
    testInfo: {
      testName: "Verify user can log in with valid credentials",
      testId: "TC-AUTH-002",
      application: "ShopSphere Auth",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.16.142",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates successful login with a valid, existing account.",
      steps: "1. Navigate to login page\n2. Enter valid credentials\n3. Submit login form",
      expectedResult: "User is redirected to the dashboard after successful login.",
      actualResult: "Login request failed; user remained on the login page with a generic error.",
    },
    evidence: {
      logs: `[INFO] Navigating to /login
[INFO] Submitting credentials for user: qa.tester@shopsphere.com
[INFO] POST https://auth.shopsphere.internal/api/token
[ERROR] connect ECONNREFUSED auth.shopsphere.internal:443
[ERROR] Authentication service unavailable
[ERROR] Login failed after 3 retries`,
      stackTrace: "",
      apiResponse: `POST /api/token
Status: 503 Service Unavailable`,
      consoleLogs: `[ERROR] Network request to authentication service timed out`,
    },
  },
  productSearch: {
    testInfo: {
      testName: "Verify product search returns results",
      testId: "TC-SEARCH-011",
      application: "ShopSphere Catalog",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.15.098",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that searching for a known product returns results within an acceptable time.",
      steps: "1. Navigate to search page\n2. Enter query 'wireless headphones'\n3. Submit search",
      expectedResult: "Search results are displayed within 3 seconds.",
      actualResult: "Search request timed out after 15 seconds with no results shown.",
    },
    evidence: {
      logs: `[INFO] Submitting search query: wireless headphones
[INFO] GET /api/search?q=wireless+headphones
[ERROR] Request timed out after 15000ms
[ERROR] Search API did not respond`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: `[ERROR] TimeoutError: Navigation timeout of 15000 ms exceeded while waiting for /api/search`,
    },
  },
  cart: {
    testInfo: {
      testName: "Verify cart total reflects applied discount",
      testId: "TC-CART-027",
      application: "ShopSphere Cart",
      environment: "QA",
      browser: "Firefox",
      buildVersion: "2026.08.14.071",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that a 10% discount code correctly reduces the cart total.",
      steps: "1. Add item priced at 100.00 to cart\n2. Apply discount code SAVE10\n3. View cart total",
      expectedResult: "Cart total: 90.00",
      actualResult: "Cart total: 99.00",
    },
    evidence: {
      logs: `[INFO] Item added: SKU-4471, price=100.00
[INFO] Applying discount code: SAVE10
[INFO] Cart total calculated: 99.00`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "",
    },
  },
  flaky: {
    testInfo: {
      testName: "Verify order confirmation banner appears",
      testId: "TC-CHECKOUT-019",
      application: "ShopSphere E-Commerce",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.16.142",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates the order confirmation banner renders after a successful order.",
      steps: "1. Complete checkout with valid data\n2. Wait for confirmation banner",
      expectedResult: "Confirmation banner is visible within 5 seconds.",
      actualResult: "Test timed out waiting for element '.order-confirmation-banner' to become visible.",
    },
    evidence: {
      logs: `[INFO] Order submitted successfully (order id: ORD-88213)
[INFO] Waiting for element: .order-confirmation-banner
[ERROR] Timed out waiting for element '.order-confirmation-banner' after 5000ms`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "",
    },
  },
  automation: {
    testInfo: {
      testName: "Verify user can update shipping address",
      testId: "TC-ACCOUNT-008",
      application: "ShopSphere Account",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.13.055",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates a user can edit and save a new shipping address.",
      steps: "1. Navigate to Account > Addresses\n2. Click 'Edit' on the primary address\n3. Update the street field\n4. Save",
      expectedResult: "Updated address is saved and displayed.",
      actualResult: "Test failed before completing the steps.",
    },
    evidence: {
      logs: `[INFO] Navigating to /account/addresses
[ERROR] NoSuchElementException: Unable to locate element: [data-testid='edit-address-btn']`,
      stackTrace: `org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {"method":"css selector","selector":"[data-testid='edit-address-btn']"}`,
      apiResponse: "",
      consoleLogs: "",
    },
  },

  // ── Cross-industry scenarios (test-data/README.md) ──────────────────────
  // Six additional scenarios spanning different fictional companies/domains,
  // chosen to exercise failure signatures the ShopSphere-only set above
  // doesn't cover — most notably #6, which pairs a successful API response
  // with a UI automation timeout to test whether the AI correctly blames the
  // test rather than the application.

  ecommercePaymentAdvanced: {
    testInfo: {
      testName: "Verify checkout using credit card",
      testId: "TC-CHECKOUT-014",
      application: "ShopSphere E-Commerce",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.16.142",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description:
        "Verify that a customer can successfully complete checkout using a valid credit card and receive an order confirmation after successful payment.",
      steps:
        "1. Login to ShopSphere with a valid customer account.\n2. Search for a product.\n3. Add the product to the shopping cart.\n4. Navigate to checkout.\n5. Enter valid shipping information.\n6. Select Credit Card as the payment method.\n7. Enter valid credit card details.\n8. Click the \"Place Order\" button.\n9. Verify that payment is processed successfully.\n10. Verify that the order confirmation is displayed.",
      expectedResult: "Payment should be processed successfully and the customer should see an order confirmation with a valid order ID.",
      actualResult: "Payment API returned HTTP 500 and the checkout process failed. The payment response contained a null transactionId.",
    },
    evidence: {
      logs: `[INFO] Starting checkout test
[INFO] Product added to cart: SKU-IPHONE-15
[INFO] Cart total: 79999.00
[INFO] Payment method: CREDIT_CARD
[INFO] Sending payment request
[INFO] POST /api/v1/payments
[ERROR] Payment API returned status: 500
[ERROR] Payment processing failed
[INFO] Order status: PAYMENT_FAILED
[ERROR] Checkout test failed`,
      stackTrace: `java.lang.NullPointerException: Cannot invoke "String.trim()" because "transactionId" is null
    at com.shopsphere.payment.PaymentService.processPayment(PaymentService.java:142)
    at com.shopsphere.checkout.CheckoutService.completeOrder(CheckoutService.java:287)
    at com.shopsphere.api.PaymentController.process(PaymentController.java:96)
    at java.base/java.lang.reflect.Method.invoke(Method.java:568)

Caused by: Payment response did not contain transactionId`,
      apiResponse: `{
  "status": 500,
  "error": "Internal Server Error",
  "message": "Payment processing failed",
  "paymentStatus": "FAILED",
  "transactionId": null,
  "timestamp": "2026-08-16T08:32:41Z"
}`,
      consoleLogs: "",
    },
  },

  bankingLoginFailure: {
    testInfo: {
      testName: "Verify login with valid credentials",
      testId: "TC-AUTH-007",
      application: "SecureBank Online",
      environment: "Staging",
      browser: "Chrome",
      buildVersion: "2026.08.16.205",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Verify that a registered banking customer can log in successfully using valid credentials and access the account dashboard.",
      steps:
        "1. Open the SecureBank login page.\n2. Enter a registered username.\n3. Enter the correct password.\n4. Click the Login button.\n5. Wait for authentication to complete.\n6. Verify that the customer is redirected to the account dashboard.\n7. Verify that the customer's account information is displayed.",
      expectedResult: "The user should be authenticated successfully and redirected to the account dashboard.",
      actualResult: "The login request returned HTTP 401 Unauthorized even though valid test credentials were used.",
    },
    evidence: {
      logs: `[INFO] Starting login test
[INFO] Username: testuser01
[INFO] Sending authentication request
[INFO] POST /api/v2/auth/login
[INFO] Response received: 401
[WARN] Authentication failed
[ERROR] Expected HTTP 200 but received HTTP 401
[ERROR] Login test failed`,
      stackTrace: `org.opentest4j.AssertionFailedError:
Expected: 200
Actual: 401

    at com.bank.tests.LoginTest.verifySuccessfulLogin(LoginTest.java:87)
    at com.bank.tests.LoginTest.testValidCredentials(LoginTest.java:52)

Assertion failed: Valid user credentials were rejected`,
      apiResponse: `{
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid authentication token",
  "code": "AUTH_TOKEN_INVALID",
  "timestamp": "2026-08-16T09:15:22Z"
}`,
      consoleLogs: "",
    },
  },

  warehouseInventoryTimeout: {
    testInfo: {
      testName: "Verify product inventory availability",
      testId: "TC-INVENTORY-021",
      application: "SmartWarehouse",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.16.118",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Verify that the product inventory service returns the current stock quantity when a valid product ID is requested.",
      steps:
        "1. Login to the SmartWarehouse application.\n2. Navigate to the Inventory section.\n3. Search for product SKU-98421.\n4. Request the current inventory information.\n5. Wait for the inventory API response.\n6. Verify that the available quantity is displayed.",
      expectedResult: "The inventory service should return the current stock quantity within the configured response timeout.",
      actualResult: "The inventory API did not respond within 3000 milliseconds. The request timed out after two retry attempts and returned HTTP 504.",
    },
    evidence: {
      logs: `[INFO] Starting inventory validation
[INFO] Product ID: SKU-98421
[INFO] GET /api/v1/inventory/SKU-98421
[INFO] Request timeout configured: 3000ms
[WARN] Inventory API did not respond within timeout
[WARN] Retrying request 1/2
[WARN] Inventory API did not respond within timeout
[ERROR] Request failed after 2 retries
[ERROR] Inventory validation failed`,
      stackTrace: `java.net.SocketTimeoutException: Read timed out

    at java.net.http/jdk.internal.net.http.HttpClientImpl.send(HttpClientImpl.java:578)
    at java.net.http/jdk.internal.net.http.HttpClientFacade.send(HttpClientFacade.java:123)
    at com.warehouse.inventory.InventoryClient.getInventory(InventoryClient.java:74)
    at com.warehouse.tests.InventoryTest.verifyStock(InventoryTest.java:119)

Caused by:
java.net.SocketTimeoutException: Read timed out after 3000ms`,
      apiResponse: `{
  "status": 504,
  "error": "Gateway Timeout",
  "message": "Inventory service did not respond within the configured timeout",
  "service": "inventory-service",
  "requestId": "REQ-883421",
  "timestamp": "2026-08-16T09:42:17Z"
}`,
      consoleLogs: "",
    },
  },

  rideBookingLogicFailure: {
    testInfo: {
      testName: "Verify ride booking confirmation",
      testId: "TC-RIDE-032",
      application: "QuickRide",
      environment: "Staging",
      browser: "Chrome",
      buildVersion: "2026.08.16.087",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Verify that a customer can book a ride and that the ride is confirmed after a successful booking request.",
      steps:
        "1. Login to QuickRide.\n2. Enter Pune Station as the pickup location.\n3. Enter Hinjewadi Phase 1 as the destination.\n4. Select the standard ride option.\n5. Click \"Book Ride\".\n6. Wait for the booking API response.\n7. Verify that the ride status is CONFIRMED.\n8. Verify that a driver is assigned.",
      expectedResult: "CONFIRMED",
      actualResult: "PENDING",
    },
    evidence: {
      logs: `[INFO] Starting ride booking test
[INFO] Pickup: Pune Station
[INFO] Destination: Hinjewadi Phase 1
[INFO] POST /api/v1/rides
[INFO] Response status: 201
[INFO] Ride created successfully
[INFO] Validating ride status
[ERROR] Expected ride status: CONFIRMED
[ERROR] Actual ride status: PENDING
[ERROR] Ride booking test failed`,
      stackTrace: `org.opentest4j.AssertionFailedError:
Ride status mismatch

Expected:
CONFIRMED

Actual:
PENDING

    at com.ride.tests.BookingTest.verifyRideConfirmation(BookingTest.java:143)
    at com.ride.tests.BookingTest.createRide(BookingTest.java:98)`,
      apiResponse: `{
  "status": 201,
  "rideId": "RIDE-72891",
  "rideStatus": "PENDING",
  "driverAssigned": false,
  "estimatedArrival": null,
  "message": "Ride created successfully",
  "timestamp": "2026-08-16T10:04:32Z"
}`,
      consoleLogs: "",
    },
  },

  healthcareDatabaseFailure: {
    testInfo: {
      testName: "Verify patient registration",
      testId: "TC-PATIENT-011",
      application: "MediCare Portal",
      environment: "QA",
      browser: "Edge",
      buildVersion: "2026.08.16.056",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description:
        "Verify that a new patient can be registered successfully and that the patient information is stored in the healthcare database.",
      steps:
        "1. Login to the MediCare Portal.\n2. Navigate to Patient Registration.\n3. Enter the patient's personal information.\n4. Enter contact information.\n5. Enter required medical information.\n6. Click \"Register Patient\".\n7. Verify that the patient record is created.\n8. Search for the newly created patient.\n9. Verify that the patient information is displayed correctly.",
      expectedResult: "The patient should be registered successfully and the patient record should be stored in the database.",
      actualResult: "Patient registration failed with HTTP 503. The Patient Service could not establish a connection to the PostgreSQL database.",
    },
    evidence: {
      logs: `[INFO] Starting patient registration test
[INFO] POST /api/v1/patients
[INFO] Validating patient information
[INFO] Saving patient record
[ERROR] Database connection failed
[ERROR] Patient registration failed
[ERROR] HTTP 503 returned by Patient Service`,
      stackTrace: `org.springframework.jdbc.CannotGetJdbcConnectionException:
Failed to obtain JDBC Connection

    at org.springframework.jdbc.datasource.DataSourceUtils.getConnection(DataSourceUtils.java:84)
    at com.healthcare.patient.PatientRepository.save(PatientRepository.java:61)
    at com.healthcare.patient.PatientService.register(PatientService.java:104)

Caused by:
java.sql.SQLException: Connection refused

Caused by:
java.net.ConnectException: Connection refused: database-host:5432`,
      apiResponse: `{
  "status": 503,
  "error": "Service Unavailable",
  "message": "Patient service is temporarily unavailable",
  "service": "patient-service",
  "dependency": "postgresql",
  "requestId": "REQ-991823",
  "timestamp": "2026-08-16T10:21:44Z"
}`,
      consoleLogs: "",
    },
  },

  playwrightAutomationFailure: {
    testInfo: {
      testName: "Verify order confirmation banner",
      testId: "TC-CHECKOUT-019",
      application: "ShopSphere E-Commerce",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.16.142",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Verify that the order confirmation banner is displayed after a customer successfully completes checkout and payment.",
      steps:
        "1. Login to ShopSphere.\n2. Add a product to the cart.\n3. Navigate to checkout.\n4. Enter valid shipping information.\n5. Select a valid payment method.\n6. Submit the order.\n7. Wait for the order confirmation page.\n8. Verify that the order confirmation banner is displayed.\n9. Verify that the order ID is displayed.",
      expectedResult: "After successful order submission, the order confirmation banner should be displayed with the generated order ID.",
      actualResult:
        "The order was successfully created and the payment was successful according to the API response, but the automation test could not find the order confirmation banner within 5000 milliseconds.",
    },
    evidence: {
      logs: `[INFO] Starting checkout confirmation test
[INFO] Order submitted successfully
[INFO] Waiting for confirmation banner
[INFO] Locator: .order-confirmation-banner
[ERROR] Element not found
[ERROR] Timeout after 5000ms
[ERROR] Test execution failed`,
      stackTrace: `playwright._impl._errors.TimeoutError:
Timeout 5000ms exceeded.

waiting for locator(".order-confirmation-banner")

Call log:
- waiting for locator(".order-confirmation-banner")
- locator resolved to 0 elements
- waiting 5000ms
- timeout exceeded

    at CheckoutPage.verifyConfirmation(CheckoutPage.ts:87)
    at checkout.spec.ts:142`,
      apiResponse: `{
  "status": 201,
  "orderId": "ORD-88213",
  "orderStatus": "CONFIRMED",
  "paymentStatus": "SUCCESS",
  "message": "Order submitted successfully"
}`,
      consoleLogs: "",
    },
  },
};

function analysisFor(
  summary: string,
  rootCause: string,
  category: FailureAnalysis["root_cause_category"],
  severity: FailureAnalysis["severity"],
  priority: FailureAnalysis["priority"],
  confidence: number,
  flags: Partial<Pick<FailureAnalysis, "is_flaky" | "environment_issue" | "application_defect">> = {}
): FailureAnalysis {
  return {
    failure_summary: summary,
    root_cause: rootCause,
    root_cause_category: category,
    severity,
    priority,
    confidence,
    confidence_rationale: "Historical record seeded for demo purposes based on the original investigation notes.",
    is_flaky: flags.is_flaky ?? false,
    environment_issue: flags.environment_issue ?? false,
    application_defect: flags.application_defect ?? false,
    evidence: [],
    why_ai_thinks_this: ["Historical record — see original investigation for full evidence trail."],
    recommended_actions: [],
    developer_hint: "",
    test_recommendation: "",
    business_impact: "",
    insufficient_evidence: false,
  };
}

/**
 * Seed history so the Dashboard, Failure History, Release Risk, and Similar
 * Failure Detection features all have realistic data immediately on startup.
 * Distribution roughly mirrors the illustrative dashboard in the product spec
 * (a mix of Application Defect / Environment / Automation / Flaky / Configuration
 * failures, with a repeated payment defect for the Similar Failure demo).
 */
export const seedHistory: StoredFailure[] = [
  {
    id: "PAY-142",
    createdAt: daysAgo(2),
    testInfo: { testName: "Verify successful checkout using credit card", testId: "TC-CHECKOUT-014", application: "ShopSphere E-Commerce", environment: "QA", browser: "Chrome", buildVersion: "2026.08.14.130", executionTime: daysAgo(2) },
    testDetails: { description: "", steps: "", expectedResult: "Payment completes successfully.", actualResult: "Checkout failed with HTTP 500." },
    analysis: analysisFor(
      "Payment service transaction ID failure",
      "PaymentService threw a NullPointerException because transactionId was null in the payment response.",
      "Application Defect",
      "Critical",
      "P1",
      93,
      { application_defect: true }
    ),
    status: "Investigating",
  },
  {
    id: "PAY-098",
    createdAt: daysAgo(9),
    testInfo: { testName: "Verify checkout with saved card", testId: "TC-CHECKOUT-009", application: "ShopSphere E-Commerce", environment: "QA", browser: "Chrome", buildVersion: "2026.08.07.061", executionTime: daysAgo(9) },
    testDetails: { description: "", steps: "", expectedResult: "Payment completes successfully.", actualResult: "Checkout failed with HTTP 500." },
    analysis: analysisFor(
      "Payment service transaction ID failure (recurrence)",
      "PaymentService threw a NullPointerException because transactionId was null in the payment response.",
      "Application Defect",
      "Critical",
      "P1",
      91,
      { application_defect: true }
    ),
    status: "Open",
  },
  {
    id: "PAY-051",
    createdAt: daysAgo(21),
    testInfo: { testName: "Verify checkout using credit card", testId: "TC-CHECKOUT-014", application: "ShopSphere E-Commerce", environment: "QA", browser: "Firefox", buildVersion: "2026.07.26.020", executionTime: daysAgo(21) },
    testDetails: { description: "", steps: "", expectedResult: "Payment completes successfully.", actualResult: "Checkout failed with HTTP 500." },
    analysis: analysisFor(
      "Payment service transaction ID failure (first occurrence)",
      "PaymentService threw a NullPointerException because transactionId was null in the payment response.",
      "Application Defect",
      "Critical",
      "P1",
      89,
      { application_defect: true }
    ),
    status: "Resolved",
  },
  {
    id: "CART-027",
    createdAt: daysAgo(1),
    testInfo: { testName: "Verify cart total reflects applied discount", testId: "TC-CART-027", application: "ShopSphere Cart", environment: "QA", browser: "Firefox", buildVersion: "2026.08.14.071", executionTime: daysAgo(1) },
    testDetails: { description: "", steps: "", expectedResult: "Cart total: 90.00", actualResult: "Cart total: 99.00" },
    analysis: analysisFor("Incorrect discount calculation", "Discount code SAVE10 was not fully applied to the cart total.", "Application Defect", "High", "P2", 72, { application_defect: true }),
    status: "Open",
  },
  {
    id: "SRCH-011",
    createdAt: daysAgo(3),
    testInfo: { testName: "Verify product search returns results", testId: "TC-SEARCH-011", application: "ShopSphere Catalog", environment: "QA", browser: "Chrome", buildVersion: "2026.08.15.098", executionTime: daysAgo(3) },
    testDetails: { description: "", steps: "", expectedResult: "Search results within 3s.", actualResult: "Search timed out after 15s." },
    analysis: analysisFor("Search API timeout", "The search API exceeded its timeout threshold under load.", "Environment Issue", "High", "P2", 80, { environment_issue: true }),
    status: "Investigating",
  },
  {
    id: "AUTH-002",
    createdAt: daysAgo(4),
    testInfo: { testName: "Verify user can log in with valid credentials", testId: "TC-AUTH-002", application: "ShopSphere Auth", environment: "QA", browser: "Chrome", buildVersion: "2026.08.16.142", executionTime: daysAgo(4) },
    testDetails: { description: "", steps: "", expectedResult: "User logs in successfully.", actualResult: "Login failed; auth service unreachable." },
    analysis: analysisFor("Authentication service unavailable", "The authentication service was unreachable (connection refused).", "Environment Issue", "High", "P2", 88, { environment_issue: true }),
    status: "Resolved",
  },
  {
    id: "INFRA-014",
    createdAt: daysAgo(6),
    testInfo: { testName: "Verify order history loads", testId: "TC-ORDERS-004", application: "ShopSphere Account", environment: "Staging", browser: "Chrome", buildVersion: "2026.08.10.040", executionTime: daysAgo(6) },
    testDetails: { description: "", steps: "", expectedResult: "Order history loads within 3s.", actualResult: "Database connection error." },
    analysis: analysisFor("Database unavailable in staging", "The orders database was unreachable during the test run.", "Environment Issue", "Medium", "P3", 84, { environment_issue: true }),
    status: "Resolved",
  },
  {
    id: "DEPLOY-005",
    createdAt: daysAgo(12),
    testInfo: { testName: "Verify new pricing page loads", testId: "TC-PRICING-002", application: "ShopSphere Marketing", environment: "QA", browser: "Chrome", buildVersion: "2026.08.04.010", executionTime: daysAgo(12) },
    testDetails: { description: "", steps: "", expectedResult: "Pricing page renders new layout.", actualResult: "Pricing page returned 404." },
    analysis: analysisFor("Deployment issue — new build not promoted", "The QA environment was serving a stale build missing the pricing route.", "Environment Issue", "Medium", "P3", 79, { environment_issue: true }),
    status: "Resolved",
  },
  {
    id: "ACC-008",
    createdAt: daysAgo(5),
    testInfo: { testName: "Verify user can update shipping address", testId: "TC-ACCOUNT-008", application: "ShopSphere Account", environment: "QA", browser: "Chrome", buildVersion: "2026.08.13.055", executionTime: daysAgo(5) },
    testDetails: { description: "", steps: "", expectedResult: "Address updates and saves.", actualResult: "Locator not found for edit button." },
    analysis: analysisFor("Locator not found for edit-address button", "The automation's selector for the edit-address button no longer matches the current UI.", "Test Automation Issue", "Medium", "P3", 82),
    status: "Open",
  },
  {
    id: "CONF-019",
    createdAt: daysAgo(8),
    testInfo: { testName: "Verify feature flag gated checkout flow", testId: "TC-CHECKOUT-031", application: "ShopSphere E-Commerce", environment: "QA", browser: "Chrome", buildVersion: "2026.08.08.033", executionTime: daysAgo(8) },
    testDetails: { description: "", steps: "", expectedResult: "New checkout flow is shown.", actualResult: "Legacy checkout flow was shown instead." },
    analysis: analysisFor("Missing feature flag configuration", "The 'new-checkout-flow' feature flag was not enabled in the QA environment configuration.", "Configuration Issue", "Medium", "P3", 76),
    status: "Resolved",
  },
  {
    id: "FLK-019",
    createdAt: daysAgo(1),
    testInfo: { testName: "Verify order confirmation banner appears", testId: "TC-CHECKOUT-019", application: "ShopSphere E-Commerce", environment: "QA", browser: "Chrome", buildVersion: "2026.08.16.142", executionTime: daysAgo(1) },
    testDetails: { description: "", steps: "", expectedResult: "Confirmation banner visible within 5s.", actualResult: "Timed out waiting for confirmation banner." },
    analysis: analysisFor("Intermittent wait-timeout on confirmation banner", "The test timed out waiting for a UI element, consistent with a race condition rather than an application defect.", "Flaky Test", "Medium", "P3", 70, { is_flaky: true }),
    status: "Investigating",
  },
  {
    id: "FLK-033",
    createdAt: daysAgo(15),
    testInfo: { testName: "Verify cart badge updates", testId: "TC-CART-033", application: "ShopSphere Cart", environment: "QA", browser: "Chrome", buildVersion: "2026.07.30.015", executionTime: daysAgo(15) },
    testDetails: { description: "", steps: "", expectedResult: "Cart badge count updates immediately.", actualResult: "Assertion failed intermittently; badge updated after a delay." },
    analysis: analysisFor("Timing-dependent cart badge assertion", "The test asserted the badge count before the UI finished re-rendering, a timing-dependent (flaky) failure.", "Flaky Test", "Low", "P4", 68, { is_flaky: true }),
    status: "Resolved",
  },
  {
    id: "FLK-041",
    createdAt: daysAgo(18),
    testInfo: { testName: "Verify search suggestions dropdown", testId: "TC-SEARCH-018", application: "ShopSphere Catalog", environment: "QA", browser: "Chrome", buildVersion: "2026.07.28.008", executionTime: daysAgo(18) },
    testDetails: { description: "", steps: "", expectedResult: "Suggestions appear as user types.", actualResult: "Suggestions dropdown intermittently did not appear." },
    analysis: analysisFor("Race condition in search suggestions rendering", "Suggestions dropdown render timing raced with the debounce timer, causing an intermittent failure.", "Flaky Test", "Low", "P4", 65, { is_flaky: true }),
    status: "Investigating",
  },
];

/** Total number of tests executed in the represented suite runs (passed + failed), for dashboard metrics. */
export const TOTAL_TESTS_ANALYZED = 150;
