/**
 * Defensive Server-Side Input Validation & Sanitization Layer
 * Mandate: Never trust input straight from the client; validate thoroughly before touching DB/Cache.
 */

export interface ValidationResult<T> {
  valid: boolean;
  error?: string;
  statusCode?: number;
  data?: T;
}

export interface SanitizedPollInput {
  title: string;
  description: string;
  options: string[];
  allow_multiple: boolean;
  is_anonymous: boolean;
  expires_in_minutes?: number;
  template_id?: string;
  theme_id?: string;
  personality?: string;
}

export interface SanitizedVoteInput {
  option_id: string;
  voter_name?: string;
}

export interface SanitizedReactionInput {
  emoji: string;
}

export interface SanitizedRegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface SanitizedLoginInput {
  email: string;
  password: string;
}

/**
 * Strips HTML tags and excessive control characters to prevent injection
 */
export function sanitizeText(input: unknown, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '') // Strip control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates RFC-5322 compatible email address format
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validatePollCreation(body: any): ValidationResult<SanitizedPollInput> {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body. Expected JSON object.', statusCode: 400 };
  }

  // 1. Title Validation
  const rawTitle = typeof body.title === 'string' ? body.title : '';
  const title = sanitizeText(rawTitle, 200);

  if (title.length < 5) {
    return {
      valid: false,
      error: 'Poll title is required and must be at least 5 characters.',
      statusCode: 400,
    };
  }
  if (title.length > 200) {
    return {
      valid: false,
      error: 'Poll title must not exceed 200 characters.',
      statusCode: 400,
    };
  }

  // 2. Description Validation
  const rawDesc = typeof body.description === 'string' ? body.description : '';
  const description = sanitizeText(rawDesc, 1000);

  // 3. Options Array Validation
  if (!Array.isArray(body.options)) {
    return {
      valid: false,
      error: 'Options must be provided as an array of choice strings.',
      statusCode: 400,
    };
  }

  if (body.options.length < 2) {
    return {
      valid: false,
      error: 'A poll must have at least 2 options.',
      statusCode: 400,
    };
  }

  if (body.options.length > 10) {
    return {
      valid: false,
      error: 'A poll cannot have more than 10 options.',
      statusCode: 400,
    };
  }

  const cleanedOptions: string[] = [];
  const seenLower = new Set<string>();

  for (let i = 0; i < body.options.length; i++) {
    const rawOpt = body.options[i];
    if (typeof rawOpt !== 'string') {
      return {
        valid: false,
        error: `Option at index ${i + 1} must be a text string.`,
        statusCode: 400,
      };
    }
    const cleanOpt = sanitizeText(rawOpt, 100);
    if (cleanOpt.length === 0) {
      return {
        valid: false,
        error: `Option at index ${i + 1} cannot be empty.`,
        statusCode: 400,
      };
    }
    const lower = cleanOpt.toLowerCase();
    if (seenLower.has(lower)) {
      return {
        valid: false,
        error: `Duplicate option detected: "${cleanOpt}". All options must be unique.`,
        statusCode: 400,
      };
    }
    seenLower.add(lower);
    cleanedOptions.push(cleanOpt);
  }

  if (cleanedOptions.length < 2) {
    return {
      valid: false,
      error: 'At least 2 non-empty unique options are required.',
      statusCode: 400,
    };
  }

  // 4. Expiration Validation
  let expiresInMinutes: number | undefined = undefined;
  if (body.expires_in_minutes !== undefined && body.expires_in_minutes !== null) {
    const num = Number(body.expires_in_minutes);
    if (!Number.isInteger(num) || num < 1 || num > 43200) {
      return {
        valid: false,
        error: 'Expiration time must be a whole number between 1 and 43200 minutes (max 30 days).',
        statusCode: 400,
      };
    }
    expiresInMinutes = num;
  }

  // 5. Template, Theme & Personality Identifiers (alphanumeric/hyphen/underscore only)
  const safeIdentifierRegex = /^[a-zA-Z0-9_-]{1,60}$/;
  const template_id = typeof body.template_id === 'string' && safeIdentifierRegex.test(body.template_id)
    ? body.template_id
    : undefined;
  const theme_id = typeof body.theme_id === 'string' && safeIdentifierRegex.test(body.theme_id)
    ? body.theme_id
    : undefined;
  const personality = typeof body.personality === 'string' && safeIdentifierRegex.test(body.personality)
    ? body.personality
    : undefined;

  return {
    valid: true,
    data: {
      title,
      description,
      options: cleanedOptions,
      allow_multiple: Boolean(body.allow_multiple),
      is_anonymous: Boolean(body.is_anonymous),
      expires_in_minutes: expiresInMinutes,
      template_id,
      theme_id,
      personality,
    },
  };
}

