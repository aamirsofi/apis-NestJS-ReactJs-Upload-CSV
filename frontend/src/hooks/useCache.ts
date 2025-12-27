import { useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
}

/**
 * Custom hook for caching API responses
 * Provides a simple in-memory cache with TTL support
 */
export function useCache<T>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000 } = options; // Default 5 minutes
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  /**
   * Get cached value by key
   */
  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry.data;
  }, []);

  /**
   * Set cached value by key
   */
  const set = useCallback((key: string, data: T, customTtl?: number): void => {
    const expiresAt = Date.now() + (customTtl || ttl);
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
    });
  }, [ttl]);

  /**
   * Check if key exists and is valid
   */
  const has = useCallback((key: string): boolean => {
    const entry = cacheRef.current.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      cacheRef.current.delete(key);
      return false;
    }

    return true;
  }, []);

  /**
   * Remove cached value by key
   */
  const remove = useCallback((key: string): void => {
    cacheRef.current.delete(key);
  }, []);

  /**
   * Clear all cached values
   */
  const clear = useCallback((): void => {
    cacheRef.current.clear();
  }, []);

  /**
   * Clear expired entries
   */
  const clearExpired = useCallback((): void => {
    const now = Date.now();
    for (const [key, entry] of cacheRef.current.entries()) {
      if (now > entry.expiresAt) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  /**
   * Get cache statistics
   */
  const getStats = useCallback(() => {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of cacheRef.current.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: cacheRef.current.size,
      valid,
      expired,
    };
  }, []);

  return {
    get,
    set,
    has,
    remove,
    clear,
    clearExpired,
    getStats,
  };
}

