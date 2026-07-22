"use client";

import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import InstallPrompt from "@/components/pwa/InstallPrompt";

export default function PwaProvider() {
  return (
    <>
      <ServiceWorkerRegister />
      <InstallPrompt />
    </>
  );
}