export function validateVoteSubmission(body: any, pollOptions: Array<{ id: string }>): ValidationResult<SanitizedVoteInput> {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid vote payload.', statusCode: 400 };
  }

  const { option_id } = body;
  if (!option_id || typeof option_id !== 'string') {
    return { valid: false, error: 'option_id is required and must be a string.', statusCode: 400 };
  }

  const cleanOptionId = sanitizeText(option_id, 50);
  const exists = pollOptions.some((o) => o.id === cleanOptionId);
  if (!exists) {
    return {
      valid: false,
      error: 'Selected option does not exist in this poll.',
      statusCode: 400,
    };
  }

  const rawVoterName = typeof body.voter_name === 'string' ? body.voter_name : undefined;
  const cleanVoterName = rawVoterName ? sanitizeText(rawVoterName, 60) : undefined;

  return {
    valid: true,
    data: {
      option_id: cleanOptionId,
      voter_name: cleanVoterName,
    },
  };
}

export const ALLOWED_REACTIONS = ['🔥', '❤️', '👀', '🤔', '💡'] as const;

export function validateReactionSubmission(body: any): ValidationResult<SanitizedReactionInput> {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid reaction payload.', statusCode: 400 };
  }

  const { emoji } = body;
  if (!emoji || typeof emoji !== 'string') {
    return { valid: false, error: 'emoji string is required.', statusCode: 400 };
  }

  const cleanEmoji = emoji.trim();
  if (!ALLOWED_REACTIONS.includes(cleanEmoji as any)) {
    return {
      valid: false,
      error: `Invalid reaction emoji "${cleanEmoji}". Allowed emojis: ${ALLOWED_REACTIONS.join(', ')}`,
      statusCode: 400,
    };
  }

  return {
    valid: true,
    data: { emoji: cleanEmoji },
  };
}

export function validateAuthRegister(body: any): ValidationResult<SanitizedRegisterInput> {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid registration payload.', statusCode: 400 };
  }

  const { username, email, password } = body;

  if (typeof username !== 'string' || username.trim().length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.', statusCode: 400 };
  }
  const cleanUsername = sanitizeText(username, 50);
  if (cleanUsername.length < 3) {
    return { valid: false, error: 'Username must contain at least 3 valid characters.', statusCode: 400 };
  }

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: 'A valid email address is required (e.g., name@domain.com).', statusCode: 400 };
  }
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail.length > 255) {
    return { valid: false, error: 'Email address exceeds maximum length of 255 characters.', statusCode: 400 };
  }

  if (typeof password !== 'string' || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters.', statusCode: 400 };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password cannot exceed 128 characters.', statusCode: 400 };
  }

  return {
    valid: true,
    data: {
      username: cleanUsername,
      email: cleanEmail,
      password,
    },
  };
}

export function validateAuthLogin(body: any): ValidationResult<SanitizedLoginInput> {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid login payload.', statusCode: 400 };
  }

  const { email, password } = body;

  if (typeof email !== 'string' || !email.trim()) {
    return { valid: false, error: 'Email is required.', statusCode: 400 };
  }
  if (typeof password !== 'string' || !password) {
    return { valid: false, error: 'Password is required.', statusCode: 400 };
  }

  return {
    valid: true,
    data: {
      email: email.trim().toLowerCase(),
      password,
    },
  };
}
