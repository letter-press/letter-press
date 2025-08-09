import { type ArkError, type ArkErrors } from "arktype";

/**
 * Result type for validation operations
 */
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: ArkError[] };

/**
 * API response type for validation
 */
export type APIResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Validates data against an ArkType schema and returns a result
 */
export function validateData<T>(
  schema: { (data: unknown): T | ArkErrors | false },
  data: unknown,
  contextName?: string
): ValidationResult<T> {
  try {
    const result = schema(data);
    
    // Check if result is false (validation failed - from narrow())
    if (result === false) {
      return {
        success: false,
        error: contextName 
          ? `${contextName}: Validation failed`
          : "Validation failed"
      };
    }
    
    // Check if result is ArkErrors (validation failed)
    if (typeof result === 'object' && result !== null && ' arkKind' in result && result[' arkKind'] === 'errors') {
      const errors = result as ArkErrors;
      const errorMessage = errors
        .map(err => err.message)
        .join(", ");
      
      return {
        success: false,
        error: contextName 
          ? `${contextName}: ${errorMessage}`
          : errorMessage,
        details: Array.from(errors)
      };
    }
    
    return { success: true, data: result as T };
  } catch (error) {
    return {
      success: false,
      error: contextName 
        ? `${contextName}: ${error instanceof Error ? error.message : 'Validation failed'}`
        : error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

/**
 * Server-side validation wrapper for server functions
 */
export function withValidation<TInput, TOutput>(
  inputSchema: { (data: unknown): TInput | ArkErrors | false },
  handler: (validatedInput: TInput) => Promise<TOutput> | TOutput,
  contextName?: string
) {
  return async (rawInput: unknown): Promise<ValidationResult<TOutput>> => {
    // Validate input
    const inputResult = validateData(inputSchema, rawInput, contextName);
    if (!inputResult.success) {
      return inputResult;
    }

    try {
      // Execute handler with validated input
      const output = await handler(inputResult.data);
      return { success: true, data: output };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed'
      };
    }
  };
}

/**
 * Validation wrapper for API routes with proper HTTP responses
 */
export function withAPIValidation<TInput, TOutput>(
  inputSchema: { (data: unknown): TInput | ArkErrors | false },
  handler: (validatedInput: TInput) => Promise<TOutput> | TOutput,
  contextName?: string
) {
  return async (rawInput: unknown): Promise<Response> => {
    // Validate input
    const inputResult = validateData(inputSchema, rawInput, contextName);
    if (!inputResult.success) {
      return new Response(
        JSON.stringify({ 
          error: inputResult.error,
          code: 'VALIDATION_ERROR'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Execute handler with validated input
      const output = await handler(inputResult.data);
      
      return new Response(
        JSON.stringify({ success: true, data: output }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('API handler error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Operation failed',
          code: 'SERVER_ERROR'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Helper to extract and validate JSON from Request
 */
export async function extractAndValidateJSON<T>(
  request: Request,
  schema: { (data: unknown): T | ArkErrors | false },
  contextName?: string
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validateData(schema, body, contextName);
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON in request body'
    };
  }
}

/**
 * Helper to extract and validate URL search parameters
 */
export function extractAndValidateSearchParams<T>(
  url: URL,
  schema: { (data: unknown): T | ArkErrors | false },
  contextName?: string
): ValidationResult<T> {
  try {
    // Convert URLSearchParams to plain object
    const params: Record<string, string | number | boolean> = {};
    
    for (const [key, value] of url.searchParams.entries()) {
      // Try to parse numbers and booleans
      if (value === 'true') {
        params[key] = true;
      } else if (value === 'false') {
        params[key] = false;
      } else if (/^\d+$/.test(value)) {
        params[key] = parseInt(value, 10);
      } else if (/^\d+\.\d+$/.test(value)) {
        params[key] = parseFloat(value);
      } else {
        params[key] = value;
      }
    }
    
    return validateData(schema, params, contextName);
  } catch (error) {
    return {
      success: false,
      error: 'Invalid URL parameters'
    };
  }
}

/**
 * Helper to create standardized API error responses
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  code?: string
): Response {
  return new Response(
    JSON.stringify({ 
      error,
      code: code || (status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR')
    }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Helper to create standardized API success responses
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Client-side validation helper
 */
export function validateOnClient<T>(
  schema: { (data: unknown): T | ArkErrors | false },
  data: unknown,
  onSuccess: (data: T) => void,
  onError: (error: string) => void
): boolean {
  const result = validateData(schema, data);
  
  if (result.success) {
    onSuccess(result.data);
    return true;
  } else {
    onError(result.error);
    return false;
  }
}

/**
 * Form validation helper that returns field-specific errors
 */
export function validateForm<T>(
  schema: { (data: unknown): T | ArkErrors | false },
  data: unknown
): { isValid: boolean; data?: T; fieldErrors: Record<string, string> } {
  const result = validateData(schema, data);
  
  if (result.success) {
    return { isValid: true, data: result.data, fieldErrors: {} };
  }
  
  const fieldErrors: Record<string, string> = {};
  
  // Parse ArkType errors to extract field-specific messages
  if (result.details) {
    for (const error of result.details) {
      // Extract field path from error
      const path = error.path?.join('.') || 'root';
      fieldErrors[path] = error.message;
    }
  } else {
    // Fallback for general errors
    fieldErrors.general = result.error;
  }
  
  return { isValid: false, fieldErrors };
}

/**
 * Batch validation for arrays of data
 */
export function validateBatch<T>(
  schema: { (data: unknown): T | ArkErrors | false },
  dataArray: unknown[],
  contextName?: string
): ValidationResult<T[]> {
  const validatedItems: T[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < dataArray.length; i++) {
    const result = validateData(schema, dataArray[i], `${contextName}[${i}]`);
    
    if (result.success) {
      validatedItems.push(result.data);
    } else {
      errors.push(result.error);
    }
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      error: errors.join("; ")
    };
  }
  
  return { success: true, data: validatedItems };
}

/**
 * Type guard helper for checking if validation result is successful
 */
export function isValidationSuccess<T>(
  result: ValidationResult<T>
): result is { success: true; data: T } {
  return result.success;
}

/**
 * Extracts data from validation result or throws error
 */
export function unwrapValidation<T>(result: ValidationResult<T>): T {
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error);
}

/**
 * Validation middleware for server actions
 */
export function createValidatedAction<TInput, TOutput>(
  inputSchema: { (data: unknown): TInput | ArkErrors | false },
  handler: (input: TInput) => Promise<TOutput>
) {
  return async (rawInput: unknown): Promise<TOutput> => {
    const result = await withValidation(inputSchema, handler)(rawInput);
    
    if (result.success) {
      return result.data;
    }
    
    // Transform validation errors into proper Error objects for server actions
    throw new Error(result.error);
  };
}

/**
 * Validation middleware for API endpoints
 */
export function createValidatedAPIHandler<TInput, TOutput>(
  inputSchema: { (data: unknown): TInput | ArkErrors | false },
  handler: (input: TInput, context?: any) => Promise<TOutput> | TOutput,
  options?: {
    contextName?: string;
    successStatus?: number;
  }
) {
  return async (
    request: Request,
    context?: any
  ): Promise<Response> => {
    try {
      // Extract input based on method
      let rawInput: unknown;
      
      if (request.method === 'GET' || request.method === 'DELETE') {
        const url = new URL(request.url);
        const paramResult = extractAndValidateSearchParams(url, inputSchema, options?.contextName);
        
        if (!paramResult.success) {
          return createErrorResponse(paramResult.error, 400, 'VALIDATION_ERROR');
        }
        
        rawInput = paramResult.data;
      } else {
        // POST, PUT, PATCH - expect JSON body
        const bodyResult = await extractAndValidateJSON(request, inputSchema, options?.contextName);
        
        if (!bodyResult.success) {
          return createErrorResponse(bodyResult.error, 400, 'VALIDATION_ERROR');
        }
        
        rawInput = bodyResult.data;
      }
      
      // Execute handler with validated input
      const output = await handler(rawInput as TInput, context);
      
      return createSuccessResponse(output, options?.successStatus || 200);
    } catch (error) {
      console.error('API handler error:', error);
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Operation failed',
        500,
        'SERVER_ERROR'
      );
    }
  };
}

/**
 * Form action validation wrapper for SolidStart form actions
 */
export function createValidatedFormAction<TInput, TOutput>(
  inputSchema: { (data: unknown): TInput | ArkErrors | false },
  handler: (input: TInput) => Promise<TOutput> | TOutput
) {
  return async (formData: FormData): Promise<TOutput> => {
    // Convert FormData to plain object
    const data: Record<string, any> = {};
    
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values (convert to array)
        data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
      } else {
        data[key] = value;
      }
    }
    
    // Validate
    const result = validateData(inputSchema, data);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Execute handler
    return handler(result.data);
  };
}

/**
 * Utility to safely parse JSON from request with validation
 */
export async function safeParseJSON<T>(
  request: Request,
  schema: { (data: unknown): T | ArkErrors | false }
): Promise<T> {
  const result = await extractAndValidateJSON(request, schema);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
}