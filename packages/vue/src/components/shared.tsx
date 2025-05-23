import * as Vue from "vue";
import { onMounted, onUnmounted } from "vue";

import type { ClassListMerger } from "@uploadthing/shared";

export const usePaste = (callback: (e: ClipboardEvent) => void) => {
  const controller = new AbortController();

  onMounted(() => {
    document.addEventListener("paste", callback, {
      signal: controller.signal,
    });
  });
  onUnmounted(() => {
    controller.abort();
  });
};

export const Spinner = Vue.defineComponent(() => () => {
  return (
    <svg
      class="z-10 block h-5 w-5 animate-spin align-middle text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 576 512"
    >
      <path
        fill="currentColor"
        d="M256 32C256 14.33 270.3 0 288 0C429.4 0 544 114.6 544 256C544 302.6 531.5 346.4 509.7 384C500.9 399.3 481.3 404.6 465.1 395.7C450.7 386.9 445.5 367.3 454.3 351.1C470.6 323.8 480 291 480 255.1C480 149.1 394 63.1 288 63.1C270.3 63.1 256 49.67 256 31.1V32z"
      />
    </svg>
  );
});

export const Cancel = Vue.defineComponent(
  (props: { cn: ClassListMerger }) => () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={props.cn(
          "fill-none stroke-current stroke-2",
          "hidden size-4 group-hover:block",
        )}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m4.9 4.9 14.2 14.2" />
      </svg>
    );
  },
  { props: ["cn"] },
);
