import { useEffect } from "react";

/**
 * Like useEffect but works with async functions and makes sure that errors will be reported
 * See https://github.com/facebook/react/pull/14069
 */
export default function useAsyncEffect(
  effect: () => Promise<any>,
  deps?: readonly any[] | undefined
) {
  useEffect(() => {
    effect().catch((e) => console.warn("useAsyncEffect error", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
