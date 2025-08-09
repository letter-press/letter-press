import { 
  ThemeConfigSchema,
  ThemeSaveRequestSchema,
  ThemeActivationRequestSchema,
  ColorSchema,
  CustomFieldSchema
} from './validation-schemas';
import { validateData, validateForm, validateBatch } from './validation-utils';

/**
 * Test data and validation examples
 */

// Test valid theme data
const validTheme = {
  name: "my-custom-theme",
  displayName: "My Custom Theme",
  description: "A beautiful custom theme",
  author: "John Doe",
  version: "1.0.0",
  supportsDarkMode: true,
  isBuiltIn: false,
  layouts: {
    default: "DefaultLayout",
    home: "HomeLayout",
    page: "PageLayout", 
    post: "PostLayout"
  },
  colors: {
    primary: "#3b82f6",
    secondary: "#6b7280",
    accent: "#f59e0b",
    text: "#1f2937",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
    background: "#ffffff",
    surface: "#f9fafb",
    surfaceSecondary: "#f3f4f6",
    border: "#e5e7eb",
    borderLight: "#f3f4f6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    highlight: "#fbbf24",
    quote: "#6b7280",
    code: "#1f2937",
    codeBackground: "#f3f4f6"
  },
  darkColors: {
    primary: "#60a5fa",
    secondary: "#9ca3af",
    accent: "#fbbf24",
    text: "#f9fafb",
    textSecondary: "#d1d5db",
    textMuted: "#9ca3af",
    background: "#111827",
    surface: "#1f2937",
    surfaceSecondary: "#374151",
    border: "#374151",
    borderLight: "#4b5563",
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#60a5fa",
    highlight: "#fcd34d",
    quote: "#9ca3af",
    code: "#f9fafb",
    codeBackground: "#374151"
  },
  customCSS: "/* Custom styles */"
};

// Test invalid theme data
const invalidTheme = {
  name: "Invalid Theme Name!", // Invalid characters
  displayName: "", // Empty
  version: "1.0", // Invalid format
  supportsDarkMode: true,
  layouts: {
    default: "DefaultLayout"
    // Missing required layouts
  },
  colors: {
    primary: "not-a-color", // Invalid color
    secondary: "#6b7280"
    // Missing required colors
  }
};

// Test examples
export function runValidationTests() {
  console.log("🧪 Running ArkType Validation Tests\n");

  // Test 1: Valid theme validation
  console.log("1. Testing valid theme:");
  const validResult = validateData(ThemeConfigSchema, validTheme, "Valid Theme");
  console.log(validResult.success ? "✅ PASSED" : "❌ FAILED:", validResult);

  // Test 2: Invalid theme validation
  console.log("\n2. Testing invalid theme:");
  const invalidResult = validateData(ThemeConfigSchema, invalidTheme, "Invalid Theme");
  console.log(invalidResult.success ? "❌ FAILED" : "✅ PASSED (caught errors):", invalidResult);

  // Test 3: Color validation
  console.log("\n3. Testing color validation:");
  const validColor = validateData(ColorSchema, "#ff0000");
  const invalidColor = validateData(ColorSchema, "red");
  console.log("Valid color:", validColor.success ? "✅ PASSED" : "❌ FAILED");
  console.log("Invalid color:", invalidColor.success ? "❌ FAILED" : "✅ PASSED (caught errors)");

  // Test 4: Form validation with field errors
  console.log("\n4. Testing form validation:");
  const formValidation = validateForm(ThemeConfigSchema, invalidTheme);
  console.log("Form validation result:", formValidation);

  // Test 5: Theme save request validation
  console.log("\n5. Testing theme save request:");
  const saveRequest = { ...validTheme, id: 123 };
  const saveResult = validateData(ThemeSaveRequestSchema, saveRequest);
  console.log(saveResult.success ? "✅ PASSED" : "❌ FAILED:", saveResult);

  // Test 6: Theme activation request validation
  console.log("\n6. Testing theme activation:");
  const activationValid = validateData(ThemeActivationRequestSchema, { themeName: "my-theme" });
  const activationInvalid = validateData(ThemeActivationRequestSchema, { themeName: "Invalid Theme!" });
  console.log("Valid activation:", activationValid.success ? "✅ PASSED" : "❌ FAILED");
  console.log("Invalid activation:", activationInvalid.success ? "❌ FAILED" : "✅ PASSED (caught errors)");

  // Test 7: Custom field validation
  console.log("\n7. Testing custom field validation:");
  const validField = {
    name: "email_address",
    label: "Email Address",
    type: "TEXT",
    required: true,
    options: null,
    postTypeId: 1
  };
  const fieldResult = validateData(CustomFieldSchema, validField);
  console.log(fieldResult.success ? "✅ PASSED" : "❌ FAILED:", fieldResult);

  // Test 8: Batch validation
  console.log("\n8. Testing batch validation:");
  const fieldBatch = [validField, { ...validField, name: "invalid name!" }];
  const batchResult = validateBatch(CustomFieldSchema, fieldBatch, "Custom Fields");
  console.log("Batch validation:", batchResult.success ? "❌ FAILED" : "✅ PASSED (caught errors)");

  console.log("\n🎉 Validation tests completed!");
}

// Example usage in components
export function validateThemeOnClient(themeData: any, onSuccess: (theme: any) => void, onError: (errors: Record<string, string>) => void) {
  const validation = validateForm(ThemeConfigSchema, themeData);
  
  if (validation.isValid) {
    onSuccess(validation.data);
  } else {
    onError(validation.fieldErrors);
  }
}

// Example server-side validation wrapper
export async function createThemeWithValidation(rawThemeData: any) {
  const validation = validateData(ThemeSaveRequestSchema, rawThemeData, "Theme Creation");
  
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error}`);
  }
  
  // Proceed with database operation using validation.data
  console.log("Creating theme with validated data:", validation.data);
  return validation.data;
}