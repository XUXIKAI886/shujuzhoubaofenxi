'use client';

import { useState, useEffect } from 'react';

/**
 * 自定义Hook用于localStorage数据持久化
 * @param key localStorage键名
 * @param initialValue 初始值
 * @returns [value, setValue] 返回当前值和设置值的函数
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // 获取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 设置值的函数
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // 使用React的函数式更新确保使用最新状态
      setStoredValue(prevValue => {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevValue) : value;
        
        // 保存到localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        }
        
        return newValue;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * 清除localStorage中的指定项
 * @param key localStorage键名
 */
export function clearLocalStorageItem(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

/**
 * 获取localStorage中的所有相关键
 * @param prefix 键名前缀
 * @returns 匹配前缀的所有键名数组
 */
export function getLocalStorageKeys(prefix: string): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error('Error getting localStorage keys:', error);
    return [];
  }
}