"use client";

import React from "react";
import {
  buildWhatsAppLink,
  buildShareLink,
  createPoolInquiryMessage,
} from "@/lib/utils/whatsapp";

export interface WhatsAppContactProps {
  phone?: string | null;
  contactName?: string;
  poolTitle: string;
  zone: string;
  detailUrl: string;
  className?: string;
}

export function WhatsAppContact({
  phone,
  contactName,
  poolTitle,
  zone,
  detailUrl,
  className = "",
}: WhatsAppContactProps) {
  const hasValidPhone = Boolean(phone && phone.trim().length >= 8);

  const message = createPoolInquiryMessage({
    poolTitle,
    zone,
    detailUrl,
  });

  const href = hasValidPhone
    ? buildWhatsAppLink(phone!, message)
    : buildShareLink(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`yvy-whatsapp-contact-btn ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        backgroundColor: "#25D366",
        color: "#ffffff",
        fontWeight: 600,
        fontSize: "0.85rem",
        padding: "0.55rem 1rem",
        borderRadius: "0.5rem",
        textDecoration: "none",
        boxShadow: "0 2px 4px rgba(37, 211, 102, 0.25)",
        transition: "background-color 0.15s ease",
        cursor: "pointer",
      }}
    >
      {/* WhatsApp SVG Icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ flexShrink: 0 }}
      >
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.148-.528-1.748-.72-2.884-2.483-2.971-2.6-.088-.116-.708-.941-.708-1.796 0-.855.449-1.277.609-1.452.16-.176.352-.22.469-.22.12 0 .24.002.344.007.112.006.264-.042.413.316.155.374.528 1.288.574 1.381.047.093.078.202.016.326-.062.125-.094.202-.187.311-.093.11-.197.246-.281.331-.094.094-.193.197-.083.385.11.187.489.807 1.05 1.306.722.642 1.33.841 1.518.934.188.094.297.079.406-.047.11-.125.469-.546.594-.734.125-.187.25-.156.422-.094.172.062 1.094.516 1.281.609.188.094.312.141.359.219.047.078.047.453-.097.858z" />
      </svg>
      <span>
        {hasValidPhone
          ? `Consultar por WhatsApp ${contactName ? `(${contactName})` : ""}`
          : "Compartir consulta en WhatsApp"}
      </span>
    </a>
  );
}
