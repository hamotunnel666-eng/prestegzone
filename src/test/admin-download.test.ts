import { describe, expect, it } from 'vitest';
import { assertProductImageSize } from '@/lib/product-image-utils';
import { assertStoreAdmin, isAllowedProductImageUrl } from '@/lib/store.functions';

describe('admin-only assistant source download', () => {
  it('rejects users who are not store administrators', () => {
    expect(() => assertStoreAdmin(false)).toThrow('غير مصرح لك بدخول لوحة الإدارة');
  });

  it('allows source access only after the administrator check succeeds', () => {
    expect(() => assertStoreAdmin(true)).not.toThrow();
  });
});

describe('product image import security and size limit', () => {
  it('accepts Google image URLs and rejects insecure or unrelated hosts', () => {
    expect(isAllowedProductImageUrl('https://encrypted-tbn0.gstatic.com/image.webp')).toBe(true);
    expect(isAllowedProductImageUrl('https://images.googleusercontent.com/image.webp')).toBe(true);
    expect(isAllowedProductImageUrl('http://encrypted-tbn0.gstatic.com/image.webp')).toBe(false);
    expect(isAllowedProductImageUrl('https://gstatic.com.evil.example/image.webp')).toBe(false);
  });

  it('allows product images up to 500,000 bytes and rejects larger files', () => {
    expect(() => assertProductImageSize(500_000)).not.toThrow();
    expect(() => assertProductImageSize(500_001)).toThrow('500 كيلوبايت');
  });
});