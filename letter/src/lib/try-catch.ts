


type TryCatchResult<T> = {
    data: T
    error: never
} | {
    error: Error
    data: never
}

// Overload for Promise
export async function tryCatch<T>(
    promise: Promise<T>
): Promise<TryCatchResult<T>>

// Overload for function with no args
export async function tryCatch<T>(
    fn: () => Promise<T> | T
): Promise<TryCatchResult<T>>

// Overload for function with args
export async function tryCatch<T, A extends readonly unknown[]>(
    fn: (...args: A) => Promise<T> | T,
    ...args: A
): Promise<TryCatchResult<T>>

export async function tryCatch<T, A extends readonly unknown[]>(
    promiseOrFn: Promise<T> | ((...args: A) => Promise<T> | T),
    ...args: A
): Promise<TryCatchResult<T>> {
    try {
        let data: T;
        
        // Check if it's a Promise by looking for 'then' method
        if (promiseOrFn && typeof (promiseOrFn as any).then === 'function') {
            // It's a Promise
            data = await (promiseOrFn as Promise<T>);
        } else {
            // It's a function
            data = await (promiseOrFn as (...args: A) => Promise<T> | T)(...args);
        }
        
        return { data, error: undefined as never };
    } catch (error) {
        return { 
            error: error instanceof Error ? error : new Error(String(error)), 
            data: undefined as never 
        };
    }
}