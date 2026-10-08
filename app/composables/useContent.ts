export const useContent = () =>
  useAsyncData("site-content", () => $fetch("/api/content"));
