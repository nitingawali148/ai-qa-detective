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

  // ── Additional coverage: Performance, Mobile, and Database testing, plus ──
  // enough scenarios that every failure category has at least 5 examples.

  performanceLoadTest: {
    testInfo: {
      testName: "Verify checkout API meets performance SLA under peak load",
      testId: "TC-PERF-041",
      application: "ShopSphere E-Commerce",
      environment: "Performance",
      browser: "N/A (API load test)",
      buildVersion: "2026.08.16.142",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Load test validating the checkout API responds within SLA under 500 concurrent virtual users using k6.",
      steps: "1. Ramp up to 500 virtual users over 2 minutes\n2. Sustain load for 5 minutes\n3. Submit checkout requests continuously\n4. Measure p95 response time",
      expectedResult: "p95 response time under 2000ms per the performance SLA.",
      actualResult: "p95 response time reached 8500ms and 12% of requests timed out.",
    },
    evidence: {
      logs: `[INFO] k6 load test started: 500 virtual users
[INFO] Ramping up virtual users
[INFO] POST /api/checkout (sustained load)
[WARN] p95 response time: 8500ms (SLA: 2000ms)
[ERROR] 12% of requests timed out
[ERROR] Performance SLA breached`,
      stackTrace: "",
      apiResponse: `{ "test": "checkout-load-test", "p95_ms": 8500, "sla_ms": 2000, "error_rate": 0.12, "timeout_count": 60 }`,
      consoleLogs: "",
    },
  },

  databaseQueryPerformanceDegradation: {
    testInfo: {
      testName: "Verify inventory search returns within SLA",
      testId: "TC-PERF-018",
      application: "SmartWarehouse",
      environment: "QA",
      browser: "N/A (API load test)",
      buildVersion: "2026.08.15.099",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates the inventory search endpoint returns results within the performance SLA when the catalog contains over 1,000,000 SKUs.",
      steps: "1. Seed catalog with 1,000,000+ SKUs\n2. Submit inventory search request\n3. Measure response time",
      expectedResult: "Search results returned within 3000ms.",
      actualResult: "Search request timed out after 20000ms due to an unoptimized database query.",
    },
    evidence: {
      logs: `[INFO] GET /api/inventory/search?q=widget
[INFO] Query plan: full table scan detected
[WARN] Query execution exceeded 15000ms
[ERROR] Request timed out after 20000ms
[ERROR] N+1 query pattern detected in ORM logs`,
      stackTrace: "",
      apiResponse: `{ "status": 504, "error": "Gateway Timeout", "message": "Search query exceeded execution time limit", "queryPlan": "full_table_scan" }`,
      consoleLogs: "",
    },
  },

  mobileLocatorBroken: {
    testInfo: {
      testName: "Verify user can add item to cart on mobile app",
      testId: "TC-MOBILE-007",
      application: "ShopSphere Mobile",
      environment: "QA",
      browser: "Android 14 / Pixel 8 (Appium)",
      buildVersion: "2026.08.16.142",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates a user can add a product to the cart from the ShopSphere Android app's product detail screen.",
      steps: "1. Launch ShopSphere Android app\n2. Navigate to product detail screen\n3. Tap 'Add to Cart' button\n4. Verify item appears in cart",
      expectedResult: "Product is added to the cart and the cart badge count increments.",
      actualResult: "Test failed before completing the steps; the 'Add to Cart' button could not be found.",
    },
    evidence: {
      logs: `[INFO] Launching app on Android 14 (Pixel 8 emulator)
[INFO] Navigating to product detail screen
[ERROR] NoSuchElementException: Unable to locate element with accessibility id: 'add_to_cart_button'`,
      stackTrace: `io.appium.java_client.NoSuchElementException: An element could not be located on the page using the given search parameters: accessibility id 'add_to_cart_button'
    at io.appium.java_client.AppiumDriver.findElement(AppiumDriver.java:212)
    at com.shopsphere.mobile.tests.CartTest.addToCart(CartTest.java:64)`,
      apiResponse: "",
      consoleLogs: "",
    },
  },

  brokenCssSelector: {
    testInfo: {
      testName: "Verify promo code banner displays on cart page",
      testId: "TC-CART-041",
      application: "ShopSphere Cart",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.10.021",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates the promo code banner renders on the cart page after a recent frontend redesign.",
      steps: "1. Add item to cart\n2. Navigate to cart page\n3. Verify promo code banner is visible",
      expectedResult: "Promo code banner is visible on the cart page.",
      actualResult: "Test failed; the automation could not find the promo banner element.",
    },
    evidence: {
      logs: `[INFO] Navigating to /cart
[ERROR] NoSuchElementException: Unable to locate element: .promo-banner`,
      stackTrace: `org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {"method":"css selector","selector":".promo-banner"}
    at com.shopsphere.tests.CartPageTest.verifyPromoBanner(CartPageTest.java:52)
Note: the CSS class was renamed to '.promo-banner-v2' in the latest frontend release.`,
      apiResponse: "",
      consoleLogs: "",
    },
  },

  brittleXpathBroken: {
    testInfo: {
      testName: "Verify transaction history loads",
      testId: "TC-TXN-019",
      application: "SecureBank Online",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.09.014",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates the transaction history table loads on the account dashboard.",
      steps: "1. Login to SecureBank\n2. Navigate to Account Dashboard\n3. Verify transaction history table is visible",
      expectedResult: "Transaction history table is visible with recent transactions listed.",
      actualResult: "Test failed; the automation's XPath selector no longer matched any element after a dashboard layout change.",
    },
    evidence: {
      logs: `[INFO] Navigating to /dashboard
[ERROR] NoSuchElementException: unable to locate element using xpath: //div[3]/table[1]`,
      stackTrace: `org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {"method":"xpath","selector":"//div[3]/table[1]"}
    at com.bank.tests.DashboardTest.verifyTransactionHistory(DashboardTest.java:78)
Note: absolute XPath is brittle; the dashboard's DOM structure changed after adding a new notifications panel.`,
      apiResponse: "",
      consoleLogs: "",
    },
  },

  staleElementRace: {
    testInfo: {
      testName: "Verify quantity selector updates cart total",
      testId: "TC-CART-055",
      application: "ShopSphere E-Commerce",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.14.088",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that changing the quantity selector updates the cart total immediately.",
      steps: "1. Add item to cart\n2. Increase quantity from 1 to 2\n3. Verify cart total updates",
      expectedResult: "Cart total updates to reflect the new quantity.",
      actualResult: "Test failed intermittently with a stale element reference while interacting with the quantity selector.",
    },
    evidence: {
      logs: `[INFO] Interacting with quantity selector
[INFO] React re-rendered the cart component mid-interaction
[ERROR] StaleElementReferenceException: stale element reference: element is not attached to the page document`,
      stackTrace: `org.openqa.selenium.StaleElementReferenceException: stale element reference: element is not attached to the page document
    at com.shopsphere.tests.CartTest.updateQuantity(CartTest.java:91)
Note: this test passes on most runs; it fails intermittently when the component re-renders during the click.`,
      apiResponse: "",
      consoleLogs: "",
    },
  },

  intermittentAnimationTiming: {
    testInfo: {
      testName: "Verify ride status updates in real time",
      testId: "TC-RIDE-058",
      application: "QuickRide",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.11.033",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that the ride status badge updates from 'Searching' to 'Confirmed' without requiring a page refresh.",
      steps: "1. Book a ride\n2. Wait for driver assignment\n3. Verify status badge updates to 'Confirmed'",
      expectedResult: "Status badge updates to 'Confirmed' within 3 seconds.",
      actualResult: "Test failed intermittently; the status badge was not visible during the transition animation when the assertion ran.",
    },
    evidence: {
      logs: `[INFO] Ride booked, waiting for driver assignment
[INFO] Status transition animation started
[ERROR] Element not visible: .ride-status-badge (mid-transition)
[INFO] Retried assertion 2s later: badge visible and correct`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "[WARN] Assertion ran during a 300ms CSS transition; element visibility was momentarily false",
    },
  },

  ciNetworkFlake: {
    testInfo: {
      testName: "Verify dashboard widgets load",
      testId: "TC-DASH-012",
      application: "SmartWarehouse",
      environment: "CI",
      browser: "Chrome (headless)",
      buildVersion: "2026.08.12.045",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that all dashboard widgets render after login.",
      steps: "1. Login to SmartWarehouse\n2. Navigate to Dashboard\n3. Verify all widgets are rendered",
      expectedResult: "All dashboard widgets render within 5 seconds.",
      actualResult: "Test timed out waiting for the inventory widget on this CI run; passed on retry without any code changes.",
    },
    evidence: {
      logs: `[INFO] Navigating to /dashboard
[INFO] Waiting for element: .inventory-widget
[ERROR] Timed out waiting for element '.inventory-widget' after 5000ms
[INFO] Retry run: passed, widget rendered in 1200ms`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "[INFO] CI runner reported elevated network latency during this build",
    },
  },

  raceConditionAssertion: {
    testInfo: {
      testName: "Verify cart badge count updates immediately",
      testId: "TC-CART-033B",
      application: "ShopSphere Cart",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.13.061",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates the cart badge count updates immediately after adding an item, without a page reload.",
      steps: "1. Add item to cart\n2. Verify cart badge count increments",
      expectedResult: "Cart badge shows count 1 immediately after adding the item.",
      actualResult: "Test failed intermittently; the assertion ran before the UI finished re-rendering the badge.",
    },
    evidence: {
      logs: `[INFO] Item added to cart via API
[INFO] Asserting cart badge count
[ERROR] Element not visible: .cart-badge (assertion ran before re-render completed)
[INFO] Badge rendered correctly 150ms later`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "",
    },
  },

  featureFlagMisconfig: {
    testInfo: {
      testName: "Verify new checkout flow is enabled in QA",
      testId: "TC-CHECKOUT-058",
      application: "ShopSphere E-Commerce",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.07.061",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that the redesigned checkout flow (behind a feature flag) is active in the QA environment.",
      steps: "1. Navigate to checkout\n2. Verify the new single-page checkout layout is displayed",
      expectedResult: "The new single-page checkout flow is displayed.",
      actualResult: "The legacy multi-step checkout flow was displayed instead.",
    },
    evidence: {
      logs: `[INFO] Navigating to /checkout
[INFO] Checking feature flag: new-checkout-flow
[ERROR] Feature flag 'new-checkout-flow' is disabled in QA environment config
[INFO] Legacy checkout flow rendered`,
      stackTrace: "",
      apiResponse: `{ "featureFlags": { "new-checkout-flow": false }, "environment": "QA" }`,
      consoleLogs: "",
    },
  },

  wrongApiEndpointMobile: {
    testInfo: {
      testName: "Verify mobile app connects to QA backend",
      testId: "TC-MOBILE-014",
      application: "ShopSphere Mobile",
      environment: "QA",
      browser: "iOS 17 / iPhone 15 (XCUITest)",
      buildVersion: "2026.08.06.052",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates the iOS app's API client is configured to point at the QA backend environment.",
      steps: "1. Launch app with QA build configuration\n2. Attempt to load product catalog\n3. Verify requests go to the QA API host",
      expectedResult: "App requests are sent to api-qa.shopsphere.internal.",
      actualResult: "App requests were sent to the production API host instead of QA.",
    },
    evidence: {
      logs: `[INFO] Launching app with QA build scheme
[ERROR] Environment variable API_BASE_URL is misconfigured: pointing to the wrong host (production instead of QA)
[ERROR] Catalog load blocked by production WAF rules for test traffic`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "",
    },
  },

  dbConnectionStringWrongEnv: {
    testInfo: {
      testName: "Verify staging environment uses staging database",
      testId: "TC-INFRA-027",
      application: "MediCare Portal",
      environment: "Staging",
      browser: "N/A (config validation)",
      buildVersion: "2026.08.05.019",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates the staging environment's database connection string points to the staging database instance, not production.",
      steps: "1. Deploy to staging\n2. Run configuration validation check\n3. Verify DATABASE_URL points to the staging instance",
      expectedResult: "DATABASE_URL points to the staging database instance.",
      actualResult: "DATABASE_URL was misconfigured and pointed to the production database instance.",
    },
    evidence: {
      logs: `[INFO] Running configuration validation check
[ERROR] DATABASE_URL environment variable is misconfigured: pointing to the wrong database instance (production instead of staging)
[ERROR] Validation check failed before any staging tests ran`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "",
    },
  },

  paymentGatewaySandboxMisconfig: {
    testInfo: {
      testName: "Verify payment gateway uses sandbox credentials in QA",
      testId: "TC-PAY-072",
      application: "SecureBank Online",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.04.008",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that QA checkout tests use sandbox payment gateway credentials, not live credentials.",
      steps: "1. Submit a test payment in QA\n2. Verify the payment gateway processes it in sandbox mode",
      expectedResult: "Payment is processed using sandbox mode credentials.",
      actualResult: "Payment gateway rejected the test card because live mode credentials were configured instead of sandbox.",
    },
    evidence: {
      logs: `[INFO] Submitting test payment
[ERROR] Payment gateway configured with live mode credentials instead of sandbox mode
[ERROR] Test card rejected: not a valid live-mode card`,
      stackTrace: "",
      apiResponse: `{ "status": 402, "error": "Card Declined", "message": "Test cards are not accepted in live mode", "mode": "live" }`,
      consoleLogs: "",
    },
  },

  timeoutConfigTooShort: {
    testInfo: {
      testName: "Verify API client timeout is configured correctly",
      testId: "TC-INFRA-033",
      application: "SmartWarehouse",
      environment: "QA",
      browser: "N/A (API test)",
      buildVersion: "2026.08.03.005",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates the API client's configured request timeout is appropriate for the QA environment's typical latency.",
      steps: "1. Deploy QA build\n2. Run full API test suite\n3. Observe timeout failure rate",
      expectedResult: "API requests complete without spurious timeout failures under normal QA latency.",
      actualResult: "Over 40% of API tests failed with premature timeouts across unrelated endpoints.",
    },
    evidence: {
      logs: `[INFO] Running full API test suite
[ERROR] Invalid configuration: configured timeout of 500ms is far below the QA environment's typical 800ms response time
[ERROR] 42 of 105 API tests failed with premature timeout errors
[INFO] Root cause: HTTP_CLIENT_TIMEOUT_MS was set to 500 instead of 5000`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "",
    },
  },

  duplicateCustomerRecord: {
    testInfo: {
      testName: "Verify new customer registration succeeds",
      testId: "TC-CUST-019",
      application: "ShopSphere E-Commerce",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.02.002",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates a new customer can register with a unique email address.",
      steps: "1. Submit registration form with test email\n2. Verify account is created",
      expectedResult: "Customer account is created successfully.",
      actualResult: "Registration failed with a unique constraint violation.",
    },
    evidence: {
      logs: `[INFO] Submitting registration for qa.tester@shopsphere.com
[ERROR] Duplicate customer record already exists for this email in the QA database
[ERROR] Registration failed: unique constraint violation on customers.email`,
      stackTrace: `org.springframework.dao.DuplicateKeyException: could not execute statement; constraint [customers_email_key]
    at com.shopsphere.account.CustomerService.register(CustomerService.java:47)
Note: a leftover test record from a previous run was not cleaned up.`,
      apiResponse: "",
      consoleLogs: "",
    },
  },

  missingTestDataUserDeleted: {
    testInfo: {
      testName: "Verify user can log in with existing test account",
      testId: "TC-AUTH-033",
      application: "SecureBank Online",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.08.01.001",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates a previously-provisioned test user can log in successfully.",
      steps: "1. Enter test user credentials\n2. Submit login form",
      expectedResult: "User logs in successfully.",
      actualResult: "Login failed because the test user account no longer existed.",
    },
    evidence: {
      logs: `[INFO] Submitting login for testuser-042@securebank.qa
[ERROR] Test data was deleted: user account testuser-042 not found
[ERROR] Nightly test-data cleanup job removed this account before the test ran`,
      stackTrace: "",
      apiResponse: `{ "status": 404, "error": "Not Found", "message": "No account found for the provided credentials" }`,
      consoleLogs: "",
    },
  },

  orphanedOrderReference: {
    testInfo: {
      testName: "Verify order history displays product details",
      testId: "TC-ORDERS-041",
      application: "ShopSphere E-Commerce",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.07.30.088",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that order history correctly displays product name and image for each past order.",
      steps: "1. Navigate to order history\n2. Verify each order displays correct product details",
      expectedResult: "All past orders display valid product details.",
      actualResult: "One order displayed a blank product entry with a broken image.",
    },
    evidence: {
      logs: `[INFO] Loading order history for customer
[ERROR] Orphaned reference detected: order ORD-55210 references product SKU-3391 which no longer exists
[ERROR] Product was deleted from the catalog without updating historical order references`,
      stackTrace: "",
      apiResponse: `{ "orderId": "ORD-55210", "productId": "SKU-3391", "productFound": false }`,
      consoleLogs: "",
    },
  },

  staleSeedDataMismatch: {
    testInfo: {
      testName: "Verify fare estimate matches confirmed fare",
      testId: "TC-RIDE-071",
      application: "QuickRide",
      environment: "QA",
      browser: "Chrome",
      buildVersion: "2026.07.29.077",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that the fare estimate shown before booking matches the confirmed fare after the ride is booked.",
      steps: "1. Request fare estimate for a route\n2. Book the ride\n3. Compare estimated fare to confirmed fare",
      expectedResult: "Confirmed fare matches the estimated fare (within rounding).",
      actualResult: "Confirmed fare was significantly higher than the estimated fare due to outdated pricing seed data.",
    },
    evidence: {
      logs: `[INFO] Requesting fare estimate for Pune Station to Hinjewadi
[INFO] Estimate returned using cached pricing table
[ERROR] Stale seed data: QA pricing table was not refreshed after a production pricing update
[ERROR] Seed data mismatch between QA and staging pricing tables`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "",
    },
  },

  dbMigrationDataLoss: {
    testInfo: {
      testName: "Verify database migration completes without data loss",
      testId: "TC-DB-MIGRATE-004",
      application: "MediCare Portal",
      environment: "Staging",
      browser: "N/A (migration test)",
      buildVersion: "2026.07.28.066",
      executionTime: new Date().toISOString(),
    },
    testDetails: {
      description: "Validates that a schema migration preserves all existing patient records.",
      steps: "1. Record pre-migration row count for patients table\n2. Run migration script\n3. Record post-migration row count\n4. Compare counts",
      expectedResult: "Post-migration row count matches pre-migration row count exactly.",
      actualResult: "Post-migration row count was lower than pre-migration, indicating data loss.",
    },
    evidence: {
      logs: `[INFO] Pre-migration patients row count: 48213
[INFO] Running migration script V47__add_patient_consent_flag.sql
[INFO] Post-migration patients row count: 48009
[ERROR] Row count mismatch: 204 records lost during migration
[ERROR] Migration script's WHERE clause incorrectly excluded records where consent_date was missing`,
      stackTrace: "",
      apiResponse: "",
      consoleLogs: "",
    },
  },
};

