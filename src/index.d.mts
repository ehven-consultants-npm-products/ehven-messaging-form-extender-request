import type { IdentityOptions, MessagingIdentity, MessagingValues, ValidationResult } from '@ehven/messaging-form-core';

export const PROGRAM_LIMIT: 200;
export interface RequestField { name: string; label: string; required?: boolean; limit?: number }
export interface RequestReason { value: string; label: string; fields: readonly Readonly<RequestField>[] }
export const REQUEST_REASONS: readonly Readonly<RequestReason>[];
export interface RequestDetails { reason: string; [field: string]: string }
export interface AccessRequest extends MessagingIdentity { request: RequestDetails }
export interface RequestSchema {
  readonly reasonField: string;
  readonly reasons: readonly Readonly<RequestReason>[];
  validate(values: MessagingValues, formData: FormData): ValidationResult<AccessRequest>;
  formatMessage(request: RequestDetails): string;
}
export interface RequestSchemaOptions {
  identity?: IdentityOptions;
  reasons?: readonly RequestReason[];
  reasonField?: string;
  programLimit?: number;
  messages?: Partial<Record<'reason' | 'field', string>>;
}
export function createRequestSchema(options?: RequestSchemaOptions): RequestSchema;
export const validateAccessRequest: RequestSchema['validate'];
export const requestMessage: RequestSchema['formatMessage'];
