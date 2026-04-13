import { useCallback, useEffect, useState, useRef } from "react";

type URLParamSerializer<T> = {
  serialize: (obj: T) => string | null;
  deserialize: (str: string) => T;
};

type UrlParamOpts<T> = T extends string
  ? string | { defaultValue: T; serializer?: URLParamSerializer<T> }
  : {
      defaultValue: T;
      serializer: URLParamSerializer<T>;
    };

// Cache for URL parameters to prevent unnecessary updates
const urlParamCache = new Map<string, string>();

// Global event emitter for URL changes
const urlChangeListeners = new Set<() => void>();

function notifyUrlChange() {
  urlChangeListeners.forEach((listener) => listener());
}

// Listen for browser navigation events
window.addEventListener("popstate", notifyUrlChange);

export function useUrlParam<T>(key: string, opts: UrlParamOpts<T>) {
  const { serializer, defaultValue } =
    typeof opts === "string"
      ? { defaultValue: opts as unknown as T, serializer: null }
      : opts;

  const [val, setValue] = useState(defaultValue);
  const lastValueRef = useRef<T>(defaultValue);
  const isUpdatingRef = useRef(false);

  const updateValueFromURL = useCallback(() => {
    if (isUpdatingRef.current) return;

    const params = new URLSearchParams(document.location.search);
    const encoded = params.get(key);

    if (encoded === urlParamCache.get(key)) return;

    if (encoded) {
      try {
        const newValue = serializer
          ? serializer.deserialize(encoded)
          : (encoded as unknown as T);

        if (JSON.stringify(newValue) !== JSON.stringify(lastValueRef.current)) {
          setValue(newValue);
          lastValueRef.current = newValue;
        }
        urlParamCache.set(key, encoded);
      } catch (error) {
        console.error(`Error deserializing URL parameter ${key}:`, error);
      }
    } else if (val !== defaultValue) {
      setValue(defaultValue);
      lastValueRef.current = defaultValue;
      urlParamCache.delete(key);
    }
  }, [key, serializer, val, defaultValue]);

  useEffect(() => {
    updateValueFromURL();

    const handleUrlChange = () => {
      updateValueFromURL();
    };

    urlChangeListeners.add(handleUrlChange);

    return () => {
      urlChangeListeners.delete(handleUrlChange);
    };
  }, [updateValueFromURL]);

  const setValueWithURL = useCallback(
    (newValue: T) => {
      if (JSON.stringify(newValue) === JSON.stringify(lastValueRef.current))
        return;

      isUpdatingRef.current = true;
      setValue(newValue);
      lastValueRef.current = newValue;

      const mapped = serializer
        ? serializer.serialize(newValue)
        : (newValue as unknown as string);

      setQueryParam(key, mapped);
      isUpdatingRef.current = false;
    },
    [key, serializer]
  );

  return [val, setValueWithURL] as const;
}

export function setQueryParam(key: string, value: string | null) {
  const urlParams = new URLSearchParams(document.location.search);

  if (value !== null && value !== undefined && value !== "") {
    urlParams.set(key, value);
    urlParamCache.set(key, value);
  } else {
    urlParams.delete(key);
    urlParamCache.delete(key);
  }

  const newUrl =
    document.location.href.split("?")[0] +
    (urlParams.toString() ? `?${urlParams.toString()}` : "");

  window.history.pushState({}, document.title, newUrl);
  notifyUrlChange();
}
