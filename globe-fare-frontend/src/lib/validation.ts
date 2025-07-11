export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateDestination(code: string): ValidationResult {
  const errors: string[] = [];

  if (!code) {
    errors.push('Destination code is required');
  } else if (!/^[A-Z]{3}$/.test(code)) {
    errors.push('Destination code must be 3 uppercase letters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateDate(dateString: string): ValidationResult {
  const errors: string[] = [];

  if (!dateString) {
    errors.push('Date is required');
  } else {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    } else if (date < today) {
      errors.push('Date cannot be in the past');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>'"&]/g, '');
}

export function validateInput(input: string): ValidationResult {
  const errors: string[] = [];

  if (!input) {
    errors.push('Input is required');
  } else if (input.length < 2) {
    errors.push('Input must be at least 2 characters');
  } else if (input.length > 100) {
    errors.push('Input must be less than 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export const validateEnvironment = () => {
  // Only validate environment in Node.js environment
  if (typeof window === 'undefined') {
    const requiredEnvVars = [
      'NEXT_PUBLIC_API_URL',
      // Add other required env vars
    ];

    const missing = requiredEnvVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
      // Throw in production, warn in development
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `Missing required environment variables: ${missing.join(', ')}`
        );
      }
    }
  }
};

export const validateDependencies = () => {
  // Skip dependency validation to avoid dynamic require() issues
  console.log('📦 Dependency validation skipped (avoiding dynamic imports)');
};

export const runStartupValidations = () => {
  if (typeof window === 'undefined') {
    console.log('🔍 Running startup validations...');

    try {
      validateEnvironment();
      validateDependencies();
      console.log('✅ All validations passed');
    } catch (error) {
      console.error('❌ Validation failed:', error);
      // Re-throw in production to stop the build
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
};
