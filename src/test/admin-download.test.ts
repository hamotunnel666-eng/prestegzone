import { describe, expect, it } from 'vitest';
import { assertStoreAdmin } from '@/lib/store.functions';

describe('admin-only assistant source download', () => {
  it('rejects users who are not store administrators', () => {
    expect(() => assertStoreAdmin(false)).toThrow('غير مصرح لك بدخول لوحة الإدارة');
  });

  it('allows source access only after the administrator check succeeds', () => {
    expect(() => assertStoreAdmin(true)).not.toThrow();
  });
});