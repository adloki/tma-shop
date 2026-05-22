"use client";

import {
  bindThemeParamsCssVars,
  bindViewportCssVars,
  expandViewport,
  init,
  isLaunchParamsRetrieveError,
  isTMA,
  isUnknownEnvError,
  mountThemeParams,
  mountViewport,
  retrieveRawInitData,
} from "@telegram-apps/sdk";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export const TMA_INIT_DATA_COOKIE = "tma-init-data";

function syncInitDataCookie(rawInitData: string) {
  const encoded = encodeURIComponent(rawInitData);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TMA_INIT_DATA_COOKIE}=${encoded}; Path=/; Max-Age=86400; SameSite=Lax${secure}`;
}

function isTelegramEnvError(error: unknown): boolean {
  return isLaunchParamsRetrieveError(error) || isUnknownEnvError(error);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isTMA()) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[TelegramProvider] App opened outside Telegram — SDK init skipped",
        );
      }
      return;
    }

    let cleanup: VoidFunction = () => {};

    try {
      cleanup = init();
    } catch (error) {
      if (isTelegramEnvError(error)) {
        console.warn("[TelegramProvider] SDK init skipped:", error);
        return;
      }
      console.error("[TelegramProvider] SDK init failed:", error);
      return;
    }

    void (async () => {
      try {
        if (mountThemeParams.isAvailable()) {
          await mountThemeParams();
          bindThemeParamsCssVars();
        }

        if (mountViewport.isAvailable()) {
          await mountViewport();
          bindViewportCssVars();
          expandViewport();
        }

        const rawInitData = retrieveRawInitData();
        if (rawInitData) {
          syncInitDataCookie(rawInitData);
          router.refresh();
        }
      } catch (error) {
        if (isTelegramEnvError(error)) {
          console.warn("[TelegramProvider] SDK mount skipped:", error);
          return;
        }
        console.error("[TelegramProvider] SDK mount failed:", error);
      }
    })();

    return cleanup;
  }, [router]);

  return (
    <div className="tma-shell flex min-h-full flex-1 flex-col">{children}</div>
  );
}