/**
 * The failure category each sample scenario classifies to when run through the
 * mock rule engine — used only to power the "Filter by Category" picker on the
 * Analyze Failure page, so a judge/tester can jump straight to e.g. a Flaky Test
 * example instead of reading all 12 labels. Verified against the real engine
 * output in server/tests/mock-analyzer.test.ts; keep this in sync if a rule's
 * classification for one of these scenarios ever changes.
 */
export const SAMPLE_SCENARIO_CATEGORY: Record<string, FailureAnalysis["root_cause_category"]> = {
  payment: "Application Defect",
  login: "Environment Issue",
  productSearch: "Environment Issue",
  cart: "Application Defect",
  flaky: "Flaky Test",
  automation: "Test Automation Issue",
  ecommercePaymentAdvanced: "Application Defect",
  bankingLoginFailure: "Application Defect",
  warehouseInventoryTimeout: "Environment Issue",
  rideBookingLogicFailure: "Application Defect",
  healthcareDatabaseFailure: "Environment Issue",
  playwrightAutomationFailure: "Test Automation Issue",
  performanceLoadTest: "Environment Issue",
  databaseQueryPerformanceDegradation: "Environment Issue",
  mobileLocatorBroken: "Test Automation Issue",
  brokenCssSelector: "Test Automation Issue",
  brittleXpathBroken: "Test Automation Issue",
  staleElementRace: "Flaky Test",
  intermittentAnimationTiming: "Flaky Test",
  ciNetworkFlake: "Flaky Test",
  raceConditionAssertion: "Flaky Test",
  featureFlagMisconfig: "Configuration Issue",
  wrongApiEndpointMobile: "Configuration Issue",
  dbConnectionStringWrongEnv: "Configuration Issue",
  paymentGatewaySandboxMisconfig: "Configuration Issue",
  timeoutConfigTooShort: "Configuration Issue",
  duplicateCustomerRecord: "Data Issue",
  missingTestDataUserDeleted: "Data Issue",
  orphanedOrderReference: "Data Issue",
  staleSeedDataMismatch: "Data Issue",
  dbMigrationDataLoss: "Data Issue",
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
