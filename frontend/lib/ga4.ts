// GA4 Analytics utility
// Measurement ID should be set via NEXT_PUBLIC_GA4_MEASUREMENT_ID env var in .env

// Check if gtag is available
const getGtag = (): ((...args: any[]) => void) | null => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    return (window as any).gtag;
  }
  return null;
};

// Track a custom GA4 event
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  const gtag = getGtag();
  if (gtag) {
    gtag("event", eventName, params);
  }
};

// Predefined CIM Amplify events
export const ga4Events = {
  formStartBuyer: () =>
    trackEvent("form_start_buyer", {
      event_category: "registration",
      event_label: "buyer_registration_started",
    }),

  formStartSeller: () =>
    trackEvent("form_start_seller", {
      event_category: "registration",
      event_label: "seller_registration_started",
    }),

  formEndBuyer: () =>
    trackEvent("form_end_buyer", {
      event_category: "registration",
      event_label: "buyer_registration_completed",
    }),

  formEndSeller: () =>
    trackEvent("form_end_seller", {
      event_category: "registration",
      event_label: "seller_registration_completed",
    }),
};
